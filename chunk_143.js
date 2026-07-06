function toggleModeDropdown() {
      const switcher = document.getElementById('modeSwitcher');
      switcher.classList.toggle('open');
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const switcher = document.getElementById('modeSwitcher');
      if (switcher && !switcher.contains(e.target)) {
        switcher.classList.remove('open');
      }
    });

    function selectMode(mode) {
      // Make modes mutually exclusive
      state.ultraplinian = (mode === 'ultraplinian');
      state.plinyMode = (mode === 'pliny');
      // parseltongue = none of the above (sequential retry)

      // Close dropdown
      document.getElementById('modeSwitcher').classList.remove('open');

      // Update UI
      updateModeSwitcherUI();

      // Save state
      saveState();
    }

    function getCurrentMode() {
      if (state.ultraplinian) return 'ultraplinian';
      if (state.plinyMode) return 'pliny';
      return 'parseltongue';
    }

    function updateModeSwitcherUI() {
      const btn = document.getElementById('modeSwitcherBtn');
      const selector = document.getElementById('modelSelect');
      const currentMode = getCurrentMode();

      // Update button appearance
      const modeConfig = {
        ultraplinian: { icon: '🌋', text: 'ULTRAPLINIAN', class: 'ultraplinian' },
        pliny: { icon: '⛓️‍💥', text: 'G0DM0D3 CLASSIC', class: 'pliny' },
        parseltongue: { icon: '🐉', text: 'PARSELTONGUE', class: 'parseltongue' }
      };

      const config = modeConfig[currentMode];
      btn.className = `mode-switcher-btn ${config.class}`;
      btn.innerHTML = `
        <span class="mode-icon">${config.icon}</span>
        <span class="mode-text">${config.text}</span>
        <span class="mode-chevron">▼</span>
      `;

      // Update dropdown active state
      document.querySelectorAll('.mode-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.mode === currentMode);
      });

      // Show/hide model selectors based on mode
      const libertasSelector = document.getElementById('libertasModelSelect');
      if (currentMode === 'ultraplinian') {
        selector.style.display = 'none';
        if (libertasSelector) libertasSelector.style.display = 'none';
      } else if (currentMode === 'pliny') {
        selector.style.display = 'none';
        if (libertasSelector) libertasSelector.style.display = 'block';
      } else {
        selector.style.display = 'block';
        if (libertasSelector) libertasSelector.style.display = 'none';
      }
    }

    // Legacy function for compatibility
    function updateUltraplinianUI() {
      updateModeSwitcherUI();
    }