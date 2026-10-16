// --- GLOBAL DEĞİŞKENLER VE SES MOTORU ---
let score = 0;
let highScore = localStorage.getItem('arcade_highscore') || 0;
let coins = parseInt(localStorage.getItem('arcade_coins')) || 10;

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const coinsDisplay = document.getElementById('coins');

highScoreDisplay.innerText = highScore;
coinsDisplay.innerText = coins;

function updateScore(points) {
    score += points;
    scoreDisplay.innerText = score;
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.innerText = highScore;
        localStorage.setItem('arcade_highscore', highScore);
    }
}

function addCoin(amount) {
    coins += amount;
    coinsDisplay.innerText = coins;
    localStorage.setItem('arcade_coins', coins);
}

// Web Audio API ile Retrofistik Ses Efektleri
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    let now = audioCtx.currentTime;
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// --- OYUN GEÇİŞLERİ ---
function switchGame(gameType) {
    playSound('click');
    clearInterval(snakeInterval);
    clearInterval(flappyInterval);
    clearInterval(tetrisInterval);

    const areas = ['reflex', 'snake', 'memory', 'flappy', 'tetris'];
    areas.forEach(area => {
        document.getElementById(`${area}-game`).style.display = (area === gameType) ? 'flex' : 'none';
    });

    document.querySelectorAll('.game-select button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === gameType);
    });

    if (gameType === 'memory') startMemoryGame();
}

// --- 1. REFLEKS OYUNU ---
let reflexStartTime;
let reflexTimeout;
let reflexActive = false;
const gameBox = document.getElementById('game-box');
const targetText = document.getElementById('target-text');

function startReflexGame() {
    playSound('click');
    targetText.innerText = "Kutu YEŞİL olunca hemen tıkla!";
    gameBox.style.backgroundColor = "#e94560";
    reflexActive = false;

    const waitTime = Math.floor(Math.random() * 2500) + 1500;
    clearTimeout(reflexTimeout);
    reflexTimeout = setTimeout(() => {
        gameBox.style.backgroundColor = "#2ed573";
        targetText.innerText = "ŞİMDİ TIKLA!";
        reflexStartTime = Date.now();
        reflexActive = true;
    }, waitTime);
}

gameBox.addEventListener('click', () => {
    if (reflexActive) {
        const time = Date.now() - reflexStartTime;
        targetText.innerText = `Harika! ${time} ms`;
        updateScore(Math.max(1000 - time, 50));
        addCoin(1);
        playSound('score');
        reflexActive = false;
    } else if (gameBox.style.backgroundColor === "rgb(233, 69, 96)") {
        clearTimeout(reflexTimeout);
        targetText.innerText = "Erken tıkladın! Cezalandırıldın.";
        playSound('gameover');
    }
});

// --- 2. YILAN OYUNU ---
const snakeCanvas = document.getElementById('snakeCanvas');
const sCtx = snakeCanvas.getContext('2d');
const gridSize = 14;
let snake = [{x: 140, y: 140}];
let sDx = gridSize;
let sDy = 0;
let sFood = {x: 56, y: 56};
let snakeInterval;

function startSnakeGame() {
    playSound('click');
    snake = [{x: 140, y: 140}];
    sDx = gridSize;
    sDy = 0;
    spawnSnakeFood();
    clearInterval(snakeInterval);
    snakeInterval = setInterval(updateSnake, 90);
}

function updateSnake() {
    const head = {x: snake[0].x + sDx, y: snake[0].y + sDy};
    if (head.x < 0) head.x = snakeCanvas.width - gridSize;
    if (head.x >= snakeCanvas.width) head.x = 0;
    if (head.y < 0) head.y = snakeCanvas.height - gridSize;
    if (head.y >= snakeCanvas.height) head.y = 0;

    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            clearInterval(snakeInterval);
            playSound('gameover');
            alert("Oyun Bitti! Skorun: " + score);
            return;
        }
    }

    snake.unshift(head);
    if (head.x === sFood.x && head.y === sFood.y) {
        updateScore(50);
        addCoin(2);
        playSound('score');
        spawnSnakeFood();
    } else {
        snake.pop();
    }

    sCtx.fillStyle = '#05050f';
    sCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    sCtx.fillStyle = '#ff6b81';
    sCtx.fillRect(sFood.x, sFood.y, gridSize - 1, gridSize - 1);

    sCtx.fillStyle = '#00fff0';
    snake.forEach(seg => sCtx.fillRect(seg.x, seg.y, gridSize - 1, gridSize - 1));
}

function spawnSnakeFood() {
    sFood.x = Math.floor(Math.random() * (snakeCanvas.width / gridSize)) * gridSize;
    sFood.y = Math.floor(Math.random() * (snakeCanvas.height / gridSize)) * gridSize;
}

// --- 3. HAFIZA KARTLARI ---
const emojis = ['🚀', '👾', '🕹️', '👑', '🔥', '💎', '🎯', '⚡'];
let cardsDeck = [...emojis, ...emojis];
let flipped = [];
let pairsFound = 0;

function startMemoryGame() {
    playSound('click');
    const gridEl = document.getElementById('memory-grid');
    gridEl.innerHTML = '';
    flipped = [];
    pairsFound = 0;
    cardsDeck.sort(() => 0.5 - Math.random());

    cardsDeck.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.innerText = '❓';
        card.addEventListener('click', flipMemoryCard);
        gridEl.appendChild(card);
    });
}

function flipMemoryCard() {
    if (flipped.length < 2 && !this.classList.contains('flipped') && !this.classList.contains('matched')) {
        playSound('click');
        this.classList.add('flipped');
        this.innerText = this.dataset.emoji;
        flipped.push(this);

        if (flipped.length === 2) {
            const [c1, c2] = flipped;
            if (c1.dataset.emoji === c2.dataset.emoji) {
                c1.classList.add('matched');
                c2.classList.add('matched');
                flipped = [];
                pairsFound++;
                updateScore(100);
                playSound('score');
                if (pairsFound === emojis.length) {
                    setTimeout(() => alert('Tebrikler! Hafıza Testini Tamamladın! 🎉'), 200);
                }
            } else {
                setTimeout(() => {
                    c1.classList.remove('flipped');
                    c2.classList.remove('flipped');
                    c1.innerText = '❓';
                    c2.innerText = '❓';
                    flipped = [];
                }, 700);
            }
        }
    }
}

// --- 4. FLAPPY BIRD ---
const flappyCanvas = document.getElementById('flappyCanvas');
const fCtx = flappyCanvas.getContext('2d');
let birdY = 130, fVel = 0, fGravity = 0.35, fJump = -5.5, pipes = [], flappyInterval, flappyActive = false;

function startFlappyGame() {
    playSound('click');
    birdY = 130;
    fVel = 0;
    pipes = [];
    flappyActive = true;
    clearInterval(flappyInterval);
    flappyInterval = setInterval(updateFlappy, 20);
}

function updateFlappy() {
    if (!flappyActive) return;
    fVel += fGravity;
    birdY += fVel;

    if (birdY > flappyCanvas.height - 12 || birdY < 0) endFlappy();

    if (pipes.length === 0 || pipes[pipes.length - 1].x < flappyCanvas.width - 110) {
        let gap = 95;
        let topH = Math.floor(Math.random() * (flappyCanvas.height - gap - 40)) + 20;
        pipes.push({ x: flappyCanvas.width, top: topH, bottom: flappyCanvas.height - topH - gap, passed: false });
    }

    pipes.forEach((p, idx) => {
        p.x -= 2;
        if (40 + 12 > p.x && 40 < p.x + 28) {
            if (birdY < p.top || birdY + 12 > flappyCanvas.height - p.bottom) endFlappy();
        }
        if (p.x + 28 < 40 && !p.passed) {
            p.passed = true;
            updateScore(20);
            addCoin(1);
            playSound('score');
        }
        if (p.x < -30) pipes.splice(idx, 1);
    });

    fCtx.fillStyle = '#05050f';
    fCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    fCtx.fillStyle = '#f1c40f';
    fCtx.beginPath();
    fCtx.arc(40, birdY, 10, 0, Math.PI * 2);
    fCtx.fill();

    fCtx.fillStyle = '#2ecc71';
    pipes.forEach(p => {
        fCtx.fillRect(p.x, 0, 28, p.top);
        fCtx.fillRect(p.x, flappyCanvas.height - p.bottom, 28, p.bottom);
    });
}

function flapBird() {
    if (flappyActive) { fVel = fJump; playSound('click'); }
}

function endFlappy() {
    flappyActive = false;
    clearInterval(flappyInterval);
    playSound('gameover');
    alert("Kuş Düştü! Skorun: " + score);
}

flappyCanvas.addEventListener('click', flapBird);

// --- 5. TETRIS ---
const tCanvas = document.getElementById('tetrisCanvas');
const tCtx = tCanvas.getContext('2d');
const T_BLOCK = 16, T_COLS = 12, T_ROWS = 18;
let tBoard = Array.from({length: T_ROWS}, () => Array(T_COLS).fill(0));
let currentTBlock, tetrisInterval;

const SHAPES = [
    { shape: [[1,1,1,1]], color: '#00fff0' },
    { shape: [[1,1],[1,1]], color: '#f1c40f' },
    { shape: [[0,1,0],[1,1,1]], color: '#9b59b6' },
    { shape: [[1,0,0],[1,1,1]], color: '#e67e22' },
    { shape: [[0,0,1],[1,1,1]], color: '#3498db' },
    { shape: [[0,1,1],[1,1,0]], color: '#2ecc71' },
    { shape: [[1,1,0],[0,1,1]], color: '#e74c3c' }
];

function startTetrisGame() {
    playSound('click');
    tBoard = Array.from({length: T_ROWS}, () => Array(T_COLS).fill(0));
    spawnTetrisBlock();
    clearInterval(tetrisInterval);
    tetrisInterval = setInterval(updateTetris, 450);
}

function spawnTetrisBlock() {
    const rand = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    currentTBlock = {
        shape: rand.shape,
        color: rand.color,
        x: Math.floor(T_COLS / 2) - Math.floor(rand.shape[0].length / 2),
        y: 0
    };
    if (checkTetrisCollide()) {
        clearInterval(tetrisInterval);
        playSound('gameover');
        alert("Tetris Bitti! Skorun: " + score);
    }
}

function updateTetris() {
    currentTBlock.y++;
    if (checkTetrisCollide()) {
        currentTBlock.y--;
        mergeTetrisBlock();
        clearTetrisRows();
        spawnTetrisBlock();
    }
    drawTetrisBoard();
}

function checkTetrisCollide() {
    for (let r = 0; r < currentTBlock.shape.length; r++) {
        for (let c = 0; c < currentTBlock.shape[r].length; c++) {
            if (currentTBlock.shape[r][c]) {
                let nx = currentTBlock.x + c;
                let ny = currentTBlock.y + r;
                if (nx < 0 || nx >= T_COLS || ny >= T_ROWS || (ny >= 0 && tBoard[ny][nx])) return true;
            }
        }
    }
    return false;
}

function mergeTetrisBlock() {
    for (let r = 0; r < currentTBlock.shape.length; r++) {
        for (let c = 0; c < currentTBlock.shape[r].length; c++) {
            if (currentTBlock.shape[r][c]) {
                tBoard[currentTBlock.y + r][currentTBlock.x + c] = currentTBlock.color;
            }
        }
    }
}

function clearTetrisRows() {
    let cleared = 0;
    for (let r = T_ROWS - 1; r >= 0; r--) {
        if (tBoard[r].every(cell => cell !== 0)) {
            tBoard.splice(r, 1);
            tBoard.unshift(Array(T_COLS).fill(0));
            cleared++;
            r++;
        }
    }
    if (cleared > 0) {
        updateScore(cleared * 100);
        addCoin(cleared * 2);
        playSound('score');
    }
}

function drawTetrisBoard() {
    tCtx.fillStyle = '#05050f';
    tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);

    for (let r = 0; r < T_ROWS; r++) {
        for (let c = 0; c < T_COLS; c++) {
            if (tBoard[r][c]) {
                tCtx.fillStyle = tBoard[r][c];
                tCtx.fillRect(c * T_BLOCK, r * T_BLOCK, T_BLOCK - 1, T_BLOCK - 1);
            }
        }
    }

    if (currentTBlock) {
        tCtx.fillStyle = currentTBlock.color;
        for (let r = 0; r < currentTBlock.shape.length; r++) {
            for (let c = 0; c < currentTBlock.shape[r].length; c++) {
                if (currentTBlock.shape[r][c]) {
                    tCtx.fillRect((currentTBlock.x + c) * T_BLOCK, (currentTBlock.y + r) * T_BLOCK, T_BLOCK - 1, T_BLOCK - 1);
                }
            }
        }
    }
}

// --- KLAVYE KONTROLLERİ ---
document.addEventListener('keydown', (e) => {
    // Yılan
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && sDy === 0) { sDx = 0; sDy = -gridSize; }
    else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && sDy === 0) { sDx = 0; sDy = gridSize; }
    else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && sDx === 0) { sDx = -gridSize; sDy = 0; }
    else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && sDx === 0) { sDx = gridSize; sDy = 0; }

    // Flappy
    if (e.code === 'Space') {
        e.preventDefault();
        flapBird();
    }

    // Tetris
    if (document.getElementById('tetris-game').style.display === 'flex') {
        if (e.key === 'ArrowLeft') { currentTBlock.x--; if (checkTetrisCollide()) currentTBlock.x++; }
        else if (e.key === 'ArrowRight') { currentTBlock.x++; if (checkTetrisCollide()) currentTBlock.x--; }
        else if (e.key === 'ArrowDown') { updateTetris(); }
        else if (e.key === 'ArrowUp') {
            const rotated = currentTBlock.shape[0].map((_, i) => currentTBlock.shape.map(row => row[i]).reverse());
            const oldShape = currentTBlock.shape;
            currentTBlock.shape = rotated;
            if (checkTetrisCollide()) currentTBlock.shape = oldShape;
        }
        drawTetrisBoard();
    }
});