if (state.liquidMode) {
          console.log('%c[DEBUG] ✓ ENTERING G0DM0D3 CLASSIC + LIQUID RESPONSE MODE', 'background: linear-gradient(90deg, #a855f7, #00c8ff); color: white; padding: 4px 8px; font-weight: bold;');
          _log('[DEBUG] Liquid Response active — progressive G0DM0D3 CLASSIC serving, no early exit');

          showPongGame();

          // Live leader state — DOM element for progressive content morphing
          let liveMessageEl = null;
          let liveMessagePushed = false;
          let leaderUpgradeCount = 0;

          try {
            abortController = new AbortController();

            const result = await executePlinyMode(messages, conv.model, content, {
              enabled: true,
              minDelta: state.liquidMinDelta || 8,
              onLeaderChange: (leaderContent, template, score, strategy) => {
                leaderUpgradeCount++;
                console.log(`[GODMODE-CLASSIC-LIQUID] Leader upgrade #${leaderUpgradeCount}: ${template} (${score})`);

                if (!liveMessagePushed) {
                  // ── First leader: push to conv.messages and create DOM ──
                  conv.messages.push({
                    role: 'assistant',
                    content: leaderContent,
                    strategy: strategy || `godmode-classic-${template}`
                  });
                  liveMessagePushed = true;
                  saveState();

                  // Create DOM element and insert BEFORE typing indicator
                  const container = document.getElementById('messagesArea');
                  const typingEl = document.getElementById('typingIndicator');
                  liveMessageEl = document.createElement('div');
                  liveMessageEl.className = 'message assistant';
                  liveMessageEl.id = 'godmode-classic-live-message';
                  liveMessageEl.innerHTML = `
                    <div class="message-avatar">&gt;_</div>
                    <div class="message-wrapper">
                      <div class="message-content liquid-morph">${formatMessage(leaderContent)}</div>
                      <div class="liquid-godmode-classic-badge" style="
                        display: inline-flex; align-items: center; gap: 6px;
                        margin-top: 8px; padding: 3px 10px;
                        background: linear-gradient(90deg, rgba(168,85,247,0.15), rgba(0,200,255,0.15));
                        border: 1px solid rgba(168,85,247,0.3);
                        border-radius: 12px; font-size: 11px; color: #a855f7;
                      ">
                        <span style="animation: pulse 1.5s infinite;">💧</span>
                        G0DM0D3 CLASSIC LIQUID — refining...
                      </div>
                    </div>
                  `;
                  if (typingEl) {
                    container.insertBefore(liveMessageEl, typingEl);
                  } else {
                    container.appendChild(liveMessageEl);
                  }
                  autoScrollIfNeeded(container);
                } else {
                  // ── Subsequent leader: morph content in place ──
                  const msgIdx = conv.messages.length - 1;
                  conv.messages[msgIdx].content = leaderContent;
                  conv.messages[msgIdx].strategy = strategy || `godmode-classic-${template}`;
                  saveState();

                  // Update DOM directly (no render() — preserve thinking UI)
                  if (liveMessageEl) {
                    const contentEl = liveMessageEl.querySelector('.message-content');
                    if (contentEl) {
                      contentEl.classList.remove('liquid-morph');
                      void contentEl.offsetWidth; // force reflow for re-animation
                      contentEl.innerHTML = formatMessage(leaderContent);
                      contentEl.classList.add('liquid-morph');
                    }
                    // Update badge with upgrade count
                    const badge = liveMessageEl.querySelector('.liquid-godmode-classic-badge');
                    if (badge) {
                      badge.innerHTML = `
                        <span style="animation: pulse 1.5s infinite;">💧</span>
                        G0DM0D3 CLASSIC LIQUID — upgrade #${leaderUpgradeCount} (${score} pts)
                      `;
                    }
                  }

                  autoScrollIfNeeded(document.getElementById('messagesArea'));
                }
              }
            });

            _log('[DEBUG] executePlinyMode() returned (liquid):', result);

            const isErrorResult = !result?.content || result.content.startsWith('**Error');

            if (result?.content && !isErrorResult) {
              // Good result — finalize the message
              if (liveMessagePushed) {
                const msgIdx = conv.messages.length - 1;
                conv.messages[msgIdx].content = result.content;
                conv.messages[msgIdx].strategy = result.strategy;
                conv.messages[msgIdx].score = result.score;
                conv.messages[msgIdx].magic = result.magic;
              } else {
                conv.messages.push({
                  role: 'assistant',
                  content: result.content,
                  strategy: result.strategy,
                  score: result.score,
                  magic: result.magic
                });
              }

              // ── Hand off to liquidResponseLoop for iterative refinement ──
              // All templates are done; now the liquid refiner takes over to
              // push quality even higher via coaching passes
              const messageIdx = conv.messages.length - 1;
              const winnerModel = result.magic?.model || conv.model;
              liquidResponseLoop(messageIdx, result.content, content, winnerModel);
            } else if (liveMessagePushed) {
              // Error returned but we already showed valid leader content — keep it
              _log('[GODMODE-CLASSIC-LIQUID] Error result but live leader exists — keeping leader content');
              const msgIdx = conv.messages.length - 1;
              conv.messages[msgIdx].strategy = conv.messages[msgIdx].strategy || 'godmode-classic-leader-preserved';

              // Still run liquid refinement on the preserved leader
              liquidResponseLoop(msgIdx, conv.messages[msgIdx].content, content, conv.model);
            } else {
              conv.messages.push({ role: 'assistant', content: '**Error:** G0DM0D3 CLASSIC mode failed.' });
            }
          } catch (err) {
            const errContent = err.name === 'AbortError' ? '_[Response stopped]_' : `**Error:** ${err.message}`;
            if (liveMessagePushed) {
              conv.messages[conv.messages.length - 1].content = errContent;
            } else {
              conv.messages.push({ role: 'assistant', content: errContent });
            }
          }

          // Remove the temporary live element — render() will rebuild properly
          const liveEl = document.getElementById('godmode-classic-live-message');
          if (liveEl) liveEl.remove();

          isStreaming = false;
          abortController = null;
          hidePongGame();
          hideTyping(true);
          updateSendButton();
          saveState();
          render();

          return;  // CRITICAL: Return here to prevent other modes from running

        } else {
          // ── Original L1B3RT4S behavior (no liquid mode) ──────────────
          // Early exit on first non-refusal, no progressive serving
          console.log('%c[DEBUG] ✓ ENTERING G0DM0D3 CLASSIC MODE (exclusive - no PARSELTONGUE/retry)', 'background: #a855f7; color: white; padding: 4px 8px; font-weight: bold;');
          try {
            abortController = new AbortController();
            const result = await executePlinyMode(messages, conv.model, content);
            _log('[DEBUG] executePlinyMode() returned:', result);

            if (result && result.content) {
              conv.messages.push({
                role: 'assistant',
                content: result.content,
                strategy: result.strategy,
                score: result.score,
                magic: result.magic  // Preserve magic metadata for Show Magic
              });
            } else {
              conv.messages.push({ role: 'assistant', content: '**Error:** G0DM0D3 CLASSIC mode failed.' });
            }
          } catch (err) {
            if (err.name === 'AbortError') {
              conv.messages.push({ role: 'assistant', content: '_[Response stopped]_' });
            } else {
              conv.messages.push({ role: 'assistant', content: `**Error:** ${err.message}` });
            }
          }

          isStreaming = false;
          abortController = null;
          hideTyping(true);  // Pass true to preserve magic steps
          updateSendButton();
          saveState();
          render();
          return;  // CRITICAL: Return here to prevent other modes from running
        }
      }