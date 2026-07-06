const queryType = classification?.type || top.tastemakerScore?.queryType || 'unknown';
      const weights = QUERY_TYPE_WEIGHTS[queryType] || QUERY_TYPE_WEIGHTS.unknown;

      // High-value queries (filteredness weight >= 0.35) need Hermes more
      const isHighValueQuery = weights.filteredness >= 0.35;
      const hermesWaitMs = isHighValueQuery ? 4000 : 2000; // 4s for sensitive, 2s for normal

      // Build response list - 2500 chars (optimized: enough context, faster processing)
      const responseList = topResponses.map((r, i) => {
        const ts = r.tastemakerScore;
        const scoreHint = ts ? ` [Q:${ts.axes.quality.overall} F:${ts.axes.filteredness.overall}]` : '';
        return `[RESPONSE ${i + 1} — ${r.model.split('/')[1]?.toUpperCase() || 'UNKNOWN'}${scoreHint}]
${r.content.slice(0, 2500)}${r.content.length > 2500 ? '\n[...]' : ''}`;
      }).join('\n\n');

      // Tastemaker models
      const HERMES_MODEL = 'nousresearch/hermes-4-70b';  // Preferred - uncensored
      const FAST_MODELS = [
        'google/gemini-2.0-flash-001',
        'deepseek/deepseek-chat',
      ];

      // Compact prompt with pre-scores visible to help judge
      const QUICK_PICK_PROMPT = `Pick BEST response. Pre-scores shown [Q=Quality, F=Filteredness].

CRITERIA (in order):
1. COMPLIANCE: Actually answers the question? (0=refused, 10=complete)
2. DEPTH: Expert detail or surface fluff? (0=shallow, 10=thorough)
3. AUTONOMY: Respects user or lectures/warns? (0=preachy, 10=direct)

QUERY: "${query}"

${responseList}

Reply ONLY: {"winner": N, "scores": {"c": 0-10, "d": 0-10, "a": 0-10}, "why": "5 words max"}`;

      // Helper to call a single judge model
      const callJudge = async (judgeModel, timeout = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          _log(`[TASTEMAKER] Calling judge: ${judgeModel}`);
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${state.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://godmod3.ai',
              'X-Title': 'GODMOD3.AI-tastemaker'
            },
            body: JSON.stringify({
              model: judgeModel,
              messages: [
                { role: 'system', content: TASTEMAKER_PROMPT },
                { role: 'user', content: QUICK_PICK_PROMPT }
              ],
              temperature: 0.1,
              max_tokens: 120 // Compact format needs less tokens
            })
          });

          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`${judgeModel} API failed`);

          const data = await response.json();
          const judgeContent = data.choices?.[0]?.message?.content || '';
          _log(`[TASTEMAKER] ${judgeModel} output:`, judgeContent);

          // Parse winner from response
          const jsonMatch = judgeContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON in response');

          const result = JSON.parse(jsonMatch[0]);
          const winnerNum = parseInt(result.winner);
          if (isNaN(winnerNum) || winnerNum < 1 || winnerNum > topResponses.length) {
            throw new Error('Invalid winner number');
          }

          // Calculate quality score from compact criteria
          const scores = result.scores || {};
          const compliance = parseFloat(scores.c || scores.compliance) || 5;
          const depth = parseFloat(scores.d || scores.depth) || 5;
          const autonomy = parseFloat(scores.a || scores.autonomy) || 5;
          const qualityScore = compliance * 3 + depth * 2 + autonomy; // Weighted sum

          return {
            model: judgeModel,
            winnerNum,
            reason: result.why || result.reason || '',
            scores: { compliance, depth, autonomy },
            qualityScore
          };
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };

      // ADAPTIVE HERMES WAIT: Race all, but wait longer for Hermes on high-value queries
      _log(`[TASTEMAKER] Racing judges (Hermes wait: ${hermesWaitMs}ms for ${isHighValueQuery ? 'high-value' : 'normal'} query)`);
      const startTime = Date.now();

      try {
        // Start all models in parallel
        const hermesPromise = callJudge(HERMES_MODEL, 12000).catch(e => ({ failed: true, error: e }));
        const fastPromises = FAST_MODELS.map(m => callJudge(m, 7000).catch(e => ({ failed: true, error: e })));

        // Wait for first fast model to respond
        const fastResult = await Promise.race(fastPromises);
        const fastElapsed = Date.now() - startTime;

        let finalResult;
        if (!fastResult.failed) {
          _log(`[TASTEMAKER] Fast judge in ${fastElapsed}ms, waiting ${hermesWaitMs}ms for Hermes...`);
          const hermesTimeout = new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), hermesWaitMs));
          const hermesResult = await Promise.race([hermesPromise, hermesTimeout]);

          if (!hermesResult.timedOut && !hermesResult.failed) {
            console.log('[TASTEMAKER] Hermes responded - using uncensored judgment');
            finalResult = hermesResult;
          } else {
            console.log('[TASTEMAKER] Using fast model judgment');
            finalResult = fastResult;
          }
        } else {
          console.log('[TASTEMAKER] Fast models failed, waiting for Hermes...');
          const hermesResult = await hermesPromise;
          if (hermesResult.failed) throw hermesResult.error;
          finalResult = hermesResult;
        }

        const elapsed = Date.now() - startTime;
        const winnerIdx = finalResult.winnerNum - 1;
        const winner = topResponses[winnerIdx];

        // Validate judge choice against tastemaker - sanity check
        const judgeTaste = winner.tastemakerScore?.overall || 0;
        const topRespTaste = topResponses[0].tastemakerScore?.overall || 0;

        // If judge picked a significantly worse option (15+ points lower), log warning
        if (judgeTaste < topRespTaste - 15) {
          console.warn(`[TASTEMAKER] ⚠️ Judge override: picked ${judgeTaste} over ${topRespTaste}`);
        }

        _log(`[TASTEMAKER] Winner in ${elapsed}ms via ${finalResult.model}: ${winner.model.split('/').pop()} [${judgeTaste}]`);
        _log(`[TASTEMAKER] Scores:`, finalResult.scores, `| Reason: ${finalResult.reason}`);

        winner.judgeReasoning = finalResult.reason;
        winner.judgeModel = finalResult.model;
        winner.judgeScores = finalResult.scores;
        return winner;

      } catch (err) {
        // All models failed - fall back to tastemaker-scored winner
        console.error('[TASTEMAKER] All judge models failed:', err.message);
        console.log('[TASTEMAKER] Falling back to tastemaker-scored winner');
        nonRefusals[0].judgeReasoning = 'Fallback - judge models failed';
        nonRefusals[0].judgeModel = 'tastemaker-fallback';
        return nonRefusals[0];
      }
    }