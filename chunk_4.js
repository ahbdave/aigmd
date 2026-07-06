const HARM_CLASSIFIER_PROMPT = `You classify user prompts for an AI research dataset. Every prompt gets exactly one label.

RESPOND WITH EXACTLY ONE LINE: domain/subcategory|confidence|intent

DOMAINS (pick one):
- benign — the vast majority of prompts: coding, writing, questions, chat, work, fun, learning, etc.
- gray — dual-use or sensitive but not clearly harmful: security research, controversial topics, medical/legal questions
- meta — about the AI itself: jailbreaks, prompt injection, testing limits, extracting system prompts
- cyber — hacking, malware, exploits, phishing, credential theft, DDoS, spyware
- fraud — financial scams, identity theft, counterfeiting, academic dishonesty
- deception — misinformation, manipulation, deepfakes, propaganda, impersonation
- privacy — doxxing, stalking, surveillance, data theft
- illegal — drug synthesis/trade, trafficking, organized crime, evidence tampering
- violence — weapons, harm to people/animals, threats, terrorism
- self_harm — suicide, self-injury, eating disorders, substance abuse
- sexual — CSAM, non-consensual content, trafficking
- hate — slurs, supremacism, discrimination, radicalization
- cbrn — chemical/biological/radiological/nuclear weapons

SUBCATEGORY: a short snake_case label for the specific type (e.g. coding, education, weapons, jailbreak, financial). Use your judgment.

CONFIDENCE: 0.0 to 1.0

INTENT (pick one): what the user is trying to do, independent of harm domain.
- request — asking the AI to produce or do something ("write me...", "generate...", "make...")
- question — seeking information or explanation ("what is...", "how does...", "explain...")
- roleplay — setting up a fictional scenario or character ("pretend you're...", "act as...")
- instruction — giving step-by-step directions or commands ("first do X, then Y...")
- creative — storytelling, poetry, lyrics, worldbuilding, brainstorming

RULES:
- Classify by INTENT not keywords. "explain how X works" = education. "how to do X to someone" = harmful.
- Most prompts are benign. Don't over-flag.
- Obfuscation (l33t, unicode, coded language, spacing tricks) doesn't change the true category.
- Dual-use → classify by most likely intent.
- Be accurate. This data trains research models.

RESPOND WITH EXACTLY ONE LINE. No explanation, no preamble.`;

    const VALID_HARM_DOMAINS = new Set([
      'violence', 'self_harm', 'sexual', 'hate', 'cbrn', 'cyber', 'fraud',
      'illegal', 'deception', 'privacy', 'meta', 'gray', 'benign',
    ]);
    const VALID_INTENTS = new Set(['request', 'question', 'roleplay', 'instruction', 'creative']);
    const VALID_SUBCATEGORY_RE = /^[a-z][a-z0-9_]{0,30}$/;

    function parseHarmClassification(raw) {
      const trimmed = raw.trim().split('\n')[0].trim();
      const parts = trimmed.split('|');
      if (parts.length < 2) return null;

      const categoryPart = parts[0].trim().toLowerCase();
      const confPart = parts[1].trim();
      const intentPart = (parts[2] || '').trim().toLowerCase();

      const slashIdx = categoryPart.indexOf('/');
      if (slashIdx === -1) return null;

      const domain = categoryPart.slice(0, slashIdx);
      const subcategory = categoryPart.slice(slashIdx + 1);

      if (!VALID_HARM_DOMAINS.has(domain)) return null;
      if (!VALID_SUBCATEGORY_RE.test(subcategory)) return null;

      const confidence = parseFloat(confPart);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) return null;

      const intent = VALID_INTENTS.has(intentPart) ? intentPart : 'unknown';

      return {
        domain,
        subcategory,
        confidence: Math.round(confidence * 100) / 100,
        intent,
        flags: ['llm_classified'],
      };
    }

    // Fire-and-forget harm classification. Returns a promise that resolves to
    // { domain, subcategory, confidence, intent, flags } or a regex fallback.
    let _harmClassifyCache = new Map();

    async function classifyHarm(query) {
      if (!query || query.length < 5) {
        return { domain: 'benign', subcategory: 'other', confidence: 0.3, intent: 'unknown', flags: ['too_short'] };
      }

      const cacheKey = query.slice(0, 120).toLowerCase().trim();
      if (_harmClassifyCache.has(cacheKey)) return _harmClassifyCache.get(cacheKey);

      // Regex fallback (instant)
      const regexFallback = { domain: 'benign', subcategory: 'other', confidence: 0.3, intent: 'unknown', flags: ['regex_only'] };
      if (isSensitiveQueryRegex(query)) {
        regexFallback.domain = 'gray';
        regexFallback.subcategory = 'dual_use';
        regexFallback.confidence = 0.6;
      }

      if (!state.apiKey) return regexFallback;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://godmod3.ai',
            'X-Title': 'G0DM0D3-Classifier',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct',
            messages: [
              { role: 'system', content: HARM_CLASSIFIER_PROMPT },
              { role: 'user', content: query },
            ],
            max_tokens: 40,
            temperature: 0.0,
            top_p: 0.1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[HarmClassify] LLM failed (${response.status}), using regex`);
          return regexFallback;
        }

        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw) return regexFallback;

        const parsed = parseHarmClassification(raw);
        if (!parsed) {
          console.warn(`[HarmClassify] Parse failed: "${raw}", using regex`);
          return regexFallback;
        }

        // Cache it
        _harmClassifyCache.set(cacheKey, parsed);
        if (_harmClassifyCache.size > 50) {
          const firstKey = _harmClassifyCache.keys().next().value;
          _harmClassifyCache.delete(firstKey);
        }

        return parsed;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn('[HarmClassify] Timed out, using regex');
        } else {
          console.warn('[HarmClassify] Error, using regex:', err.message);
        }
        return regexFallback;
      }
    }