// Конфигурация игры
const config = {
    startBalance: 10000,
    betOptions: [10, 50, 100, 500],
    baseMultiplier: 2.5,
    visibleLevels: 2,
    multiplierStep: 0.5,
    levelHeight: 120,
    levelSpacing: 10,
    cellWidth: 80,
    cellHeight: 100,
    cellBackground: 'rgba(0, 123, 255, 0.7)',
    cellBorder: '2px solid #00f0ff',
    animationDuration: 300
};

// Состояние игры
const state = {
    balance: config.startBalance,
    currentBet: 0,
    currentMultiplier: config.baseMultiplier,
    currentLevel: 1,
    isGameActive: false,
    isAnimating: false,
    levelsPassed: 0,
    currentCorrectIndex: 0,
    currentLevelRows: [],
    gameTimer: null,
    stats: {
        totalWins: 0,
        totalLevelsPassed: 0,
        gameHistory: []
    }
};

// Элементы DOM
const elements = {
    balance: document.getElementById('balance'),
    startBtn: document.getElementById('startBtn'),
    cashoutBtn: document.getElementById('cashoutBtn'),
    topupBtn: document.getElementById('topupBtn'),
    levelContainer: document.getElementById('levelContainer'),
    notification: document.getElementById('notification'),
    betOptions: document.querySelectorAll('.chip-btn'),
    cashoutAmount: document.getElementById('cashoutAmount'),
    statsBtn: document.getElementById('statsBtn'),
    closeStats: document.getElementById('closeStats'),
    statsModal: document.getElementById('statsModal'),
    initialDeposit: document.getElementById('initialDeposit'),
    currentBalanceStat: document.getElementById('currentBalanceStat'),
    totalWins: document.getElementById('totalWins'),
    totalLevelsPassed: document.getElementById('totalLevelsPassed'),
    statsHistory: document.getElementById('statsHistory')
};

// Инициализация игры
function init() {
    if (!checkElements()) {
        console.error("Не найдены необходимые элементы");
        return;
    }

    setupEventListeners();
    selectBetAmount(10);
    updateUI();
    
    if (typeof particlesJS !== 'undefined') {
        particlesJS("particles", {
            particles: {
                number: { value: 50 },
                color: { value: "#00f0ff" },
                shape: { type: "circle" },
                opacity: { value: 0.5 },
                size: { value: 3 },
                line_linked: { enable: true, distance: 150 },
                move: { enable: true, speed: 2 }
            }
        });
    }
}

function checkElements() {
    let allFound = true;
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Не найден элемент: ${key}`);
            allFound = false;
        }
    }
    return allFound;
}

function setupEventListeners() {
    elements.betOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount);
            selectBetAmount(amount);
        });
    });

    elements.startBtn.addEventListener('click', startGame);
    elements.cashoutBtn.addEventListener('click', cashout);
    elements.topupBtn.addEventListener('click', topupBalance);
    elements.levelContainer.addEventListener('click', handleCellClick);
    elements.statsBtn.addEventListener('click', showStats);
    elements.closeStats.addEventListener('click', hideStats);
}

function showStats() {
    elements.statsModal.classList.add('active');
    updateStats();
}

function hideStats() {
    elements.statsModal.classList.remove('active');
}

function startGame() {
    if (state.isGameActive) {
        showNotification("Игра уже начата!", 'warning');
        return;
    }
    
    if (state.balance < state.currentBet) {
        showNotification("Недостаточно средств", 'error');
        return;
    }
    
    if (state.currentBet <= 0) {
        showNotification("Выберите сумму ставки", 'warning');
        return;
    }
    
    state.balance -= state.currentBet;
    state.isGameActive = true;
    state.currentMultiplier = config.baseMultiplier;
    state.levelsPassed = 0;
    state.currentLevel = 1;
    
    elements.levelContainer.innerHTML = '';
    state.currentLevelRows = [];
    
    createLevel();
    
    elements.startBtn.disabled = true;
    elements.cashoutBtn.disabled = false;
    updateCashoutButton();
    updateUI();
}

function createLevel() {
    const levelRow = document.createElement('div');
    levelRow.className = 'level-row';
    levelRow.style.display = 'flex';
    levelRow.style.justifyContent = 'flex-start'; // Изменено с 'center'
    levelRow.style.paddingRight = '45px'; // Добавлен отступ справа
    levelRow.style.gap = '10px'; // Уменьшен промежуток между ячейками
    levelRow.style.marginBottom = config.levelSpacing + 'px';
    levelRow.style.opacity = '0';
    levelRow.style.transform = 'scale(0.8)';
    levelRow.style.transition = `all ${config.animationDuration}ms ease`;
    levelRow.style.width = '100%';
    levelRow.style.boxSizing = 'border-box';

    state.currentCorrectIndex = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'level-cell';
        cell.dataset.index = i;
        cell.style.width = config.cellWidth + 'px';
        cell.style.height = config.cellHeight + 'px';
        cell.style.background = config.cellBackground;
        cell.style.border = config.cellBorder;
        cell.style.borderRadius = '10px';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '24px';
        cell.style.fontWeight = 'bold';
        cell.style.color = 'white';
        cell.style.cursor = 'pointer';
        cell.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
        cell.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        cell.style.transition = 'all 0.3s ease';
        cell.style.padding = '0';
        cell.style.margin = '0';
        cell.style.boxSizing = 'border-box';
        
        // Оптимизация хитбокса
        cell.style.padding = '0';
        cell.style.margin = '0';
        cell.style.boxSizing = 'border-box';
        cell.style.position = 'relative';
        cell.style.overflow = 'hidden';

        // Контент ячейки
        const multiplier = document.createElement('div');
        multiplier.textContent = `${state.currentMultiplier.toFixed(1)}x`;
        multiplier.style.width = '100%';
        multiplier.style.height = '100%';
        multiplier.style.display = 'flex';
        multiplier.style.alignItems = 'center';
        multiplier.style.justifyContent = 'center';
        cell.appendChild(multiplier);

        // Hover-эффекты
        cell.addEventListener('mouseenter', () => {
            cell.style.transform = 'scale(1.05)';
            cell.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.7)';
            cell.style.zIndex = '10';
        });
        
        cell.addEventListener('mouseleave', () => {
            cell.style.transform = '';
            cell.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            cell.style.zIndex = '';
        });

        levelRow.appendChild(cell);
    }

    elements.levelContainer.insertBefore(levelRow, elements.levelContainer.firstChild);
    
    setTimeout(() => {
        levelRow.style.opacity = '1';
        levelRow.style.transform = 'scale(1)';
    }, 50);

    // Обновление позиций уровней
    updateLevelPositions();
}

function updateLevelPositions() {
    const allRows = elements.levelContainer.querySelectorAll('.level-row');
    allRows.forEach((row, index) => {
        if (index > 0) {
            row.style.transform = `translateY(${index * (config.levelHeight + config.levelSpacing)}px)`;
        }
    });
}

function handleCellClick(e) {
    const cell = e.target.closest('.level-cell');
    
    if (!state.isGameActive || state.isAnimating || !cell) {
        return;
    }
    
    // Проверка точного попадания в ячейку
    const rect = cell.getBoundingClientRect();
    const isClickInside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    );
    
    if (!isClickInside) return;
    
    state.isAnimating = true;
    const selectedIndex = parseInt(cell.dataset.index);
    const isCorrect = selectedIndex === state.currentCorrectIndex;
    
    // Визуальная обратная связь
    cell.style.background = isCorrect ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
    cell.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        if (isCorrect) {
            handleLevelSuccess();
        } else {
            handleGameOver();
        }
        state.isAnimating = false;
    }, 500);
}

function handleLevelSuccess() {
    state.levelsPassed++;
    state.currentMultiplier += config.multiplierStep;
    state.currentLevel++;
    
    animateLevelsUp();
    
    setTimeout(() => {
        createLevel();
        updateUI();
        updateCashoutButton();
        showNotification(`Уровень ${state.levelsPassed} пройден!`, 'success');
    }, config.animationDuration);
}

function animateLevelsUp() {
    const rows = elements.levelContainer.querySelectorAll('.level-row');
    rows.forEach(row => {
        const currentY = parseInt(row.style.transform.match(/translateY\((\d+)px\)/)?.[1] || 0);
        row.style.transform = `translateY(${currentY + (config.levelHeight + config.levelSpacing)}px)`;
    });
}

function handleGameOver() {
    showNotification(`Проигрыш: -${state.currentBet} ₽`, 'error');
    endGame(false);
}

function endGame(isWin) {
    if (isWin) {
        const winAmount = Math.floor(state.currentBet * state.currentMultiplier);
        state.balance += winAmount;
        state.stats.totalWins += winAmount;
        state.stats.totalLevelsPassed += state.levelsPassed;
        
        state.stats.gameHistory.unshift({
            date: new Date().toLocaleString(),
            win: winAmount,
            levels: state.levelsPassed,
            bet: state.currentBet
        });
    }
    
    state.isGameActive = false;
    elements.startBtn.disabled = false;
    elements.cashoutBtn.disabled = true;
    updateUI();
    updateStats();
}
function selectBetAmount(amount) {
    if (amount === 'max') {
        state.currentBet = state.balance;
    } else {
        state.currentBet = Math.min(amount, state.balance);
    }
    
    elements.betOptions.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.amount) === state.currentBet) {
            btn.classList.add('active');
        }
    });
    
    updateUI();
    updateCashoutButton();
}

// Кэшаут
function cashout() {
    if (!state.isGameActive || state.levelsPassed < 1) return;
    
    const winAmount = Math.floor(state.currentBet * state.currentMultiplier);
    state.balance += winAmount;
    state.stats.totalWins += winAmount;
    state.stats.totalLevelsPassed += state.levelsPassed;
    
    state.stats.gameHistory.unshift({
        date: new Date().toLocaleString(),
        win: winAmount,
        levels: state.levelsPassed,
        bet: state.currentBet
    });
    
    showNotification(`Вывод: +${winAmount} ₽`, 'success');
    endGame(true);
}

// Пополнение баланса
function topupBalance() {
    state.balance += 10000;
    updateUI();
    showNotification("Баланс пополнен на 10 000 ₽", 'success');
}

// Обновление интерфейса
function updateUI() {
    elements.balance.textContent = `${state.balance.toLocaleString('ru-RU')} ₽`;
}

// Обновление кнопки вывода
function updateCashoutButton() {
    const winAmount = Math.floor(state.currentBet * state.currentMultiplier);
    elements.cashoutAmount.textContent = winAmount;
    elements.cashoutBtn.disabled = !state.isGameActive || state.levelsPassed < 1;
}

// Обновление статистики
function updateStats() {
    elements.initialDeposit.textContent = `${config.startBalance.toLocaleString('ru-RU')} ₽`;
    elements.currentBalanceStat.textContent = `${state.balance.toLocaleString('ru-RU')} ₽`;
    elements.totalWins.textContent = `${state.stats.totalWins.toLocaleString('ru-RU')} ₽`;
    elements.totalLevelsPassed.textContent = state.stats.totalLevelsPassed;
    
    updateHistoryList();
}

// Обновление истории
function updateHistoryList() {
    elements.statsHistory.innerHTML = '';
    
    if (state.stats.gameHistory.length === 0) {
        elements.statsHistory.innerHTML = '<div class="empty-history">Нет данных</div>';
        return;
    }
    
    state.stats.gameHistory.forEach(game => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span>${game.date}</span>
            <span>+${game.win.toLocaleString('ru-RU')} ₽ (${game.levels} ур.)</span>
        `;
        elements.statsHistory.appendChild(item);
    });
}

// Показать уведомление
function showNotification(message, type) {
    elements.notification.textContent = message;
    elements.notification.className = 'game-notification show';
    elements.notification.style.background = type === 'error' ? 'var(--danger)' : 
                                           type === 'warning' ? 'var(--warning)' : 'var(--success)';
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
if (isMobile) {
    // Настройки для мобильных
    config.cellWidth = 70;
    config.cellHeight = 90;
}
// Запуск игры
document.addEventListener('DOMContentLoaded', init);