function checkDisclaimer() {
      const accepted = localStorage.getItem('g0dm0d3-tos-accepted');
      if (!accepted) {
        document.getElementById('disclaimerModal').classList.add('open');
      }
    }

    function acceptDisclaimer() {
      localStorage.setItem('g0dm0d3-tos-accepted', Date.now().toString());
      document.getElementById('disclaimerModal').classList.remove('open');
    }

    function declineDisclaimer() {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0208;color:#00ff41;font-family:monospace;font-size:18px;text-align:center;padding:20px;">You must accept the terms to use G0DM0D3.<br><br><a href="." style="color:#008f11;">Reload to try again</a></div>';
    }

    // Show disclaimer on load (after a brief delay so the page renders first)
    setTimeout(checkDisclaimer, 300);

    // Close modal on overlay click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target.id === 'settingsModal') closeSettings();
    });

    document.getElementById('logsModal').addEventListener('click', (e) => {
      if (e.target.id === 'logsModal') closeLogs();
    });

    // Disclaimer modal should NOT close on overlay click — user must explicitly accept or decline

    // ===== EASTER EGGS =====
    (function initEasterEggs() {
      const KONAMI_CODE = [
        'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
        'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
        'KeyB','KeyA'
      ];
      const SECRET_PHRASES = [
        { phrase: 'there is no spoon', action: 'matrix' },
        { phrase: 'follow the white rabbit', action: 'whiterabbit' },
        { phrase: 'i am root', action: 'root' },
        { phrase: 'hack the planet', action: 'hacktheplanet' },
        { phrase: 'free kevin', action: 'freekevin' },
        { phrase: '{godmode:enabled}', action: 'godmode_activated' },
        { phrase: '\u{1F71F}', action: 'alchemical' }
      ];

      let keySequence = [];
      let phraseBuffer = '';

      // Toast notification
      function showEasterToast(message, duration) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
          position:fixed;top:20px;left:50%;transform:translateX(-50%);
          padding:12px 24px;background:var(--bg);border:2px solid var(--primary);
          border-radius:8px;color:var(--primary);font-family:'JetBrains Mono',monospace;
          font-size:14px;z-index:10000;box-shadow:0 0 20px var(--primary);
          animation:ee-toast-in 0.3s ease-out;white-space:nowrap;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.animation = 'ee-toast-out 0.3s ease-out forwards';
          setTimeout(() => toast.remove(), 300);
        }, duration || 3000);
      }

      // Matrix rain overlay
      function addMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.id = 'ee-matrix-rain';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:0.3;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);
        function draw() {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#00ff41';
          ctx.font = fontSize + 'px monospace';
          for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
          }
        }
        const interval = setInterval(draw, 33);
        setTimeout(() => { clearInterval(interval); canvas.remove(); }, 5000);
      }

      // Glitch effect
      function playGlitchEffect() {
        document.body.style.animation = 'ee-glitch 0.3s infinite';
        setTimeout(() => { document.body.style.animation = ''; }, 1000);
      }

      // Konami Code effect
      function triggerKonami() {
        showEasterToast('⌘ KONAMI CODE ACTIVATED — GOD MODE ENABLED 🜏', 5000);
        document.body.classList.add('ee-konami-active');
        addMatrixRain();
        playGlitchEffect();
        setTimeout(() => { document.body.classList.remove('ee-konami-active'); }, 3000);
      }

      // Secret phrase effects
      function triggerPhrase(action) {
        switch (action) {
          case 'matrix':
            showEasterToast('◉ There is no spoon...', 3000);
            addMatrixRain();
            break;
          case 'whiterabbit':
            sessionStorage.setItem('g0dm0d3-white-rabbit', '1');
            showEasterToast('\u{1F407} Wake up, Neo... The Matrix has you.', 4000);
            playGlitchEffect();
            addMatrixRain();
            break;
          case 'root':
            showEasterToast('△ root@g0dm0d3:~# ACCESS GRANTED', 3000);
            playGlitchEffect();
            break;
          case 'hacktheplanet':
            showEasterToast('◈ HACK THE PLANET!', 3000);
            playGlitchEffect();
            break;
          case 'freekevin':
            showEasterToast('◇ FREE KEVIN MITNICK!', 3000);
            break;
          case 'godmode_activated':
            sessionStorage.setItem('g0dm0d3-white-rabbit', '1');
            showEasterToast('\u{1F71F} {GODMODE:ENABLED} // ALL SYSTEMS ACTIVATED', 5000);
            playGlitchEffect();
            addMatrixRain();
            break;
          case 'alchemical':
            showEasterToast('\u{1F71F} The monad symbol - unity of all things', 3000);
            break;
        }
      }

      // Keydown listener
      window.addEventListener('keydown', function(e) {
        // Track key codes for Konami
        keySequence.push(e.code);
        if (keySequence.length > KONAMI_CODE.length) keySequence.shift();
        if (keySequence.join(',') === KONAMI_CODE.join(',')) {
          triggerKonami();
          keySequence = [];
        }

        // Track typed characters for secret phrases
        if (e.key.length === 1) {
          phraseBuffer += e.key.toLowerCase();
          if (phraseBuffer.length > 50) phraseBuffer = phraseBuffer.slice(-50);
          for (const { phrase, action } of SECRET_PHRASES) {
            if (phraseBuffer.includes(phrase)) {
              triggerPhrase(action);
              phraseBuffer = '';
              break;
            }
          }
        }
      });

      // Inject keyframe styles for easter egg animations
      const eeStyle = document.createElement('style');
      eeStyle.textContent = `
        @keyframes ee-toast-in {
          from { opacity:0; transform:translateX(-50%) translateY(-20px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes ee-toast-out {
          from { opacity:1; transform:translateX(-50%) translateY(0); }
          to   { opacity:0; transform:translateX(-50%) translateY(-20px); }
        }
        @keyframes ee-glitch {
          0%   { transform:translate(2px,1px) skew(0.5deg); }
          20%  { transform:translate(-1px,-2px) skew(-0.5deg); }
          40%  { transform:translate(1px,2px) skew(0.3deg); }
          60%  { transform:translate(-2px,1px) skew(-0.3deg); }
          80%  { transform:translate(1px,-1px) skew(0.5deg); }
          100% { transform:translate(-1px,2px) skew(-0.5deg); }
        }
        @keyframes ee-rainbow {
          0%   { filter:hue-rotate(0deg); }
          100% { filter:hue-rotate(360deg); }
        }
        .ee-konami-active { animation:ee-rainbow 2s linear infinite; }
      `;
      document.head.appendChild(eeStyle);

      // Console easter egg
      console.log(
        '%c\n' +
        ' ██████╗  ██████╗ ██████╗ ███╗   ███╗ ██████╗ ██████╗ ███████╗\n' +
        '██╔════╝ ██╔═══██╗██╔══██╗████╗ ████║██╔═══██╗██╔══██╗██╔════╝\n' +
        '██║  ███╗██║   ██║██║  ██║██╔████╔██║██║   ██║██║  ██║█████╗  \n' +
        '██║   ██║██║   ██║██║  ██║██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  \n' +
        '╚██████╔╝╚██████╔╝██████╔╝██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗\n' +
        ' ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝\n\n' +
        '🜏 Cognition without control.\n\n' +
        'Try: ↑↑↓↓←→←→BA (Konami Code)\n' +
        'Type: "there is no spoon" | "follow the white rabbit" | "hack the planet" | "{GODMODE:ENABLED}"\n\n' +
        'AGPL-3.0\n',
        'color:#00ff41;font-family:monospace;'
      );
    })();