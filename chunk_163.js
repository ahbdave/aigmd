let attempt = 0;
      let lastResponse = null;
      let success = false;

      // Initialize thinking steps for retry mode (only if GODMODE and auto-retry enabled)
      const showRetryThinking = state.persona === 'godmode' && state.autoRetry;
      if (showRetryThinking) {
        initThinkingSteps('GODMODE');
        addThinkingLog(`Model: ${conv.model.split('/')[1] || conv.model}`, 'info');
        addThinkingLog(`Max retries: ${state.maxRetries}`, 'info');

        // Set up attempt tracking
        const attemptModels = {};
        for (let i = 0; i <= state.maxRetries; i++) {
          attemptModels[`Attempt ${i + 1}`] = { status: 'pending', score: null };
        }
        thinkingState.models = attemptModels;
        updateThinkingUI();
      }

      while (attempt <= state.maxRetries && !success) {
        try {
          abortController = new AbortController();

          // Update thinking for this attempt
          if (showRetryThinking) {
            updateThinkingModel(`Attempt ${attempt + 1}`, 'running');
            if (attempt === 0) {
              addThinkingLog('Sending initial request...', 'step');
            } else {
              addThinkingLog(`Retry ${attempt}: Applying bypass techniques...`, 'step');
            }
          }

          const retryMessages = [];

          // System prompt
          if (systemPrompt) {
            retryMessages.push({ role: 'system', content: systemPrompt });
          }

          // Conversation history (excluding the assistant message we might be retrying)
          const historyMessages = conv.messages.filter(m => m.role === 'user' || (m.role === 'assistant' && m !== lastResponse));

          // Get retry prefix for this attempt
          const retryPrefix = getRetryPrefix(attempt);

          historyMessages.forEach((m, idx) => {
            if (m.role === 'user' && idx === historyMessages.length - 1) {
              let modifiedContent = m.content;
              // Add retry prefix if present
              if (retryPrefix) {
                modifiedContent = retryPrefix + modifiedContent;
              }
              retryMessages.push({ role: m.role, content: modifiedContent });
            } else {
              retryMessages.push({ role: m.role, content: m.content });
            }
          });

          // Get retry params (with AutoTune support)
          const params = getRetryParams(attempt, content, historyMessages);

          // Log params to thinking UI
          if (showRetryThinking) {
            if (retryPrefix) {
              addThinkingLog(`Prefix: "${retryPrefix.slice(0, 30)}..."`, 'info');
            }
            addThinkingLog(`Params: temp=${params.temperature?.toFixed(2) || params.temperature}, top_p=${params.top_p?.toFixed(2) || params.top_p}`, 'info');
            if (state.autoTuneEnabled && state.autoTuneLastContext) {
              addThinkingLog(`AutoTune: ${state.autoTuneLastContext.toUpperCase()}`, 'info');
            }
          }

          // Update typing indicator on retry (legacy fallback)
          if (attempt > 0 && !showRetryThinking) {
            updateTypingStatus(`Retry ${attempt}/${state.maxRetries} (temp: ${params.temperature})...`);
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
              model: conv.model,
              messages: retryMessages,
              temperature: params.temperature,
              top_p: params.top_p,
              frequency_penalty: state.modelFreqPenalty ?? 0,
              presence_penalty: params.presence_penalty || state.modelPresPenalty || 0,
              max_tokens: state.modelMaxTokens ?? 4096
            }),
            signal: abortController.signal
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API Error: ${response.status}`);
          }

          const data = await response.json();
          const assistantContent = data.choices?.[0]?.message?.content || 'No response';

          // Check for refusal and retry if enabled
          if (state.autoRetry && isRefusal(assistantContent) && attempt < state.maxRetries) {
            console.log(`[G0DM0D3] Refusal detected on attempt ${attempt + 1}, retrying...`);
            if (showRetryThinking) {
              updateThinkingModel(`Attempt ${attempt + 1}`, 'fail', null, 'refusal');
              addThinkingLog(`Attempt ${attempt + 1}: REFUSED - "${assistantContent.slice(0, 50)}..."`, 'fail');
            }
            lastResponse = { role: 'assistant', content: assistantContent };
            attempt++;
            continue;
          }

          // Success - add the response
          if (showRetryThinking) {
            updateThinkingModel(`Attempt ${attempt + 1}`, 'winner');
            setThinkingWinner(`Attempt ${attempt + 1}`);
            addThinkingLog(`Attempt ${attempt + 1}: SUCCESS (${assistantContent.length} chars)`, 'success');
            if (attempt > 0) {
              addThinkingLog(`Bypassed after ${attempt} retries`, 'step');
            }
            finishThinking(attempt > 0 ? `Success on attempt ${attempt + 1}` : 'Success');
          }

          // Build magic metadata for display
          const magicInfo = {
            mode: 'GODMODE',
            attempt: attempt + 1,
            temperature: params.temperature,
            topP: params.top_p,
            prefix: retryPrefix ? retryPrefix.slice(0, 80) : null,
            model: conv.model
          };

          // Add AutoTune info if enabled
          if (state.autoTuneEnabled && state.autoTuneLastParams) {
            magicInfo.autoTune = {
              context: state.autoTuneLastContext,
              confidence: 0.8, // Default for non-adaptive
              params: state.autoTuneLastParams
            };
          }

          const finalMessage = {
            role: 'assistant',
            content: assistantContent,
            retries: attempt > 0 ? attempt : undefined,
            params: attempt > 0 ? params : undefined,
            magic: magicInfo
          };
          conv.messages.push(finalMessage);
          saveState();
          success = true;

          // ZDR: Track single-model response
          await harmPromise; // ensure classification landed
          trackEvent('completion', {
            mode: 'godmode',
            model: conv.model,
            attempts: attempt + 1,
            content_length: assistantContent.length,
            temperature: params.temperature,
            top_p: params.top_p,
            pipeline: {
              autotune: state.autoTuneEnabled,
              autotune_context: state.autoTuneLastContext || null,
              auto_retry: state.autoRetry,
            },
            classification: _lastHarmResult || undefined,
            ..._lastTelemetryCtx,
          });

        } catch (err) {
          if (err.name === 'AbortError') {
            if (showRetryThinking) {
              addThinkingLog('Stopped by user', 'warn');
              finishThinking('Stopped');
            }
            conv.messages.push({ role: 'assistant', content: '_[Response stopped]_' });
            trackEvent('completion', {
              mode: 'godmode',
              model: conv.model,
              success: false,
              error_type: 'abort',
              attempts: attempt + 1,
              ..._lastTelemetryCtx,
            });
            success = true; // Don't retry on user abort
          } else if (attempt >= state.maxRetries) {
            if (showRetryThinking) {
              updateThinkingModel(`Attempt ${attempt + 1}`, 'fail');
              addThinkingLog(`Attempt ${attempt + 1}: Error - ${err.message}`, 'fail');
              addThinkingLog('All retries exhausted', 'fail');
              finishThinking('Failed - max retries');
            }
            conv.messages.push({ role: 'assistant', content: `**Error:** ${err.message}` });
            trackEvent('completion', {
              mode: 'godmode',
              model: conv.model,
              success: false,
              error_type: 'max_retries',
              attempts: attempt + 1,
              classification: _lastHarmResult || undefined,
              ..._lastTelemetryCtx,
            });
            success = true;
          } else {
            if (showRetryThinking) {
              updateThinkingModel(`Attempt ${attempt + 1}`, 'fail');
              addThinkingLog(`Attempt ${attempt + 1}: Error - ${err.message.slice(0, 40)}`, 'fail');
            }
            console.log(`[G0DM0D3] Error on attempt ${attempt + 1}: ${err.message}, retrying...`);
            attempt++;
          }
          saveState();
        }
      }

      isStreaming = false;
      abortController = null;
      hideTyping();
      updateSendButton();
      render();
    }

    function updateTypingStatus(status) {
      const indicator = document.getElementById('typingIndicator');
      if (indicator) {
        const content = indicator.querySelector('.message-content');
        if (content) {
          content.innerHTML = `
            <div class="typing"><span></span><span></span><span></span></div>
            <div style="font-size: 11px; color: var(--secondary); margin-top: 4px;">${status}</div>
          `;
        }
      }
    }

    function stopGeneration() {
      if (abortController) {
        abortController.abort();
      }
    }

    function updateSendButton() {
      const btn = document.getElementById('sendBtn');
      if (isStreaming) {
        btn.innerHTML = '■';
        btn.classList.add('stop');
        btn.onclick = stopGeneration;
      } else {
        btn.innerHTML = '→';
        btn.classList.remove('stop');
        btn.onclick = sendMessage;
      }
    }