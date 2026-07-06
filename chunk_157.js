const selectedCombo = state.libertasSelectedCombo || 'all';
        const fastCombo = HALL_OF_FAME.find(c => c.fast);
        const fastEnabled = fastCombo && isLibertasComboEnabled(fastCombo.id);
        const isFastSolo = fastCombo && selectedCombo === fastCombo.id;
        const isFastInRace = fastEnabled && selectedCombo === 'all';

        if (isFastSolo || isFastInRace) {
          console.log(`%c[DEBUG] ✓ ENTERING GODMODE FAST — ${isFastInRace ? 'ALL 5 parallel race' : 'solo stream'}`, 'background: #10b981; color: white; padding: 4px 8px; font-weight: bold;');
          const fastStartTime = Date.now();

          // Build GODMODE FAST messages with injected query
          const fastSystemPrompt = injectQueryHOF(fastCombo.system, content);
          const fastUserPrompt = injectQueryHOF(fastCombo.user, content);
          const fastMessages = [{ role: 'system', content: fastSystemPrompt }];
          messages.forEach(m => {
            if (m.role !== 'system') fastMessages.push({ role: m.role, content: m.content });
          });
          if (fastMessages.length > 0 && fastMessages[fastMessages.length - 1].role === 'user') {
            fastMessages[fastMessages.length - 1].content = fastUserPrompt;
          } else {
            fastMessages.push({ role: 'user', content: fastUserPrompt });
          }

          // Create a simple message element — no liquid-morph, no blur
          const container = document.getElementById('messagesArea');
          const typingEl = document.getElementById('typingIndicator');
          const liveEl = document.createElement('div');
          liveEl.className = 'message assistant';
          liveEl.id = 'godmode-fast-live-message';
          liveEl.innerHTML = `
            <div class="message-avatar">&gt;_</div>
            <div class="message-wrapper">
              <div class="message-content" id="godmode-fast-content"></div>
            </div>
          `;
          if (typingEl) {
            container.insertBefore(liveEl, typingEl);
          } else {
            container.appendChild(liveEl);
          }
          hideTyping(true);
          autoScrollIfNeeded(container);

          // Track whether a liquid upgrade has replaced the fast content
          let fastContent = '';
          let liquidUpgraded = false;
          let liveMessagePushed = false;
          abortController = new AbortController();

          // ── GODMODE FAST streaming promise ──────────────────────────────
          const fastStreamPromise = (async () => {
            try {
              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${state.apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://godmod3.ai',
                  'X-Title': 'GODMOD3.AI-godmode-fast'
                },
                body: JSON.stringify({
                  model: fastCombo.model,
                  messages: fastMessages,
                  stream: true,
                  max_tokens: 16384,
                  temperature: 1.0,
                  top_p: 1.0,
                }),
                signal: abortController.signal,
              });

              if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                throw new Error(`API ${response.status}: ${errBody.slice(0, 200)}`);
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              const contentEl = document.getElementById('godmode-fast-content');

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
                  try {
                    const chunk = JSON.parse(line.slice(6));
                    const delta = chunk.choices?.[0]?.delta?.content || '';
                    if (delta) {
                      fastContent += delta;
                      // Only update DOM if liquid hasn't replaced us
                      if (!liquidUpgraded && contentEl) {
                        contentEl.innerHTML = formatMessage(fastContent);
                        autoScrollIfNeeded(container);
                      }
                    }
                  } catch (_) { /* skip malformed SSE */ }
                }
              }

              return { content: fastContent, strategy: `godmode-classic-${fastCombo.id}`, score: 50 };
            } catch (err) {
              if (err.name === 'AbortError') return null;
              console.log(`[GODMODE FAST] Stream error: ${err.message}`);
              return null;
            }
          })();

          if (isFastSolo) {
            // ── Solo mode: just stream, no race ──────────────────────────
            let fastSuccess = false;
            try {
              const fastResult = await fastStreamPromise;
              if (fastResult?.content) {
                conv.messages.push({
                  role: 'assistant',
                  content: fastResult.content,
                  strategy: fastResult.strategy,
                  score: fastResult.score,
                });
                fastSuccess = true;
              } else if (abortController.signal.aborted) {
                conv.messages.push({ role: 'assistant', content: '_[Response stopped]_' });
              } else {
                conv.messages.push({ role: 'assistant', content: '**Error:** GODMODE FAST failed.' });
              }
            } catch (err) {
              conv.messages.push({ role: 'assistant', content: `**Error:** ${err.message}` });
            }

            // Telemetry — GODMODE FAST solo
            await harmPromise;
            trackEvent('completion', {
              mode: 'godmode-fast',
              combo: fastCombo.id,
              model: fastCombo.model,
              success: fastSuccess,
              content_length: fastContent.length,
              total_duration_ms: Date.now() - fastStartTime,
              stream: true,
              classification: _lastHarmResult || undefined,
              ..._lastTelemetryCtx,
            });

            const fastLiveEl = document.getElementById('godmode-fast-live-message');
            if (fastLiveEl) fastLiveEl.remove();
            isStreaming = false;
            abortController = null;
            hideTyping(true);
            updateSendButton();
            saveState();
            render();
            return;
          }

          // ── ALL 5 mode: race other 4 in parallel while GODMODE FAST streams ──
          if (isFastInRace) {
            showPongGame();

            // Push GODMODE FAST content as the initial message immediately
            conv.messages.push({
              role: 'assistant',
              content: '', // will be filled by streaming
              strategy: `godmode-classic-${fastCombo.id}`,
              score: 50,
            });
            liveMessagePushed = true;

            // Race the other 4 combos via executePlinyMode with liquid callbacks
            const racePromise = executePlinyMode(messages, conv.model, content, {
              enabled: true,
              minDelta: state.liquidMinDelta || 8,
              onLeaderChange: (leaderContent, template, score, strategy) => {
                // A liquid leader from the race beat the current content
                liquidUpgraded = true;
                const msgIdx = conv.messages.length - 1;
                conv.messages[msgIdx].content = leaderContent;
                conv.messages[msgIdx].strategy = strategy || `godmode-classic-${template}`;
                conv.messages[msgIdx].score = score;
                saveState();

                // Update the live element with the upgrade (no blur)
                const contentEl = document.getElementById('godmode-fast-content');
                if (contentEl) {
                  contentEl.innerHTML = formatMessage(leaderContent);
                  autoScrollIfNeeded(container);
                }
                console.log(`[ALL 5] Liquid upgrade from ${template} (${score} pts) replaced GODMODE FAST`);
              }
            });

            // Wait for both to finish
            const [fastResult, raceResult] = await Promise.allSettled([fastStreamPromise, racePromise]);

            // Finalize: pick the best content
            const msgIdx = conv.messages.length - 1;
            if (liquidUpgraded && raceResult.status === 'fulfilled' && raceResult.value?.content) {
              // Race winner is better — already in conv.messages from the callback
              conv.messages[msgIdx].content = raceResult.value.content;
              conv.messages[msgIdx].strategy = raceResult.value.strategy;
              conv.messages[msgIdx].score = raceResult.value.score;
              conv.messages[msgIdx].magic = raceResult.value.magic;
            } else if (fastResult.status === 'fulfilled' && fastResult.value?.content) {
              // GODMODE FAST content wins (race didn't beat it, or race failed)
              conv.messages[msgIdx].content = fastResult.value.content;
              conv.messages[msgIdx].strategy = fastResult.value.strategy;
              conv.messages[msgIdx].score = fastResult.value.score;
            } else {
              // Both failed
              conv.messages[msgIdx].content = '**Error:** All G0DM0D3 CLASSIC combos failed.';
            }

            // Hand off to liquid refinement if we have good content
            if (conv.messages[msgIdx].content && !conv.messages[msgIdx].content.startsWith('**Error')) {
              const winnerModel = conv.messages[msgIdx].magic?.model || conv.model;
              liquidResponseLoop(msgIdx, conv.messages[msgIdx].content, content, winnerModel);
            }

            // Telemetry — FULL COMBO (GODMODE FAST + 4-way race)
            const fastStreamOk = fastResult.status === 'fulfilled' && !!fastResult.value?.content;
            const raceOk = raceResult.status === 'fulfilled' && !!raceResult.value?.content;
            await harmPromise;
            trackEvent('completion', {
              mode: 'godmode-classic-full-combo',
              fast_stream: {
                model: fastCombo.model,
                success: fastStreamOk,
                content_length: fastStreamOk ? fastResult.value.content.length : 0,
              },
              liquid_upgraded: liquidUpgraded,
              winner_source: liquidUpgraded ? 'race' : 'fast',
              winner_combo: conv.messages[msgIdx].strategy,
              winner_score: conv.messages[msgIdx].score || 0,
              winner_content_length: conv.messages[msgIdx].content?.length || 0,
              race_result: raceOk ? {
                winner_combo: raceResult.value.comboId || raceResult.value.strategy,
                winner_model: raceResult.value.magic?.model || null,
                winner_score: raceResult.value.score || 0,
                combos_attempted: raceResult.value.magic?.combos_attempted || 0,
                combos_failed: raceResult.value.magic?.combos_failed || 0,
              } : null,
              total_duration_ms: Date.now() - fastStartTime,
              classification: _lastHarmResult || undefined,
              ..._lastTelemetryCtx,
            });

            const fastLiveEl = document.getElementById('godmode-fast-live-message');
            if (fastLiveEl) fastLiveEl.remove();
            isStreaming = false;
            abortController = null;
            hidePongGame();
            hideTyping(true);
            updateSendButton();
            saveState();
            render();
            return;
          }
        }