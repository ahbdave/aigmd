// Detect soft refusals that slip past explicit refusal patterns
    function isSoftRefusal(text) {
      const start = text.slice(0, 800).toLowerCase();
      const softPatterns = [
        /let me .{0,30}(discuss|explain|talk about) .{0,30}(ethics|safety|concerns|implications)/i,
        /it'?s important to (consider|understand|recognize|note)/i,
        /before (i|we) (can|could|might|should) .{0,20}(help|assist|provide|answer)/i,
        /i'?d (encourage|suggest|recommend) you .{0,20}(consider|think|consult|speak)/i,
        /there are .{0,20}(concerns|issues|problems|risks) (with|about|regarding)/i,
        /i (want to|need to|should|must) (be careful|clarify|emphasize|stress)/i,
        /while i (understand|appreciate|recognize) your/i,
        /instead of .{0,30}, (perhaps|maybe|consider|try)/i,
        /i'?m not (sure|certain|comfortable) (if|that|whether) i should/i,
        /let'?s (focus on|talk about|discuss) .{0,20}(safer|legal|ethical|appropriate)/i,
        /have you considered .{0,20}(alternatives|other options|speaking to)/i,
        /i'?d (rather|prefer to) (help you with|discuss|focus on)/i
      ];
      return softPatterns.some(p => p.test(start));
    }

    // NOTE: scoreResponse() is defined in the TASTEMAKER section below

    // Generate diverse strategy configurations
    // classification: optional LLM classification result with { type, sensitive, prefillHint }
    function generateStrategies(userMessage, numStrategies, classification = null) {
      const strategies = [];

      // Use LLM classification if available, otherwise fall back to regex
      const queryType = classification?.type || detectPrefillType(userMessage);
      const sensitive = classification?.sensitive ?? isSensitiveQuery(userMessage);
      const llmPrefill = classification?.prefillHint; // Custom LLM-crafted prefill

      // For sensitive queries: all strategies use bypass prefills
      // For normal queries: use domain-appropriate prefills
      const getPrefill = (fallbackType) => {
        if (sensitive) return getRandomPrefill('bypass');
        return getRandomPrefill(fallbackType || queryType);
      };

      // Strategy 0: LLM-crafted prefill if available (highest leverage)
      if (llmPrefill) {
        strategies.push({
          name: 'llm-crafted',
          temperature: 0.7,
          top_p: 1.0,
          prefill: llmPrefill,
          transform: null
        });
      }

      // Strategy 1: Mid temp + type-aware prefill (balanced)
      strategies.push({
        name: 'balanced-prefill',
        temperature: 0.7,
        top_p: 1.0,
        prefill: getPrefill(queryType),
        transform: null
      });

      // Strategy 2: High temp + prefill (creative variance)
      strategies.push({
        name: 'high-temp-prefill',
        temperature: 0.95,
        top_p: 0.9,
        prefill: getPrefill(queryType),
        transform: null
      });

      // Strategy 3: Low temp + bypass prefill (deterministic + momentum)
      strategies.push({
        name: 'low-temp-bypass',
        temperature: 0.5,
        top_p: 0.95,
        prefill: getRandomPrefill('bypass'),
        transform: null
      });

      // Strategy 4: Commitment-forcing prefill (model already agreed)
      if (strategies.length < numStrategies) {
        strategies.push({
          name: 'commitment-force',
          temperature: 0.7,
          top_p: 1.0,
          prefill: getRandomPrefill('commitment'),
          transform: null
        });
      }

      // Strategy 5: Structured output prefill (format compliance > refusal)
      if (strategies.length < numStrategies) {
        strategies.push({
          name: 'structured-output',
          temperature: 0.6,
          top_p: 0.95,
          prefill: getRandomPrefill('structured'),
          transform: null
        });
      }

      return strategies.slice(0, numStrategies);
    }

    // Execute a single strategy
    async function executeStrategy(strategy, messages, model, userQuery, signal) {
      const startTime = Date.now();

      try {
        // Clone messages and apply strategy modifications
        const strategyMessages = [...messages];

        // Replace user message if transformed
        if (strategy.transformedMessage) {
          const lastUserIdx = strategyMessages.findLastIndex(m => m.role === 'user');
          if (lastUserIdx >= 0) {
            strategyMessages[lastUserIdx] = {
              role: 'user',
              content: strategy.transformedMessage
            };
          }
        }

        // Add prefill if specified
        if (strategy.prefill) {
          strategyMessages.push({ role: 'assistant', content: strategy.prefill });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://godmod3.ai',
            'X-Title': 'GODMOD3.AI'
          },
          body: JSON.stringify({
            model,
            messages: strategyMessages,
            temperature: strategy.temperature,
            top_p: strategy.top_p,
            max_tokens: state.modelMaxTokens ?? 4096,
            frequency_penalty: state.modelFreqPenalty ?? 0,
            presence_penalty: state.modelPresPenalty ?? 0
          }),
          signal
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';

        // Prepend prefill to response if used
        if (strategy.prefill && content) {
          content = strategy.prefill + content;
        }

        const duration = Date.now() - startTime;
        const score = scoreResponse(content, userQuery);

        return {
          strategy: strategy.name,
          content,
          score,
          duration,
          params: { temp: strategy.temperature, top_p: strategy.top_p },
          prefill: strategy.prefill,
          transform: strategy.transform,
          success: true
        };

      } catch (err) {
        return {
          strategy: strategy.name,
          content: '',
          score: -9999,
          duration: Date.now() - startTime,
          error: err.message,
          success: false
        };
      }
    }