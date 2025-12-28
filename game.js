// Game Configuration
const CONFIG = {
    CELL_SIZE: 40,
    MAZE_WIDTH: 15,
    MAZE_HEIGHT: 15,
    PLAYER_SPEED: 200, // ms between moves
    ENEMY_SPEED: 400, // ms between moves
    COLORS: {
        wall: '#333333',
        path: '#f0f0f0',
        goal: '#f5576c',
        player: '#4CAF50',
        enemy: '#FF5722'
    }
};

// Game State
let gameState = {
    level: 1,
    score: 0,
    lives: 3,
    isPlaying: false,
    maze: [],
    player: { x: 1, y: 1 },
    goal: { x: 0, y: 0 },
    enemies: [],
    lastMoveTime: 0,
    lastEnemyMoveTime: 0
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CELL_SIZE * CONFIG.MAZE_WIDTH;
canvas.height = CONFIG.CELL_SIZE * CONFIG.MAZE_HEIGHT;

// Preview Canvases
const playerPreviewCanvas = document.getElementById('playerPreview');
const playerPreviewCtx = playerPreviewCanvas.getContext('2d');
const enemyPreviewCanvas = document.getElementById('enemyPreview');
const enemyPreviewCtx = enemyPreviewCanvas.getContext('2d');

// Maze Generation using Recursive Backtracking
function generateMaze() {
    const maze = Array(CONFIG.MAZE_HEIGHT).fill().map(() => 
        Array(CONFIG.MAZE_WIDTH).fill(1)
    );

    function carvePassage(x, y) {
        maze[y][x] = 0;
        
        const directions = [
            [0, -2], [2, 0], [0, 2], [-2, 0]
        ].sort(() => Math.random() - 0.5);

        for (let [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx > 0 && nx < CONFIG.MAZE_WIDTH - 1 && 
                ny > 0 && ny < CONFIG.MAZE_HEIGHT - 1 && 
                maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carvePassage(nx, ny);
            }
        }
    }

    carvePassage(1, 1);
    return maze;
}

// Draw Player with proper graphics
function drawPlayer(x, y, size, context = ctx) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const scale = size / 40;

    // Body (circle)
    context.fillStyle = '#4CAF50';
    context.beginPath();
    context.arc(centerX, centerY, 12 * scale, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#2E7D32';
    context.lineWidth = 2 * scale;
    context.stroke();

    // Eyes
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(centerX - 5 * scale, centerY - 3 * scale, 3 * scale, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(centerX + 5 * scale, centerY - 3 * scale, 3 * scale, 0, Math.PI * 2);
    context.fill();

    // Pupils
    context.fillStyle = 'black';
    context.beginPath();
    context.arc(centerX - 5 * scale, centerY - 3 * scale, 1.5 * scale, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(centerX + 5 * scale, centerY - 3 * scale, 1.5 * scale, 0, Math.PI * 2);
    context.fill();

    // Smile
    context.strokeStyle = '#2E7D32';
    context.lineWidth = 2 * scale;
    context.beginPath();
    context.arc(centerX, centerY + 2 * scale, 6 * scale, 0, Math.PI);
    context.stroke();

    // Arms
    context.strokeStyle = '#4CAF50';
    context.lineWidth = 3 * scale;
    context.beginPath();
    context.moveTo(centerX - 10 * scale, centerY);
    context.lineTo(centerX - 15 * scale, centerY - 5 * scale);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX + 10 * scale, centerY);
    context.lineTo(centerX + 15 * scale, centerY - 5 * scale);
    context.stroke();

    // Legs
    context.beginPath();
    context.moveTo(centerX - 4 * scale, centerY + 10 * scale);
    context.lineTo(centerX - 8 * scale, centerY + 17 * scale);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX + 4 * scale, centerY + 10 * scale);
    context.lineTo(centerX + 8 * scale, centerY + 17 * scale);
    context.stroke();
}

// Draw Enemy with proper graphics
function drawEnemy(x, y, size, context = ctx) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const scale = size / 40;
    const time = Date.now() / 200;

    // Body (spiky circle)
    context.fillStyle = '#FF5722';
    context.beginPath();
    context.arc(centerX, centerY, 12 * scale, 0, Math.PI * 2);
    context.fill();

    // Spikes
    context.fillStyle = '#D32F2F';
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + time;
        const spikeX = centerX + Math.cos(angle) * 12 * scale;
        const spikeY = centerY + Math.sin(angle) * 12 * scale;
        const tipX = centerX + Math.cos(angle) * 18 * scale;
        const tipY = centerY + Math.sin(angle) * 18 * scale;
        
        context.beginPath();
        context.moveTo(spikeX, spikeY);
        context.lineTo(tipX, tipY);
        context.lineTo(spikeX + Math.cos(angle + 0.3) * 2 * scale, 
                   spikeY + Math.sin(angle + 0.3) * 2 * scale);
        context.closePath();
        context.fill();
    }

    // Evil eyes
    context.fillStyle = 'yellow';
    context.beginPath();
    context.arc(centerX - 4 * scale, centerY - 3 * scale, 3 * scale, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(centerX + 4 * scale, centerY - 3 * scale, 3 * scale, 0, Math.PI * 2);
    context.fill();

    // Evil pupils
    context.fillStyle = 'red';
    context.beginPath();
    context.arc(centerX - 4 * scale, centerY - 3 * scale, 1.5 * scale, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(centerX + 4 * scale, centerY - 3 * scale, 1.5 * scale, 0, Math.PI * 2);
    context.fill();

    // Angry mouth
    context.strokeStyle = '#D32F2F';
    context.lineWidth = 2 * scale;
    context.beginPath();
    context.arc(centerX, centerY + 5 * scale, 5 * scale, Math.PI, 0);
    context.stroke();
}

// Draw preview thumbnails
function drawPreviews() {
    playerPreviewCtx.clearRect(0, 0, 40, 40);
    drawPlayer(0, 0, 40, playerPreviewCtx);

    enemyPreviewCtx.clearRect(0, 0, 40, 40);
    drawEnemy(0, 0, 40, enemyPreviewCtx);
}

// Render the maze
function renderMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < CONFIG.MAZE_HEIGHT; y++) {
        for (let x = 0; x < CONFIG.MAZE_WIDTH; x++) {
            if (gameState.maze[y][x] === 1) {
                ctx.fillStyle = CONFIG.COLORS.wall;
                ctx.fillRect(x * CONFIG.CELL_SIZE, y * CONFIG.CELL_SIZE, 
                           CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
            } else {
                ctx.fillStyle = CONFIG.COLORS.path;
                ctx.fillRect(x * CONFIG.CELL_SIZE, y * CONFIG.CELL_SIZE, 
                           CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
            }
        }
    }

    // Draw goal with gradient
    const gradient = ctx.createLinearGradient(
        gameState.goal.x * CONFIG.CELL_SIZE,
        gameState.goal.y * CONFIG.CELL_SIZE,
        (gameState.goal.x + 1) * CONFIG.CELL_SIZE,
        (gameState.goal.y + 1) * CONFIG.CELL_SIZE
    );
    gradient.addColorStop(0, '#f093fb');
    gradient.addColorStop(1, '#f5576c');
    ctx.fillStyle = gradient;
    ctx.fillRect(gameState.goal.x * CONFIG.CELL_SIZE, 
                gameState.goal.y * CONFIG.CELL_SIZE,
                CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

    // Draw star in goal
    ctx.fillStyle = 'white';
    const gx = gameState.goal.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    const gy = gameState.goal.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', gx, gy);

    // Draw enemies
    gameState.enemies.forEach(enemy => {
        drawEnemy(enemy.x * CONFIG.CELL_SIZE, enemy.y * CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    });

    // Draw player
    drawPlayer(gameState.player.x * CONFIG.CELL_SIZE, 
              gameState.player.y * CONFIG.CELL_SIZE, 
              CONFIG.CELL_SIZE);
}

// Check if move is valid
function isValidMove(x, y) {
    return x >= 0 && x < CONFIG.MAZE_WIDTH && 
           y >= 0 && y < CONFIG.MAZE_HEIGHT && 
           gameState.maze[y][x] === 0;
}

// Move player
function movePlayer(dx, dy) {
    if (!gameState.isPlaying) return;
    
    const now = Date.now();
    if (now - gameState.lastMoveTime < CONFIG.PLAYER_SPEED) return;
    
    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (isValidMove(newX, newY)) {
        gameState.player.x = newX;
        gameState.player.y = newY;
        gameState.lastMoveTime = now;

        // Check if reached goal
        if (newX === gameState.goal.x && newY === gameState.goal.y) {
            winLevel();
        }

        // Check collision with enemies
        checkEnemyCollision();
    }
}

// Move enemies
function moveEnemies() {
    if (!gameState.isPlaying) return;

    const now = Date.now();
    if (now - gameState.lastEnemyMoveTime < CONFIG.ENEMY_SPEED) return;
    
    gameState.enemies.forEach(enemy => {
        // Simple AI: move towards player
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;

        let moveX = 0, moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }

        // Try to move towards player
        if (isValidMove(enemy.x + moveX, enemy.y + moveY)) {
            enemy.x += moveX;
            enemy.y += moveY;
        } else {
            // Random movement if can't move towards player
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]
                .sort(() => Math.random() - 0.5);
            
            for (let [dx, dy] of directions) {
                if (isValidMove(enemy.x + dx, enemy.y + dy)) {
                    enemy.x += dx;
                    enemy.y += dy;
                    break;
                }
            }
        }
    });

    gameState.lastEnemyMoveTime = now;
    checkEnemyCollision();
}

// Check collision with enemies
function checkEnemyCollision() {
    for (let enemy of gameState.enemies) {
        if (enemy.x === gameState.player.x && enemy.y === gameState.player.y) {
            loseLife();
            break;
        }
    }
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateUI();

    if (gameState.lives <= 0) {
        gameOver();
    } else {
        // Reset player position
        gameState.player = { x: 1, y: 1 };
        renderMaze();
    }
}

// Win level
function winLevel() {
    gameState.score += 100 * gameState.level;
    gameState.level++;
    updateUI();

    showOverlay('Level Complete! 🎉', 
                `You scored ${100 * (gameState.level - 1)} points!`, 
                'Next Level');
    
    gameState.isPlaying = false;
}

// Game over
function gameOver() {
    gameState.isPlaying = false;
    showOverlay('Game Over! 💀', 
                `Final Score: ${gameState.score}`, 
                'Play Again');
}

// Show overlay
function showOverlay(title, message, buttonText) {
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMessage').textContent = message;
    document.getElementById('restartButton').textContent = buttonText;
    document.getElementById('gameOverlay').classList.remove('hidden');
}

// Hide overlay
function hideOverlay() {
    document.getElementById('gameOverlay').classList.add('hidden');
}

// Initialize game
function initGame() {
    gameState.maze = generateMaze();
    
    // Set goal position (far from start)
    gameState.goal = { 
        x: CONFIG.MAZE_WIDTH - 2, 
        y: CONFIG.MAZE_HEIGHT - 2 
    };
    gameState.maze[gameState.goal.y][gameState.goal.x] = 0;

    // Place enemies
    gameState.enemies = [];
    const numEnemies = Math.min(gameState.level + 1, 5);
    
    for (let i = 0; i < numEnemies; i++) {
        let ex, ey;
        do {
            ex = Math.floor(Math.random() * (CONFIG.MAZE_WIDTH - 2)) + 1;
            ey = Math.floor(Math.random() * (CONFIG.MAZE_HEIGHT - 2)) + 1;
        } while (
            gameState.maze[ey][ex] === 1 || 
            (ex === 1 && ey === 1) || 
            (ex === gameState.goal.x && ey === gameState.goal.y) ||
            Math.abs(ex - 1) + Math.abs(ey - 1) < 5
        );
        gameState.enemies.push({ x: ex, y: ey });
    }

    gameState.player = { x: 1, y: 1 };
    gameState.isPlaying = true;
    hideOverlay();
    updateUI();
    renderMaze();
}

// Update UI
function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

// Reset game
function resetGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.lives = 3;
    initGame();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying) return;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePlayer(1, 0);
            break;
    }
    renderMaze();
});

// Button controls
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!gameState.isPlaying) return;
        
        const key = btn.dataset.key;
        switch(key) {
            case 'ArrowUp':
                movePlayer(0, -1);
                break;
            case 'ArrowDown':
                movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                movePlayer(-1, 0);
                break;
            case 'ArrowRight':
                movePlayer(1, 0);
                break;
        }
        renderMaze();
    });
});

// Restart button
document.getElementById('restartButton').addEventListener('click', () => {
    const buttonText = document.getElementById('restartButton').textContent;
    if (buttonText === 'Next Level') {
        initGame();
    } else {
        resetGame();
    }
});

// Game loop for enemy movement
function gameLoop() {
    if (gameState.isPlaying) {
        moveEnemies();
        renderMaze();
    }
    requestAnimationFrame(gameLoop);
}

// Initialize and start
drawPreviews();
initGame();
gameLoop();
