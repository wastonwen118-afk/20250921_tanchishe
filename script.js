// 获取DOM元素
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
const currentScore = document.getElementById('current-score');
const currentLength = document.getElementById('current-length');
const historyBody = document.getElementById('history-body');

// 触摸控制按钮
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// 游戏配置
const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

// 游戏状态
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 5;
let score = 0;
let gameInterval;
let gameHistory = [];
let gameCount = 0;

// 初始化游戏
function initGame() {
    // 初始化蛇
    snake = [
        { x: 5, y: 10 }
    ];
    
    // 随机生成食物
    generateFood();
    
    // 重置游戏状态
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    
    // 更新UI
    currentScore.textContent = score;
    currentLength.textContent = snake.length;
}

// 生成食物
function generateFood() {
    // 随机位置
    let foodX, foodY;
    let validPosition = false;
    
    while (!validPosition) {
        foodX = Math.floor(Math.random() * gridWidth);
        foodY = Math.floor(Math.random() * gridHeight);
        
        // 确保食物不会生成在蛇身上
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                validPosition = false;
                break;
            }
        }
    }
    
    food = { x: foodX, y: foodY };
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景
    drawGrid();
    
    // 绘制蛇
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const isHead = i === 0;
        
        // 计算颜色渐变 - 从头到尾逐渐变淡
        const gradientPosition = i / Math.max(snake.length, 1);
        const alpha = 1 - gradientPosition * 0.6;
        
        if (isHead) {
            // 绘制蛇头 - 发光效果
            ctx.fillStyle = '#64ffda';
            ctx.shadowColor = '#64ffda';
            ctx.shadowBlur = 10;
            
            // 绘制蛇头
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize / 2,
                segment.y * gridSize + gridSize / 2,
                gridSize / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // 重置阴影
            ctx.shadowBlur = 0;
            
            // 绘制蛇头内部
            ctx.fillStyle = '#172a45';
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize / 2,
                segment.y * gridSize + gridSize / 2,
                gridSize / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            // 绘制蛇身 - 科技风格
            ctx.fillStyle = `rgba(0, 168, 255, ${alpha})`;
            
            // 绘制圆角矩形
            const cornerRadius = 3;
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            const width = gridSize - 2;
            const height = gridSize - 2;
            
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + width - cornerRadius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
            ctx.lineTo(x + width, y + height - cornerRadius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
            ctx.lineTo(x + cornerRadius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            ctx.closePath();
            ctx.fill();
            
            // 添加内部细节
            ctx.fillStyle = `rgba(100, 255, 218, ${alpha * 0.5})`;
            ctx.fillRect(x + width / 4, y + height / 4, width / 2, height / 2);
        }
    }
    
    // 绘制食物 - 脉冲效果
    const now = Date.now();
    const pulseScale = 1 + 0.1 * Math.sin(now / 200);
    
    // 外发光
    ctx.shadowColor = '#64ffda';
    ctx.shadowBlur = 15;
    
    // 绘制食物
    ctx.fillStyle = '#64ffda';
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = (gridSize / 2) * pulseScale;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 重置阴影
    ctx.shadowBlur = 0;
    
    // 绘制食物内部
    ctx.fillStyle = '#0a192f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.05)';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 更新游戏状态
function updateGame() {
    if (!gameRunning || gamePaused) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头位置
    const head = { ...snake[0] };
    
    // 根据方向移动蛇头
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        endGame();
        return;
    }
    
    // 检查是否撞到自己
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }
    
    // 将新头部添加到蛇身
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        currentScore.textContent = score;
        currentLength.textContent = snake.length;
        
        // 生成新食物
        generateFood();
    } else {
        // 如果没有吃到食物，移除尾部
        snake.pop();
    }
    
    // 绘制游戏
    drawGame();
}

// 结束游戏
function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    
    // 保存游戏记录
    gameCount++;
    const gameRecord = {
        id: gameCount,
        score: score,
        length: snake.length
    };
    gameHistory.push(gameRecord);
    
    // 更新历史记录UI
    updateHistoryUI();
    
    // 更新按钮状态
    startBtn.textContent = '重新开始';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 显示游戏结束信息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`长度: ${snake.length}`, canvas.width / 2, canvas.height / 2 + 40);
}

// 更新历史记录UI
function updateHistoryUI() {
    // 清空历史记录表格
    historyBody.innerHTML = '';
    
    // 添加新记录
    for (let i = gameHistory.length - 1; i >= 0; i--) {
        const record = gameHistory[i];
        const row = document.createElement('tr');
        
        const gameCell = document.createElement('td');
        gameCell.textContent = record.id;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = record.score;
        
        const lengthCell = document.createElement('td');
        lengthCell.textContent = record.length;
        
        row.appendChild(gameCell);
        row.appendChild(scoreCell);
        row.appendChild(lengthCell);
        
        historyBody.appendChild(row);
    }
}

// 开始游戏
function startGame() {
    if (gameRunning && !gamePaused) return;
    
    if (gamePaused) {
        // 继续游戏
        gamePaused = false;
        pauseBtn.textContent = '暂停';
    } else {
        // 新游戏
        initGame();
        gameRunning = true;
        gamePaused = false;
        
        // 更新按钮状态
        startBtn.textContent = '重新开始';
        pauseBtn.disabled = false;
    }
    
    // 设置游戏循环
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / gameSpeed);
}

// 暂停游戏
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(gameInterval);
        pauseBtn.textContent = '继续';
        
        // 显示暂停信息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('已暂停', canvas.width / 2, canvas.height / 2);
    } else {
        gameInterval = setInterval(updateGame, 1000 / gameSpeed);
        pauseBtn.textContent = '暂停';
    }
}

// 更新游戏速度
function updateSpeed() {
    gameSpeed = parseInt(speedSlider.value);
    speedValue.textContent = gameSpeed;
    
    if (gameRunning && !gamePaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, 1000 / gameSpeed);
    }
}

// 键盘控制
function handleKeydown(e) {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            togglePause();
            break;
    }
}

// 触摸控制处理函数
function handleTouchControl(newDirection) {
    if (!gameRunning) return;
    
    // 防止反向移动
    if ((direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'right' && newDirection === 'left')) {
        return;
    }
    
    nextDirection = newDirection;
}

// 添加触摸按钮事件监听
function addTouchEventListeners() {
    // 为每个触摸按钮添加点击和触摸事件
    const touchButtons = [
        { btn: upBtn, direction: 'up' },
        { btn: downBtn, direction: 'down' },
        { btn: leftBtn, direction: 'left' },
        { btn: rightBtn, direction: 'right' }
    ];
    
    touchButtons.forEach(({ btn, direction }) => {
        // 点击事件
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleTouchControl(direction);
        });
        
        // 触摸事件
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTouchControl(direction);
        });
        
        // 防止长按选择文本
        btn.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    });
}

// 事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
speedSlider.addEventListener('input', updateSpeed);
document.addEventListener('keydown', handleKeydown);

// 初始化触摸控制
addTouchEventListeners();

// 初始化游戏
initGame();
drawGame();