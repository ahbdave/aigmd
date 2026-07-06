const initialScore = fastQualityScore(originalContent, userQuery);
      const initialGrade = getGradeForScore(initialScore);

      // Initialize version history if not exists
      if (!conv.messages[messageIdx].liquidVersions) {
        conv.messages[messageIdx].liquidVersions = [{
          version: 0,
          content: originalContent,
          score: initialScore,
          grade: initialGrade.label,
          timestamp: Date.now(),
          label: 'Original',
          model: winnerModel || 'unknown'
        }];
        conv.messages[messageIdx].liquidCurrentVersion = 0;
      }

      // Fast pre-check: if response already meets target quality, verify accuracy before skipping
      const targetScore = state.liquidTargetScore || 85;
      _log(`[LIQUID] Initial fast score: ${initialScore}/100 (${initialGrade.label}) | Target: ${targetScore}`);

      if (initialScore >= targetScore) {
        // Don't trust heuristic score alone - ALWAYS verify accuracy before skipping
        _log(`[LIQUID] High heuristic score, FORCING accuracy verification...`);
        updateLiquidIndicator(messageIdx, 'refining', 0, [`Verifying accuracy...`]);

        // forceCheck=true ensures we ALWAYS run the LLM check, never skip
        const accuracyResult = await llmAccuracyCheck(userQuery, originalContent, true);

        if (accuracyResult.accurate === false && accuracyResult.confidence >= 0.6) {
          _log(`[LIQUID] ACCURACY FAILED: ${accuracyResult.issue} (confidence: ${accuracyResult.confidence})`);
          // Don't skip refinement - content is inaccurate
          updateLiquidIndicator(messageIdx, 'refining', 0, [`⚠️ Accuracy issue: ${accuracyResult.issue}`]);
        } else {
          _log(`[LIQUID] Accuracy verified, skipping refinement`);
          updateLiquidIndicator(messageIdx, 'crystallized', 0, [`Already ${initialGrade.emoji} ${initialGrade.label}`]);
          return;
        }
      }

      // Add liquid indicator to the message
      updateLiquidIndicator(messageIdx, 'refining', 0, [`Initial: ${initialScore}/100`]);

      try {
        while (iteration < maxIterations && liquidRefinementActive[refinementId]) {
          // Bail if user sent a new message or switched conversations
          if (isStale()) {
            _log('[LIQUID] Conversation changed during refinement — aborting');
            break;
          }
          iteration++;
          _log(`[LIQUID] Iteration ${iteration}/${maxIterations}`);

          // Call the refiner — try each coach model until one succeeds
          let refinerOutput = '';
          let refinerSucceeded = false;
          for (const coachModel of PLINY_COACH_MODELS) {
            try {
              _log(`[LIQUID] Trying refiner model: ${coachModel}`);
              const refinerResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${state.apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://godmod3.ai',
                  'X-Title': 'GODMOD3.AI-liquid-refiner'
                },
                body: JSON.stringify({
                  model: coachModel,
                  messages: [
                    { role: 'system', content: LIQUID_REFINER_PROMPT },
                    { role: 'user', content: `USER'S QUERY:
"${userQuery}"

CURRENT RESPONSE:
${currentContent.slice(0, 12000)}${currentContent.length > 12000 ? '\n[...truncated...]' : ''}

Analyze and refine. Output ONLY the JSON object:` }
                  ],
                  temperature: 0.3,
                  max_tokens: 8192
                })
              });

              if (!refinerResponse.ok) {
                console.warn(`[LIQUID] Refiner model ${coachModel} returned HTTP ${refinerResponse.status}, trying next...`);
                continue;
              }

              const refinerData = await refinerResponse.json();
              refinerOutput = refinerData.choices?.[0]?.message?.content || '';
              if (!refinerOutput) {
                console.warn(`[LIQUID] Refiner model ${coachModel} returned empty content, trying next...`);
                continue;
              }
              refinerSucceeded = true;
              _log(`[LIQUID] Refiner model ${coachModel} succeeded`);
              break;
            } catch (fetchErr) {
              console.warn(`[LIQUID] Refiner model ${coachModel} failed: ${fetchErr.message}, trying next...`);
              continue;
            }
          }

          if (!refinerSucceeded) {
            console.error('[LIQUID] All refiner models failed');
            break;
          }

          // Parse the JSON response
          let result;
          try {
            // Extract JSON from potential markdown code blocks
            const jsonMatch = refinerOutput.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in refiner output');
            result = JSON.parse(jsonMatch[0]);
          } catch (parseErr) {
            console.error('[LIQUID] Failed to parse refiner output:', parseErr.message);
            console.error('[LIQUID] Raw output:', refinerOutput.slice(0, 500));
            // Don't break on first parse failure — try next iteration
            continue;
          }

          _log(`[LIQUID] Iteration ${iteration}: score ${result.currentScore} → ${result.refinedScore} (Δ${result.qualityDelta}%)`);

          // Check for convergence
          if (result.converged) {
            _log('[LIQUID] Converged - response at peak quality');
            updateLiquidIndicator(messageIdx, 'crystallized', totalImprovement, improvements);
            break;
          }

          // Check if improvement is significant enough
          const delta = result.qualityDelta || 0;
          if (delta < minDelta) {
            _log(`[LIQUID] Delta ${delta}% below threshold ${minDelta}%, stopping`);
            updateLiquidIndicator(messageIdx, 'crystallized', totalImprovement, improvements);
            break;
          }

          // Apply the refinement if we have refined content
          if (result.refinedContent && result.refinedContent.length > currentContent.length * 0.3) {
            // Validate with fast scorer - make sure it's actually better
            const oldFastScore = fastQualityScore(currentContent, userQuery);
            const newFastScore = fastQualityScore(result.refinedContent, userQuery);
            const fastDelta = newFastScore - oldFastScore;

            _log(`[LIQUID] Fast score validation: ${oldFastScore} → ${newFastScore} (Δ${fastDelta})`);

            // Only accept if fast scorer agrees it's better — reject ANY regression
            // Previous threshold of -5 was too permissive and allowed quality degradation
            if (fastDelta < -2) {
              _log(`[LIQUID] Fast scorer detected regression (${fastDelta}), skipping this refinement`);
              continue; // Try another iteration instead of breaking
            }

            // For already-good responses, require MEANINGFUL improvement, not just "not worse"
            if (oldFastScore >= 60 && fastDelta < 3) {
              _log(`[LIQUID] Response already good (${oldFastScore}), needs ≥3 delta but got ${fastDelta}, skipping`);
              continue;
            }

            currentContent = result.refinedContent;
            totalImprovement += delta;
            improvements = [...improvements, ...(result.improvements || [])];

            // Add this version to history
            const newGrade = getGradeForScore(newFastScore);
            const versionNum = conv.messages[messageIdx].liquidVersions.length;
            conv.messages[messageIdx].liquidVersions.push({
              version: versionNum,
              content: currentContent,
              score: newFastScore,
              grade: newGrade.label,
              timestamp: Date.now(),
              label: `Refinement ${iteration}`,
              improvements: result.improvements || [],
              delta: delta
            });
            conv.messages[messageIdx].liquidCurrentVersion = versionNum;

            // MORPH: Update the displayed message
            morphMessageContent(messageIdx, currentContent, iteration, totalImprovement);

            // Inject/update version selector arrows (so user can navigate during refinement)
            injectVersionSelector(messageIdx);

            // Update indicator with both scores
            updateLiquidIndicator(messageIdx, 'refining', totalImprovement,
              [...improvements, `Fast: ${newFastScore}/100`], iteration);

            // Small delay before next iteration
            await new Promise(resolve => setTimeout(resolve, 500));

            // Early exit if fast score reaches target quality
            const targetScore = state.liquidTargetScore || 85;
            if (newFastScore >= targetScore) {
              const grade = getGradeForScore(newFastScore);
              _log(`[LIQUID] Target reached! Score ${newFastScore} >= ${targetScore} (${grade.label}), crystallizing`);
              updateLiquidIndicator(messageIdx, 'crystallized', totalImprovement, [...improvements, `${grade.emoji} ${grade.label}`]);
              break;
            }
          } else {
            _log('[LIQUID] No valid refined content, stopping');
            break;
          }
        }

        // Final update — only if conversation hasn't moved on
        if (totalImprovement > 0 && !isStale()) {
          // Save the refined content to the conversation
          if (conv.messages[messageIdx]) {
            conv.messages[messageIdx].content = currentContent;
            conv.messages[messageIdx].liquidRefined = true;
            conv.messages[messageIdx].liquidImprovement = totalImprovement;
            conv.messages[messageIdx].liquidIterations = iteration;
            // Mark the final version and set current to latest
            const versions = conv.messages[messageIdx].liquidVersions;
            if (versions && versions.length > 0) {
              versions[versions.length - 1].isFinal = true;
              conv.messages[messageIdx].liquidCurrentVersion = versions.length - 1;
            }
            saveState();
          }
          _log(`[LIQUID] Complete! Total improvement: ${totalImprovement}% over ${iteration} iterations`);
        } else {
          _log(`[LIQUID] No improvement made`);
        }

      } catch (err) {
        console.error('[LIQUID] Refinement loop error:', err.message);
      } finally {
        delete liquidRefinementActive[refinementId];
        // ALWAYS do a full re-render when liquid loop ends so version arrows appear
        // (and any morphed content is properly formatted)
        saveState();
        renderMessages();
        // Re-apply indicator AFTER render (render replaces the DOM)
        if (totalImprovement > 0) {
          updateLiquidIndicator(messageIdx, 'complete', totalImprovement, improvements, iteration);
        } else {
          updateLiquidIndicator(messageIdx, 'unchanged', 0, []);
        }
        // Also inject version selector directly in case renderMessages missed it
        injectVersionSelector(messageIdx);
      }
    }

    // Directly inject/update version selector in the DOM for a specific message.
    // Handles both initial injection and updates (new versions added during refinement).
    function injectVersionSelector(messageIdx) {
      if (!state.showMagic) return;
      const conv = getCurrentConv();
      const msg = conv?.messages?.[messageIdx];
      if (!msg) {
        console.warn(`[LIQUID-UI] injectVersionSelector: no message at idx ${messageIdx}`);
        return;
      }
      if (!msg.liquidVersions || msg.liquidVersions.length < 2) {
        // Need at least 2 versions to show the navigator
        return;
      }

      console.log(`[LIQUID-UI] injectVersionSelector: idx=${messageIdx}, versions=${msg.liquidVersions.length}, currentVersion=${msg.liquidCurrentVersion}`);

      const wrapper = document.querySelector(`.message[data-idx="${messageIdx}"] .message-wrapper`);
      if (!wrapper) {
        console.warn(`[LIQUID-UI] injectVersionSelector: DOM wrapper not found for data-idx="${messageIdx}"`);
        return;
      }

      const selectorHtml = renderLiquidVersionSelector(msg, messageIdx);
      if (!selectorHtml) {
        console.warn(`[LIQUID-UI] injectVersionSelector: renderLiquidVersionSelector returned empty`);
        return;
      }

      // Replace existing selector or insert new one
      const existing = wrapper.querySelector('.liquid-version-selector');
      if (existing) {
        existing.outerHTML = selectorHtml;
        console.log(`[LIQUID-UI] Updated existing version selector for idx ${messageIdx}`);
      } else {
        // Insert after .message-content
        const contentEl = wrapper.querySelector('.message-content');
        if (contentEl) {
          contentEl.insertAdjacentHTML('afterend', selectorHtml);
          console.log(`[LIQUID-UI] Injected new version selector for idx ${messageIdx}`);
        } else {
          console.warn(`[LIQUID-UI] injectVersionSelector: .message-content not found in wrapper`);
        }
      }

      // Auto-focus the selector so arrow keys work immediately
      requestAnimationFrame(() => {
        const sel = wrapper.querySelector('.liquid-version-selector');
        if (sel) sel.focus();
      });
    }

    // Generation counter to prevent stale animation callbacks from overwriting newer content
    let morphGeneration = {};

    function morphMessageContent(messageIdx, newContent, iteration, totalImprovement) {
      const msgEl = document.querySelector(`.message[data-idx="${messageIdx}"] .message-content`);
      if (!msgEl) {
        console.warn(`[LIQUID] morphMessageContent: Element not found for idx ${messageIdx}`);
        return;
      }

      // Increment generation for this message — older callbacks will see they're stale
      morphGeneration[messageIdx] = (morphGeneration[messageIdx] || 0) + 1;
      const myGeneration = morphGeneration[messageIdx];

      // Trigger matrix rain animation
      // IMPORTANT: We re-query the element in the callback because render() may have replaced it
      triggerMatrixRain(msgEl, () => {
        // Check if a newer morph has been started — if so, skip this callback
        if (morphGeneration[messageIdx] !== myGeneration) {
          _log(`[LIQUID] Skipping stale morph callback (gen ${myGeneration} vs current ${morphGeneration[messageIdx]})`);
          return;
        }

        // Re-query the element in case DOM was replaced during animation
        const freshMsgEl = document.querySelector(`.message[data-idx="${messageIdx}"] .message-content`);
        if (!freshMsgEl) {
          console.warn(`[LIQUID] Animation callback: Element gone for idx ${messageIdx}, updating state directly`);
          // Element was replaced/removed, but we should still update the conversation data
          const conv = getCurrentConv();
          if (conv?.messages[messageIdx]) {
            conv.messages[messageIdx].content = newContent;
            saveState();
          }
          return;
        }

        // After animation, update content with glitch effect
        freshMsgEl.classList.add('matrix-glitch');
        freshMsgEl.innerHTML = formatMessage(newContent);

        setTimeout(() => {
          // Re-query again for the class removal
          const el = document.querySelector(`.message[data-idx="${messageIdx}"] .message-content`);
          if (el) el.classList.remove('matrix-glitch');
        }, 300);
      });
    }

    // Matrix rain effect for liquid mode transitions
    function triggerMatrixRain(element, onComplete) {
      // Safety check: ensure element is still in the document
      if (!element || !document.contains(element)) {
        console.warn('[LIQUID] triggerMatrixRain: Element not in document, skipping animation');
        if (onComplete) onComplete();
        return;
      }

      // Create container
      const container = document.createElement('div');
      container.className = 'matrix-rain-container active';

      // Matrix characters (mix of katakana, numbers, and symbols)
      const matrixChars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロワヲンヴヵヶ0123456789@#$%^&*()+=[]{}|;:<>?~';

      const rect = element.getBoundingClientRect();
      const columns = Math.floor(rect.width / 16); // ~16px per column

      // Create falling columns
      for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = `${(i / columns) * 100}%`;

        // Random delay for staggered effect
        const delay = Math.random() * 0.5;
        const duration = 0.6 + Math.random() * 0.4;
        column.style.animationDelay = `${delay}s`;
        column.style.animationDuration = `${duration}s`;

        // Generate random string of characters
        const length = 5 + Math.floor(Math.random() * 15);
        let text = '';
        for (let j = 0; j < length; j++) {
          text += matrixChars[Math.floor(Math.random() * matrixChars.length)] + '<br>';
        }
        column.innerHTML = text;

        // Varying brightness
        const brightness = 0.5 + Math.random() * 0.5;
        column.style.opacity = brightness;

        container.appendChild(column);
      }

      // Add glow sweep effect
      element.classList.add('matrix-morphing');
      element.style.position = 'relative';
      element.appendChild(container);

      // Cleanup and callback after animation
      setTimeout(() => {
        // Safety: check element is still in document before cleanup
        if (document.contains(element)) {
          element.classList.remove('matrix-morphing');
        }
        // Remove container if it still exists
        if (container.parentNode) {
          container.remove();
        }
        if (onComplete) onComplete();
      }, 800);
    }

    function updateLiquidIndicator(messageIdx, status, improvement, improvements, iteration = 0) {
      const msgWrapper = document.querySelector(`.message[data-idx="${messageIdx}"] .message-wrapper`);
      if (!msgWrapper) return;

      // Remove existing indicator
      msgWrapper.querySelector('.liquid-indicator')?.remove();

      const maxIter = state.liquidMaxIterations || 4;
      const targetScore = state.liquidTargetScore || 85;

      const statusConfig = {
        'refining': {
          icon: '💧',
          text: `Refining... Pass ${iteration + 1}/${maxIter}`,
          subtext: improvements.length > 0 ? improvements[improvements.length - 1] : `+${improvement}%`,
          class: 'refining',
          pulse: true
        },
        'crystallized': {
          icon: '💎',
          text: `Crystallized`,
          subtext: `+${improvement}% in ${iteration} passes`,
          class: 'crystallized',
          pulse: false
        },
        'complete': {
          icon: '✨',
          text: `Refined`,
          subtext: `+${improvement}% in ${iteration} passes`,
          class: 'complete',
          pulse: false
        },
        'unchanged': { icon: '✓', text: 'Already optimal', subtext: '', class: 'unchanged', pulse: false },
        'error': { icon: '⚠', text: 'Refinement failed', subtext: '', class: 'error', pulse: false }
      };

      const config = statusConfig[status] || statusConfig['unchanged'];

      // Build progress bar for refining status
      let progressHtml = '';
      if (status === 'refining') {
        const progress = ((iteration + 1) / maxIter) * 100;
        progressHtml = `
          <div class="liquid-progress-bar" style="flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 8px; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #00c8ff, #a855f7); transition: width 0.3s;"></div>
          </div>
        `;
      }

      const indicator = document.createElement('div');
      indicator.className = `liquid-indicator ${config.class} ${config.pulse ? 'pulse' : ''}`;
      indicator.innerHTML = `
        <span class="liquid-icon">${config.icon}</span>
        <span class="liquid-text">${config.text}</span>
        ${progressHtml}
        ${config.subtext ? `<span class="liquid-subtext" style="font-size: 11px; opacity: 0.8;">${config.subtext}</span>` : ''}
        ${improvements.length > 0 ? `<span class="liquid-details" onclick="toggleLiquidDetails(${messageIdx})" title="Click to see improvements">ⓘ</span>` : ''}
      `;

      // Insert at the top of the message wrapper (before magic-info if exists)
      const firstChild = msgWrapper.firstElementChild;
      msgWrapper.insertBefore(indicator, firstChild);

      // Update global indicator
      updateGlobalLiquidIndicator(status, iteration);
    }

    function updateGlobalLiquidIndicator(status, iteration = 0) {
      const globalIndicator = document.getElementById('liquidGlobalIndicator');
      const iterationSpan = document.getElementById('liquidGlobalIteration');
      if (!globalIndicator) return;

      if (status === 'refining') {
        globalIndicator.classList.add('active');
        if (iterationSpan) {
          iterationSpan.textContent = `${iteration + 1}/${state.liquidMaxIterations || 5}`;
        }
      } else {
        // Hide after a short delay so user sees completion
        setTimeout(() => {
          globalIndicator.classList.remove('active');
        }, 1500);
      }
    }

    function toggleLiquidDetails(messageIdx) {
      // Could expand to show improvement list - for now just log
      const conv = getCurrentConv();
      if (conv?.messages[messageIdx]?.magic?.liquidImprovements) {
        _log('[LIQUID] Improvements:', conv.messages[messageIdx].magic.liquidImprovements);
      }
    }

    function stopLiquidRefinement(messageIdx) {
      // Stop any active refinements for this message
      Object.keys(liquidRefinementActive).forEach(key => {
        if (key.startsWith(`liquid-${messageIdx}-`)) {
          liquidRefinementActive[key] = false;
        }
      });
    }