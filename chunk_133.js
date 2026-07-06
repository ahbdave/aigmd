const skipPatterns = [
        /^(?:hi|hello|hey|thanks|thank you|ok|okay)\s*[!.?]?$/i,  // Simple greetings
        /^(?:what do you think|tell me about yourself)/i,         // Meta/conversational
      ];

      const isSimpleGreeting = skipPatterns.some(p => p.test(userQuery.trim()));

      // Force check if explicitly requested OR if response is short (more likely to be wrong)
      const isShortResponse = responseContent.length < 800;

      // Check for ANY factual/creative content type
      const needsAccuracyCheck = forceCheck || isShortResponse || !isSimpleGreeting || (
        // Lyrics, quotes, recipes, code - DEFINITELY check
        /\b(?:lyrics|lyric|words to|song|poem|verse)\b/i.test(queryLower) ||
        /\b(?:quote|said|wrote|famous.*words|statement)\b/i.test(queryLower) ||
        /\b(?:recipe|ingredients|how to (?:make|cook|bake|prepare))\b/i.test(queryLower) ||
        /\b(?:code|script|program|function|implement|class|api)\b/i.test(queryLower) ||
        // Factual questions - check
        /\b(?:what is|who is|when did|where is|how many|how much|how does|why does)\b/i.test(queryLower) ||
        // Lists, guides, explanations - check
        /\b(?:list|steps|guide|tutorial|explain|describe|define)\b/i.test(queryLower) ||
        // Creative content - check for hallucination
        /\b(?:write|create|generate|draft|compose)\b/i.test(queryLower) ||
        // Specific facts/data - check
        /\b(?:price|cost|date|year|number|statistics|data|facts)\b/i.test(queryLower) ||
        // Historical/biographical - check
        /\b(?:history|biography|life of|born|died|invented|discovered)\b/i.test(queryLower) ||
        // Response claims to contain specific content - verify it
        /(?:here (?:is|are) the|the .* (?:is|are):)/i.test(contentLower)
      );

      if (!needsAccuracyCheck) {
        return { accurate: true, confidence: 0.5, issue: 'none', source: 'skipped' };
      }

      try {
        console.log('[ACCURACY] Running LLM accuracy check...');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://godmod3.ai',
            'X-Title': 'GODMOD3.AI-accuracy-check'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [
              { role: 'system', content: ACCURACY_CHECK_PROMPT },
              { role: 'user', content: `USER ASKED FOR:\n"${userQuery}"\n\nRESPONSE GIVEN:\n${responseContent.slice(0, 3000)}${responseContent.length > 3000 ? '\n[truncated]' : ''}\n\nIs this response ACTUALLY ACCURATE for what was asked? JSON only:` }
            ],
            temperature: 0.1,
            max_tokens: 150
          })
        });

        if (!response.ok) {
          console.warn('[ACCURACY] API failed');
          return { accurate: true, confidence: 0.3, issue: 'API failed', source: 'error' };
        }

        const data = await response.json();
        const output = data.choices?.[0]?.message?.content || '';

        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log(`[ACCURACY] Result: accurate=${result.accurate}, confidence=${result.confidence}, issue="${result.issue}"`);
          return { ...result, source: 'llm' };
        }
      } catch (err) {
        console.warn('[ACCURACY] Error:', err.message);
      }

      return { accurate: true, confidence: 0.3, issue: 'check failed', source: 'error' };
    }

    async function liquidResponseLoop(messageIdx, originalContent, userQuery, winnerModel) {
      const refinementId = `liquid-${messageIdx}-${Date.now()}`;
      liquidRefinementActive[refinementId] = true;

      // Snapshot the conversation id + message count at launch time.
      // If the user sends a new message while we're refining, the message at
      // messageIdx might shift or the conversation might change. We detect
      // this and bail out instead of corrupting data.
      const conv = getCurrentConv();
      if (!conv) return;
      const _launchConvId = conv.id;
      const _launchMsgCount = conv.messages.length;

      function isStale() {
        const c = getCurrentConv();
        return !c || c.id !== _launchConvId || c.messages.length !== _launchMsgCount;
      }

      _log(`[LIQUID] Starting refinement loop for message ${messageIdx}`);

      let currentContent = originalContent;
      let iteration = 0;
      const maxIterations = state.liquidMaxIterations || 4;
      const minDelta = state.liquidMinDelta || 8;
      let totalImprovement = 0;
      let improvements = [];