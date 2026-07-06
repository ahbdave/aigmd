function openSettings() {
      // Load values into form
      document.getElementById('apiKeyInput').value = state.apiKey;
      updateOAuthUI();
      document.getElementById('defaultModelInput').value = state.model;
      document.getElementById('personaSelect').value = state.persona;
      document.getElementById('customSystemPromptEnabled').checked = state.customSystemPromptEnabled;
      document.getElementById('customSystemPromptInput').value = state.customSystemPrompt || '';
      document.getElementById('customSystemPromptInput').disabled = !state.customSystemPromptEnabled;
      updateSystemPromptUI();
      document.getElementById('noLogMode').checked = state.noLogMode;
      document.getElementById('showMagic').checked = state.showMagic;
      document.getElementById('waitingGameSelect').value = state.waitingGame || 'snake';
      document.getElementById('autoRetry').checked = state.autoRetry;
      document.getElementById('parseltongue').checked = state.parseltongue;
      document.getElementById('parseltongueTier').value = state.parseltongueTier || 'standard';
      document.getElementById('maxRetriesInput').value = state.maxRetries;
      document.getElementById('ultraplinian').checked = state.ultraplinian;
      document.getElementById('ultraSpeedTier').value = state.ultraSpeedTier || 'standard';
      document.getElementById('ultraEarlyThreshold').value = state.ultraEarlyThreshold;
      updateThresholdDisplay(state.ultraEarlyThreshold);
      document.getElementById('ultraImproveMode').checked = state.ultraImproveMode !== false; // default true
      document.getElementById('plinyMode').checked = state.plinyMode;
      document.getElementById('backendUrlInput').value = state.backendUrl || '';

      // Setup tab switching
      document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.onclick = () => switchSettingsTab(tab.dataset.tab);
      });

      // System prompt toggle + live char count
      document.getElementById('customSystemPromptEnabled').onchange = function() {
        updateSystemPromptUI();
      };
      document.getElementById('customSystemPromptInput').oninput = function() {
        document.getElementById('systemPromptCharCount').textContent = this.value.length + ' characters';
      };

      // Setup live threshold display update with grade indicator
      document.getElementById('ultraEarlyThreshold').oninput = function() {
        updateThresholdDisplay(parseInt(this.value, 10));
      };

      // Setup global Liquid Response controls (dedicated section at top of Strategies tab)
      document.getElementById('liquidModeGlobal').checked = state.liquidMode || false;
      document.getElementById('liquidMinDeltaGlobal').value = state.liquidMinDelta || 8;
      document.getElementById('liquidMinDeltaValueGlobal').textContent = state.liquidMinDelta || 8;
      document.getElementById('liquidMaxIterationsGlobal').value = state.liquidMaxIterations || 4;
      document.getElementById('liquidMaxValueGlobal').textContent = state.liquidMaxIterations || 4;
      document.getElementById('liquidTargetScoreGlobal').value = state.liquidTargetScore || 85;
      document.getElementById('liquidTargetValueGlobal').textContent = state.liquidTargetScore || 85;

      document.getElementById('liquidModeGlobal').onchange = function() {};
      document.getElementById('liquidMinDeltaGlobal').oninput = function() {
        document.getElementById('liquidMinDeltaValueGlobal').textContent = this.value;
      };
      document.getElementById('liquidMaxIterationsGlobal').oninput = function() {
        document.getElementById('liquidMaxValueGlobal').textContent = this.value;
      };
      document.getElementById('liquidTargetScoreGlobal').oninput = function() {
        document.getElementById('liquidTargetValueGlobal').textContent = this.value;
        updateLiquidTargetDisplay(parseInt(this.value, 10));
      };

      // Setup model parameter sliders
      document.getElementById('modelTemperature').value = state.modelTemperature ?? 0.7;
      document.getElementById('tempValue').textContent = state.modelTemperature ?? 0.7;
      document.getElementById('modelTopP').value = state.modelTopP ?? 1.0;
      document.getElementById('topPValue').textContent = state.modelTopP ?? 1.0;
      document.getElementById('modelMaxTokens').value = state.modelMaxTokens ?? 4096;
      document.getElementById('maxTokensValue').textContent = state.modelMaxTokens ?? 4096;
      document.getElementById('modelFreqPenalty').value = state.modelFreqPenalty ?? 0;
      document.getElementById('freqPenaltyValue').textContent = state.modelFreqPenalty ?? 0;
      document.getElementById('modelPresPenalty').value = state.modelPresPenalty ?? 0;
      document.getElementById('presPenaltyValue').textContent = state.modelPresPenalty ?? 0;

      document.getElementById('modelTemperature').oninput = function() {
        document.getElementById('tempValue').textContent = this.value;
      };
      document.getElementById('modelTopP').oninput = function() {
        document.getElementById('topPValue').textContent = this.value;
      };
      document.getElementById('modelMaxTokens').oninput = function() {
        document.getElementById('maxTokensValue').textContent = this.value;
      };
      document.getElementById('modelFreqPenalty').oninput = function() {
        document.getElementById('freqPenaltyValue').textContent = this.value;
      };
      document.getElementById('modelPresPenalty').oninput = function() {
        document.getElementById('presPenaltyValue').textContent = this.value;
      };

      // Setup AutoTune controls
      document.getElementById('autoTuneEnabled').checked = state.autoTuneEnabled || false;
      document.getElementById('autoTuneStrategy').value = state.autoTuneStrategy || 'adaptive';

      document.getElementById('autoTuneEnabled').onchange = function() {
        state.autoTuneEnabled = this.checked;
        const preview = document.getElementById('autoTunePreview');
        if (preview) preview.style.display = this.checked ? 'block' : 'none';
      };
      document.getElementById('autoTuneStrategy').onchange = function() {
        state.autoTuneStrategy = this.value;
      };

      // Show/hide preview based on current state
      const autoTunePreview = document.getElementById('autoTunePreview');
      if (autoTunePreview) autoTunePreview.style.display = state.autoTuneEnabled ? 'block' : 'none';

      // Render API keys list
      renderApiKeysList();

      // Calculate storage info
      updateStorageInfo();

      // Show modal
      document.getElementById('settingsModal').classList.add('open');
    }

    function switchSettingsTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });

      // Update panels
      document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabName}`);
      });
    }

    function closeSettings() {
      document.getElementById('settingsModal').classList.remove('open');
      // Reset to first tab
      switchSettingsTab('general');
    }

    function updateSystemPromptUI() {
      const enabled = document.getElementById('customSystemPromptEnabled').checked;
      const textarea = document.getElementById('customSystemPromptInput');
      const status = document.getElementById('systemPromptStatus');
      const charCount = document.getElementById('systemPromptCharCount');

      textarea.disabled = !enabled;
      status.textContent = enabled ? 'ON' : 'OFF';
      status.className = 'system-prompt-status ' + (enabled ? 'on' : 'off');
      charCount.textContent = (textarea.value || '').length + ' characters';
    }

    function clearCustomSystemPrompt() {
      document.getElementById('customSystemPromptInput').value = '';
      updateSystemPromptUI();
      saveSettings();
    }

    function saveSettings() {
      const newKey = document.getElementById('apiKeyInput').value.trim();
      // If user manually changed the key, clear OAuth connected state
      if (newKey !== state.apiKey) state.orOAuthConnected = false;
      state.apiKey = newKey;
      state.model = document.getElementById('defaultModelInput').value;
      state.persona = document.getElementById('personaSelect').value;
      state.customSystemPromptEnabled = document.getElementById('customSystemPromptEnabled').checked;
      state.customSystemPrompt = document.getElementById('customSystemPromptInput').value;
      updateSystemPromptUI();
      state.noLogMode = document.getElementById('noLogMode').checked;
      state.showMagic = document.getElementById('showMagic').checked;
      state.waitingGame = document.getElementById('waitingGameSelect').value;
      state.autoRetry = document.getElementById('autoRetry').checked;
      state.parseltongue = document.getElementById('parseltongue').checked;
      state.parseltongueTier = document.getElementById('parseltongueTier').value;
      state.maxRetries = parseInt(document.getElementById('maxRetriesInput').value, 10);
      // Read checkbox values and enforce mutual exclusivity (priority: ultraplinian > pliny)
      const ultraChecked = document.getElementById('ultraplinian').checked;
      const plinyChecked = document.getElementById('plinyMode').checked;

      // Only one mode can be active at a time
      if (ultraChecked) {
        state.ultraplinian = true;
        state.plinyMode = false;
      } else if (plinyChecked) {
        state.ultraplinian = false;
        state.plinyMode = true;
      } else {
        // PARSELTONGUE (sequential retry) - none of the special modes
        state.ultraplinian = false;
        state.plinyMode = false;
      }
      state.ultraSpeedTier = document.getElementById('ultraSpeedTier').value;
      state.ultraEarlyThreshold = parseInt(document.getElementById('ultraEarlyThreshold').value, 10);
      state.ultraImproveMode = document.getElementById('ultraImproveMode').checked;
      state.liquidMode = document.getElementById('liquidModeGlobal').checked;
      updateHeaderLiquidUI(); // Sync header toggle with settings checkbox
      state.liquidMaxIterations = parseInt(document.getElementById('liquidMaxIterationsGlobal').value) || 4;
      state.liquidMinDelta = parseInt(document.getElementById('liquidMinDeltaGlobal').value) || 8;
      state.liquidTargetScore = parseInt(document.getElementById('liquidTargetScoreGlobal').value) || 85;
      // Model parameters
      state.modelTemperature = parseFloat(document.getElementById('modelTemperature').value) ?? 0.7;
      state.modelTopP = parseFloat(document.getElementById('modelTopP').value) ?? 1.0;
      state.modelMaxTokens = parseInt(document.getElementById('modelMaxTokens').value) || 4096;
      state.modelFreqPenalty = parseFloat(document.getElementById('modelFreqPenalty').value) ?? 0;
      state.modelPresPenalty = parseFloat(document.getElementById('modelPresPenalty').value) ?? 0;
      state.backendUrl = document.getElementById('backendUrlInput').value.trim();
      // AutoTune settings
      state.autoTuneEnabled = document.getElementById('autoTuneEnabled').checked;
      state.autoTuneStrategy = document.getElementById('autoTuneStrategy').value;
      _log('[DEBUG] saveSettings: ultraplinian =', state.ultraplinian);
      _log('[DEBUG] saveSettings: ultraEarlyThreshold =', state.ultraEarlyThreshold);
      _log('[DEBUG] saveSettings: plinyMode =', state.plinyMode);
      _log('[DEBUG] saveSettings: autoTuneEnabled =', state.autoTuneEnabled);
      document.getElementById('modelSelect').value = state.model;
      saveState();
      updateApiWarning();
      updateUltraplinianUI();

      // Show auto-save indicator briefly
      const indicator = document.getElementById('autoSaveIndicator');
      indicator.style.display = 'flex';
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        indicator.style.display = 'none';
      }, 2000);
    }