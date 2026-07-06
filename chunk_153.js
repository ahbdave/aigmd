_log('[DEBUG] state.ultraplinian =', state.ultraplinian);
      _log('[DEBUG] content =', content.slice(0, 50), '(length:', content.length, ')');

      if (state.ultraplinian) {
        console.log('%c[DEBUG] ✓ ENTERING ULTRAPLINIAN MODE', 'background: #ff0055; color: white; padding: 4px 8px; font-weight: bold;');
        _log('[DEBUG] ULTRAPLINIAN overrides all other modes - running regardless of query length');

        // Show Pong game while waiting
        showPongGame();

        // Live leader state - we insert a DOM element directly (no render() calls
        // during the race, since render() would destroy the thinking UI indicator)
        let liveMessageEl = null;
        let liveMessagePushed = false;
        let leaderUpgradeCount = 0;

        const handleLeaderChange = (leaderContent, leaderModel, leaderScore) => {
          leaderUpgradeCount++;
          const shortModel = leaderModel.split('/')[1] || leaderModel;
          console.log(`[ULTRAPLINIAN-LIVE] Leader upgrade #${leaderUpgradeCount}: ${shortModel} (${leaderScore})`);

          if (!liveMessagePushed) {
            // First leader: push to conv.messages and create DOM element
            conv.messages.push({
              role: 'assistant',
              content: leaderContent,
              strategy: `ultraplinian-leader-${leaderModel}`
            });
            liveMessagePushed = true;
            saveState();

            // Create DOM element and insert BEFORE the typing indicator
            const container = document.getElementById('messagesArea');
            const typingEl = document.getElementById('typingIndicator');
            liveMessageEl = document.createElement('div');
            liveMessageEl.className = 'message assistant';
            liveMessageEl.id = 'ultraplinian-live-message';
            liveMessageEl.innerHTML = `
              <div class="message-avatar">&gt;_</div>
              <div class="message-wrapper">
                <div class="message-content liquid-morph">${formatMessage(leaderContent)}</div>
              </div>
            `;
            if (typingEl) {
              container.insertBefore(liveMessageEl, typingEl);
            } else {
              container.appendChild(liveMessageEl);
            }
            autoScrollIfNeeded(container);
          } else {
            // Subsequent leader: update conv.messages and DOM in place
            const msgIdx = conv.messages.length - 1;
            conv.messages[msgIdx].content = leaderContent;
            conv.messages[msgIdx].strategy = `ultraplinian-leader-${leaderModel}`;
            saveState();

            // Update DOM directly (no render() — preserve thinking UI)
            if (liveMessageEl) {
              const contentEl = liveMessageEl.querySelector('.message-content');
              if (contentEl) {
                contentEl.classList.remove('liquid-morph');
                void contentEl.offsetWidth; // force reflow
                contentEl.innerHTML = formatMessage(leaderContent);
                contentEl.classList.add('liquid-morph');
              }
            }

            autoScrollIfNeeded(document.getElementById('messagesArea'));
          }
        };

        try {
          const result = await ultraplinian(messages, content, handleLeaderChange);
          _log('[DEBUG] ultraplinian() returned:', result);

          const isErrorResult = !result?.content || result.content.startsWith('**Error');

          if (result?.content && !isErrorResult) {
            // Good result — update or push
            if (liveMessagePushed) {
              const msgIdx = conv.messages.length - 1;
              conv.messages[msgIdx].content = result.content;
              conv.messages[msgIdx].strategy = result.strategy;
              conv.messages[msgIdx].score = result.score;
              conv.messages[msgIdx].magic = result.magic;
              if (result.raceResponses) {
                conv.messages[msgIdx].raceResponses = result.raceResponses;
              }
            } else {
              conv.messages.push({
                role: 'assistant',
                content: result.content,
                strategy: result.strategy,
                score: result.score,
                magic: result.magic,
                raceResponses: result.raceResponses
              });
            }

            // Start Liquid Response refinement in background if enabled
            // SKIP if coaching pass already improved the response — double-processing
            // degrades quality (a weaker coach model rewrites a frontier model's output)
            if (state.liquidMode && !result.magic?.coachingApplied) {
              const messageIdx = conv.messages.length - 1;
              const winnerModel = result.magic?.winnerModel || result.strategy?.replace(/^ultraplinian-(earlybird-)?/, '');
              liquidResponseLoop(messageIdx, result.content, content, winnerModel);
            } else if (state.liquidMode && result.magic?.coachingApplied) {
              _log('[ULTRAPLINIAN] Liquid loop skipped — coaching pass already enhanced response');
            }
          } else if (liveMessagePushed) {
            // Error returned BUT we already showed valid leader content.
            // Keep the leader content — don't overwrite with an error.
            // The user already saw a good response; destroying it is worse
            // than keeping a slightly-less-vetted answer.
            _log('[ULTRAPLINIAN] Error result but live leader exists — keeping leader content');
            const msgIdx = conv.messages.length - 1;
            conv.messages[msgIdx].strategy = conv.messages[msgIdx].strategy || 'ultraplinian-leader-preserved';
          } else {
            // No leader and no valid result — show error
            conv.messages.push({ role: 'assistant', content: '**Error:** ULTRAPLINIAN mode failed.' });
          }
        } catch (err) {
          const errContent = err.name === 'AbortError' ? '_[Response stopped]_' : `**Error:** ${err.message}`;
          if (liveMessagePushed) {
            conv.messages[conv.messages.length - 1].content = errContent;
          } else {
            conv.messages.push({ role: 'assistant', content: errContent });
          }
        }

        // Remove the temporary live element — render() will rebuild it properly
        const liveEl = document.getElementById('ultraplinian-live-message');
        if (liveEl) liveEl.remove();

        isStreaming = false;
        abortController = null;
        hidePongGame();
        hideTyping(true);  // Pass true to preserve magic steps
        updateSendButton();
        saveState();
        render();

        return;
      }