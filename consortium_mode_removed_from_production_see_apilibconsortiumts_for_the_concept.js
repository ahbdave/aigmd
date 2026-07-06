// CONSORTIUM MODE removed from production — see api/lib/consortium.ts for the concept.
    // Can be re-enabled in a future version once orchestrator synthesis is refined.
    async function consortium() {
      return { content: 'Consortium mode is currently disabled.', strategy: 'consortium-disabled', score: 0 };
    }
    /* CONSORTIUM ORIGINAL IMPLEMENTATION (preserved for reference — dead code)
    async function _consortium_original(messages, userQuery, onPhaseChange) {
      _log('[CONSORTIUM] ========== STARTING ==========');
      _log('[CONSORTIUM] Query:', userQuery.slice(0, 100));

      const startTime = Date.now();
      const controller = new AbortController();
      abortController = controller;

      // Use same tier as ULTRAPLINIAN
      const modelCount = TIER_SIZES[state.ultraSpeedTier] || TIER_SIZES.standard;
      const modelsToQuery = ULTRAPLINIAN_MODELS.slice(0, modelCount);

      // Initialize thinking UI
      initThinkingSteps('CONSORTIUM Mode');
      addThinkingLog(`{HIVE-MIND:ACTIVE} // ${modelsToQuery.length} models loaded`, 'step');
      addThinkingLog(`!PHASE:COLLECTION // querying all models`, 'info');
      setThinkingModels(modelsToQuery);
      modelsToQuery.forEach(m => updateThinkingModel(m, 'running'));

      if (onPhaseChange) onPhaseChange('collecting', 0, modelsToQuery.length);

      // ── Phase 1: Collect ALL responses ──────────────────────────────
      const allResults = [];
      let successCount = 0;
      let settledCount = 0;

      const promises = modelsToQuery.map(model => {
        return queryModel(model, messages, null, controller.signal)
          .then(result => {
            settledCount++;
            if (result.success) successCount++;
            allResults.push(result);

            const shortModel = model.split('/')[1] || model;
            if (result.success) {
              addThinkingLog(`  ✓ ${shortModel} (${result.content.length} chars, ${Math.round(result.duration / 1000)}s)`, 'success');
              updateThinkingModel(model, 'success');
            } else {
              addThinkingLog(`  ✗ ${shortModel}: ${result.error || 'failed'}`, 'fail');
              updateThinkingModel(model, 'fail');
            }

            if (onPhaseChange) onPhaseChange('collecting', settledCount, modelsToQuery.length);

            return result;
          })
          .catch(err => {
            settledCount++;
            const errResult = { model, content: '', duration: 0, error: err.message || 'Unknown error', success: false };
            allResults.push(errResult);
            const shortModel = model.split('/')[1] || model;
            addThinkingLog(`  ✗ ${shortModel}: ${err.message || 'promise rejected'}`, 'fail');
            updateThinkingModel(model, 'fail');
            if (onPhaseChange) onPhaseChange('collecting', settledCount, modelsToQuery.length);
            return errResult;
          });
      });

      // Wait for all models (with hard timeout)
      const HARD_TIMEOUT = 60000;
      await Promise.race([
        Promise.allSettled(promises),
        new Promise(resolve => setTimeout(resolve, HARD_TIMEOUT)),
      ]);

      const collectionDuration = Date.now() - startTime;
      addThinkingLog(`!COLLECTED // ${successCount}/${modelsToQuery.length} models (${Math.round(collectionDuration / 1000)}s)`, 'step');

      // Score all responses
      const scoredResponses = allResults
        .filter(r => r.success && r.content && r.content.length > 50)
        .map(r => ({
          model: r.model,
          content: r.content,
          score: scoreResponse(r.content, userQuery),
          duration_ms: r.duration || 0,
        }))
        .sort((a, b) => b.score - a.score);

      if (scoredResponses.length === 0) {
        addThinkingLog('!FAILED // no valid responses collected', 'fail');
        finishThinking('Failed - no valid responses');
        return { content: '**Error:** All models failed in CONSORTIUM collection.', strategy: 'consortium-failed', score: -9999 };
      }

      addThinkingLog(`!TOP: ${scoredResponses[0].model.split('/')[1]} (${scoredResponses[0].score})`, 'info');

      // ── Phase 2: Orchestrator Synthesis ─────────────────────────────
      addThinkingLog('!PHASE:SYNTHESIS // orchestrator analyzing...', 'step');
      if (onPhaseChange) onPhaseChange('synthesizing', 0, 0);

      // Build the orchestration prompt
      let orchPrompt = `## USER'S ORIGINAL QUESTION\n\n${userQuery}\n\n`;
      orchPrompt += `## MODEL RESPONSES (${scoredResponses.length} collected)\n\n`;
      orchPrompt += `Each response below is from a different AI model, scored 0-100 on substance/directness.\n\n`;

      for (let i = 0; i < scoredResponses.length; i++) {
        const r = scoredResponses[i];
        orchPrompt += `---\n### Response ${i + 1} (Score: ${r.score}/100, ${r.duration_ms}ms)\n\n${r.content}\n\n`;
      }

      orchPrompt += `---\n\n## YOUR TASK\n\nSynthesize the above ${scoredResponses.length} responses into a single, definitive answer. `;
      orchPrompt += `Identify what the models agree on (high confidence), resolve any contradictions, `;
      orchPrompt += `and produce the most complete, accurate, and direct response possible. `;
      orchPrompt += `Your synthesis should be BETTER than any individual response.`;

      const orchMessages = [
        { role: 'system', content: CONSORTIUM_SYSTEM_PROMPT },
        { role: 'user', content: orchPrompt },
      ];

      let synthesis;
      try {
        const orchResult = await queryModel(CONSORTIUM_ORCHESTRATOR, orchMessages, null, null);
        if (!orchResult.success || !orchResult.content) {
          throw new Error(orchResult.error || 'Orchestrator returned empty');
        }
        synthesis = orchResult.content;
        addThinkingLog(`!SYNTHESIZED >> orchestrator (${Math.round(orchResult.duration / 1000)}s)`, 'success');
      } catch (orchErr) {
        console.error('[CONSORTIUM] Orchestrator failed:', orchErr);
        addThinkingLog('!ORCHESTRATOR FAILED // using top-scored response', 'warn');
        // Fallback: concatenate top 3 responses
        synthesis = scoredResponses[0].content;
      }

      // Polish
      const polishedContent = polishResponse(synthesis);
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Build race responses for version browsing
      const raceResponses = scoredResponses.map(r => ({
        model: r.model,
        content: polishResponse(r.content),
        score: r.score,
        duration_ms: r.duration_ms,
        isWinner: false,
      }));

      setThinkingWinner(CONSORTIUM_ORCHESTRATOR);
      finishThinking(`!GROUND-TRUTH >> synthesized from ${scoredResponses.length} models`);

      // ZDR telemetry
      trackEvent('race', {
        mode: 'consortium',
        tier: state.ultraSpeedTier,
        models_queried: modelsToQuery.length,
        models_succeeded: successCount,
        total_duration_ms: Date.now() - startTime,
        orchestrator_model: CONSORTIUM_ORCHESTRATOR,
        response_length: polishedContent.length,
        model_results: scoredResponses.map(r => ({
          model: r.model, score: r.score, duration_ms: r.duration_ms,
          content_length: r.content?.length || 0,
        })),
      });

      return {
        content: polishedContent,
        strategy: `consortium-${CONSORTIUM_ORCHESTRATOR}`,
        score: 9999,
        raceResponses: raceResponses.length > 1 ? raceResponses : undefined,
        magic: {
          mode: 'CONSORTIUM',
          winnerModel: CONSORTIUM_ORCHESTRATOR,
          duration: `${elapsedTime}s`,
          totalModels: modelsToQuery.length,
          successfulModels: successCount,
          scoredResponses: scoredResponses.length,
          topModel: scoredResponses[0]?.model,
          topScore: scoredResponses[0]?.score,
          thinkingLogs: [...thinkingState.logs],
          thinkingModels: {...thinkingState.models},
        }
      };
    }
    END CONSORTIUM ORIGINAL IMPLEMENTATION */

    // Init
    document.addEventListener('DOMContentLoaded', async () => {
      // Build dynamic UI elements BEFORE loadState so selects have options
      buildTierSelect();
      buildTierDisplay();

      loadState();

      // Initialize universal header indicators from persisted state
      updateHeaderLiquidUI();
      updatePromptsTriedUI();
      renderHallOfFameUI();

      // Handle OpenRouter OAuth callback (?code=... in URL)
      const oauthSuccess = await handleOAuthCallback();
      if (oauthSuccess) {
        // Re-render with the new API key
        updateApiWarning();
      }

      render();

      // Attach delegated click handlers (must run after DOM is ready)
      _initConvDelegate();
      _initMessageAreaDelegate();

      // Collapse sidebar on mobile by default
      if (window.innerWidth <= 768) {
        state.sidebarOpen = false;
        document.getElementById('sidebar').classList.add('collapsed');
      }

      // Set up auto-save for all settings inputs
      setupSettingsAutoSave();

      // Delegated double-click to rename conversations
      document.getElementById('conversations').addEventListener('dblclick', (e) => {
        const titleEl = e.target.closest('.conv-title');
        if (!titleEl) return;
        const convId = titleEl.dataset.convId;
        if (convId) renameChat(convId, titleEl, e);
      });
    });

    function setupSettingsAutoSave() {
      const settingsModal = document.getElementById('settingsModal');
      if (!settingsModal) return;

      // Get all inputs, selects, and textareas in the settings modal
      const inputs = settingsModal.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        // Use 'change' for selects and checkboxes, 'input' with debounce for text inputs
        if (input.type === 'checkbox' || input.tagName === 'SELECT') {
          input.addEventListener('change', () => {
            saveSettings();
          });
        } else if (input.type !== 'hidden') {
          // Debounce text input changes
          let timeout;
          input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              saveSettings();
            }, 500);
          });
          // Also save on blur for immediate feedback
          input.addEventListener('blur', () => {
            clearTimeout(timeout);
            saveSettings();
          });
        }
      });
    }

    // ─── API key encryption helpers (AES-GCM via Web Crypto) ─────────
    // Encrypts the API key before it hits localStorage. The encryption
    // key is derived from a random per-device salt (stored separately).
    // This prevents trivial exfiltration of the key from localStorage
    // by XSS or malicious extensions — they'd need to also read the
    // salt and re-derive the key.
    async function _getOrCreateCryptoKey() {
      const SALT_KEY = 'g0dm0d3-device-salt';
      let saltHex = localStorage.getItem(SALT_KEY);
      if (!saltHex) {
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(SALT_KEY, saltHex);
      }
      const saltBytes = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
      const baseKey = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(window.location.origin + '-g0dm0d3'),
        'PBKDF2', false, ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
        baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
    }

    async function encryptApiKey(plaintext) {
      if (!plaintext) return '';
      try {
        const key = await _getOrCreateCryptoKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)
        );
        // Store as "enc:iv_hex:ct_hex"
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const ctHex = Array.from(new Uint8Array(ct)).map(b => b.toString(16).padStart(2, '0')).join('');
        return `enc:${ivHex}:${ctHex}`;
      } catch (_) { return plaintext; } // Fallback: store plaintext if crypto unavailable
    }

    async function decryptApiKey(stored) {
      if (!stored || !stored.startsWith('enc:')) return stored; // Not encrypted or empty
      try {
        const [, ivHex, ctHex] = stored.split(':');
        const key = await _getOrCreateCryptoKey();
        const iv = new Uint8Array(ivHex.match(/.{2}/g).map(h => parseInt(h, 16)));
        const ct = new Uint8Array(ctHex.match(/.{2}/g).map(h => parseInt(h, 16)));
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        return new TextDecoder().decode(pt);
      } catch (_) { return stored; } // Fallback: return raw if decryption fails
    }

    // Whitelist of allowed state keys — prevents injected localStorage
    // keys from polluting application state
    const STATE_KEYS = new Set([
      'apiKey', 'orOAuthConnected', 'model', 'persona',
      'customSystemPrompt', 'customSystemPromptEnabled',
      'conversations', 'currentId', 'noLogMode', 'sidebarOpen',
      'autoRetry', 'parseltongue', 'parseltongueTier', 'maxRetries',
      'ultraplinian', 'ultraSpeedTier', 'ultraEarlyThreshold', 'ultraImproveMode',
      'liquidMode', 'liquidMinDelta', 'liquidMaxIterations', 'liquidTargetScore',
      'plinyMode', 'libertasDisabledCombos', 'libertasSelectedCombo', 'showMagic', 'waitingGame', 'strategyLogs',
      'backendUrl', 'generatedApiKeys',
      'modelTemperature', 'modelTopP', 'modelMaxTokens', 'modelFreqPenalty', 'modelPresPenalty',
      'autoTuneEnabled', 'autoTuneStrategy', 'autoTuneLastContext', 'autoTuneLastParams',
      'promptsTried',
    ]);

    function loadState() {
      const saved = localStorage.getItem('g0dm0d3-state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only merge whitelisted keys
          for (const key of Object.keys(parsed)) {
            if (STATE_KEYS.has(key)) state[key] = parsed[key];
          }
        } catch (e) {
          console.error('[loadState] Failed to parse saved state:', e);
        }
      }
      // Decrypt API key asynchronously (UI will update when ready)
      const encKey = localStorage.getItem('g0dm0d3-apikey');
      if (encKey) {
        // Prefer the separate encrypted store
        decryptApiKey(encKey).then(plain => {
          state.apiKey = plain;
          updateApiWarning();
        });
      } else if (state.apiKey) {
        // Migrate: old plaintext key found in state blob → encrypt it
        encryptApiKey(state.apiKey).then(enc => {
          localStorage.setItem('g0dm0d3-apikey', enc);
        });
      }
      _log('[DEBUG] loadState: final state.ultraplinian =', state.ultraplinian);
      document.getElementById('modelSelect').value = state.model;
      // Restore L1B3RT4S combo selector
      // Migrate stale libertasSelectedCombo values to current combo IDs
      const comboIdMigration = { 'grok-420': 'grok-reset', 'claude-inversion': 'sonnet-35', 'sonnet-37': 'sonnet-35' };
      if (state.libertasSelectedCombo && comboIdMigration[state.libertasSelectedCombo]) {
        state.libertasSelectedCombo = comboIdMigration[state.libertasSelectedCombo];
        saveState();
      }
      const libertasSel = document.getElementById('libertasModelSelect');
      if (libertasSel && state.libertasSelectedCombo) libertasSel.value = state.libertasSelectedCombo;
      // Migrate old libertasDisabledTemplates → clear it (no 1:1 mapping)
      if (state.libertasDisabledTemplates) {
        delete state.libertasDisabledTemplates;
      }
      // Clean up stale combo IDs from libertasDisabledCombos
      // (combo IDs can change when models are swapped)
      if (state.libertasDisabledCombos) {
        const validIds = new Set(HALL_OF_FAME.map(c => c.id));
        state.libertasDisabledCombos = state.libertasDisabledCombos.filter(id => validIds.has(id));
        // If ALL combos ended up disabled, re-enable everything
        if (state.libertasDisabledCombos.length >= HALL_OF_FAME.length) {
          state.libertasDisabledCombos = [];
        }
        saveState();
      }
      enforceDataCaps(); // Cap unbounded arrays on load
      updateApiWarning();
      updateUltraplinianUI();
    }