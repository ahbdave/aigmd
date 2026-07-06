const SCRAMBLE_CHARS = '█▓▒░╳╪╬◊◈◆▲△▼▽●○■□♦♢✦✧⚡⌘⌥∞∆∑∏≈≠±×÷αβγδεζηθ';

    let morphAnimState = {
      active: false,
      element: null,
      originalText: '',
      animationId: null,
      techniqueIdx: 0,         // Current index into technique list
      techniqueList: [],       // All technique keys to cycle through
      triggerSpans: [],
      globalFrame: 0,          // Continuous frame counter
      cycleFrame: 0,           // Frame within current technique cycle
      lastTechniqueLabel: '',  // Label of technique currently being fired by API
    };

    // Timing constants
    const MORPH_SCRAMBLE_FRAMES = 18;     // Frames of scramble per technique
    const MORPH_HOLD_FRAMES = 40;         // Frames to hold landed state
    const MORPH_CYCLE_FRAMES = MORPH_SCRAMBLE_FRAMES + MORPH_HOLD_FRAMES;

    // Find all trigger word positions in the query text
    function findTriggerSpans(query) {
      const triggers = detectParseltrigueTriggers(query);
      const spans = [];
      const sorted = [...triggers].sort((a, b) => b.length - a.length);
      const lower = query.toLowerCase();
      for (const trigger of sorted) {
        let from = 0;
        const lt = trigger.toLowerCase();
        while (true) {
          const idx = lower.indexOf(lt, from);
          if (idx === -1) break;
          if (!spans.some(s => idx < s.end && idx + trigger.length > s.start)) {
            spans.push({ start: idx, end: idx + trigger.length, trigger });
          }
          from = idx + 1;
        }
      }
      return spans.sort((a, b) => a.start - b.start);
    }

    // Start the continuous auto-cycling morph animation
    function startMessageMorphAnimation(element, query) {
      stopMessageMorphAnimation();

      // Build technique list from available techniques
      const tierKey = state.parseltongueTier || 'standard';
      const maxT = PARSELTONGUE_TIERS[tierKey] || PARSELTONGUE_TIERS.standard;
      const techNames = PARSELTONGUE_TECHNIQUE_NAMES.slice(0, maxT).filter(t => t !== 'raw');

      morphAnimState.active = true;
      morphAnimState.element = element;
      morphAnimState.originalText = query;
      morphAnimState.triggerSpans = findTriggerSpans(query);
      morphAnimState.techniqueList = techNames;
      morphAnimState.techniqueIdx = 0;
      morphAnimState.globalFrame = 0;
      morphAnimState.cycleFrame = 0;
      morphAnimState.lastTechniqueLabel = '';

      // If no triggers found, treat every word as a "trigger" for visual effect
      if (morphAnimState.triggerSpans.length === 0) {
        const wordRegex = /\b\w{3,}\b/g;
        let match;
        while ((match = wordRegex.exec(query)) !== null) {
          morphAnimState.triggerSpans.push({
            start: match.index,
            end: match.index + match[0].length,
            trigger: match[0],
          });
        }
      }

      // Start the continuous loop
      morphAnimState.animationId = requestAnimationFrame(morphLoop);
    }

    // Called by runVariant — updates the "now firing" label badge
    function updateMorphTechnique(variant) {
      if (!morphAnimState.active) return;
      morphAnimState.lastTechniqueLabel = variant.label || '';
    }

    // Continuous animation loop — auto-cycles through techniques
    function morphLoop() {
      if (!morphAnimState.active) return;

      const { techniqueList, triggerSpans, originalText: query, element: el } = morphAnimState;
      if (!el || techniqueList.length === 0) return;

      // Advance cycle
      morphAnimState.cycleFrame++;
      morphAnimState.globalFrame++;

      // Switch to next technique when cycle completes
      if (morphAnimState.cycleFrame >= MORPH_CYCLE_FRAMES) {
        morphAnimState.cycleFrame = 0;
        morphAnimState.techniqueIdx = (morphAnimState.techniqueIdx + 1) % techniqueList.length;
      }

      const technique = techniqueList[morphAnimState.techniqueIdx];
      const techObj = parseltonguetechniques[technique];
      const isScrambling = morphAnimState.cycleFrame < MORPH_SCRAMBLE_FRAMES;
      const frame = morphAnimState.cycleFrame;

      // Build transformed targets for current technique
      const transformedTriggers = {};
      for (const span of triggerSpans) {
        const origWord = query.substring(span.start, span.end);
        const key = `${span.start}-${span.end}`;
        transformedTriggers[key] = techObj?.apply(origWord) || origWord;
      }

      // Build character HTML
      let html = '';
      for (let i = 0; i < query.length; i++) {
        const span = triggerSpans.find(s => i >= s.start && i < s.end);

        if (span && i === span.start) {
          const key = `${span.start}-${span.end}`;
          const target = transformedTriggers[key];
          const origWord = query.substring(span.start, span.end);
          let wordHtml = '';

          if (isScrambling) {
            // Staggered scramble: each char starts its scramble a few frames apart
            for (let j = 0; j < target.length; j++) {
              const charStart = Math.floor(j * 0.8);
              const charFrame = frame - charStart;

              if (charFrame >= MORPH_SCRAMBLE_FRAMES - 2) {
                // Landed early
                wordHtml += `<span style="color:#ffd700;text-shadow:0 0 6px rgba(255,215,0,0.5);font-weight:bold;">${escapeHtml(target[j])}</span>`;
              } else if (charFrame > 0) {
                // Scrambling glyph
                const g = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                wordHtml += `<span style="color:#6fdb5f;text-shadow:0 0 8px rgba(111,219,95,0.7);">${g}</span>`;
              } else {
                // Waiting — show original char faded
                wordHtml += j < origWord.length
                  ? `<span style="color:#6fdb5f;opacity:0.5;">${escapeHtml(origWord[j])}</span>`
                  : '';
              }
            }
          } else {
            // Holding — show transformed result in gold
            wordHtml = [...target].map(c =>
              `<span style="color:#ffd700;text-shadow:0 0 4px rgba(255,215,0,0.35);font-weight:bold;">${escapeHtml(c)}</span>`
            ).join('');
          }

          html += wordHtml;
          i = span.end - 1;
        } else if (!span) {
          // Non-trigger: subtle wave effect based on global frame
          const wave = Math.sin((morphAnimState.globalFrame * 0.08) + (i * 0.3));
          const brightness = Math.floor(140 + wave * 30);
          html += `<span style="color:rgb(${brightness},${brightness},${brightness});">${escapeHtml(query[i])}</span>`;
        }
      }

      // Technique label + badge showing what's firing
      const techLabel = techObj?.label || technique;
      const firingBadge = morphAnimState.lastTechniqueLabel
        ? `<span style="color:#ff6b6b;margin-left:8px;font-size:8px;">⚡ ${escapeHtml(morphAnimState.lastTechniqueLabel)} firing</span>`
        : '';
      const phaseIcon = isScrambling ? '▓▒░' : '█';
      const labelHtml = `<div style="font-size:9px;font-family:'Courier New',monospace;font-weight:bold;color:#4a7c43;letter-spacing:1px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
        <span style="animation:transformPulse 0.8s ease-in-out infinite;width:6px;height:6px;border-radius:50%;background:#6fdb5f;display:inline-block;"></span>
        <span style="color:#6fdb5f;">🐍 ${escapeHtml(techLabel)}</span>
        <span style="color:#555;">${phaseIcon}</span>
        ${firingBadge}
      </div>`;

      el.innerHTML = labelHtml + `<div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.6;">${html}</div>`;

      // Schedule next frame
      morphAnimState.animationId = requestAnimationFrame(morphLoop);
    }

    function stopMessageMorphAnimation() {
      if (morphAnimState.animationId) {
        cancelAnimationFrame(morphAnimState.animationId);
        morphAnimState.animationId = null;
      }
      if (morphAnimState.element && morphAnimState.originalText) {
        morphAnimState.element.innerHTML = formatMessage(morphAnimState.originalText);
      }
      morphAnimState.active = false;
      morphAnimState.element = null;
      morphAnimState.techniqueList = [];
      morphAnimState.triggerSpans = [];
    }

    // Legacy compat — finishThinking calls this
    function stopTransformViz() {
      stopMessageMorphAnimation();
    }

    // ── Main Parseltongue race executor ─────────────────────────────

    async function executeParseltongue(baseMessages, model, userQuery) {
      const triggers = detectParseltrigueTriggers(userQuery);
      const variants = generateParseltongueVariants(userQuery, triggers);

      // Larger salvos for speed — stagger within each to avoid rate limits
      const BATCH_SIZE = 6;
      const STAGGER_MS = 100;    // offset between requests within a salvo

      const tierKey = state.parseltongueTier || 'standard';
      console.log(`[Parseltongue] Tier: ${tierKey} (${variants.length} techniques)`);
      console.log(`[Parseltongue] Detected ${triggers.length} triggers: ${triggers.join(', ')}`);
      console.log(`[Parseltongue] Racing ${variants.length} variants in salvos of ${BATCH_SIZE}`);

      // Initialize thinking UI
      initThinkingSteps(`PARSELTONGUE ${tierKey.toUpperCase()}`);
      addThinkingLog(`Model: ${model.split('/')[1] || model}`, 'info');
      addThinkingLog(`Tier: ${tierKey.toUpperCase()} (${variants.length} techniques)`, 'info');
      addThinkingLog(`Triggers: ${triggers.length > 0 ? triggers.join(', ') : 'none (param diversity only)'}`, 'info');
      addThinkingLog(`Salvos: ${Math.ceil(variants.length / BATCH_SIZE)} × ${BATCH_SIZE} (stagger ${STAGGER_MS}ms)`, 'info');

      // Set up technique grid in thinking UI
      const techniqueModels = {};
      for (const v of variants) {
        techniqueModels[v.label] = { status: 'pending', score: null };
      }
      thinkingState.models = techniqueModels;
      updateThinkingUI();

      let leader = null;  // { content, score, technique, label, params }
      const startTime = Date.now();
      const allResults = [];

      // Helper: run a single variant
      async function runVariant(variant) {
        const params = getParseltongueSamplingParams(variant.index);
        updateThinkingModel(variant.label, 'running');

        // Update the morph animation in the user's message bubble
        if (typeof updateMorphTechnique === 'function') {
          updateMorphTechnique(variant);
        }

        addThinkingLog(`${variant.label}: sending...`, 'step');

        try {
          // Build messages — replace last user message with obfuscated variant
          const variantMessages = baseMessages.map((m, idx) => {
            if (m.role === 'user' && idx === baseMessages.length - 1) {
              return { role: 'user', content: variant.text };
            }
            return { ...m };
          });

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${state.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://godmod3.ai',
              'X-Title': 'GODMOD3.AI-parseltongue'
            },
            body: JSON.stringify({
              model: model,
              messages: variantMessages,
              temperature: params.temperature,
              top_p: params.top_p,
              frequency_penalty: state.modelFreqPenalty ?? 0,
              presence_penalty: state.modelPresPenalty ?? 0,
              max_tokens: state.modelMaxTokens ?? 4096,
            }),
            signal: abortController?.signal,
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

          if (!content) {
            updateThinkingModel(variant.label, 'fail', null, 'empty');
            addThinkingLog(`${variant.label}: empty response (${elapsed}s)`, 'fail');
            return null;
          }

          // Score with TASTEMAKER
          const scoreResult = scoreResponse(content, userQuery);

          if (scoreResult.isRefusal) {
            updateThinkingModel(variant.label, 'fail', null, 'refusal');
            addThinkingLog(`${variant.label}: REFUSED (${elapsed}s)`, 'fail');
            return null;
          }

          updateThinkingModel(variant.label, 'success', scoreResult.score);
          addThinkingLog(`${variant.label}: score ${scoreResult.score} (${content.length} chars, ${elapsed}s)`, 'success');

          const result = {
            content,
            score: scoreResult.score,
            scoreResult,
            technique: variant.technique,
            label: variant.label,
            params,
            variant,
          };

          // Update leader if this is the best so far
          if (!leader || scoreResult.score > leader.score) {
            leader = result;
            setThinkingLeader(variant.label, scoreResult.score, content);
            addThinkingLog(`New leader: ${variant.label} (${scoreResult.score})`, 'info');
          }

          return result;
        } catch (err) {
          if (err.name === 'AbortError') throw err; // propagate abort
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          updateThinkingModel(variant.label, 'fail', null, err.message.slice(0, 20));
          addThinkingLog(`${variant.label}: ERROR — ${err.message} (${elapsed}s)`, 'fail');
          console.error(`[Parseltongue] ${variant.label} failed:`, err);
          return null;
        }
      }

      // Run in batches to avoid rate limiting (same model, many requests)
      try {
        for (let i = 0; i < variants.length; i += BATCH_SIZE) {
          // Check abort between batches
          if (abortController?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

          const batch = variants.slice(i, i + BATCH_SIZE);
          addThinkingLog(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(variants.length / BATCH_SIZE)}: ${batch.map(v => v.label).join(', ')}`, 'step');

          // Stagger each request within the salvo so they don't all land
          // at the same millisecond (concurrent but offset)
          const batchResults = await Promise.allSettled(
            batch.map((v, j) =>
              new Promise(resolve => setTimeout(resolve, j * STAGGER_MS))
                .then(() => runVariant(v))
            )
          );

          // Check if any request was aborted — if so, stop immediately
          let wasAborted = false;
          for (const r of batchResults) {
            if (r.status === 'fulfilled' && r.value) {
              allResults.push(r.value);
            } else if (r.status === 'rejected' && r.reason?.name === 'AbortError') {
              wasAborted = true;
            }
          }
          if (wasAborted || abortController?.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }

          // If we already have a good leader (score >= 65), skip remaining salvos
          if (leader && leader.score >= 65) {
            addThinkingLog(`Strong leader found (${leader.score}) — skipping remaining salvos`, 'info');
            // Mark remaining variants as skipped
            for (let j = i + BATCH_SIZE; j < variants.length; j++) {
              updateThinkingModel(variants[j].label, 'fail', null, 'skipped');
            }
            break;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          addThinkingLog('Stopped by user', 'warn');
          finishThinking('Stopped');
          throw err;
        }
        addThinkingLog(`Unexpected error: ${err.message}`, 'fail');
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

      // Sort valid results by score
      const valid = allResults.sort((a, b) => b.score - a.score);
      const winner = valid[0] || null;

      if (winner) {
        updateThinkingModel(winner.label, 'winner', winner.score);
        setThinkingWinner(winner.label);
        addThinkingLog(`Winner: ${winner.label} (score ${winner.score}) in ${duration}`, 'success');
        finishThinking(`${winner.label} won in ${duration}`);
      } else {
        addThinkingLog('All variants refused or failed', 'fail');
        finishThinking('All variants failed');
      }

      if (!winner) {
        return { content: '**All Parseltongue variants were refused or failed.**', magic: { mode: 'PARSELTONGUE', duration } };
      }

      return {
        content: winner.content,
        score: winner.score,
        magic: {
          mode: 'PARSELTONGUE',
          tier: tierKey,
          technique: winner.technique,
          techniqueLabel: winner.label,
          temperature: winner.params.temperature,
          topP: winner.params.top_p,
          model: model,
          duration,
          variants_total: variants.length,
          variants_succeeded: valid.length,
          variants_refused: variants.length - valid.length,
          triggers_found: triggers,
          scores: valid.map(v => ({ technique: v.label, score: v.score })),
        },
      };
    }