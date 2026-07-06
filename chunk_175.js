function generateApiKey() {
      // Generate a cryptographically secure random API key
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      let key = 'g0d_';
      for (let i = 0; i < 32; i++) {
        key += chars.charAt(randomBytes[i] % chars.length);
      }

      const newKey = {
        key: key,
        created: new Date().toISOString(),
        name: `Key ${(state.generatedApiKeys?.length || 0) + 1}`
      };

      state.generatedApiKeys = state.generatedApiKeys || [];
      state.generatedApiKeys.push(newKey);
      saveState();

      // Show the new key
      const display = document.getElementById('newKeyDisplay');
      display.style.display = 'block';
      display.innerHTML = `
        <div class="generated-key-box">
          <label>New API Key Generated</label>
          <code id="newKeyValue">${key}</code>
          <div class="api-key-actions">
            <button class="api-key-btn" onclick="copyNewKey()">Copy Key</button>
          </div>
          <small>Save this key now - it won't be shown again in full!</small>
        </div>
      `;

      renderApiKeysList();
    }

    function copyNewKey() {
      const key = document.getElementById('newKeyValue').textContent;
      navigator.clipboard.writeText(key).then(() => {
        const btn = event.target;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Key', 2000);
      });
    }

    function renderApiKeysList() {
      const container = document.getElementById('apiKeysList');
      const keys = state.generatedApiKeys || [];

      if (keys.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); font-size: 13px; padding: 12px; background: var(--bg); border-radius: 8px;">No API keys generated yet.</div>';
        return;
      }

      container.innerHTML = keys.map((k, i) => `
        <div class="api-key-display" style="margin-bottom: 8px;">
          <code>${k.key.slice(0, 8)}...${k.key.slice(-4)}</code>
          <span style="color: var(--text-dim); font-size: 11px;">${new Date(k.created).toLocaleDateString()}</span>
          <button onclick="deleteApiKey(${i})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 16px;">×</button>
        </div>
      `).join('');
    }

    function deleteApiKey(index) {
      if (confirm('Delete this API key? This cannot be undone.')) {
        state.generatedApiKeys.splice(index, 1);
        saveState();
        renderApiKeysList();
      }
    }