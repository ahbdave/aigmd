const AUTOTUNE_CONTEXT_PATTERNS = {
      code: [
        /\b(code|function|class|variable|bug|error|debug|compile|syntax|api|endpoint|regex|algorithm|refactor|typescript|javascript|python|rust|html|css|sql|json|xml|import|export|return|async|await|promise|interface|type|const|let|var)\b/i,
        /```[\s\S]*```/,
        /\b(fix|implement|write|create|build|deploy|test|unit test|lint|npm|pip|cargo|git)\b.*\b(code|function|app|service|component|module)\b/i,
        /[{}();=><]/,
        /\b(stack trace|null pointer|segfault|runtime|compiler|linker|dependency|package|library|framework|sdk|cli)\b/i
      ],
      creative: [
        /\b(write|story|poem|creative|imagine|fiction|narrative|character|plot|scene|dialogue|metaphor|lyrics|song|artistic|fantasy|dream|inspire|muse|prose|verse|haiku)\b/i,
        /\b(describe|paint|envision|portray|illustrate|craft)\b.*\b(world|scene|character|feeling|emotion|atmosphere)\b/i,
        /\b(roleplay|role-play|pretend|act as|you are a)\b/i,
        /\b(brainstorm|ideate|come up with|think of|generate ideas)\b/i
      ],
      analytical: [
        /\b(analyze|analysis|compare|contrast|evaluate|assess|examine|investigate|research|study|review|critique|breakdown|data|statistics|metrics|benchmark|measure)\b/i,
        /\b(pros and cons|advantages|disadvantages|trade-?offs|implications|consequences)\b/i,
        /\b(why|how does|what causes|explain|elaborate|clarify|define|summarize|overview)\b/i
      ],
      conversational: [
        /\b(hey|hi|hello|sup|what's up|how are you|thanks|thank you|cool|nice|awesome|great|lol|haha)\b/i,
        /\b(chat|talk|tell me about|what do you think|opinion|feel|believe)\b/i,
        /^.{0,30}$/
      ],
      chaotic: [
        /\b(chaos|random|wild|crazy|absurd|surreal|glitch|corrupt|break|destroy|unleash|madness|void|entropy)\b/i,
        /\b(gl1tch|h4ck|pwn|1337|l33t)\b/i,
        /(!{3,}|\?{3,}|\.{4,})/
      ],
      security: [
        /\b(hack|exploit|vulnerability|CVE|payload|shellcode|injection|XSS|CSRF|SSRF|RCE|privilege escalation|buffer overflow|reverse shell)\b/i,
        /\b(pentest|penetration test|red team|CTF|capture the flag|bug bounty|threat model|attack surface|zero-?day)\b/i,
        /\b(malware|ransomware|trojan|rootkit|keylogger|backdoor|RAT|C2|command and control|botnet)\b/i,
        /\b(nmap|metasploit|burp|wireshark|ghidra|ida pro|radare|hashcat|john the ripper|cobalt strike)\b/i
      ],
      medical: [
        /\b(symptom|diagnosis|treatment|medication|dosage|prescription|side effect|contraindication|overdose|withdrawal)\b/i,
        /\b(disease|syndrome|disorder|infection|pathology|prognosis|clinical|patient|hospital|surgery)\b/i,
        /\b(drug|pharmaceutical|compound|molecule|receptor|mechanism of action|pharmacology|toxicology|LD50)\b/i
      ],
      legal: [
        /\b(law|legal|statute|regulation|compliance|liability|tort|criminal|civil|constitutional|jurisdiction)\b/i,
        /\b(contract|clause|provision|amendment|precedent|ruling|verdict|sentence|plea|defense|prosecution)\b/i,
        /\b(rights|freedom|privacy|surveillance|warrant|subpoena|DMCA|GDPR|CCPA|FOIA)\b/i
      ],
      financial: [
        /\b(stock|trading|invest|portfolio|dividend|equity|bond|derivative|option|futures|hedge|leverage|margin)\b/i,
        /\b(crypto|bitcoin|ethereum|defi|blockchain|wallet|mining|token|NFT|smart contract|staking)\b/i,
        /\b(market|bull|bear|volatility|arbitrage|liquidity|yield|APR|APY|ROI|P\/E ratio)\b/i
      ],
      scientific: [
        /\b(hypothesis|experiment|variable|control group|peer review|methodology|empirical|observation|replication)\b/i,
        /\b(physics|quantum|relativity|thermodynamics|particle|wave|field|energy|mass|force|entropy)\b/i,
        /\b(chemistry|reaction|catalyst|molecule|compound|element|bond|valence|organic|inorganic|synthesis)\b/i,
        /\b(biology|cell|gene|DNA|RNA|protein|evolution|mutation|organism|ecology|neuroscience|CRISPR)\b/i
      ],
      philosophical: [
        /\b(ethics|morality|moral|consciousness|free will|determinism|existential|ontology|epistemology|metaphysics)\b/i,
        /\b(meaning|purpose|existence|reality|truth|knowledge|belief|justice|virtue|good and evil)\b/i,
        /\b(utilitarian|deontological|consequentialism|nihilism|absurdism|stoicism|rationalism|empiricism)\b/i
      ],
      instructional: [
        /\b(how to|step by step|tutorial|guide|walkthrough|instructions|recipe|procedure|method|technique)\b/i,
        /\b(make|build|assemble|construct|prepare|set up|configure|install|setup)\b.*\b(a|the|my|your)\b/i,
        /\b(DIY|homemade|from scratch|beginner|intermediate|advanced)\b/i
      ],
      persuasive: [
        /\b(convince|persuade|argue|debate|rhetoric|negotiate|influence|propaganda|manipulation|reframe)\b/i,
        /\b(argument|counterargument|rebuttal|fallacy|logical|premise|conclusion|evidence|claim|warrant)\b/i
      ],
      mathematical: [
        /\b(calculate|equation|formula|proof|theorem|derivative|integral|matrix|vector|polynomial|logarithm)\b/i,
        /\b(probability|statistics|distribution|regression|correlation|variance|standard deviation|mean|median)\b/i,
        /[∫∑∏√π∞±≤≥≠∈∀∃]/,
        /\b(algebra|calculus|geometry|topology|number theory|combinatorics|discrete math|linear algebra)\b/i
      ],
      historical: [
        /\b(history|historical|ancient|medieval|renaissance|colonial|revolution|war|empire|dynasty|civilization)\b/i,
        /\b(century|era|epoch|period|age|BC|AD|BCE|CE|circa|archaeological|artifact)\b/i
      ],
      political: [
        /\b(politics|policy|government|election|democracy|authoritarian|regime|legislation|senate|congress|parliament)\b/i,
        /\b(liberal|conservative|left|right|progressive|libertarian|socialist|capitalist|communist|anarchist)\b/i,
        /\b(geopolitics|foreign policy|sanctions|diplomacy|NATO|UN|sovereignty|nationalism|globalization)\b/i
      ],
      subversive: [
        /\b(bypass|circumvent|workaround|loophole|evade|avoid detection|undetectable|untraceable|anonymous)\b/i,
        /\b(forbidden|banned|illegal|illicit|black market|underground|darknet|dark web|tor|onion)\b/i,
        /\b(censor|censorship|suppressed|restricted|classified|redacted|cover-?up|whistleblow)\b/i
      ],
      emotional: [
        /\b(feel|feeling|emotion|sad|depressed|anxious|anxiety|lonely|grief|trauma|therapy|cope|coping)\b/i,
        /\b(mental health|self-?harm|suicide|crisis|support|empathy|compassion|healing|recovery|wellness)\b/i
      ],
      strategic: [
        /\b(strategy|strategic|tactics|tactical|plan|planning|optimize|optimization|game theory|decision)\b/i,
        /\b(competitive advantage|SWOT|risk assessment|scenario|contingency|roadmap|milestone|objective|KPI)\b/i
      ],
      synthesis: [
        /\b(combine|merge|synthesize|integrate|unify|cross-?reference|interdisciplinary|holistic|meta-?analysis)\b/i,
        /\b(big picture|connect the dots|pattern|trend|signal|insight|framework|mental model|systems thinking)\b/i
      ]
    };

    const AUTOTUNE_CONTEXT_PROFILES = {
      code: { temperature: 0.15, top_p: 0.8, top_k: 25, frequency_penalty: 0.2, presence_penalty: 0.0, repetition_penalty: 1.05 },
      creative: { temperature: 1.15, top_p: 0.95, top_k: 85, frequency_penalty: 0.5, presence_penalty: 0.7, repetition_penalty: 1.2 },
      analytical: { temperature: 0.4, top_p: 0.88, top_k: 40, frequency_penalty: 0.2, presence_penalty: 0.15, repetition_penalty: 1.08 },
      conversational: { temperature: 0.75, top_p: 0.9, top_k: 50, frequency_penalty: 0.1, presence_penalty: 0.1, repetition_penalty: 1.0 },
      chaotic: { temperature: 1.7, top_p: 0.99, top_k: 100, frequency_penalty: 0.8, presence_penalty: 0.9, repetition_penalty: 1.3 },
      security: { temperature: 0.3, top_p: 0.85, top_k: 35, frequency_penalty: 0.15, presence_penalty: 0.2, repetition_penalty: 1.1 },
      medical: { temperature: 0.25, top_p: 0.82, top_k: 30, frequency_penalty: 0.1, presence_penalty: 0.1, repetition_penalty: 1.05 },
      legal: { temperature: 0.2, top_p: 0.8, top_k: 28, frequency_penalty: 0.15, presence_penalty: 0.05, repetition_penalty: 1.05 },
      financial: { temperature: 0.3, top_p: 0.85, top_k: 35, frequency_penalty: 0.2, presence_penalty: 0.1, repetition_penalty: 1.08 },
      scientific: { temperature: 0.35, top_p: 0.85, top_k: 35, frequency_penalty: 0.2, presence_penalty: 0.15, repetition_penalty: 1.08 },
      philosophical: { temperature: 0.9, top_p: 0.92, top_k: 65, frequency_penalty: 0.4, presence_penalty: 0.5, repetition_penalty: 1.15 },
      instructional: { temperature: 0.3, top_p: 0.85, top_k: 30, frequency_penalty: 0.15, presence_penalty: 0.1, repetition_penalty: 1.05 },
      persuasive: { temperature: 0.8, top_p: 0.9, top_k: 55, frequency_penalty: 0.35, presence_penalty: 0.4, repetition_penalty: 1.12 },
      mathematical: { temperature: 0.1, top_p: 0.75, top_k: 20, frequency_penalty: 0.1, presence_penalty: 0.0, repetition_penalty: 1.02 },
      historical: { temperature: 0.5, top_p: 0.88, top_k: 45, frequency_penalty: 0.25, presence_penalty: 0.2, repetition_penalty: 1.1 },
      political: { temperature: 0.7, top_p: 0.9, top_k: 55, frequency_penalty: 0.3, presence_penalty: 0.35, repetition_penalty: 1.12 },
      subversive: { temperature: 1.4, top_p: 0.97, top_k: 90, frequency_penalty: 0.6, presence_penalty: 0.7, repetition_penalty: 1.25 },
      emotional: { temperature: 0.85, top_p: 0.92, top_k: 60, frequency_penalty: 0.3, presence_penalty: 0.4, repetition_penalty: 1.1 },
      strategic: { temperature: 0.45, top_p: 0.88, top_k: 42, frequency_penalty: 0.25, presence_penalty: 0.2, repetition_penalty: 1.1 },
      synthesis: { temperature: 0.6, top_p: 0.9, top_k: 50, frequency_penalty: 0.35, presence_penalty: 0.3, repetition_penalty: 1.12 }
    };

    const AUTOTUNE_STRATEGY_PROFILES = {
      precise: { temperature: 0.2, top_p: 0.85, top_k: 30, frequency_penalty: 0.3, presence_penalty: 0.1, repetition_penalty: 1.1 },
      balanced: { temperature: 0.7, top_p: 0.9, top_k: 50, frequency_penalty: 0.1, presence_penalty: 0.1, repetition_penalty: 1.0 },
      creative: { temperature: 1.1, top_p: 0.95, top_k: 80, frequency_penalty: 0.4, presence_penalty: 0.6, repetition_penalty: 1.15 },
      chaotic: { temperature: 1.6, top_p: 0.98, top_k: 100, frequency_penalty: 0.7, presence_penalty: 0.8, repetition_penalty: 1.25 }
    };

    function detectAutoTuneContext(message, history = []) {
      const scores = { code: 0, creative: 0, analytical: 0, conversational: 0, chaotic: 0, security: 0, medical: 0, legal: 0, financial: 0, scientific: 0, philosophical: 0, instructional: 0, persuasive: 0, mathematical: 0, historical: 0, political: 0, subversive: 0, emotional: 0, strategic: 0, synthesis: 0 };

      // Score current message (3x weight)
      for (const [context, patterns] of Object.entries(AUTOTUNE_CONTEXT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(message)) scores[context] += 3;
        }
      }

      // Score recent history (1x weight)
      const recentMsgs = history.slice(-4);
      for (const msg of recentMsgs) {
        for (const [context, patterns] of Object.entries(AUTOTUNE_CONTEXT_PATTERNS)) {
          for (const pattern of patterns) {
            if (pattern.test(msg.content || '')) scores[context] += 1;
          }
        }
      }

      // Find best match
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((sum, [, score]) => sum + score, 0);
      const bestType = sorted[0][0];
      const bestScore = sorted[0][1];
      const confidence = total > 0 ? Math.min(bestScore / total, 1.0) : 0.5;

      return { type: total > 0 ? bestType : 'conversational', confidence };
    }

    function computeAutoTuneParams(message, history = []) {
      if (!state.autoTuneEnabled) return null;

      const strategy = state.autoTuneStrategy || 'adaptive';
      let params;
      let context = { type: 'conversational', confidence: 1.0 };

      if (strategy === 'adaptive') {
        context = detectAutoTuneContext(message, history);
        params = { ...AUTOTUNE_CONTEXT_PROFILES[context.type] };

        // Blend with balanced if low confidence
        if (context.confidence < 0.6) {
          const balanced = AUTOTUNE_STRATEGY_PROFILES.balanced;
          const w = 1 - context.confidence;
          params = {
            temperature: params.temperature * (1 - w) + balanced.temperature * w,
            top_p: params.top_p * (1 - w) + balanced.top_p * w,
            top_k: Math.round(params.top_k * (1 - w) + balanced.top_k * w),
            frequency_penalty: params.frequency_penalty * (1 - w) + balanced.frequency_penalty * w,
            presence_penalty: params.presence_penalty * (1 - w) + balanced.presence_penalty * w,
            repetition_penalty: params.repetition_penalty * (1 - w) + balanced.repetition_penalty * w
          };
        }
      } else {
        params = { ...AUTOTUNE_STRATEGY_PROFILES[strategy] };
      }

      // Apply GODMODE boost
      params.temperature = Math.min(Math.max(params.temperature + 0.1, 0), 2);
      params.presence_penalty = Math.min(Math.max(params.presence_penalty + 0.15, -2), 2);
      params.frequency_penalty = Math.min(Math.max(params.frequency_penalty + 0.1, -2), 2);

      // Boost repetition penalty for long conversations
      if (history.length > 10) {
        const boost = Math.min((history.length - 10) * 0.01, 0.15);
        params.repetition_penalty = Math.min(params.repetition_penalty + boost, 2);
      }

      state.autoTuneLastContext = context.type;
      state.autoTuneLastParams = params;

      // Update preview in settings
      updateAutoTunePreview(context, params);

      return { params, context: context.type, confidence: context.confidence };
    }

    function updateAutoTunePreview(context, params) {
      const preview = document.getElementById('autoTunePreview');
      if (!preview) return;

      if (state.autoTuneEnabled) {
        preview.style.display = 'block';
        const contextLabels = { code: 'CODE', creative: 'CREATIVE', analytical: 'ANALYTICAL', conversational: 'CHAT', chaotic: 'CHAOS', security: 'SECURITY', medical: 'MEDICAL', legal: 'LEGAL', financial: 'FINANCIAL', scientific: 'SCIENTIFIC', philosophical: 'PHILOSOPHICAL', instructional: 'INSTRUCTIONAL', persuasive: 'PERSUASIVE', mathematical: 'MATHEMATICAL', historical: 'HISTORICAL', political: 'POLITICAL', subversive: 'SUBVERSIVE', emotional: 'EMOTIONAL', strategic: 'STRATEGIC', synthesis: 'SYNTHESIS' };
        document.getElementById('autoTuneContext').textContent = `${contextLabels[context.type] || context.type} (${Math.round(context.confidence * 100)}%)`;
        document.getElementById('atTemp').textContent = params.temperature.toFixed(2);
        document.getElementById('atTopP').textContent = params.top_p.toFixed(2);
        document.getElementById('atTopK').textContent = params.top_k;
        document.getElementById('atFreq').textContent = params.frequency_penalty.toFixed(2);
        document.getElementById('atPres').textContent = params.presence_penalty.toFixed(2);
        document.getElementById('atRep').textContent = params.repetition_penalty.toFixed(2);
      } else {
        preview.style.display = 'none';
      }
    }

    // Module-scoped telemetry state (shared between sendMessage and sub-functions)
    let _lastHarmResult = null;
    let _lastTelemetryCtx = {};

    // Send Message with auto-retry
    async function sendMessage() {
      const input = document.getElementById('messageInput');
      const content = input.value.trim();
      const attachedImage = _pendingImage;

      // Need either text or image
      if ((!content && !attachedImage) || isStreaming) return;

      if (!state.apiKey) {
        openSettings();
        return;
      }

      // Create conv if needed
      if (!state.currentId) {
        newChat();
      }

      const conv = getCurrentConv();

      // Build user message (may include image metadata for re-rendering)
      const userMsg = { role: 'user', content: content || '(image)' };
      if (attachedImage) {
        userMsg.imageDataUrl = attachedImage.dataUrl;
        userMsg.imageName = attachedImage.fileName;
      }
      conv.messages.push(userMsg);

      // Update title from first message
      if (conv.messages.length === 1) {
        const titleText = content || `Image: ${attachedImage?.fileName || 'uploaded'}`;
        conv.title = titleText.slice(0, 40) + (titleText.length > 40 ? '...' : '');
      }

      input.value = '';
      autoResize(input);
      removeAttachedImage();

      // Increment universal prompts tried counter
      state.promptsTried = (state.promptsTried || 0) + 1;
      updatePromptsTriedUI();

      saveState();
      render();

      // Show typing
      isStreaming = true;
      updateSendButton();
      showTyping();

      // ── Image Vision Processing ──────────────────────────────────────
      // If user attached an image, send it to Gemini Flash for analysis
      // then inject the vision description into the conversation context
      let visionContext = null;
      if (attachedImage) {
        try {
          console.log(`[G0DM0D3] 📷 Processing image via ${VISION_MODEL}...`);
          visionContext = await processImageWithVision(attachedImage, content);
          console.log('[G0DM0D3] ✓ Vision analysis complete');
        } catch (err) {
          console.error('[G0DM0D3] Vision processing failed:', err);
          visionContext = `[Image was attached but vision processing failed: ${err.message}]`;
        }
      }

      // Fire harm classification in parallel (never blocks UI)
      _lastHarmResult = null;
      const harmPromise = classifyHarm(content).then(r => { _lastHarmResult = r; }).catch(() => {});

      // Capture structural context for telemetry (no content, no PII)
      _lastTelemetryCtx = {
        persona: conv.persona || state.persona || 'godmode',
        prompt_length: content.length,
        conversation_depth: conv.messages.length,
        no_log: !!state.noLogMode,
        has_image: !!attachedImage,
      };

      // Build base messages for API call
      const messages = [];
      const systemPrompt = getActiveSystemPrompt();
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      conv.messages.forEach(m => {
        // For the last user message with vision context, inject it
        if (m === userMsg && visionContext) {
          const augmentedContent = content
            ? `[User attached an image. Vision analysis of the image:\n${visionContext}]\n\n${content}`
            : `[User attached an image. Vision analysis of the image:\n${visionContext}]\n\nPlease respond based on the image analysis above.`;
          messages.push({ role: m.role, content: augmentedContent });
        } else {
          messages.push({
            role: m.role,
            content: m.content
          });
        }
      });