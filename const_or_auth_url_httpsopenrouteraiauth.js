const OR_AUTH_URL = 'https://openrouter.ai/auth';
    const OR_KEY_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';

    function generateCodeVerifier(length = 128) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      const arr = crypto.getRandomValues(new Uint8Array(length));
      return Array.from(arr, b => chars[b % chars.length]).join('');
    }

    async function generateCodeChallenge(verifier) {
      const data = new TextEncoder().encode(verifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function startOpenRouterLogin() {
      try {
        const codeVerifier = generateCodeVerifier();
        sessionStorage.setItem('or_code_verifier', codeVerifier);

        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Use current origin as callback (works on any deployment)
        const callbackUrl = window.location.origin + window.location.pathname;
        sessionStorage.setItem('or_callback_url', callbackUrl);

        const authUrl = `${OR_AUTH_URL}?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        window.location.href = authUrl;
      } catch (err) {
        console.error('[OAuth] Failed to start login:', err);
        alert('Failed to start OpenRouter login. Your browser may not support the required crypto APIs.');
      }
    }

    async function handleOAuthCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) return false;

      // Clean the URL immediately (remove ?code= from address bar)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      const codeVerifier = sessionStorage.getItem('or_code_verifier');
      if (!codeVerifier) {
        console.warn('[OAuth] Got code but no verifier in session — stale callback?');
        return false;
      }

      // Clean up session storage
      sessionStorage.removeItem('or_code_verifier');
      sessionStorage.removeItem('or_callback_url');

      try {
        const res = await fetch(OR_KEY_EXCHANGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            code_challenge_method: 'S256',
          }),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => '');
          console.error(`[OAuth] Key exchange failed (${res.status}):`, err);
          alert(`OpenRouter login failed (${res.status}). Please try again or paste your key manually.`);
          return false;
        }

        const data = await res.json();
        if (!data.key) {
          console.error('[OAuth] No key in response:', data);
          return false;
        }

        // Store the key exactly like manual entry
        state.apiKey = data.key;
        state.orOAuthConnected = true;
        saveState();
        updateApiWarning();
        updateOAuthUI();

        _log('[OAuth] Connected via OpenRouter OAuth');
        return true;
      } catch (err) {
        console.error('[OAuth] Key exchange error:', err);
        alert('Failed to complete OpenRouter login. Check your network connection.');
        return false;
      }
    }

    function disconnectOpenRouter() {
      state.apiKey = '';
      state.orOAuthConnected = false;
      saveState();
      updateApiWarning();
      updateOAuthUI();
      // Also clear the input field if settings is open
      const input = document.getElementById('apiKeyInput');
      if (input) input.value = '';
    }

    function updateOAuthUI() {
      const loginBtn = document.getElementById('orLoginBtn');
      const connectedBadge = document.getElementById('orConnected');
      const keyInput = document.getElementById('apiKeyInput');
      const keyHint = document.getElementById('apiKeyHint');

      if (!loginBtn) return; // UI not rendered yet

      if (state.orOAuthConnected && state.apiKey) {
        loginBtn.style.display = 'none';
        connectedBadge.style.display = 'flex';
        if (keyInput) keyInput.value = state.apiKey;
        if (keyHint) keyHint.textContent = 'Connected via OpenRouter login. Key is managed automatically.';
      } else {
        loginBtn.style.display = 'flex';
        connectedBadge.style.display = 'none';
        if (keyHint) keyHint.textContent = 'Stored in your browser\'s localStorage only. Never sent to G0DM0D3 servers.';
      }
    }