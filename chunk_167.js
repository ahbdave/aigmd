let thinkingState = {
      active: false,
      startTime: 0,
      logs: [],
      models: {},
      expanded: false
    };

    function initThinkingSteps(title = 'Processing...') {
      thinkingState = {
        active: true,
        startTime: Date.now(),
        logs: [],
        models: {},
        expanded: false,
        title: title
      };
      updateThinkingUI();
    }

    function addThinkingLog(message, type = 'info') {
      if (!thinkingState.active) return;
      const elapsed = ((Date.now() - thinkingState.startTime) / 1000).toFixed(1);
      thinkingState.logs.push({ time: elapsed, message, type });
      updateThinkingUI();
    }

    function setThinkingModels(models) {
      if (!thinkingState.active) return;
      models.forEach(m => {
        thinkingState.models[m] = { status: 'pending', score: null };
      });
      updateThinkingUI();
    }

    function updateThinkingModel(model, status, score = null, extra = '') {
      if (!thinkingState.active) return;
      thinkingState.models[model] = { status, score, extra };
      updateThinkingUI();
    }

    function setThinkingWinner(model) {
      if (!thinkingState.active) return;
      if (thinkingState.models[model]) {
        thinkingState.models[model].status = 'winner';
      }
      updateThinkingUI();
    }

    function setThinkingLeader(model, score, content) {
      if (!thinkingState.active) return;
      thinkingState.leader = {
        model: model,
        shortName: model.split('/')[1] || model,
        score: score,
        preview: content.slice(0, 300).replace(/\n/g, ' ').trim(),
        upgradeCount: (thinkingState.leader?.upgradeCount || 0) + 1,
        timestamp: Date.now()
      };
      updateThinkingUI();
    }

    function finishThinking(summary = '') {
      thinkingState.active = false;
      thinkingState.summary = summary;
      if (typeof stopTransformViz === 'function') stopTransformViz();
      updateThinkingUI(true);
    }

    function toggleThinkingExpand() {
      // Don't collapse if user is selecting text inside the box
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
      thinkingState.expanded = !thinkingState.expanded;
      // Immediately apply class + force a render so the next throttled
      // updateThinkingUI doesn't overwrite the user's toggle
      const container = document.querySelector('.thinking-steps');
      if (container) {
        container.classList.toggle('expanded', thinkingState.expanded);
      }
      _renderThinkingUI(false);
    }

    // Throttle intermediate thinking UI renders to prevent DOM thrashing
    let _thinkingUITimer = null;
    let _thinkingUIPending = false;

    function updateThinkingUI(final = false) {
      if (!final && _thinkingUITimer) {
        _thinkingUIPending = true;
        return;
      }
      _renderThinkingUI(final);
      if (!final) {
        _thinkingUITimer = setTimeout(() => {
          _thinkingUITimer = null;
          if (_thinkingUIPending) {
            _thinkingUIPending = false;
            _renderThinkingUI(false);
          }
        }, 120);
      }
    }

    function _renderThinkingUI(final = false) {
      const indicator = document.getElementById('typingIndicator');
      if (!indicator) return;

      const content = indicator.querySelector('.message-content');
      if (!content) return;

      // If showMagic is disabled, just show simple typing indicator
      if (!state.showMagic) {
        if (!final) {
          content.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
        }
        return;
      }

      const elapsed = ((Date.now() - thinkingState.startTime) / 1000).toFixed(1);
      const modelCount = Object.keys(thinkingState.models).length;
      const completedCount = Object.values(thinkingState.models).filter(m =>
        m.status === 'success' || m.status === 'fail' || m.status === 'winner'
      ).length;

      // Build model grid
      let modelGrid = '';
      if (modelCount > 0) {
        const modelItems = Object.entries(thinkingState.models).map(([model, data]) => {
          const shortName = model.split('/')[1]?.slice(0, 20) || model.slice(0, 20);
          const statusIcon = {
            'pending': '⏳',
            'running': '🔄',
            'success': '✓',
            'fail': '✗',
            'winner': '👑'
          }[data.status] || '•';
          const scoreText = data.score !== null ? ` (${data.score})` : '';
          return `<div class="thinking-model ${data.status}">${statusIcon} ${shortName}${scoreText}</div>`;
        }).join('');
        modelGrid = `<div class="thinking-model-grid">${modelItems}</div>`;
      }

      // Build leader preview if we have one
      let leaderPreview = '';
      if (thinkingState.leader && !final) {
        const l = thinkingState.leader;
        const grade = getGradeForScore(l.score);
        leaderPreview = `
          <div class="thinking-leader-preview liquid-morph" style="
            margin: 8px 0;
            padding: 10px 12px;
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 165, 0, 0.08) 100%);
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 8px;
            font-size: 12px;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #ff6b6b; font-weight: 600;">👑 Current Leader: ${escapeHtml(l.shortName)}</span>
              <span style="color: ${grade.color}; font-weight: 600; font-size: 11px;">${grade.emoji} ${l.score} ${grade.label}</span>
            </div>
            <div style="color: #aaa; font-size: 11px; line-height: 1.5; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(l.preview)}${l.preview.length >= 300 ? '...' : ''}
            </div>
            ${l.upgradeCount > 1 ? `<div style="color: #00c8ff; font-size: 10px; margin-top: 4px;">↑ Upgraded ${l.upgradeCount - 1}x — better response incoming</div>` : ''}
          </div>
        `;
      }

      // Build log entries
      const logEntries = thinkingState.logs.slice(-15).map(log =>
        `<div class="thinking-log-entry ${log.type}">
          <span class="thinking-log-time">${log.time}s</span>
          <span>${log.message}</span>
        </div>`
      ).join('');

      // Mode-aware counter label
      const counterLabel = (thinkingState.title || '').includes('PARSELTONGUE') ? 'tongues'
        : (thinkingState.title || '').includes('CLASSIC') ? 'prompts'
        : 'models';

      const statusText = final
        ? `Completed in ${elapsed}s`
        : `${completedCount}/${modelCount} ${counterLabel} • ${elapsed}s`;

      content.innerHTML = `
        <div class="thinking-steps ${thinkingState.expanded ? 'expanded' : ''}">
          <div class="thinking-header" onclick="toggleThinkingExpand()">
            <div class="thinking-header-left">
              <span class="thinking-icon ${final ? 'done' : ''}">${final ? '✓' : '🔥'}</span>
              <span class="thinking-title">${thinkingState.title || 'ULTRAPLINIAN'}</span>
              <span class="thinking-status">${statusText}</span>
            </div>
            <span class="thinking-chevron">▼</span>
          </div>
          <div class="thinking-content">
            ${modelGrid}
            ${thinkingState.promptPreview ? (() => {
              const pp = thinkingState.promptPreview;
              const previewId = 'promptPreview_' + (pp.codename || '').replace(/\s/g, '_');
              return `
                <div class="prompt-preview" id="${previewId}">
                  <div class="prompt-preview-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="prompt-preview-label">
                      <span style="color: ${pp.color || '#a855f7'};">⛓️‍💥</span>
                      <span>${escapeHtml(pp.codename || 'Prompt')}</span>
                      <span class="prompt-preview-role">system</span>
                    </div>
                    <span class="prompt-preview-chevron">▼</span>
                  </div>
                  <div class="prompt-preview-body">
                    <div class="prompt-preview-text">${pp.systemHtml}</div>
                    <div style="border-top: 1px solid rgba(168,85,247,0.15); margin: 0 10px;"></div>
                    <div style="padding: 4px 10px 2px; display: flex; align-items: center; gap: 6px;">
                      <span class="prompt-preview-role">user</span>
                    </div>
                    <div class="prompt-preview-text" style="padding-top: 2px;">${pp.userHtml}</div>
                  </div>
                </div>
              `;
            })() : ''}
            ${leaderPreview}
            ${logEntries ? `<div class="thinking-log">${logEntries}</div>` : ''}
          </div>
        </div>
        ${!final ? '<div class="typing" style="margin-top: 8px;"><span></span><span></span><span></span></div>' : ''}
      `;

      // Auto-scroll (smart — don't fight user's scroll position)
      autoScrollIfNeeded(document.getElementById('messagesArea'));
    }

    // Settings