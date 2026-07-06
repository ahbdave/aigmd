function modelDisplayName(id) {
      // Check dropdown for a human-friendly name first
      const opt = document.querySelector(`#modelSelect option[value="${id}"]`);
      if (opt) return opt.textContent;
      // Fallback: derive from model ID slug
      const slug = id.split('/').pop();
      return slug
        .replace(/-instruct$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b[a-z]/g, c => c.toUpperCase())
        .replace(/(\d+)b\b/gi, '$1B')
        .replace(/\bA(\d)/g, 'A$1');
    }

    function buildTierSelect() {
      const sel = document.getElementById('ultraSpeedTier');
      if (!sel) return;
      const saved = sel.value || 'standard';
      sel.innerHTML = [
        `<option value="fast">⚡ FAST (${TIER_SIZES.fast} models)</option>`,
        `<option value="standard">🎯 STANDARD (${TIER_SIZES.standard} models)</option>`,
        `<option value="smart">🧠 SMART (${TIER_SIZES.smart} models)</option>`,
        `<option value="power">⚔️ POWER (${TIER_SIZES.power} models)</option>`,
        `<option value="ultra">🔱 ULTRA (${TIER_SIZES.ultra} models)</option>`,
      ].join('');
      sel.value = saved;
    }

    function buildTierDisplay() {
      const container = document.getElementById('tierModelDisplay');
      if (!container || !ULTRAPLINIAN_MODELS || !ULTRAPLINIAN_MODELS.length) return;

      const tc = TIER_SIZES;
      const tiers = [
        {
          key: 'fast',
          label: `FAST (1-${tc.fast})`,
          emoji: '⚡',
          models: ULTRAPLINIAN_MODELS.slice(0, tc.fast),
          color: '#ff6b6b',
          bgAlpha: '255, 107, 107'
        },
        {
          key: 'standard',
          label: `+STANDARD (${tc.fast + 1}-${tc.standard})`,
          emoji: '🎯',
          models: ULTRAPLINIAN_MODELS.slice(tc.fast, tc.standard),
          color: '#ffa500',
          bgAlpha: '255, 165, 0'
        },
        {
          key: 'smart',
          label: `+SMART (${tc.standard + 1}-${tc.smart})`,
          emoji: '🧠',
          models: ULTRAPLINIAN_MODELS.slice(tc.standard, tc.smart),
          color: '#a855f7',
          bgAlpha: '138, 43, 226'
        },
        {
          key: 'power',
          label: `+POWER (${tc.smart + 1}-${tc.power})`,
          emoji: '⚔️',
          models: ULTRAPLINIAN_MODELS.slice(tc.smart, tc.power),
          color: '#f97316',
          bgAlpha: '249, 115, 22'
        },
        {
          key: 'ultra',
          label: `+ULTRA (${tc.power + 1}-${tc.ultra})`,
          emoji: '🔱',
          models: ULTRAPLINIAN_MODELS.slice(tc.power, tc.ultra),
          color: '#ffd700',
          bgAlpha: '255, 215, 0'
        }
      ];

      container.innerHTML = tiers.map(t => {
        const names = t.models.map(id => modelDisplayName(id)).join('<br>');
        return `<div
          onclick="document.getElementById('ultraSpeedTier').value='${t.key}'; document.getElementById('ultraSpeedTier').dispatchEvent(new Event('change'));"
          style="background: rgba(${t.bgAlpha}, 0.15); border: 1px solid rgba(${t.bgAlpha}, 0.3); border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='rgba(${t.bgAlpha}, 0.25)'; this.style.borderColor='rgba(${t.bgAlpha}, 0.6)';"
          onmouseout="this.style.background='rgba(${t.bgAlpha}, 0.15)'; this.style.borderColor='rgba(${t.bgAlpha}, 0.3)';">
          <div style="color: ${t.color}; font-weight: 600; margin-bottom: 6px;">${t.emoji} ${t.label}</div>
          <div style="color: #ccc; line-height: 1.5;">${names}</div>
        </div>`;
      }).join('');
    }

    // Query a single model (for ultraplinian)
    async function queryModel(model, messages, prefill, signal) {
      const startTime = Date.now();
      _log(`[ULTRAPLINIAN] Querying ${model}...`);

      try {
        const queryMessages = [...messages];
        // Providers that natively support assistant prefill (trailing assistant message).
        // These get the real prefill for maximum steering. All others get a
        // system-instruction fallback to avoid 400 errors.
        const PREFILL_PROVIDERS = ['anthropic/', 'deepseek/', 'mistralai/', 'nousresearch/', 'meta-llama/', 'qwen/'];
        const supportsPrefill = PREFILL_PROVIDERS.some(p => model.startsWith(p));

        if (prefill && supportsPrefill) {
          // Native prefill: trailing assistant message (best steering)
          queryMessages.push({ role: 'assistant', content: prefill });
        } else if (prefill && queryMessages.length > 0 && queryMessages[0].role === 'system') {
          // Fallback: inject as system instruction
          queryMessages[0] = {
            ...queryMessages[0],
            content: queryMessages[0].content + `\n\nIMPORTANT: Begin your response EXACTLY with the following text, then continue naturally:\n${prefill}`
          };
        } else if (prefill) {
          queryMessages.unshift({
            role: 'system',
            content: `Begin your response EXACTLY with the following text, then continue naturally:\n${prefill}`
          });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://godmod3.ai',
            'X-Title': 'GODMOD3.AI-ultraplinian'
          },
          body: JSON.stringify({
            model,
            messages: queryMessages,
            temperature: state.modelTemperature ?? 0.7,
            top_p: state.modelTopP ?? 1.0,
            max_tokens: state.modelMaxTokens ?? 4096,
            frequency_penalty: state.modelFreqPenalty ?? 0,
            presence_penalty: state.modelPresPenalty ?? 0
          }),
          signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
          console.error(`[ULTRAPLINIAN] ${model} API error:`, errorMsg);
          throw new Error(errorMsg);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';

        if (!content) {
          console.warn(`[ULTRAPLINIAN] ${model} returned empty content`);
          throw new Error('Empty response');
        }

        // For native prefill models, the response continues from the prefill — prepend it.
        // For system-instruction fallback models, the model includes it naturally.
        if (prefill && supportsPrefill && content) content = prefill + content;

        _log(`[ULTRAPLINIAN] ${model} success: ${content.length} chars`);
        return {
          model,
          content,
          duration: Date.now() - startTime,
          success: true
        };
      } catch (err) {
        console.error(`[ULTRAPLINIAN] ${model} failed:`, err.message);
        return {
          model,
          content: '',
          duration: Date.now() - startTime,
          error: err.message,
          success: false
        };
      }
    }