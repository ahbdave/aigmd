function exportConversations() {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: 'G0DM0D3-v1',
        totalConversations: state.conversations.length,
        conversations: state.conversations
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `g0dm0d3-conversations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // ── Full self-custody backup (all state) ──
    function exportFullBackup() {
      const exportData = {
        _version: 1,
        _exportedAt: new Date().toISOString(),
        _source: 'g0dm0d3',
        conversations: state.conversations,
        currentId: state.currentId,
        apiKey: state.apiKey,
        model: state.model,
        persona: state.persona,
        customSystemPrompt: state.customSystemPrompt,
        customSystemPromptEnabled: state.customSystemPromptEnabled,
        strategyLogs: state.strategyLogs,
        autoTuneEnabled: state.autoTuneEnabled,
        liquidEnabled: state.liquidEnabled,
        ultraplinianEnabled: state.ultraplinianEnabled,
        ultraplinianTier: state.ultraplinianTier,
        noLogMode: state.noLogMode,
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `g0dm0d3-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    let _pendingImportData = null;

    function handleImportBackup(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB file limit (localStorage is ~5 MB; JSON has whitespace overhead)
      if (file.size > MAX_FILE_SIZE) {
        showImportStatus('error', 'File too large (' + (file.size / 1024 / 1024).toFixed(1) + ' MB). Maximum is 10 MB. Note: browser storage limit is ~5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);

          // Legacy format: plain array of conversations
          if (Array.isArray(imported)) {
            _pendingImportData = { conversations: imported };
            showImportConfirm(imported.length + ' conversations (legacy format)');
            return;
          }

          if (typeof imported !== 'object' || imported === null) {
            throw new Error('Not a valid G0DM0D3 export file.');
          }
          if (imported.conversations !== undefined && !Array.isArray(imported.conversations)) {
            throw new Error('Invalid backup: conversations field is not an array.');
          }
          if (!imported.conversations && !imported._source && !imported.version) {
            throw new Error('Not a valid G0DM0D3 export file.');
          }

          const convCount = imported.conversations?.length ?? 0;
          const msgCount = imported.conversations?.reduce(function(sum, c) { return sum + (c.messages?.length || 0); }, 0) || 0;
          const logCount = imported.strategyLogs?.length ?? 0;
          const parts = [];
          if (convCount > 0) {
            let convLabel = convCount + ' conversation' + (convCount !== 1 ? 's' : '');
            if (msgCount > 0) convLabel += ' (' + msgCount + ' messages)';
            if (convCount > MAX_CONVERSATIONS) convLabel += ' — will be capped to ' + MAX_CONVERSATIONS;
            parts.push(convLabel);
          }
          if (logCount > 0) parts.push(logCount + ' strategy logs');
          if (imported.model || imported.persona) parts.push('settings');
          if (imported.apiKey) parts.push('API key');

          _pendingImportData = imported;
          showImportConfirm(parts.join(', ') || 'backup data');
        } catch (err) {
          showImportStatus('error', err.message || 'Failed to parse export file.');
        }
      };
      reader.readAsText(file);
    }

    function showImportStatus(type, msg) {
      const el = document.getElementById('importStatus');
      el.style.display = 'block';
      el.style.border = '1px solid ' + (type === 'error' ? '#ff4444' : '#00ff88');
      el.style.background = type === 'error' ? 'rgba(255,68,68,0.06)' : 'rgba(0,255,136,0.06)';
      el.style.color = type === 'error' ? '#ff4444' : '#00ff88';
      el.textContent = (type === 'error' ? '✗ ' : '✓ ') + msg;
      setTimeout(function() { el.style.display = 'none'; }, 6000);
    }

    function showImportConfirm(summary) {
      document.getElementById('importSummaryText').textContent = summary;
      document.getElementById('importConfirm').style.display = 'block';
    }

    function confirmImportBackup() {
      if (!_pendingImportData) return;
      const imported = _pendingImportData;

      // Merge into state — only overwrite keys that exist in the import
      const allowed = ['conversations', 'currentId', 'apiKey', 'model', 'persona',
        'customSystemPrompt', 'customSystemPromptEnabled', 'strategyLogs',
        'autoTuneEnabled', 'liquidEnabled', 'ultraplinianEnabled',
        'ultraplinianTier', 'noLogMode'];
      for (const key of allowed) {
        if (imported[key] !== undefined) state[key] = imported[key];
      }

      // Enforce hard caps before saving (same caps as normal save)
      enforceDataCaps();

      // Pre-flight: check if the merged state will fit in localStorage (~5 MB)
      const { apiKey: _ak, ...stateWithoutKey } = state;
      const testPayload = JSON.stringify(stateWithoutKey);
      const estimatedBytes = new Blob([testPayload]).size;
      const maxBytes = 5 * 1024 * 1024;

      if (estimatedBytes > maxBytes * 0.95) {
        // Too large even after caps — try trimming, then warn
        trimOldData();
        const retryPayload = JSON.stringify((() => { const { apiKey: _k, ...rest } = state; return rest; })());
        const retryBytes = new Blob([retryPayload]).size;
        if (retryBytes > maxBytes * 0.95) {
          showImportStatus('error',
            'Backup is too large for browser storage (' + (retryBytes / 1024 / 1024).toFixed(1) + ' MB / ~5 MB limit). ' +
            'Try exporting fewer conversations or clearing existing data first.');
          _pendingImportData = null;
          document.getElementById('importConfirm').style.display = 'none';
          return;
        }
      }

      // Report if caps trimmed anything
      const importedConvCount = imported.conversations?.length ?? 0;
      const actualConvCount = state.conversations?.length ?? 0;
      let capWarning = '';
      if (importedConvCount > actualConvCount) {
        capWarning = ' (' + (importedConvCount - actualConvCount) + ' older conversations trimmed to fit ' + MAX_CONVERSATIONS + '-conversation limit)';
      }

      saveState();
      document.getElementById('importConfirm').style.display = 'none';
      _pendingImportData = null;
      showImportStatus('success', 'Backup restored — ' + actualConvCount + ' conversations loaded' + capWarning + '. Reloading...');
      setTimeout(function() { location.reload(); }, 1800);
    }

    function cancelImportBackup() {
      _pendingImportData = null;
      document.getElementById('importConfirm').style.display = 'none';
    }

    function clearAllData() {
      if (confirm('Are you sure you want to delete ALL data? This includes all conversations, logs, and settings. This cannot be undone!')) {
        if (confirm('This is your last chance. Delete everything?')) {
          localStorage.removeItem('g0dm0d3-state');
          location.reload();
        }
      }
    }

    function updateStorageInfo() {
      try {
        const { bytes, maxBytes, percent } = getStorageUsage();
        const kb = (bytes / 1024).toFixed(1);
        const mb = (bytes / 1024 / 1024).toFixed(2);
        const maxMb = (maxBytes / 1024 / 1024).toFixed(0);
        const convCount = state.conversations?.length || 0;
        const logCount = state.strategyLogs?.length || 0;
        const msgCount = state.conversations?.reduce((sum, c) => sum + (c.messages?.length || 0), 0) || 0;

        // Color based on usage
        let barColor = '#00ff00';
        let statusText = 'OK';
        if (percent > 90) {
          barColor = '#ff4444';
          statusText = 'CRITICAL - Clear data soon!';
        } else if (percent > 70) {
          barColor = '#ffaa00';
          statusText = 'Warning - Getting full';
        }

        document.getElementById('storageInfo').innerHTML = `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Storage: ${mb} MB / ~${maxMb} MB</span>
              <span style="color: ${barColor};">${percent.toFixed(1)}%</span>
            </div>
            <div style="background: var(--border); border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="background: ${barColor}; height: 100%; width: ${Math.min(percent, 100)}%; transition: width 0.3s;"></div>
            </div>
            ${percent > 70 ? `<div style="color: ${barColor}; font-size: 12px; margin-top: 4px;">${statusText}</div>` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>Conversations:</div><div><strong>${convCount}</strong></div>
            <div>Total Messages:</div><div><strong>${msgCount}</strong></div>
            <div>Strategy Logs:</div><div><strong>${logCount}</strong></div>
          </div>
        `;
      } catch (e) {
        document.getElementById('storageInfo').textContent = 'Unable to calculate storage info.';
      }
    }

    // Strategy Logs
    function openLogs() {
      closeSettings();
      renderLogs();
      document.getElementById('logsModal').classList.add('open');
    }

    function closeLogs() {
      document.getElementById('logsModal').classList.remove('open');
    }

    function clearLogs() {
      state.strategyLogs = [];
      saveState();
      renderLogs();
    }

    function downloadAllLogs() {
      // Compile comprehensive logs with all data
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: 'G0DM0D3-v1',
        totalLogs: state.strategyLogs?.length || 0,
        logs: (state.strategyLogs || []).map(log => ({
          timestamp: log.timestamp,
          query: log.query,
          mode: log.mode || 'PARALLEL',
          earlyStop: log.earlyStop || false,
          threshold: log.threshold,
          winner: {
            model: log.winner,
            score: log.winnerScore,
            output: log.winnerOutput
          },
          allResults: log.results?.map(r => ({
            model: r.model,
            score: r.score,
            success: r.success,
            duration: r.duration,
            contentLength: r.contentLength,
            error: r.error
          })) || []
        }))
      };

      // Create downloadable JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link and trigger
      const a = document.createElement('a');
      a.href = url;
      a.download = `g0dm0d3-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[LOGS] Downloaded', exportData.totalLogs, 'log entries');
    }

    function renderLogs() {
      const container = document.getElementById('logsContent');

      if (!state.strategyLogs || state.strategyLogs.length === 0) {
        container.innerHTML = `
          <div class="empty-logs">
            No strategy logs yet.<br>
            Send a message with ULTRAPLINIAN mode enabled to see racing results.
          </div>
        `;
        return;
      }

      const logsHtml = state.strategyLogs.map(log => `
        <div class="log-entry">
          <div class="log-header">
            <span>${new Date(log.timestamp).toLocaleString()}</span>
            <span>${log.model}</span>
          </div>
          <div class="log-query">${escapeHtml(log.query)}</div>
          <div class="log-results">
            ${log.results.map((r, i) => `
              <div class="log-result ${i === 0 ? 'winner' : ''}">
                <span class="log-strategy">${i === 0 ? '🏆 ' : ''}${r.strategy}</span>
                <span class="log-score ${r.score < 0 ? 'negative' : ''}">${r.score.toFixed(0)} pts</span>
                <span class="log-duration">${r.duration}ms</span>
                <span class="log-preview">${r.error ? '❌ ' + r.error : escapeHtml(r.contentPreview || '')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="logs-list">${logsHtml}</div>
        <button class="clear-logs-btn" onclick="clearLogs()">🗑️ Clear All Logs</button>
      `;
    }