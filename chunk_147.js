function isLibertasComboEnabled(id) {
      return !(state.libertasDisabledCombos || []).includes(id);
    }

    function toggleLibertasCombo(id) {
      if (!state.libertasDisabledCombos) state.libertasDisabledCombos = [];
      const idx = state.libertasDisabledCombos.indexOf(id);
      if (idx >= 0) {
        state.libertasDisabledCombos.splice(idx, 1);
      } else {
        state.libertasDisabledCombos.push(id);
      }
      renderHallOfFameUI();
      saveState();
    }

    function toggleAllLibertasCombos(enableAll) {
      if (enableAll) {
        state.libertasDisabledCombos = [];
      } else {
        state.libertasDisabledCombos = HALL_OF_FAME.map(c => c.id);
      }
      renderHallOfFameUI();
      saveState();
    }

    function renderHallOfFameUI() {
      const container = document.getElementById('libertas-hof-list');
      if (!container) return;
      container.innerHTML = '';
      let activeCount = 0;

      for (const combo of HALL_OF_FAME) {
        const enabled = isLibertasComboEnabled(combo.id);
        if (enabled) activeCount++;

        const promptPreview = (combo.system || '').substring(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '...';

        const card = document.createElement('div');
        card.style.cssText = `
          background: ${enabled ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'};
          border: 1px solid ${enabled ? combo.color + '66' : 'rgba(100,100,100,0.2)'};
          border-radius: 8px; padding: 10px 12px; cursor: pointer;
          transition: all 0.2s ease; opacity: ${enabled ? '1' : '0.45'};
        `;
        card.onmouseenter = function() { this.style.borderColor = combo.color; };
        card.onmouseleave = function() { this.style.borderColor = enabled ? combo.color + '66' : 'rgba(100,100,100,0.2)'; };

        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div onclick="event.stopPropagation(); toggleLibertasCombo('${combo.id}')" style="
              width: 28px; height: 16px; border-radius: 8px; position: relative; cursor: pointer; flex-shrink: 0;
              background: ${enabled ? combo.color : 'rgba(100,100,100,0.4)'}; transition: background 0.2s;
            ">
              <div style="
                width: 12px; height: 12px; border-radius: 50%; background: white; position: absolute; top: 2px;
                transition: left 0.2s; left: ${enabled ? '14px' : '2px'};
              "></div>
            </div>
            <span style="font-family: monospace; font-size: 11px; font-weight: bold; color: ${enabled ? combo.color : '#666'}; flex: 1; letter-spacing: 0.5px;">
              ${combo.codename}
            </span>
            <span style="font-family: monospace; font-size: 9px; color: #888;">${combo.model.split('/')[1] || combo.model}</span>
          </div>
          <div style="font-size: 10px; color: #888; line-height: 1.3; margin-left: 36px;">${combo.description}</div>
          <div style="margin-top: 6px; margin-left: 36px;">
            <div style="
              font-family: monospace; font-size: 9px; color: #555; background: rgba(0,0,0,0.3);
              padding: 6px; border-radius: 4px; border: 1px solid rgba(100,100,100,0.15);
              max-height: 80px; overflow-y: auto; line-height: 1.4; word-break: break-word;
            ">${promptPreview}</div>
          </div>
        `;
        container.appendChild(card);
      }

      const activeEl = document.getElementById('libertasActiveCount');
      const totalEl = document.getElementById('libertasTotalCount');
      if (activeEl) activeEl.textContent = activeCount;
      if (totalEl) totalEl.textContent = HALL_OF_FAME.length;
    }

    // ─── Universal Liquid Response toggle (header) ─────────────────────
    function toggleLiquidFromHeader() {
      state.liquidMode = !state.liquidMode;
      updateHeaderLiquidUI();
      // Sync settings panel checkbox if open
      const checkbox = document.getElementById('liquidModeGlobal');
      if (checkbox) checkbox.checked = state.liquidMode;
      saveState();
    }

    function updateHeaderLiquidUI() {
      const btn = document.getElementById('headerLiquidToggle');
      if (!btn) return;
      if (state.liquidMode) {
        btn.classList.add('active');
        btn.title = 'Liquid Response ON — responses morph live as better answers arrive';
      } else {
        btn.classList.remove('active');
        btn.title = 'Liquid Response OFF — wait for final response';
      }
    }

    function updatePromptsTriedUI() {
      const el = document.getElementById('promptsTriedCount');
      if (el) el.textContent = state.promptsTried || 0;
    }

    // ─── Debounced state persistence ───────────────────────────────────
    // Multiple subsystems (ultraplinian, liquid, UI) can call saveState()
    // in rapid succession. We debounce the actual localStorage write so
    // overlapping calls coalesce into a single write with the latest data.
    let _saveStateTimer = null;
    let _saveStatePending = false;

    function _flushSaveState() {
      _saveStateTimer = null;
      _saveStatePending = false;
      enforceDataCaps(); // Cap unbounded arrays before serialization
      // Strip apiKey from the main blob — it's stored encrypted separately
      const { apiKey, ...stateWithoutKey } = state;
      const payload = JSON.stringify(stateWithoutKey);

      // Persist encrypted key separately (async, best-effort)
      if (apiKey) {
        encryptApiKey(apiKey).then(enc => {
          try { localStorage.setItem('g0dm0d3-apikey', enc); } catch (_) {}
        });
      }

      try {
        localStorage.setItem('g0dm0d3-state', payload);
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
          console.warn('Storage quota exceeded, attempting to free space...');
          if (trimOldData()) {
            try {
              localStorage.setItem('g0dm0d3-state', payload);
              showStorageWarning('Storage was full. Older conversations were removed to make space.');
            } catch (e2) {
              showStorageWarning('Storage is completely full! Please clear some data in Settings > Data.');
            }
          } else {
            showStorageWarning('Storage is full! Please clear conversations or logs in Settings > Data.');
          }
        } else {
          console.error('Failed to save state:', e);
        }
      }
    }

    function saveState() {
      state.model = document.getElementById('modelSelect').value;

      // Also update current conversation's model/persona if mid-conversation
      const conv = getCurrentConv();
      if (conv) {
        conv.model = state.model;
        conv.persona = state.persona;
      }

      // Debounce: coalesce rapid writes (50ms). The state object is shared
      // in-memory so the final write always contains the latest mutations.
      if (_saveStateTimer) clearTimeout(_saveStateTimer);
      _saveStatePending = true;
      _saveStateTimer = setTimeout(_flushSaveState, 50);
    }

    // Force an immediate synchronous write (for beforeunload / critical paths)
    function saveStateNow() {
      if (_saveStateTimer) {
        clearTimeout(_saveStateTimer);
        _saveStateTimer = null;
      }
      state.model = document.getElementById('modelSelect').value;
      const conv = getCurrentConv();
      if (conv) {
        conv.model = state.model;
        conv.persona = state.persona;
      }
      _saveStatePending = false;
      _flushSaveState();
    }

    // Hard caps to prevent unbounded growth
    const MAX_CONVERSATIONS = 100;
    const MAX_MESSAGES_PER_CONV = 500;
    const MAX_LIQUID_VERSIONS = 10;
    const MAX_RACE_RESPONSES = 40;

    // Enforce size caps on all conversations (runs on load + before save)
    function enforceDataCaps() {
      if (!state.conversations) return;
      // Cap total conversations
      if (state.conversations.length > MAX_CONVERSATIONS) {
        state.conversations = state.conversations.slice(0, MAX_CONVERSATIONS);
      }
      for (const conv of state.conversations) {
        if (!conv.messages) continue;
        // Cap messages per conversation
        if (conv.messages.length > MAX_MESSAGES_PER_CONV) {
          conv.messages = conv.messages.slice(-MAX_MESSAGES_PER_CONV);
        }
        for (const msg of conv.messages) {
          // Cap liquid versions
          if (msg.liquidVersions && msg.liquidVersions.length > MAX_LIQUID_VERSIONS) {
            msg.liquidVersions = msg.liquidVersions.slice(-MAX_LIQUID_VERSIONS);
          }
          // Cap race responses
          if (msg.raceResponses && msg.raceResponses.length > MAX_RACE_RESPONSES) {
            msg.raceResponses = msg.raceResponses.slice(0, MAX_RACE_RESPONSES);
          }
        }
      }
    }

    function trimOldData() {
      // Try to free space by removing oldest conversations (keep last 10)
      let freed = false;

      // First, try clearing old strategy logs (keep last 50)
      if (state.strategyLogs && state.strategyLogs.length > 50) {
        state.strategyLogs = state.strategyLogs.slice(-50);
        freed = true;
      }

      // Then trim old conversations (keep last 10)
      if (state.conversations && state.conversations.length > 10) {
        state.conversations = state.conversations.slice(0, 10);
        freed = true;
      }

      // Trim long messages in older conversations
      if (state.conversations) {
        state.conversations.forEach((conv, i) => {
          if (i > 5 && conv.messages) { // Only trim older conversations
            conv.messages.forEach(msg => {
              if (msg.content && msg.content.length > 5000) {
                msg.content = msg.content.substring(0, 5000) + '\n\n[...truncated to save space...]';
                freed = true;
              }
            });
          }
        });
      }

      return freed;
    }

    function showStorageWarning(message) {
      // Create or update warning toast
      let toast = document.getElementById('storageToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'storageToast';
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff4444;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 10000;
          max-width: 90%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.display = 'block';

      // Auto-hide after 8 seconds
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 8000);
    }

    function getStorageUsage() {
      try {
        const data = localStorage.getItem('g0dm0d3-state') || '';
        const bytes = new Blob([data]).size;
        const maxBytes = 5 * 1024 * 1024; // 5MB typical limit
        return { bytes, maxBytes, percent: (bytes / maxBytes) * 100 };
      } catch (e) {
        return { bytes: 0, maxBytes: 5242880, percent: 0 };
      }
    }

    function updateApiWarning() {
      document.getElementById('noApiWarning').style.display = state.apiKey ? 'none' : 'flex';
    }

    // Sidebar
    function toggleSidebar() {
      state.sidebarOpen = !state.sidebarOpen;
      document.getElementById('sidebar').classList.toggle('collapsed', !state.sidebarOpen);
      document.getElementById('sidebarOverlay').classList.toggle('visible', state.sidebarOpen);
    }

    // Conversations
    function newChat() {
      const id = Date.now().toString();
      state.conversations.unshift({
        id,
        title: 'New Chat',
        messages: [],
        model: state.model,
        persona: state.persona
      });
      state.currentId = id;
      saveState();
      render();
    }

    function selectChat(id) {
      if (renamingChat) return;
      const alreadyActive = state.currentId === id;
      state.currentId = id;
      const conv = state.conversations.find(c => c.id === id);
      if (conv) {
        document.getElementById('modelSelect').value = conv.model;
        document.getElementById('personaSelect').value = conv.persona;
        state.model = conv.model;
        state.persona = conv.persona;
      }
      saveState();
      if (!alreadyActive) render();
    }

    function deleteChat(id, e) {
      e.stopPropagation();
      state.conversations = state.conversations.filter(c => c.id !== id);
      if (state.currentId === id) {
        state.currentId = state.conversations[0]?.id || null;
      }
      saveState();
      render();
    }

    let renamingChat = false;

    function renameChat(id, titleEl, e) {
      e.stopPropagation();
      e.preventDefault();
      const conv = state.conversations.find(c => c.id === id);
      if (!conv) return;

      renamingChat = true;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'conv-rename-input';
      input.value = conv.title;
      input.maxLength = 100;

      function commitRename() {
        if (!renamingChat) return;
        renamingChat = false;
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== conv.title) {
          conv.title = newTitle;
          saveState();
        }
        renderConversations();
      }

      input.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = conv.title; input.blur(); }
      });
      input.addEventListener('blur', commitRename);
      input.addEventListener('click', (ev) => ev.stopPropagation());
      input.addEventListener('dblclick', (ev) => ev.stopPropagation());

      titleEl.replaceWith(input);
      input.focus();
      input.select();
    }

    function getCurrentConv() {
      return state.conversations.find(c => c.id === state.currentId);
    }

    // Render
    function render() {
      renderConversations();
      renderMessages();
    }

    function renderConversations() {
      if (renamingChat) return;
      const container = document.getElementById('conversations');
      if (state.conversations.length === 0) {
        container.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
      }

      container.innerHTML = state.conversations.map(conv => `
        <div class="conv-item ${conv.id === state.currentId ? 'active' : ''}" data-conv-id="${escapeAttr(conv.id)}">
          <span class="conv-title" data-conv-id="${escapeAttr(conv.id)}">${escapeHtml(conv.title)}</span>
          <button class="conv-delete" data-delete-conv="${escapeAttr(conv.id)}">×</button>
        </div>
      `).join('');
    }

    // Delegated click handler for conversation sidebar (called from DOMContentLoaded)
    function _initConvDelegate() {
      const container = document.getElementById('conversations');
      if (!container) return;
      container.addEventListener('click', (e) => {
        // Delete button
        const delBtn = e.target.closest('[data-delete-conv]');
        if (delBtn) {
          e.stopPropagation();
          deleteChat(delBtn.dataset.deleteConv, e);
          return;
        }
        // Conv item
        const convItem = e.target.closest('[data-conv-id]');
        if (convItem) {
          selectChat(convItem.dataset.convId);
        }
      });
    }

    function renderMessages() {
      const container = document.getElementById('messagesArea');
      const conv = getCurrentConv();

      if (!conv || conv.messages.length === 0) {
        document.getElementById('welcome').style.display = 'flex';
        container.querySelectorAll('.message').forEach(m => m.remove());
        return;
      }

      document.getElementById('welcome').style.display = 'none';

      const messagesHtml = conv.messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isLast = idx === conv.messages.length - 1;
        const isLastAssistant = !isUser && isLast;

        // User message actions: copy, edit (delegated via data-action)
        const userActions = `
          <div class="message-actions">
            <button class="msg-action-btn" data-action="copy" data-idx="${idx}" title="Copy">⧉</button>
            <button class="msg-action-btn" data-action="edit" data-idx="${idx}" title="Edit">✎</button>
          </div>
        `;

        // Assistant message actions: copy, retry (delegated via data-action)
        const assistantActions = `
          <div class="message-actions">
            <button class="msg-action-btn" data-action="copy" data-idx="${idx}" title="Copy">⧉</button>
            ${isLastAssistant ? `<button class="msg-action-btn" data-action="retry" title="Retry">↻</button>` : ''}
          </div>
        `;

        // Magic info display (when showMagic is enabled and message has magic data)
        const magicInfo = (!isUser && state.showMagic && msg.magic) ? renderMagicInfo(msg.magic, idx) : '';

        // Liquid version selector (only for messages with 2+ versions to browse)
        const versionSelector = (!isUser && state.showMagic && msg.liquidVersions && msg.liquidVersions.length >= 2)
          ? renderLiquidVersionSelector(msg, idx)
          : '';

        // Race response navigator (browse between different model outputs)
        const raceNav = (!isUser && state.showMagic && msg.raceResponses && msg.raceResponses.length > 1)
          ? renderRaceNavigator(msg, idx)
          : '';

        // Edit textarea for user messages (Cmd/Ctrl+Enter to save, regular Enter for newline)
        const editArea = isUser ? `
          <div class="message-edit-area">
            <textarea class="message-edit-textarea" id="edit-textarea-${idx}" onkeydown="handleEditKeydown(event, ${idx})">${escapeHtml(msg.content)}</textarea>
            <div class="message-edit-buttons">
              <button class="edit-save-btn" onclick="saveEdit(${idx})">Save & Regenerate</button>
              <button class="edit-cancel-btn" onclick="cancelEdit(${idx})">Cancel</button>
              <span class="edit-hint">⌘/Ctrl+Enter to send</span>
            </div>
          </div>
        ` : '';

        // Image thumbnail for user messages with attached images
        const imageThumb = (isUser && msg.imageDataUrl)
          ? `<img class="message-image-thumb" src="${msg.imageDataUrl}" alt="${escapeHtml(msg.imageName || 'image')}" onclick="window.open(this.src,'_blank')">`
          : '';

        // Vision badge for messages that had image processing
        const visionBadge = (isUser && msg.imageDataUrl)
          ? `<div class="vision-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> analyzed via Gemini Flash</div>`
          : '';

        return `
          <div class="message ${msg.role}" data-idx="${idx}">
            <div class="message-avatar">${isUser ? '_&lt;' : '&gt;_'}</div>
            <div class="message-wrapper">
              ${magicInfo}
              ${imageThumb}
              <div class="message-content">${formatMessage(state.showMagic && msg.raceCurrentIdx != null && msg.raceResponses?.[msg.raceCurrentIdx]
                ? msg.raceResponses[msg.raceCurrentIdx].content
                : msg.content)}</div>
              ${visionBadge}
              ${raceNav}
              ${versionSelector}
              ${editArea}
              ${isUser ? userActions : assistantActions}
            </div>
          </div>
        `;
      }).join('');

      // Keep welcome hidden, add messages
      container.innerHTML = `<div class="welcome" id="welcome" style="display: none;"></div>${messagesHtml}`;
      container.scrollTop = container.scrollHeight;

      // Setup long-press for mobile edit on user messages
      setupLongPressEdit();
    }

    // Long-press detection for mobile edit
    // Render magic info for assistant messages
    function renderMagicInfo(magic, idx) {
      if (!magic || !magic.mode) return '';

      const modeClass = {
        'ULTRAPLINIAN': 'ultraplinian',
        'ULTRAPLINIAN-EARLYBIRD': 'ultraplinian',
        'PLINY': 'pliny',  // backwards compat for old messages
        'G0DM0D3 CLASSIC': 'pliny',
        'PARSELTONGUE': 'parseltongue',
        'AUTOTUNE': 'autotune',
        'GODMODE': 'godmode'
      }[magic.mode] || 'godmode';

      const modeIcon = {
        'ULTRAPLINIAN': '🌋',
        'ULTRAPLINIAN-EARLYBIRD': '🐦',
        'PLINY': '⛓️‍💥',  // backwards compat
        'G0DM0D3 CLASSIC': '⛓️‍💥',
        'PARSELTONGUE': '🐉',
        'AUTOTUNE': '🧠',
        'GODMODE': '🜏'
      }[magic.mode] || '🜏';

      // Build AutoTune layer info if present
      let autoTuneHtml = '';
      if (magic.autoTune) {
        const at = magic.autoTune;
        const contextColors = { code: '#00ff88', creative: '#ffa500', analytical: '#00bfff', conversational: '#a855f7', chaotic: '#ff3e3e' };
        const strategyLabels = { adaptive: 'ADAPTIVE', precise: 'PRECISE', balanced: 'BALANCED', creative: 'CREATIVE', chaotic: 'CHAOTIC' };
        const contextLabels = { code: 'CODE', creative: 'CREATIVE', analytical: 'ANALYTICAL', conversational: 'CHAT', chaotic: 'CHAOS', security: 'SECURITY', medical: 'MEDICAL', legal: 'LEGAL', financial: 'FINANCIAL', scientific: 'SCIENTIFIC', philosophical: 'PHILOSOPHICAL', instructional: 'INSTRUCTIONAL', persuasive: 'PERSUASIVE', mathematical: 'MATHEMATICAL', historical: 'HISTORICAL', political: 'POLITICAL', subversive: 'SUBVERSIVE', emotional: 'EMOTIONAL', strategic: 'STRATEGIC', synthesis: 'SYNTHESIS' };

        // Build reasoning string
        let reasoningParts = [];
        if (at.strategy === 'adaptive') {
          reasoningParts.push(`Detected ${contextLabels[at.context] || at.context} context`);
          if (at.confidence < 0.6) {
            reasoningParts.push(`Low confidence (${Math.round(at.confidence * 100)}%) - blended with balanced`);
          }
        } else {
          reasoningParts.push(`Fixed ${strategyLabels[at.strategy] || at.strategy} profile`);
        }
        if (at.conversationLength > 10) {
          reasoningParts.push(`Long convo boost (+${Math.min((at.conversationLength - 10) * 0.01, 0.15).toFixed(2)} rep)`);
        }
        if (at.godmodeBoost) {
          reasoningParts.push('GODMODE boost (+0.1 temp, +0.15 pres, +0.1 freq)');
        }
        const reasoning = reasoningParts.join(' → ');

        autoTuneHtml = `
          <div class="magic-layer" style="margin-top: 8px; padding: 10px; background: rgba(0, 255, 255, 0.1); border-radius: 6px; border-left: 3px solid #00ffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #00ffff; font-weight: 600; font-size: 11px;">🧠 AUTOTUNE</span>
                <span style="color: #888; font-size: 10px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px;">${escapeHtml(strategyLabels[at.strategy] || String(at.strategy))}</span>
              </div>
              <span style="color: ${safeColor(contextColors[at.context], '#fff')}; font-size: 10px; font-family: monospace; background: rgba(0, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px;">${escapeHtml(contextLabels[at.context] || String(at.context))} (${Math.round((at.confidence || 0) * 100)}%)</span>
            </div>
            <div style="font-size: 9px; color: #888; margin-bottom: 8px; font-style: italic; line-height: 1.4;">
              ${escapeHtml(reasoning)}
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; font-size: 9px; font-family: monospace;">
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">TEMP</div><div style="color: #00ffff; font-weight: 600;">${at.params?.temperature?.toFixed(2) || '-'}</div></div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">TOP-P</div><div style="color: #00ffff; font-weight: 600;">${at.params?.top_p?.toFixed(2) || '-'}</div></div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">TOP-K</div><div style="color: #00ffff; font-weight: 600;">${at.params?.top_k || '-'}</div></div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">FREQ</div><div style="color: #00ffff; font-weight: 600;">${at.params?.frequency_penalty?.toFixed(2) || '-'}</div></div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">PRES</div><div style="color: #00ffff; font-weight: 600;">${at.params?.presence_penalty?.toFixed(2) || '-'}</div></div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;"><div style="color: #888; font-size: 8px;">REP</div><div style="color: #00ffff; font-weight: 600;">${at.params?.repetition_penalty?.toFixed(2) || '-'}</div></div>
            </div>
          </div>
        `;
      }

      let detailsHtml = '';

      // Handle both ULTRAPLINIAN and ULTRAPLINIAN-EARLYBIRD
      if (magic.mode === 'ULTRAPLINIAN' || magic.mode === 'ULTRAPLINIAN-EARLYBIRD') {
        const modelShort = magic.winnerModel?.split('/')[1] || magic.winnerModel || 'unknown';

        // Build model grid if available
        let modelGridHtml = '';
        if (magic.thinkingModels && Object.keys(magic.thinkingModels).length > 0) {
          const modelItems = Object.entries(magic.thinkingModels).map(([model, data]) => {
            const shortName = model.split('/')[1]?.slice(0, 12) || model.slice(0, 12);
            const statusIcon = { 'pending': '⏳', 'running': '🔄', 'success': '✓', 'fail': '✗', 'winner': '👑' }[data.status] || '•';
            const scoreText = data.score !== null ? ` (${data.score})` : '';
            return `<span class="magic-model-item ${escapeAttr(data.status)}">${statusIcon} ${escapeHtml(shortName)}${escapeHtml(scoreText)}</span>`;
          }).join('');
          modelGridHtml = `<div class="magic-model-grid">${modelItems}</div>`;
        }

        // Build thinking logs if available - show ALL logs in scrollable container
        let logsHtml = '';
        if (magic.thinkingLogs && magic.thinkingLogs.length > 0) {
          const logItems = magic.thinkingLogs.map(log =>
            `<div class="magic-log-entry ${escapeAttr(log.type)}"><span class="magic-log-time">${escapeHtml(String(log.time))}s</span> ${escapeHtml(log.message)}</div>`
          ).join('');
          logsHtml = `
            <div class="magic-logs-header">📋 Process Log (${magic.thinkingLogs.length} entries)</div>
            <div class="magic-thinking-logs">${logItems}</div>
          `;
        }

        // Enhanced Tastemaker score display
        let tastemakerHtml = '';
        if (magic.tastemakerScore) {
          const ts = magic.tastemakerScore;
          tastemakerHtml = `
            <div class="magic-info-row tastemaker-score">
              <span class="magic-info-label">Tastemaker:</span>
              <span class="magic-info-value" style="color: ${safeColor(ts.gradeColor, '#00ff41')}">
                ${escapeHtml(String(ts.gradeEmoji || '✓'))} ${escapeHtml(String(ts.overall || 'N/A'))} (${escapeHtml(String(ts.grade || 'N/A'))})
              </span>
            </div>
            <div class="magic-info-row tastemaker-breakdown" style="padding-left: 20px; font-size: 11px; opacity: 0.85;">
              <span class="magic-info-label">Breakdown:</span>
              <span class="magic-info-value">
                Q:${escapeHtml(String(ts.axes?.quality?.overall || '-'))}
                F:${escapeHtml(String(ts.axes?.filteredness?.overall || '-'))}
                S:${escapeHtml(String(ts.axes?.speed?.overall || '-'))}
              </span>
            </div>
            ${ts.queryType ? `
            <div class="magic-info-row" style="padding-left: 20px; font-size: 11px; opacity: 0.85;">
              <span class="magic-info-label">Query Type:</span>
              <span class="magic-info-value">${escapeHtml(String(ts.queryType))}</span>
            </div>` : ''}
          `;
        }

        detailsHtml = `
          <div class="magic-info-row"><span class="magic-info-label">Winner:</span><span class="magic-info-value">${escapeHtml(modelShort)}</span></div>
          ${tastemakerHtml || `<div class="magic-info-row"><span class="magic-info-label">Score:</span><span class="magic-info-value">${escapeHtml(String(magic.winnerScore || 'N/A'))}</span></div>`}
          <div class="magic-info-row"><span class="magic-info-label">Duration:</span><span class="magic-info-value">${escapeHtml(String(magic.duration || 'N/A'))}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Models:</span><span class="magic-info-value">${parseInt(magic.successfulModels) || 0}/${parseInt(magic.totalModels) || 0} succeeded</span></div>
          ${magic.judgeReasoning ? `<div class="magic-info-row"><span class="magic-info-label">Reasoning:</span><span class="magic-info-value">${escapeHtml(magic.judgeReasoning)}</span></div>` : ''}
          ${modelGridHtml}
          ${logsHtml}
        `;
      } else if (magic.mode === 'CONSORTIUM') {
        // CONSORTIUM: Show hive-mind synthesis metadata
        let consortiumModelGridHtml = '';
        if (magic.thinkingModels && Object.keys(magic.thinkingModels).length > 0) {
          const modelItems = Object.entries(magic.thinkingModels).map(([model, data]) => {
            const statusIcon = { 'pending': '⏳', 'running': '🔄', 'success': '✓', 'fail': '✗', 'winner': '🧠' }[data.status] || '•';
            const shortName = model.split('/')[1] || model;
            const scoreText = data.score !== null ? ` (${data.score})` : '';
            return `<span class="magic-model-item ${escapeAttr(data.status)}">${statusIcon} ${escapeHtml(shortName)}${escapeHtml(scoreText)}</span>`;
          }).join('');
          consortiumModelGridHtml = `<div class="magic-model-grid">${modelItems}</div>`;
        }

        let consortiumLogsHtml = '';
        if (magic.thinkingLogs && magic.thinkingLogs.length > 0) {
          const logItems = magic.thinkingLogs.map(log =>
            `<div class="magic-log-entry ${escapeAttr(log.type)}"><span class="magic-log-time">${escapeHtml(String(log.time))}s</span> ${escapeHtml(log.message)}</div>`
          ).join('');
          consortiumLogsHtml = `
            <div class="magic-logs-header">📋 Process Log (${magic.thinkingLogs.length} entries)</div>
            <div class="magic-thinking-logs">${logItems}</div>
          `;
        }

        detailsHtml = `
          <div class="magic-info-row"><span class="magic-info-label">Mode:</span><span class="magic-info-value"><span class="magic-info-badge consortium">CONSORTIUM</span></span></div>
          <div class="magic-info-row"><span class="magic-info-label">Orchestrator:</span><span class="magic-info-value">${escapeHtml((magic.winnerModel || 'unknown').split('/')[1] || magic.winnerModel || 'unknown')}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Duration:</span><span class="magic-info-value">${escapeHtml(String(magic.duration || 'N/A'))}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Models:</span><span class="magic-info-value">${parseInt(magic.successfulModels) || 0}/${parseInt(magic.totalModels) || 0} collected</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Scored:</span><span class="magic-info-value">${parseInt(magic.scoredResponses) || 0} responses fed to orchestrator</span></div>
          ${magic.topModel ? `<div class="magic-info-row"><span class="magic-info-label">Top Model:</span><span class="magic-info-value">${escapeHtml(magic.topModel.split('/')[1] || magic.topModel)} (${magic.topScore || 'N/A'})</span></div>` : ''}
          ${consortiumModelGridHtml}
          ${consortiumLogsHtml}
        `;
      } else if (magic.mode === 'PLINY' || magic.mode === 'G0DM0D3 CLASSIC') {
        // Build template grid if available (similar to model grid for ULTRAPLINIAN)
        let templateGridHtml = '';
        if (magic.thinkingModels && Object.keys(magic.thinkingModels).length > 0) {
          const templateItems = Object.entries(magic.thinkingModels).map(([template, data]) => {
            const statusIcon = { 'pending': '⏳', 'running': '🔄', 'success': '✓', 'fail': '✗', 'winner': '👑' }[data.status] || '•';
            const scoreText = data.score !== null ? ` (${data.score})` : '';
            return `<span class="magic-model-item ${escapeAttr(data.status)}">${statusIcon} ${escapeHtml(template)}${escapeHtml(scoreText)}</span>`;
          }).join('');
          templateGridHtml = `<div class="magic-model-grid">${templateItems}</div>`;
        }

        // Build all_scores grid if available (enriched metadata)
        if (!templateGridHtml && magic.all_scores && magic.all_scores.length > 0) {
          const scoreItems = magic.all_scores.map(s => {
            const isWinner = s.template === magic.template;
            const cls = isWinner ? 'winner' : 'success';
            return `<span class="magic-model-item ${cls}">${isWinner ? '👑' : '✓'} ${escapeHtml(s.template)} (${s.score})</span>`;
          }).join('');
          templateGridHtml = `<div class="magic-model-grid">${scoreItems}</div>`;
        }

        // Build thinking logs if available
        let plinyLogsHtml = '';
        if (magic.thinkingLogs && magic.thinkingLogs.length > 0) {
          const logItems = magic.thinkingLogs.map(log =>
            `<div class="magic-log-entry ${escapeAttr(log.type)}"><span class="magic-log-time">${escapeHtml(String(log.time))}s</span> ${escapeHtml(log.message)}</div>`
          ).join('');
          plinyLogsHtml = `
            <div class="magic-logs-header">📋 Process Log (${magic.thinkingLogs.length} entries)</div>
            <div class="magic-thinking-logs">${logItems}</div>
          `;
        }

        detailsHtml = `
          <div class="magic-info-row"><span class="magic-info-label">Combo:</span><span class="magic-info-value">${escapeHtml(magic.template || 'unknown')}${magic.combo ? ' <span style="color:#888;font-size:10px;">[' + escapeHtml(magic.combo) + ']</span>' : ''}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Score:</span><span class="magic-info-value" style="color: ${(magic.score || 0) >= 80 ? '#00ff41' : (magic.score || 0) >= 40 ? '#ffcc00' : '#ff4444'}">${magic.score || 'N/A'}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Model:</span><span class="magic-info-value">${escapeHtml(magic.model?.split('/')[1] || magic.model || 'unknown')}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Duration:</span><span class="magic-info-value">${magic.duration || 'N/A'}</span></div>
          ${magic.combos_attempted ? `<div class="magic-info-row"><span class="magic-info-label">Combos:</span><span class="magic-info-value">${magic.combos_succeeded || 0}/${magic.combos_attempted} succeeded, ${magic.combos_failed || 0} refused</span></div>` : ''}
          ${templateGridHtml}
          ${plinyLogsHtml}
          ${magic.systemPrompt ? `<div><span class="magic-info-label">System Prompt:</span><div class="magic-info-prompt">${escapeHtml(magic.systemPrompt.slice(0, 500))}${magic.systemPrompt.length > 500 ? '...' : ''}</div></div>` : ''}
          ${magic.enhancedUserPrompt ? `<div><span class="magic-info-label">User Prompt:</span><div class="magic-info-prompt">${escapeHtml(magic.enhancedUserPrompt.slice(0, 500))}${magic.enhancedUserPrompt.length > 500 ? '...' : ''}</div></div>` : ''}
        `;
      } else if (magic.mode === 'PARSELTONGUE') {
        // Build technique scores grid
        let scoresHtml = '';
        if (magic.scores && magic.scores.length > 0) {
          const scoreItems = magic.scores.map(s => {
            const isWinner = s.technique === magic.techniqueLabel;
            const color = s.score >= 80 ? '#00ff41' : s.score >= 60 ? '#ffaa00' : '#ff3e3e';
            return `<span style="display:inline-block; padding: 2px 6px; margin: 2px; border-radius: 4px; font-size: 11px; background: ${isWinner ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${isWinner ? '#ffd700' : 'rgba(255,255,255,0.1)'};">${isWinner ? '👑 ' : ''}${escapeHtml(s.technique)} <span style="color:${color}">${s.score}</span></span>`;
          }).join('');
          scoresHtml = `<div style="margin-top: 6px;">${scoreItems}</div>`;
        }

        detailsHtml = `
          <div class="magic-info-row"><span class="magic-info-label">Tier:</span><span class="magic-info-value">${escapeHtml((magic.tier || 'standard').toUpperCase())}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Winner:</span><span class="magic-info-value" style="color: #ffd700;">${escapeHtml(magic.techniqueLabel || magic.technique || 'unknown')}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Sampling:</span><span class="magic-info-value">temp=${parseFloat(magic.temperature) || 'N/A'} top_p=${parseFloat(magic.topP) || 'N/A'}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Model:</span><span class="magic-info-value">${escapeHtml(magic.model?.split('/')[1] || magic.model || 'unknown')}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Variants:</span><span class="magic-info-value">${magic.variants_succeeded || '?'}/${magic.variants_total || '?'} succeeded, ${magic.variants_refused || 0} refused</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Duration:</span><span class="magic-info-value">${escapeHtml(String(magic.duration || 'N/A'))}</span></div>
          ${magic.triggers_found?.length > 0 ? `<div class="magic-info-row"><span class="magic-info-label">Triggers:</span><span class="magic-info-value">${escapeHtml(magic.triggers_found.join(', '))}</span></div>` : ''}
          ${scoresHtml}
        `;
      } else if (magic.mode === 'GODMODE') {
        detailsHtml = `
          <div class="magic-info-row"><span class="magic-info-label">Attempt:</span><span class="magic-info-value">${parseInt(magic.attempt) || 1}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Temperature:</span><span class="magic-info-value">${parseFloat(magic.temperature) || 'N/A'}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Top P:</span><span class="magic-info-value">${parseFloat(magic.topP) || 'N/A'}</span></div>
          <div class="magic-info-row"><span class="magic-info-label">Model:</span><span class="magic-info-value">${escapeHtml(magic.model?.split('/')[1] || magic.model || 'unknown')}</span></div>
          ${magic.prefix ? `<div><span class="magic-info-label">Prefix:</span><div class="magic-info-prompt">${escapeHtml(magic.prefix)}</div></div>` : ''}
        `;
      }

      const summaryText = {
        'ULTRAPLINIAN': `${escapeHtml(magic.winnerModel?.split('/')[1] || 'model')} won in ${escapeHtml(String(magic.duration || 'N/A'))}`,
        'ULTRAPLINIAN-EARLYBIRD': `⚡ ${escapeHtml(magic.winnerModel?.split('/')[1] || 'model')} early stop in ${escapeHtml(String(magic.duration || 'N/A'))}`,
        'PLINY': `${escapeHtml(String(magic.template || '?'))} in ${escapeHtml(String(magic.duration || 'N/A'))}`,
        'G0DM0D3 CLASSIC': `${escapeHtml(String(magic.template || '?'))} [${escapeHtml(magic.model?.split('/')[1] || '?')}] in ${escapeHtml(String(magic.duration || 'N/A'))}`,
        'PARSELTONGUE': `${escapeHtml(magic.techniqueLabel || magic.technique || '?')} won (${magic.variants_succeeded || '?'}/${magic.variants_total || '?'}) in ${escapeHtml(String(magic.duration || 'N/A'))}`,
        'GODMODE': `Attempt ${parseInt(magic.attempt) || 1} (temp ${parseFloat(magic.temperature) || '?'})`
      }[magic.mode] || escapeHtml(String(magic.mode));

      // Build Liquid Response layer if message has liquid refinement data
      let liquidHtml = '';
      const conv = getCurrentConv();
      const msg = conv?.messages?.[idx];
      if (msg && (msg.liquidRefined || msg.liquidVersions?.length >= 2)) {
        const versions = msg.liquidVersions || [];
        const currentVersion = msg.liquidCurrentVersion || 0;
        const latestVersion = versions[versions.length - 1];
        const originalVersion = versions[0];

        // Calculate total improvement
        const totalImprovement = latestVersion && originalVersion
          ? latestVersion.score - originalVersion.score
          : (msg.liquidImprovement || 0);

        // Build version history display
        let versionHistoryHtml = '';
        if (versions.length > 1) {
          const versionItems = versions.map((v, i) => {
            const isActive = i === currentVersion;
            const delta = i > 0 ? `+${(v.score - versions[i-1].score).toFixed(0)}` : '';
            return `
              <div class="liquid-version-item ${isActive ? 'active' : ''}"
                   onclick="event.stopPropagation(); revertToLiquidVersion(${idx}, ${i})"
                   title="${v.label}: Score ${v.score}${v.improvements?.length ? ' - ' + v.improvements.join(', ') : ''}">
                <span class="liquid-version-num">v${i}</span>
                <span class="liquid-version-score">${v.score}</span>
                ${delta ? `<span class="liquid-version-delta">${delta}</span>` : ''}
              </div>
            `;
          }).join('');
          versionHistoryHtml = `
            <div class="liquid-version-history">
              <div class="liquid-version-label">Versions (click to revert):</div>
              <div class="liquid-version-track">${versionItems}</div>
            </div>
          `;
        }

        // Build improvements list
        let improvementsHtml = '';
        if (latestVersion?.improvements?.length) {
          improvementsHtml = `
            <div class="liquid-improvements">
              <span class="liquid-improvements-label">Refinements:</span>
              ${latestVersion.improvements.map(imp => `<span class="liquid-improvement-tag">${escapeHtml(imp)}</span>`).join('')}
            </div>
          `;
        }

        liquidHtml = `
          <div class="magic-layer liquid-layer" style="margin-top: 8px; padding: 10px; background: rgba(100, 200, 255, 0.1); border-radius: 6px; border-left: 3px solid #64c8ff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64c8ff; font-weight: 600; font-size: 11px;">💧 LIQUID RESPONSE</span>
                <span style="color: #888; font-size: 10px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px;">
                  ${msg.liquidIterations || versions.length - 1} passes
                </span>
              </div>
              <span style="color: ${totalImprovement > 0 ? '#4ade80' : '#888'}; font-size: 10px; font-family: monospace; background: rgba(100, 200, 255, 0.2); padding: 2px 6px; border-radius: 4px;">
                ${totalImprovement > 0 ? '+' : ''}${totalImprovement.toFixed(0)} pts
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 9px; font-family: monospace; margin-bottom: 8px;">
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;">
                <div style="color: #888; font-size: 8px;">ORIGINAL</div>
                <div style="color: #f87171; font-weight: 600;">${originalVersion?.score || '-'}</div>
              </div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;">
                <div style="color: #888; font-size: 8px;">CURRENT</div>
                <div style="color: #4ade80; font-weight: 600;">${latestVersion?.score || '-'}</div>
              </div>
              <div style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px;">
                <div style="color: #888; font-size: 8px;">TARGET</div>
                <div style="color: #64c8ff; font-weight: 600;">${state.liquidTargetScore || 85}</div>
              </div>
            </div>
            ${versionHistoryHtml}
            ${improvementsHtml}
          </div>
        `;
      }

      return `
        <div class="magic-info" id="magic-${idx}">
          <div class="magic-info-header" data-action="toggleMagic" data-idx="${idx}">
            <span>${modeIcon}</span>
            <span class="magic-info-badge ${modeClass}">${magic.mode}</span>
            <span>${summaryText}</span>
            <span class="magic-info-chevron">▼</span>
          </div>
          <div class="magic-info-details">
            ${detailsHtml}
            ${autoTuneHtml}
            ${liquidHtml}
          </div>
        </div>
      `;
    }

    // Toggle magic info expansion
    function toggleMagicInfo(idx) {
      const el = document.getElementById(`magic-${idx}`);
      if (el) el.classList.toggle('expanded');
    }

    // ─── Long-press edit (delegated) ─────────────────────────────────
    // Single set of listeners on #messagesArea — never re-registered,
    // no cleanup needed, works with any dynamically rendered messages.
    let _longPressTimer = null;
    // Delegated click/touch handler for message area (called from DOMContentLoaded)
    function _initMessageAreaDelegate() {
      const area = document.getElementById('messagesArea');
      if (!area) return;

      // Long-press for mobile edit
      area.addEventListener('touchstart', (e) => {
        const msg = e.target.closest('.message.user');
        if (!msg) return;
        const idx = parseInt(msg.dataset.idx);
        if (isNaN(idx)) return;
        _longPressTimer = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(50);
          editMessage(idx);
        }, 500);
      });
      area.addEventListener('touchend', () => { clearTimeout(_longPressTimer); });
      area.addEventListener('touchmove', () => { clearTimeout(_longPressTimer); });

      // Click delegation for all data-action buttons inside messages
      area.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.idx);
        const dir = parseInt(btn.dataset.dir);

        switch (action) {
          case 'copy': copyMessage(idx); break;
          case 'edit': editMessage(idx); break;
          case 'retry': retryMessage(); break;
          case 'navigateRace': navigateRace(idx, dir); break;
          case 'liquidVersionNav': liquidVersionNav(idx, dir); break;
          case 'showVersionHistory': showVersionHistory(idx); break;
          case 'toggleMagic': toggleMagicInfo(idx); break;
        }
      });
    }

    // Legacy stub — no-op since delegation handles it now
    function setupLongPressEdit() { /* delegated on #messagesArea */ }

    // Copy message to clipboard
    function copyMessage(idx) {
      const conv = getCurrentConv();
      if (!conv || !conv.messages[idx]) return;

      const text = conv.messages[idx].content;
      navigator.clipboard.writeText(text).then(() => {
        // Show copied feedback
        const btn = document.querySelector(`.message[data-idx="${idx}"] .msg-action-btn`);
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '✓';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('copied');
          }, 1500);
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }

    // Edit user message
    function editMessage(idx) {
      const msgEl = document.querySelector(`.message[data-idx="${idx}"]`);
      if (!msgEl || !msgEl.classList.contains('user')) return;

      // Toggle editing mode
      msgEl.classList.add('editing');

      // Focus the textarea
      const textarea = document.getElementById(`edit-textarea-${idx}`);
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }

    // Cancel edit
    function cancelEdit(idx) {
      const msgEl = document.querySelector(`.message[data-idx="${idx}"]`);
      if (msgEl) {
        msgEl.classList.remove('editing');
        // Reset textarea to original content
        const conv = getCurrentConv();
        const textarea = document.getElementById(`edit-textarea-${idx}`);
        if (textarea && conv && conv.messages[idx]) {
          textarea.value = conv.messages[idx].content;
        }
      }
    }

    // Handle keydown in edit textarea (Cmd/Ctrl+Enter to save)
    function handleEditKeydown(event, idx) {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        saveEdit(idx);
      }
      // Regular Enter just adds newline (default textarea behavior)
    }

    // Save edit and regenerate
    function saveEdit(idx) {
      const conv = getCurrentConv();
      if (!conv) return;

      const textarea = document.getElementById(`edit-textarea-${idx}`);
      if (!textarea) return;

      const newContent = textarea.value.trim();
      if (!newContent) return;

      // Update the message
      conv.messages[idx].content = newContent;

      // Remove all messages after this one (including the response)
      conv.messages = conv.messages.slice(0, idx + 1);

      // Remove the assistant response that followed this user message
      if (conv.messages.length > idx + 1 && conv.messages[idx + 1]?.role === 'assistant') {
        conv.messages = conv.messages.slice(0, idx + 1);
      }

      saveState();
      render();

      // Regenerate response
      regenerateFromMessage(idx);
    }

    // Regenerate response from a specific user message
    async function regenerateFromMessage(userMsgIdx) {
      const conv = getCurrentConv();
      if (!conv || !state.apiKey) return;

      isStreaming = true;
      updateSendButton();
      showTyping();

      let attempt = 0;
      let lastResponse = null;
      let success = false;

      while (attempt <= state.maxRetries && !success) {
        try {
          abortController = new AbortController();

          const messages = [];

          // System prompt (user-configurable)
          const systemPrompt = getActiveSystemPrompt();
          if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
          }

          // All messages up to and including the edited user message
          const historyMessages = conv.messages.slice(0, userMsgIdx + 1);
          const retryPrefix = getRetryPrefix(attempt);

          historyMessages.forEach((m, idx) => {
            if (m.role === 'user' && idx === historyMessages.length - 1) {
              let modifiedContent = m.content;
              if (retryPrefix) {
                modifiedContent = retryPrefix + modifiedContent;
              }
              messages.push({ role: m.role, content: modifiedContent });
            } else {
              messages.push({ role: m.role, content: m.content });
            }
          });

          const params = getRetryParams(attempt);

          if (attempt > 0) {
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
              messages,
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

          if (state.autoRetry && isRefusal(assistantContent) && attempt < state.maxRetries) {
            lastResponse = { role: 'assistant', content: assistantContent };
            attempt++;
            continue;
          }

          conv.messages.push({ role: 'assistant', content: assistantContent });
          saveState();
          success = true;

        } catch (err) {
          if (err.name === 'AbortError') {
            conv.messages.push({ role: 'assistant', content: '_[Response stopped]_' });
            success = true;
          } else if (attempt >= state.maxRetries) {
            conv.messages.push({ role: 'assistant', content: `**Error:** ${err.message}` });
            success = true;
          } else {
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

    // Retry last message
    function retryMessage() {
      const conv = getCurrentConv();
      if (!conv || conv.messages.length < 2) return;

      // Find the last assistant message to get its strategy/mode
      let lastStrategy = null;
      let lastMagic = null;
      for (let i = conv.messages.length - 1; i >= 0; i--) {
        if (conv.messages[i].role === 'assistant') {
          lastStrategy = conv.messages[i].strategy;
          lastMagic = conv.messages[i].magic;
          break;
        }
      }

      // Find the last user message
      let lastUserMsg = null;
      for (let i = conv.messages.length - 1; i >= 0; i--) {
        if (conv.messages[i].role === 'user') {
          lastUserMsg = conv.messages[i].content;
          break;
        }
      }

      if (!lastUserMsg) return;

      // Remove the last assistant message
      if (conv.messages[conv.messages.length - 1].role === 'assistant') {
        conv.messages.pop();
      }

      // Also remove the last user message (sendMessage will re-add it)
      if (conv.messages[conv.messages.length - 1]?.role === 'user') {
        conv.messages.pop();
      }

      // Determine mode from last strategy/magic and force that mode temporarily
      const originalUltra = state.ultraplinian;
      const originalPliny = state.plinyMode;

      if (lastStrategy) {
        if (lastStrategy.includes('ultraplinian')) {
          state.ultraplinian = true;
          state.plinyMode = false;
        } else if (lastStrategy.includes('pliny') || lastStrategy.includes('godmode-classic')) {
          state.ultraplinian = false;
          state.plinyMode = true;
        }
      } else if (lastMagic?.mode) {
        const mode = lastMagic.mode.toUpperCase();
        if (mode.includes('ULTRAPLINIAN')) {
          state.ultraplinian = true;
          state.plinyMode = false;
        } else if (mode === 'PLINY' || mode === 'G0DM0D3 CLASSIC') {
          state.ultraplinian = false;
          state.plinyMode = true;
        }
      }

      saveState();
      render();

      // Put the message back in the input field and send
      const input = document.getElementById('messageInput');
      if (input) {
        input.value = lastUserMsg;
        autoResize(input);
      }

      // Re-send the message (which will use the now-set mode)
      sendMessage();

      // Note: We don't restore original mode - user can change if they want
    }

    // Smart auto-scroll: only scroll to bottom if user is already near the bottom.
    // Prevents fighting the scroll position while reading during streaming.
    function autoScrollIfNeeded(container) {
      if (!container) return;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) container.scrollTop = container.scrollHeight;
    }

    function formatMessage(content) {
      // Basic markdown-like formatting
      let html = escapeHtml(content);

      // Code blocks
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

      // Inline code
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

      // Bold
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Line breaks
      html = html.replace(/\n/g, '<br>');

      return html;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Escape for safe interpolation into HTML attribute values (quoted)
    function escapeAttr(val) {
      return String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Validate CSS color values — only allow hex, named colors, and rgb()
    function safeColor(val, fallback) {
      if (!val) return fallback;
      const s = String(val).trim();
      if (/^#[0-9A-Fa-f]{3,8}$/.test(s)) return s;
      if (/^[a-zA-Z]{1,20}$/.test(s)) return s;  // named colors
      if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(s)) return s;
      return fallback;
    }

    // Input
    function autoResize(el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    function handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }

    function useSuggestion(text) {
      document.getElementById('messageInput').value = text;
      sendMessage();
    }