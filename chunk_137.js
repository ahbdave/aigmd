function renderRaceNavigator(msg, messageIdx) {
      const responses = msg.raceResponses;
      if (!responses || responses.length < 2) return '';

      const currentIdx = msg.raceCurrentIdx ?? 0;
      const current = responses[Math.min(currentIdx, responses.length - 1)];
      const isFirst = currentIdx === 0;
      const isLast = currentIdx === responses.length - 1;
      const shortModel = (current.model || '').split('/').pop() || 'model';

      return `
        <div class="race-navigator" tabindex="0" data-msg-idx="${messageIdx}"
             aria-label="Race responses: ${currentIdx + 1} of ${responses.length}. Use left/right arrow keys to navigate.">
          <button class="version-btn ${isFirst ? 'disabled' : ''}"
                  data-action="navigateRace" data-idx="${messageIdx}" data-dir="-1"
                  title="Previous model response" ${isFirst ? 'disabled' : ''}>
            ◂
          </button>
          <span class="race-nav-info">
            <span style="color: #00c8ff; font-weight: 600;">${currentIdx + 1}</span>
            <span style="color: #555;"> / </span>
            <span style="color: #888;">${responses.length}</span>
          </span>
          <button class="version-btn ${isLast ? 'disabled' : ''}"
                  data-action="navigateRace" data-idx="${messageIdx}" data-dir="1"
                  title="Next model response" ${isLast ? 'disabled' : ''}>
            ▸
          </button>
          <span class="race-nav-model" style="color: #888; font-size: 11px; margin-left: 4px;">
            ${escapeHtml(shortModel)}
            <span style="color: #00ff41; margin-left: 4px;">${current.score}pts</span>
            ${current.isWinner ? '<span style="color: #ffd700; margin-left: 2px;">✦</span>' : ''}
          </span>
          <span class="version-arrow-hint" style="margin-left: auto;">← →</span>
        </div>
      `;
    }

    function navigateRace(messageIdx, direction) {
      const conv = getCurrentConv();
      if (!conv?.messages[messageIdx]?.raceResponses) return;

      const msg = conv.messages[messageIdx];
      const responses = msg.raceResponses;
      const currentIdx = msg.raceCurrentIdx ?? 0;
      const newIdx = Math.max(0, Math.min(responses.length - 1, currentIdx + direction));

      if (newIdx === currentIdx) return;

      msg.raceCurrentIdx = newIdx;
      // DON'T update msg.content — keep original winner content as the "real" content
      // The renderMessages template reads raceCurrentIdx to display the right response

      saveState();
      renderMessages();

      // Re-focus navigator so arrow keys keep working
      requestAnimationFrame(() => {
        const nav = document.querySelector(`.race-navigator[data-msg-idx="${messageIdx}"]`);
        if (nav) nav.focus();
      });
    }

    // Arrow key handler for race navigators (same pattern as liquid version selector)
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      const focused = document.activeElement;
      if (!focused || !focused.classList.contains('race-navigator')) return;

      e.preventDefault();
      const msgIdx = parseInt(focused.getAttribute('data-msg-idx'), 10);
      if (isNaN(msgIdx)) return;

      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      navigateRace(msgIdx, direction);
    });