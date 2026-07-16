(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const UI = {
    score: document.getElementById('scoreValue'),
    coins: document.getElementById('coinValue'),
    lives: document.getElementById('lifeValue'),
    time: document.getElementById('timeValue'),
    startOverlay: document.getElementById('startOverlay'),
    resultOverlay: document.getElementById('resultOverlay'),
    resultBadge: document.getElementById('resultBadge'),
    resultTitle: document.getElementById('resultTitle'),
    resultText: document.getElementById('resultText'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    soundButton: document.getElementById('soundButton')
  };

  const WIDTH = 960;
  const HEIGHT = 540;
  const WORLD_WIDTH = 5600;
  const GRAVITY = 2100;
  const MOVE_SPEED = 270;
  const JUMP_SPEED = 720;
  const MAX_FALL = 980;
  const START_TIME = 180;

  const keys = { left: false, right: false, jump: false };
  let jumpQueued = false;
  let lastTime = 0;
  let state = 'title';
  let paused = false;
  let score = 0;
  let coinsCollected = 0;
  let lives = 3;
  let timer = START_TIME;
  let cameraX = 0;
  let audioEnabled = true;
  let audioContext = null;

  const level = {
    solids: [
      { x: 0, y: 470, w: 1120, h: 70, type: 'ground' },
      { x: 1210, y: 470, w: 720, h: 70, type: 'ground' },
      { x: 2050, y: 470, w: 950, h: 70, type: 'ground' },
      { x: 3120, y: 470, w: 720, h: 70, type: 'ground' },
      { x: 3960, y: 470, w: 1640, h: 70, type: 'ground' },
      { x: 390, y: 365, w: 150, h: 28, type: 'brick' },
      { x: 650, y: 305, w: 120, h: 28, type: 'bonus' },
      { x: 910, y: 385, w: 120, h: 28, type: 'brick' },
      { x: 1270, y: 365, w: 170, h: 28, type: 'brick' },
      { x: 1530, y: 295, w: 170, h: 28, type: 'bonus' },
      { x: 1785, y: 390, w: 120, h: 28, type: 'brick' },
      { x: 2130, y: 350, w: 170, h: 28, type: 'brick' },
      { x: 2420, y: 280, w: 180, h: 28, type: 'bonus' },
      { x: 2770, y: 375, w: 150, h: 28, type: 'brick' },
      { x: 3180, y: 340, w: 150, h: 28, type: 'brick' },
      { x: 3450, y: 270, w: 190, h: 28, type: 'bonus' },
      { x: 3710, y: 390, w: 110, h: 28, type: 'brick' },
      { x: 4050, y: 360, w: 160, h: 28, type: 'brick' },
      { x: 4330, y: 300, w: 190, h: 28, type: 'bonus' },
      { x: 4720, y: 370, w: 150, h: 28, type: 'brick' },
      { x: 820, y: 398, w: 74, h: 72, type: 'pipe' },
      { x: 1850, y: 382, w: 86, h: 88, type: 'pipe' },
      { x: 2890, y: 370, w: 94, h: 100, type: 'pipe' },
      { x: 3820, y: 390, w: 78, h: 80, type: 'pipe' },
      { x: 4890, y: 360, w: 96, h: 110, type: 'pipe' }
    ],
    coins: [],
    enemies: [],
    flag: { x: 5410, y: 210, w: 18, h: 260 }
  };

  const player = {
    x: 100, y: 390, w: 42, h: 58,
    vx: 0, vy: 0,
    previousY: 390,
    onGround: false,
    facing: 1,
    invulnerable: 0,
    runCycle: 0
  };

  function buildLevelEntities() {
    const coinPositions = [
      [430, 325], [495, 325], [690, 260], [950, 345],
      [1305, 325], [1380, 325], [1570, 250], [1640, 250],
      [2165, 305], [2245, 305], [2460, 235], [2535, 235],
      [3215, 295], [3280, 295], [3490, 225], [3570, 225],
      [4085, 315], [4160, 315], [4370, 255], [4450, 255],
      [4760, 325], [4825, 325], [5100, 400], [5220, 400]
    ];
    level.coins = coinPositions.map(([x, y], index) => ({ x, y, r: 13, taken: false, phase: index * 0.45 }));
    level.enemies = [
      [560, 434, 470, 760], [1390, 434, 1250, 1740], [2230, 434, 2090, 2800],
      [3300, 434, 3160, 3690], [4200, 434, 4000, 4800], [5070, 434, 5000, 5300]
    ].map(([x, y, minX, maxX], index) => ({
      x, y, w: 44, h: 36, vx: index % 2 ? 72 : -72, minX, maxX, alive: true, squash: 0
    }));
  }

  function resetPlayer() {
    player.x = 100;
    player.y = 390;
    player.vx = 0;
    player.vy = 0;
    player.previousY = 390;
    player.onGround = false;
    player.facing = 1;
    player.invulnerable = 1.2;
    cameraX = 0;
  }

  function resetGame() {
    score = 0;
    coinsCollected = 0;
    lives = 3;
    timer = START_TIME;
    paused = false;
    buildLevelEntities();
    resetPlayer();
    updateHud();
  }

  function startGame() {
    resetGame();
    state = 'playing';
    UI.startOverlay.classList.remove('visible');
    UI.resultOverlay.classList.remove('visible');
    ensureAudio();
    beep(440, 0.06, 'square', 0.035);
  }

  function ensureAudio() {
    if (!audioEnabled || audioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }

  function beep(frequency, duration, type = 'square', volume = 0.03) {
    if (!audioEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function updateHud() {
    UI.score.textContent = String(score).padStart(6, '0');
    UI.coins.textContent = String(coinsCollected).padStart(2, '0');
    UI.lives.textContent = String(lives);
    UI.time.textContent = String(Math.max(0, Math.ceil(timer))).padStart(3, '0');
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function movePlayer(dt) {
    const direction = Number(keys.right) - Number(keys.left);
    const targetVx = direction * MOVE_SPEED;
    const acceleration = player.onGround ? 1900 : 1150;
    const change = acceleration * dt;
    if (player.vx < targetVx) player.vx = Math.min(player.vx + change, targetVx);
    if (player.vx > targetVx) player.vx = Math.max(player.vx - change, targetVx);
    if (!direction && player.onGround) player.vx *= Math.pow(0.0007, dt);
    if (direction) player.facing = direction;

    if (jumpQueued && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
      beep(310, 0.09, 'square', 0.035);
    }
    jumpQueued = false;
    if (!keys.jump && player.vy < -250) player.vy += 1250 * dt;

    player.previousY = player.y;
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
    player.x += player.vx * dt;
    resolveHorizontalCollisions();
    player.y += player.vy * dt;
    player.onGround = false;
    resolveVerticalCollisions();
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
    player.runCycle += Math.abs(player.vx) * dt * 0.035;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (player.y > HEIGHT + 180) loseLife('Tu es tombé dans le vide.');
  }

  function resolveHorizontalCollisions() {
    for (const solid of level.solids) {
      if (!rectsOverlap(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      else if (player.vx < 0) player.x = solid.x + solid.w;
      player.vx = 0;
    }
  }

  function resolveVerticalCollisions() {
    for (const solid of level.solids) {
      if (!rectsOverlap(player, solid)) continue;
      const previousBottom = player.previousY + player.h;
      const previousTop = player.previousY;
      if (player.vy >= 0 && previousBottom <= solid.y + 12) {
        player.y = solid.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && previousTop >= solid.y + solid.h - 12) {
        player.y = solid.y + solid.h;
        player.vy = 90;
        beep(120, 0.05, 'square', 0.02);
      }
    }
  }

  function updateCoins(dt) {
    for (const coin of level.coins) {
      coin.phase += dt * 5;
      if (coin.taken) continue;
      const coinRect = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
      if (rectsOverlap(player, coinRect)) {
        coin.taken = true;
        coinsCollected += 1;
        score += 100;
        beep(900, 0.08, 'sine', 0.04);
        updateHud();
      }
    }
  }

  function updateEnemies(dt) {
    for (const enemy of level.enemies) {
      if (!enemy.alive) {
        enemy.squash -= dt;
        continue;
      }
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.vx = Math.abs(enemy.vx); }
      if (enemy.x + enemy.w > enemy.maxX) { enemy.x = enemy.maxX - enemy.w; enemy.vx = -Math.abs(enemy.vx); }
      if (!rectsOverlap(player, enemy)) continue;
      const playerPreviousBottom = player.previousY + player.h;
      const stomp = player.vy > 100 && playerPreviousBottom <= enemy.y + 14;
      if (stomp) {
        enemy.alive = false;
        enemy.squash = 0.35;
        player.y = enemy.y - player.h;
        player.vy = -430;
        score += 250;
        beep(180, 0.09, 'square', 0.04);
        updateHud();
      } else if (player.invulnerable <= 0) {
        loseLife('Une créature t’a touché.');
      }
    }
  }

  function loseLife(message) {
    if (state !== 'playing') return;
    lives -= 1;
    updateHud();
    beep(95, 0.25, 'sawtooth', 0.045);
    if (lives <= 0) {
      finishGame(false, message);
      return;
    }
    resetPlayer();
  }

  function finishGame(won, reason = '') {
    state = won ? 'won' : 'gameover';
    if (won) {
      score += Math.max(0, Math.ceil(timer)) * 10;
      UI.resultBadge.textContent = 'NIVEAU TERMINÉ';
      UI.resultTitle.textContent = 'Mission réussie !';
      UI.resultText.textContent = `Score final : ${String(score).padStart(6, '0')} · ${coinsCollected} pièces récupérées.`;
      beep(660, 0.12, 'square', 0.04);
      setTimeout(() => beep(880, 0.18, 'square', 0.04), 130);
    } else {
      UI.resultBadge.textContent = 'PARTIE TERMINÉE';
      UI.resultTitle.textContent = 'Retente ta chance !';
      UI.resultText.textContent = reason || `Score final : ${String(score).padStart(6, '0')}`;
    }
    updateHud();
    UI.resultOverlay.classList.add('visible');
  }

  function update(dt) {
    if (state !== 'playing' || paused) return;
    timer -= dt;
    if (timer <= 0) {
      timer = 0;
      finishGame(false, 'Le chrono est arrivé à zéro.');
      return;
    }
    movePlayer(dt);
    updateCoins(dt);
    updateEnemies(dt);
    if (rectsOverlap(player, level.flag)) finishGame(true);
    const targetCamera = player.x - WIDTH * 0.38;
    cameraX += (targetCamera - cameraX) * Math.min(1, dt * 5.2);
    cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, cameraX));
    updateHud();
  }

  function roundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#43a9ff');
    sky.addColorStop(1, '#bceeff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 12; i++) {
      const x = ((i * 430 - cameraX * 0.18) % (WORLD_WIDTH + 500)) - 180;
      const y = 65 + (i % 4) * 42;
      drawCloud(x, y, 0.72 + (i % 3) * 0.15);
    }

    ctx.fillStyle = '#6fcf72';
    for (let i = 0; i < 18; i++) {
      const x = i * 360 - cameraX * 0.38 - 120;
      drawHill(x, 448, 220 + (i % 3) * 35, 145 + (i % 2) * 45);
    }

    ctx.fillStyle = '#47b85a';
    for (let i = 0; i < 30; i++) {
      const x = i * 220 - cameraX * 0.56 - 80;
      drawBush(x, 445, 1 + (i % 3) * 0.12);
    }
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(30, 28, 27, Math.PI, 0);
    ctx.arc(66, 22, 35, Math.PI, 0);
    ctx.arc(108, 30, 25, Math.PI, 0);
    ctx.lineTo(133, 52);
    ctx.lineTo(5, 52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHill(x, baseY, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + w / 2, baseY - h, x + w, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.56, baseY - h * 0.5, 12, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6fcf72';
  }

  function drawBush(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(22, 0, 22, Math.PI, 0);
    ctx.arc(50, -9, 30, Math.PI, 0);
    ctx.arc(86, 0, 23, Math.PI, 0);
    ctx.lineTo(109, 22);
    ctx.lineTo(0, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-cameraX, 0);
    for (const solid of level.solids) drawSolid(solid);
    drawFlag();
    for (const coin of level.coins) if (!coin.taken) drawCoin(coin);
    for (const enemy of level.enemies) if (enemy.alive || enemy.squash > 0) drawEnemy(enemy);
    drawPlayer();
    ctx.restore();
  }

  function drawSolid(solid) {
    if (solid.type === 'ground') {
      ctx.fillStyle = '#7a4221';
      ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
      ctx.fillStyle = '#42b84b';
      ctx.fillRect(solid.x, solid.y, solid.w, 14);
      ctx.fillStyle = '#246d31';
      for (let x = solid.x + 10; x < solid.x + solid.w; x += 28) ctx.fillRect(x, solid.y + 10, 12, 9);
      ctx.fillStyle = '#a8612d';
      for (let y = solid.y + 24; y < solid.y + solid.h; y += 22) {
        const offset = ((y / 22) | 0) % 2 ? 0 : 17;
        for (let x = solid.x - offset; x < solid.x + solid.w; x += 34) ctx.fillRect(x, y, 22, 10);
      }
      return;
    }

    if (solid.type === 'pipe') {
      const lip = 8;
      ctx.fillStyle = '#157e43';
      ctx.fillRect(solid.x + lip, solid.y, solid.w - lip * 2, solid.h);
      ctx.fillStyle = '#2acb69';
      ctx.fillRect(solid.x + lip + 8, solid.y + 6, 14, solid.h - 6);
      ctx.fillStyle = '#0b5f32';
      ctx.fillRect(solid.x + solid.w - 23, solid.y + 6, 12, solid.h - 6);
      ctx.fillStyle = '#169b50';
      roundedRect(solid.x, solid.y - 10, solid.w, 24, 5);
      ctx.fill();
      ctx.strokeStyle = '#07502a';
      ctx.lineWidth = 4;
      ctx.stroke();
      return;
    }

    ctx.fillStyle = solid.type === 'bonus' ? '#f1ae24' : '#b85d2c';
    roundedRect(solid.x, solid.y, solid.w, solid.h, 4);
    ctx.fill();
    ctx.strokeStyle = solid.type === 'bonus' ? '#9e6510' : '#743317';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let x = solid.x + 15; x < solid.x + solid.w; x += 34) ctx.fillRect(x, solid.y + 5, 14, 5);
    if (solid.type === 'bonus') {
      ctx.fillStyle = '#fff4b5';
      ctx.font = '900 20px system-ui';
      ctx.textAlign = 'center';
      for (let x = solid.x + 30; x < solid.x + solid.w; x += 58) ctx.fillText('?', x, solid.y + 22);
    }
  }

  function drawCoin(coin) {
    const squash = 0.35 + Math.abs(Math.sin(coin.phase)) * 0.65;
    ctx.save();
    ctx.translate(coin.x, coin.y + Math.sin(coin.phase * 0.8) * 4);
    ctx.scale(squash, 1);
    ctx.fillStyle = '#ffd83d';
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.r, coin.r + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8740b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff2a3';
    ctx.fillRect(-3, -8, 5, 16);
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const squashed = !enemy.alive;
    ctx.save();
    ctx.translate(enemy.x, enemy.y + (squashed ? 24 : 0));
    ctx.scale(1, squashed ? 0.35 : 1);
    ctx.fillStyle = '#744025';
    roundedRect(0, 4, enemy.w, enemy.h - 4, 15);
    ctx.fill();
    ctx.fillStyle = '#f6e0bf';
    ctx.fillRect(8, 22, 28, 9);
    ctx.fillStyle = '#151515';
    ctx.fillRect(10, 13, 6, 8);
    ctx.fillRect(28, 13, 6, 8);
    ctx.fillStyle = '#2e1a10';
    ctx.fillRect(2, enemy.h - 6, 16, 7);
    ctx.fillRect(enemy.w - 18, enemy.h - 6, 16, 7);
    ctx.restore();
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) return;
    const running = Math.abs(player.vx) > 25 && player.onGround;
    const step = running ? Math.sin(player.runCycle) * 5 : 0;
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y);
    ctx.scale(player.facing, 1);
    ctx.translate(-player.w / 2, 0);
    ctx.fillStyle = '#24243a';
    ctx.fillRect(8, 51 + step, 12, 7);
    ctx.fillRect(24, 51 - step, 12, 7);
    ctx.fillStyle = '#1458c4';
    roundedRect(8, 28, 28, 25, 7);
    ctx.fill();
    ctx.fillStyle = '#f15a3a';
    ctx.fillRect(5, 25, 10, 24);
    ctx.fillRect(32, 25, 8, 22);
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(2, 43, 9, 9);
    ctx.fillRect(36, 42, 8, 9);
    ctx.fillStyle = '#ffd0a0';
    roundedRect(9, 7, 27, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#5d2f1c';
    ctx.fillRect(9, 14, 7, 13);
    ctx.fillRect(14, 25, 19, 6);
    ctx.fillStyle = '#111827';
    ctx.fillRect(28, 13, 4, 7);
    ctx.fillStyle = '#ff473d';
    roundedRect(6, 1, 30, 12, 7);
    ctx.fill();
    ctx.fillRect(27, 8, 13, 5);
    ctx.fillStyle = '#fff';
    ctx.font = '900 9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('P', 21, 11);
    ctx.restore();
  }

  function drawFlag() {
    const flag = level.flag;
    ctx.fillStyle = '#e7edf5';
    ctx.fillRect(flag.x, flag.y, flag.w, flag.h);
    ctx.fillStyle = '#f5ca32';
    ctx.beginPath();
    ctx.arc(flag.x + flag.w / 2, flag.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff4e44';
    ctx.beginPath();
    ctx.moveTo(flag.x + flag.w, flag.y + 26);
    ctx.lineTo(flag.x + flag.w + 82, flag.y + 48);
    ctx.lineTo(flag.x + flag.w, flag.y + 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 18px system-ui';
    ctx.fillText('★', flag.x + 45, flag.y + 58);
    ctx.fillStyle = '#d9c7a2';
    ctx.fillRect(flag.x - 22, flag.y + flag.h - 14, 64, 14);
  }

  function drawPause() {
    if (!paused || state !== 'playing') return;
    ctx.fillStyle = 'rgba(3, 11, 27, 0.52)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '900 46px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', WIDTH / 2, HEIGHT / 2);
  }

  function render() {
    drawBackground();
    drawWorld();
    drawPause();
  }

  function frame(timestamp) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function setControl(control, pressed) {
    if (control === 'jump' && pressed && !keys.jump) jumpQueued = true;
    keys[control] = pressed;
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'p'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') setControl('left', true);
    if (key === 'arrowright' || key === 'd') setControl('right', true);
    if (key === 'arrowup' || key === 'w' || key === ' ') setControl('jump', true);
    if (key === 'p' && state === 'playing') paused = !paused;
    if (key === 'enter' && state !== 'playing') startGame();
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') setControl('left', false);
    if (key === 'arrowright' || key === 'd') setControl('right', false);
    if (key === 'arrowup' || key === 'w' || key === ' ') setControl('jump', false);
  });

  document.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.dataset.control;
    const press = (event) => {
      event.preventDefault();
      button.classList.add('active');
      setControl(control, true);
      button.setPointerCapture?.(event.pointerId);
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove('active');
      setControl(control, false);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  UI.startButton.addEventListener('click', startGame);
  UI.restartButton.addEventListener('click', startGame);
  UI.soundButton.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    UI.soundButton.textContent = audioEnabled ? '🔊' : '🔇';
    UI.soundButton.setAttribute('aria-label', audioEnabled ? 'Couper le son' : 'Activer le son');
    if (audioEnabled) beep(520, 0.06, 'sine', 0.035);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') paused = true;
  });

  buildLevelEntities();
  updateHud();
  render();
  requestAnimationFrame(frame);
})();
