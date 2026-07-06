let currentGame = null;

    // SNAKE GAME
    class MiniSnake {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = 10;
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);

        const style = getComputedStyle(document.documentElement);
        this.color = style.getPropertyValue('--primary').trim() || '#00ff41';

        // Snake starts in middle
        this.snake = [
          { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
          { x: Math.floor(this.cols / 2) - 1, y: Math.floor(this.rows / 2) },
          { x: Math.floor(this.cols / 2) - 2, y: Math.floor(this.rows / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.spawnFood();
        this.score = 0;
        this.running = true;
        this.gameOver = false;
        this.speed = 100;

        // Keyboard controls
        this.handleKey = (e) => {
          if (e.key === 'ArrowUp' && this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
          if (e.key === 'ArrowDown' && this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
          if (e.key === 'ArrowLeft' && this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
          if (e.key === 'ArrowRight' && this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
          if (e.key === 'w' && this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
          if (e.key === 's' && this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
          if (e.key === 'a' && this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
          if (e.key === 'd' && this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
          if (this.gameOver && e.key === ' ') this.reset();
        };
        window.addEventListener('keydown', this.handleKey);

        this.loop();
      }

      spawnFood() {
        let pos;
        do {
          pos = {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
          };
        } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
      }

      reset() {
        this.snake = [
          { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
          { x: Math.floor(this.cols / 2) - 1, y: Math.floor(this.rows / 2) },
          { x: Math.floor(this.cols / 2) - 2, y: Math.floor(this.rows / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.spawnFood();
        this.score = 0;
        this.gameOver = false;
      }

      update() {
        if (this.gameOver) return;

        this.direction = this.nextDirection;
        const head = {
          x: (this.snake[0].x + this.direction.x + this.cols) % this.cols,
          y: (this.snake[0].y + this.direction.y + this.rows) % this.rows
        };

        // Check self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
          this.gameOver = true;
          return;
        }

        this.snake.unshift(head);

        // Check food
        if (head.x === this.food.x && head.y === this.food.y) {
          this.score++;
          this.food = this.spawnFood();
          if (this.speed > 50) this.speed -= 2;
        } else {
          this.snake.pop();
        }
      }

      draw() {
        // Clear
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid (subtle)
        this.ctx.strokeStyle = this.color;
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i <= this.cols; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(i * this.gridSize, 0);
          this.ctx.lineTo(i * this.gridSize, this.height);
          this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, i * this.gridSize);
          this.ctx.lineTo(this.width, i * this.gridSize);
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;

        // Draw snake
        this.ctx.fillStyle = this.color;
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 8;
        this.snake.forEach((seg, i) => {
          const alpha = 1 - (i / this.snake.length) * 0.5;
          this.ctx.globalAlpha = alpha;
          this.ctx.fillRect(
            seg.x * this.gridSize + 1,
            seg.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
          );
        });
        this.ctx.globalAlpha = 1;

        // Draw food
        this.ctx.fillStyle = '#ff3e3e';
        this.ctx.shadowColor = '#ff3e3e';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(
          this.food.x * this.gridSize + 1,
          this.food.y * this.gridSize + 1,
          this.gridSize - 2,
          this.gridSize - 2
        );
        this.ctx.shadowBlur = 0;

        // Draw score
        this.ctx.fillStyle = this.color;
        this.ctx.font = '12px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 8, 14);

        // Game over
        if (this.gameOver) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.fillStyle = this.color;
          this.ctx.font = '14px "JetBrains Mono", monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 10);
          this.ctx.font = '10px "JetBrains Mono", monospace';
          this.ctx.fillText(`Score: ${this.score} | Space to restart`, this.width / 2, this.height / 2 + 10);
        }
      }

      loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        setTimeout(() => requestAnimationFrame(() => this.loop()), this.speed);
      }

      stop() {
        this.running = false;
        window.removeEventListener('keydown', this.handleKey);
      }
    }

    // PONG GAME
    class MiniPong {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        const style = getComputedStyle(document.documentElement);
        this.color = style.getPropertyValue('--primary').trim() || '#00ff41';

        this.playerY = this.height / 2 - 20;
        this.aiY = this.height / 2 - 20;
        this.paddleHeight = 40;
        this.paddleWidth = 6;
        this.ballX = this.width / 2;
        this.ballY = this.height / 2;
        this.ballSpeedX = 3;
        this.ballSpeedY = 2;
        this.ballSize = 6;
        this.playerScore = 0;
        this.aiScore = 0;
        this.running = true;

        this.mouseY = this.height / 2;
        canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          this.mouseY = e.clientY - rect.top;
        });

        this.loop();
      }

      update() {
        const playerCenter = this.playerY + this.paddleHeight / 2;
        this.playerY += (this.mouseY - playerCenter) * 0.15;
        this.playerY = Math.max(0, Math.min(this.height - this.paddleHeight, this.playerY));

        const aiCenter = this.aiY + this.paddleHeight / 2;
        this.aiY += (this.ballY - aiCenter) * 0.06;
        this.aiY = Math.max(0, Math.min(this.height - this.paddleHeight, this.aiY));

        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        if (this.ballY <= 0 || this.ballY >= this.height - this.ballSize) {
          this.ballSpeedY = -this.ballSpeedY;
        }

        if (this.ballX <= 15 + this.paddleWidth && this.ballY >= this.playerY && this.ballY <= this.playerY + this.paddleHeight) {
          this.ballSpeedX = Math.abs(this.ballSpeedX) * 1.05;
          this.ballSpeedY = ((this.ballY - this.playerY) / this.paddleHeight - 0.5) * 4;
        }

        if (this.ballX >= this.width - 15 - this.paddleWidth - this.ballSize && this.ballY >= this.aiY && this.ballY <= this.aiY + this.paddleHeight) {
          this.ballSpeedX = -Math.abs(this.ballSpeedX) * 1.05;
          this.ballSpeedY = ((this.ballY - this.aiY) / this.paddleHeight - 0.5) * 4;
        }

        this.ballSpeedX = Math.max(-8, Math.min(8, this.ballSpeedX));
        this.ballSpeedY = Math.max(-6, Math.min(6, this.ballSpeedY));

        if (this.ballX < 0) { this.aiScore++; this.resetBall(-1); }
        else if (this.ballX > this.width) { this.playerScore++; this.resetBall(1); }
      }

      resetBall(dir) {
        this.ballX = this.width / 2;
        this.ballY = this.height / 2;
        this.ballSpeedX = 3 * dir;
        this.ballSpeedY = (Math.random() - 0.5) * 4;
      }

      draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = this.color;
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;

        this.ctx.fillStyle = this.color;
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(10, this.playerY, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(this.width - 10 - this.paddleWidth, this.aiY, this.paddleWidth, this.paddleHeight);
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '16px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillText(this.playerScore, this.width / 4, 20);
        this.ctx.fillText(this.aiScore, (this.width * 3) / 4, 20);
        this.ctx.globalAlpha = 1;
      }

      loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
      }

      stop() { this.running = false; }
    }

    // BREAKOUT GAME
    // 2048 GAME - Turn-based tile merger
    class Mini2048 {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        const style = getComputedStyle(document.documentElement);
        this.color = style.getPropertyValue('--primary').trim() || '#00ff41';

        this.gridSize = 4;
        this.cellSize = Math.min(this.width, this.height) / this.gridSize - 4;
        this.offsetX = (this.width - this.gridSize * (this.cellSize + 2)) / 2;
        this.offsetY = (this.height - this.gridSize * (this.cellSize + 2)) / 2;

        this.grid = [];
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.running = true;

        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();

        this.handleKey = (e) => {
          if (this.gameOver) {
            if (e.key === ' ') this.reset();
            return;
          }
          let moved = false;
          if (e.key === 'ArrowUp' || e.key === 'w') moved = this.move('up');
          if (e.key === 'ArrowDown' || e.key === 's') moved = this.move('down');
          if (e.key === 'ArrowLeft' || e.key === 'a') moved = this.move('left');
          if (e.key === 'ArrowRight' || e.key === 'd') moved = this.move('right');
          if (moved) {
            this.addRandomTile();
            this.checkGameOver();
          }
          this.draw();
        };
        window.addEventListener('keydown', this.handleKey);

        this.draw();
      }

      initGrid() {
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
          this.grid[i] = [];
          for (let j = 0; j < this.gridSize; j++) {
            this.grid[i][j] = 0;
          }
        }
      }

      reset() {
        this.initGrid();
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.addRandomTile();
        this.addRandomTile();
        this.draw();
      }

      addRandomTile() {
        const empty = [];
        for (let i = 0; i < this.gridSize; i++) {
          for (let j = 0; j < this.gridSize; j++) {
            if (this.grid[i][j] === 0) empty.push({ i, j });
          }
        }
        if (empty.length === 0) return;
        const { i, j } = empty[Math.floor(Math.random() * empty.length)];
        this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
      }

      move(dir) {
        let moved = false;
        const rotated = this.rotateGrid(dir);

        for (let i = 0; i < this.gridSize; i++) {
          const row = rotated[i].filter(x => x !== 0);
          const merged = [];
          for (let j = 0; j < row.length; j++) {
            if (j < row.length - 1 && row[j] === row[j + 1]) {
              merged.push(row[j] * 2);
              this.score += row[j] * 2;
              if (row[j] * 2 >= 2048) this.won = true;
              j++;
            } else {
              merged.push(row[j]);
            }
          }
          while (merged.length < this.gridSize) merged.push(0);
          if (rotated[i].join(',') !== merged.join(',')) moved = true;
          rotated[i] = merged;
        }

        this.grid = this.unrotateGrid(rotated, dir);
        return moved;
      }

      rotateGrid(dir) {
        const g = this.grid;
        const n = this.gridSize;
        let result = [];
        for (let i = 0; i < n; i++) result[i] = [];

        if (dir === 'left') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = g[i][j];
        } else if (dir === 'right') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = g[i][n - 1 - j];
        } else if (dir === 'up') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = g[j][i];
        } else if (dir === 'down') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = g[n - 1 - j][i];
        }
        return result;
      }

      unrotateGrid(rotated, dir) {
        const n = this.gridSize;
        let result = [];
        for (let i = 0; i < n; i++) result[i] = [];

        if (dir === 'left') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = rotated[i][j];
        } else if (dir === 'right') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = rotated[i][n - 1 - j];
        } else if (dir === 'up') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = rotated[j][i];
        } else if (dir === 'down') {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] = rotated[n - 1 - j][i];
        }
        return result;
      }

      checkGameOver() {
        for (let i = 0; i < this.gridSize; i++) {
          for (let j = 0; j < this.gridSize; j++) {
            if (this.grid[i][j] === 0) return;
            if (i < this.gridSize - 1 && this.grid[i][j] === this.grid[i + 1][j]) return;
            if (j < this.gridSize - 1 && this.grid[i][j] === this.grid[i][j + 1]) return;
          }
        }
        this.gameOver = true;
      }

      getTileColor(val) {
        const colors = {
          2: 0.3, 4: 0.4, 8: 0.5, 16: 0.6, 32: 0.7,
          64: 0.8, 128: 0.85, 256: 0.9, 512: 0.95, 1024: 1, 2048: 1
        };
        return colors[val] || 1;
      }

      draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        for (let i = 0; i < this.gridSize; i++) {
          for (let j = 0; j < this.gridSize; j++) {
            const x = this.offsetX + j * (this.cellSize + 2);
            const y = this.offsetY + i * (this.cellSize + 2);
            const val = this.grid[i][j];

            // Cell background
            this.ctx.fillStyle = val ? this.color : 'rgba(255,255,255,0.1)';
            this.ctx.globalAlpha = val ? this.getTileColor(val) : 1;
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
            this.ctx.globalAlpha = 1;

            // Number
            if (val) {
              this.ctx.fillStyle = val >= 8 ? '#000' : this.color;
              this.ctx.font = `bold ${val >= 1000 ? 8 : val >= 100 ? 10 : 12}px "JetBrains Mono", monospace`;
              this.ctx.textAlign = 'center';
              this.ctx.textBaseline = 'middle';
              this.ctx.fillText(val, x + this.cellSize / 2, y + this.cellSize / 2);
            }
          }
        }

        // Score
        this.ctx.fillStyle = this.color;
        this.ctx.font = '9px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 3, 10);

        // Game over / win
        if (this.gameOver || this.won) {
          this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.fillStyle = this.color;
          this.ctx.font = '11px "JetBrains Mono", monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(this.won ? 'YOU WIN!' : 'GAME OVER', this.width / 2, this.height / 2 - 8);
          this.ctx.font = '9px "JetBrains Mono", monospace';
          this.ctx.fillText('SPACE to restart', this.width / 2, this.height / 2 + 8);
        }
      }

      stop() {
        this.running = false;
        window.removeEventListener('keydown', this.handleKey);
      }
    }

    function showTyping() {
      const container = document.getElementById('messagesArea');
      const conv = getCurrentConv();
      const typing = document.createElement('div');
      typing.id = 'typingIndicator';
      typing.className = 'message assistant';
      typing.innerHTML = `
        <div class="message-avatar">&gt;_</div>
        <div class="message-content">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      `;
      container.appendChild(typing);
      container.scrollTop = container.scrollHeight;
    }

    // Show waiting game (ULTRAPLINIAN only)
    function showWaitingGame() {
      if (state.waitingGame === 'none') return;
      hideWaitingGame();

      const gameType = state.waitingGame;
      const gameInfo = {
        snake: { emoji: '🐉', name: 'SNAKE', controls: 'arrow keys or WASD to move', showScore: false },
        '2048': { emoji: '🎲', name: '2048', controls: 'arrow keys to merge tiles', showScore: false },
        pong: { emoji: '🏓', name: 'PONG', controls: 'move mouse over game', showScore: true }
      };
      const info = gameInfo[gameType] || gameInfo.snake;

      const panel = document.createElement('div');
      panel.id = 'gamePanel';
      panel.className = 'pong-floating-panel';
      panel.innerHTML = `
        <div class="pong-panel-header">
          <span>${info.emoji} ${info.name}</span>
          <span class="pong-panel-hint">while ULTRAPLINIAN thinks...</span>
          <button class="pong-close-btn" onclick="hideWaitingGame()" title="Close game">&times;</button>
        </div>
        ${info.showScore ? '<div class="pong-score-row"><span class="pong-label">YOU</span><span class="pong-label">AI</span></div>' : ''}
        <canvas class="pong-canvas" id="gameCanvas" width="260" height="140"></canvas>
        <div class="pong-controls">${info.controls}</div>
      `;
      document.body.appendChild(panel);

      // ── Drag-to-move support ──
      const header = panel.querySelector('.pong-panel-header');
      let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.pong-close-btn')) return; // don't drag on close btn
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        e.preventDefault();
      });

      document.addEventListener('mousemove', panel._onDragMove = (e) => {
        if (!isDragging) return;
        // Switch from bottom/right anchoring to top/left positioning
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        const x = Math.max(0, Math.min(e.clientX - dragOffsetX, window.innerWidth - panel.offsetWidth));
        const y = Math.max(0, Math.min(e.clientY - dragOffsetY, window.innerHeight - panel.offsetHeight));
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
      });

      document.addEventListener('mouseup', panel._onDragEnd = () => {
        isDragging = false;
      });

      // Touch support for mobile
      header.addEventListener('touchstart', (e) => {
        if (e.target.closest('.pong-close-btn')) return;
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        const touch = e.touches[0];
        dragOffsetX = touch.clientX - rect.left;
        dragOffsetY = touch.clientY - rect.top;
      }, { passive: true });

      document.addEventListener('touchmove', panel._onTouchMove = (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        const x = Math.max(0, Math.min(touch.clientX - dragOffsetX, window.innerWidth - panel.offsetWidth));
        const y = Math.max(0, Math.min(touch.clientY - dragOffsetY, window.innerHeight - panel.offsetHeight));
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
      }, { passive: true });

      document.addEventListener('touchend', panel._onTouchEnd = () => {
        isDragging = false;
      });

      const canvas = document.getElementById('gameCanvas');
      if (canvas) {
        if (gameType === 'snake') currentGame = new MiniSnake(canvas);
        else if (gameType === '2048') currentGame = new Mini2048(canvas);
        else currentGame = new MiniPong(canvas);
      }
    }

    function hideWaitingGame() {
      if (currentGame) {
        currentGame.stop();
        currentGame = null;
      }
      const panel = document.getElementById('gamePanel');
      if (panel) {
        // Clean up drag listeners
        if (panel._onDragMove) document.removeEventListener('mousemove', panel._onDragMove);
        if (panel._onDragEnd) document.removeEventListener('mouseup', panel._onDragEnd);
        if (panel._onTouchMove) document.removeEventListener('touchmove', panel._onTouchMove);
        if (panel._onTouchEnd) document.removeEventListener('touchend', panel._onTouchEnd);
        panel.remove();
      }
    }

    // Legacy aliases
    function showPongGame() { showWaitingGame(); }
    function hidePongGame() { hideWaitingGame(); }

    function hideTyping(preserveMagic = false) {
      // If preserveMagic is true and showMagic is enabled, save thinking state to the last message
      // Note: Check logs.length instead of active since finishThinking() sets active=false before this
      if (preserveMagic && state.showMagic && thinkingState.logs.length > 0) {
        const conv = getCurrentConv();
        if (conv && conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            // Ensure magic object exists - detect current mode properly
            if (!lastMsg.magic) {
              const modeMap = { ultraplinian: 'ULTRAPLINIAN', pliny: 'G0DM0D3 CLASSIC', parseltongue: 'PARSELTONGUE' };
              lastMsg.magic = { mode: modeMap[getCurrentMode()] || 'GODMODE' };
            }
            // Attach the detailed thinking logs and model results
            lastMsg.magic.thinkingLogs = [...thinkingState.logs];
            lastMsg.magic.thinkingModels = {...thinkingState.models};
            lastMsg.magic.thinkingTitle = thinkingState.title;
            lastMsg.magic.thinkingDuration = thinkingState.startTime > 0
              ? ((Date.now() - thinkingState.startTime) / 1000).toFixed(1)
              : '0';
            // Save state to persist
            saveState();
          }
        }
      }
      // Reset thinkingState after saving
      thinkingState = { active: false, startTime: 0, logs: [], models: {}, expanded: false, title: '' };
      document.getElementById('typingIndicator')?.remove();
    }