// Конфигурация игры
const config = {
    startBalance: 10000,
    betOptions: [10, 50, 100, 500],
    baseMultiplier: 1.0,
    visibleLevels: 3,
    multiplierStep: 0.5,
    levelHeight: 120,
    levelSpacing: 10,
    cellWidth: 80,
    cellHeight: 100,
    cellBackground: 'rgba(108, 92, 231, 0.1)',
    cellBorder: '1px solid rgba(108, 92, 231, 0.3)',
    animationDuration: 300,
    maxLevels: 10 // добавлено
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
    gameTimer: null,
    stats: {
        totalWins: 0,
        totalLevelsPassed: 0,
        gameHistory: []
    },
    gameStartTime: null,
    elapsedSeconds: 0,
    statsIntervalId: null
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
    statsHistory: document.getElementById('statsHistory'),
    multiplierInfo: document.getElementById('multiplierInfo'),
    progressFill: document.getElementById('progressFill'),
    gameTime: document.getElementById('gameTime')
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
    updateStats();
}

function checkElements() {
    return Object.values(elements).every(element => {
        if (Array.isArray(element)) return true; // для NodeList
        if (!element) console.warn('Элемент не найден:', element);
        return !!element;
    });
}

function setupEventListeners() {
    elements.betOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.getAttribute('data-amount') || btn.textContent);
            selectBetAmount(amount);
        });
    });

    elements.startBtn.addEventListener('click', startGame);
    elements.cashoutBtn.addEventListener('click', cashout);
    elements.topupBtn.addEventListener('click', topupBalance);
    elements.levelContainer.addEventListener('click', handleCellClick);

    if (elements.statsBtn && elements.closeStats) {
        elements.statsBtn.addEventListener('click', showStats);
        elements.closeStats.addEventListener('click', hideStats);
    }

    if (elements.statsModal) {
        elements.statsModal.addEventListener('click', (e) => {
            if (e.target === elements.statsModal) hideStats();
        });
    }
}

function showStats() {
    if (!elements.statsModal) return;
    elements.statsModal.classList.add('active');
    updateStats();
}

function hideStats() {
    if (!elements.statsModal) return;
    elements.statsModal.classList.remove('active');
}

function startGame() {
    if (state.isGameActive) {
        showNotification("Игра уже начата! 🎮", 'warning');
        return;
    }
    
    if (state.balance < state.currentBet) {
        showNotification("Недостаточно средств 😔", 'error');
        return;
    }
    
    if (state.currentBet <= 0) {
        showNotification("Выберите сумму ставки 💰", 'warning');
        return;
    }
    
    state.balance -= state.currentBet;
    state.isGameActive = true;
    state.currentMultiplier = config.baseMultiplier;
    state.levelsPassed = 0;
    state.currentLevel = 1;
    
    elements.levelContainer.innerHTML = '';
    
    state.gameStartTime = Date.now();
    state.elapsedSeconds = 0;
    if (state.statsIntervalId) clearInterval(state.statsIntervalId);
    state.statsIntervalId = setInterval(() => {
        if (state.gameStartTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
            updateStats();
        }
    }, 1000);

    createLevel();
    
    elements.startBtn.disabled = true;
    elements.cashoutBtn.disabled = false;
    updateCashoutButton();
    updateUI();
}

function createLevel() {
    const levelRow = document.createElement('div');
    levelRow.className = 'level-row animate__animated animate__fadeInUp';

    // Динамический шанс успеха в зависимости от текущего уровня
    let successChance;
    if (state.currentLevel <= 5) {
        successChance = 1; // 80% на первых 5 уровнях
    } else if (state.currentLevel <= 10) {
        successChance = 0.6; // 60% на уровнях 6-10
    } else if (state.currentLevel <= 15) {
        successChance = 0.4; // 40% на уровнях 11-15
    } else {
        successChance = 0.2; // 20% на высоких уровнях
    }

    // Определяем правильную ячейку с учетом шанса
    state.currentCorrectIndex = Math.random() < successChance 
        ? Math.floor(Math.random() * 3) // Выбираем случайную правильную
        : -1; // Все ячейки неправильные (если не повезло)

    const multiplierValue = state.currentMultiplier.toFixed(2);

    for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'level-cell';
        cell.dataset.index = i;
        cell.innerHTML = `
            <span class="level-number left">${state.currentLevel}</span>
            <span class="level-multiplier">${multiplierValue}x</span>
            <span class="level-number right">${state.currentLevel}</span>
        `;
        
        // Помечаем правильную ячейку (если она есть)
        if (i === state.currentCorrectIndex) {
            cell.dataset.correct = "true";
        }

        levelRow.appendChild(cell);
    }

    elements.levelContainer.appendChild(levelRow);
    
    // Удаляем старые уровни, если их слишком много
    const maxRendered = Math.max(config.visibleLevels * 2, 10);
    while (elements.levelContainer.children.length > maxRendered) {
        elements.levelContainer.removeChild(elements.levelContainer.firstChild);
    }

    setTimeout(() => {
        levelRow.classList.remove('animate__fadeInUp');
    }, 300);
}

function handleCellClick(e) {
    if (!state.isGameActive || state.isAnimating) return;
    
    const cell = e.target.closest('.level-cell');
    if (!cell) return;
    
    state.isAnimating = true;
    const selectedIndex = parseInt(cell.dataset.index, 10);
    
    // Проверяем, есть ли вообще правильная ячейка на этом уровне
    const hasCorrectCell = state.currentCorrectIndex >= 0;
    const isCorrect = hasCorrectCell && (selectedIndex === state.currentCorrectIndex);
    
    cell.classList.add(isCorrect ? 'correct-option' : 'wrong-choice');
    cell.classList.add('animate__animated', isCorrect ? 'animate__pulse' : 'animate__headShake');
    
    setTimeout(() => {
        if (isCorrect) {
            handleLevelSuccess();
        } else {
            // Если нет правильной ячейки - всегда проигрыш
            handleGameOver();
        }
        state.isAnimating = false;
    }, 800);
}

function handleLevelSuccess() {
  // Создаем эффект подъема
  const levelUpEffect = document.createElement('div');
  levelUpEffect.className = 'level-up-effect';
  levelUpEffect.textContent = `+${config.multiplierStep.toFixed(1)}x`;
  
  // Позиционируем относительно игрового поля
  const gameRect = elements.levelContainer.getBoundingClientRect();
  levelUpEffect.style.left = `${gameRect.width / 2}px`;
  levelUpEffect.style.top = `${gameRect.height / 2}px`;
  
  // Добавляем в контейнер
  elements.levelContainer.appendChild(levelUpEffect);
  
  // Удаляем после анимации
  setTimeout(() => {
    levelUpEffect.remove();
  }, 1000);

  // Стандартная логика
  state.levelsPassed++;
  state.currentMultiplier += config.multiplierStep;
  state.currentLevel++;
  
  updateMultiplierDisplay();
  createLevel();
  updateCashoutButton();
  showNotification(`Уровень ${state.levelsPassed} пройден! 🎉`, 'success');
}


function handleGameOver() {
    showNotification(`Проигрыш: -${state.currentBet} ₽ 😞`, 'error');
    endGame(false);
}

function endGame(isWin) {
    if (state.statsIntervalId) {
        clearInterval(state.statsIntervalId);
        state.statsIntervalId = null;
    }
    state.gameStartTime = null;

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

function cashout() {
    if (!state.isGameActive) return;
    
    const winAmount = Math.floor(state.currentBet * state.currentMultiplier);
    showNotification(`Вывод: +${winAmount} ₽ 💸`, 'success');
    endGame(true);
}

function updateMultiplierDisplay() {
    if (elements.multiplierInfo) {
        elements.multiplierInfo.textContent = `${state.currentMultiplier.toFixed(2)}x`;
    }
    if (elements.progressFill) {
        const progress = Math.min(100, (state.currentLevel / config.maxLevels) * 100);
        elements.progressFill.style.width = `${progress}%`;
    }
}

function selectBetAmount(amount) {
    state.currentBet = Math.min(amount, state.balance);
    updateUI();
    updateCashoutButton();
}

function topupBalance() {
    state.balance += 10000;
    updateUI();
    showNotification("Баланс пополнен на 10 000 ₽ ✅", 'success');
}

function updateUI() {
    if (elements.balance) elements.balance.textContent = `${state.balance.toLocaleString('ru-RU')} ₽`;
    elements.betOptions.forEach(btn => {
        const amount = parseInt(btn.getAttribute('data-amount') || btn.textContent);
        btn.classList.toggle('active', amount === state.currentBet);
    });

    updateCashoutButton();
}

function updateCashoutButton() {
    const winAmount = Math.floor(state.currentBet * state.currentMultiplier);
    if (elements.cashoutAmount) {
        elements.cashoutAmount.textContent = winAmount;
    }
    if (elements.cashoutBtn) {
        elements.cashoutBtn.disabled = !state.isGameActive;
    }
}

function formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function updateStats() {
    if (elements.initialDeposit) elements.initialDeposit.textContent = `${config.startBalance.toLocaleString('ru-RU')} ₽`;
    if (elements.currentBalanceStat) elements.currentBalanceStat.textContent = `${state.balance.toLocaleString('ru-RU')} ₽`;
    if (elements.totalWins) elements.totalWins.textContent = `${state.stats.totalWins.toLocaleString('ru-RU')} ₽`;
    if (elements.totalLevelsPassed) elements.totalLevelsPassed.textContent = state.stats.totalLevelsPassed;

    if (elements.gameTime) {
        const t = state.elapsedSeconds || 0;
        elements.gameTime.textContent = formatTime(t);
    }

    if (elements.statsHistory) {
        elements.statsHistory.innerHTML = state.stats.gameHistory.length 
            ? state.stats.gameHistory.map(game => `
                <div class="history-item ${game.win > 0 ? 'win' : 'loss'}">
                    <span>${game.date}</span>
                    <span>${game.win > 0 ? '+' : ''}${game.win.toLocaleString('ru-RU')} ₽</span>
                </div>
            `).join('')
            : '<div class="empty-history">Нет данных</div>';
    }
}

function showNotification(message, type) {
    if (!elements.notification) return;
    
    elements.notification.textContent = message;
    elements.notification.className = `game-notification show ${type}`;
    
    setTimeout(() => {
        if (elements.notification) elements.notification.classList.remove('show');
    }, 3000);
}

function checkMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    if (isMobile) {
        config.cellWidth = 70;
        config.cellHeight = 90;
    }
}

// 1. Добавляем CSS для анимации
const style = document.createElement('style');
style.textContent = `
  @keyframes levelUpRise {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -150px) scale(1.5);
      opacity: 0;
    }
  }
  .level-up-animation {
    position: absolute;
    font-size: 2rem;
    font-weight: bold;
    color: #00b894;
    z-index: 1000;
    animation: levelUpRise 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
    pointer-events: none;
    left: 50%;
    top: 50%;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    white-space: nowrap;
  }
`;
document.head.appendChild(style);

// 2. Модифицируем функцию handleLevelSuccess
function handleLevelSuccess() {
  // Создаем анимацию подъёма
  const riseAnimation = document.createElement('div');
  riseAnimation.className = 'level-up-animation';
  
  // Разные сообщения для разных уровней
  let message;
  if (state.currentLevel <= 3) {
    message = `Лёгкий уровень! +${config.multiplierStep.toFixed(1)}x`;
    riseAnimation.style.color = '#00b894'; // Зелёный
  } else if (state.currentLevel <= 7) {
    message = `Хорошо! +${config.multiplierStep.toFixed(1)}x`;
    riseAnimation.style.color = '#fdcb6e'; // Жёлтый
  } else {
    message = `Невероятно! +${config.multiplierStep.toFixed(1)}x`;
    riseAnimation.style.color = '#6c5ce7'; // Фиолетовый
  }
  
  riseAnimation.textContent = message;
  
  // Позиционируем по центру игрового поля
  const gameRect = elements.levelContainer.getBoundingClientRect();
  const centerX = gameRect.left + gameRect.width / 2;
  const centerY = gameRect.top + gameRect.height / 2;
  
  riseAnimation.style.left = `${centerX}px`;
  riseAnimation.style.top = `${centerY}px`;
  
  document.body.appendChild(riseAnimation);
  
  // Удаляем после завершения анимации
  setTimeout(() => {
    riseAnimation.remove();
  }, 800);

  // Стандартная логика прогресса
  state.levelsPassed++;
  state.currentMultiplier += config.multiplierStep;
  state.currentLevel++;
  
  updateMultiplierDisplay();
  createLevel();
  updateCashoutButton();
  showNotification(`Уровень ${state.levelsPassed} пройден! 🎉`, 'success');
}

// 3. Обновляем handleCellClick для корректной работы
function handleCellClick(e) {
    if (!state.isGameActive || state.isAnimating) return;
    
    const cell = e.target.closest('.level-cell');
    if (!cell) return;
    
    state.isAnimating = true;
    const selectedIndex = parseInt(cell.dataset.index, 10);
    const isCorrect = selectedIndex === state.currentCorrectIndex;
    
    cell.classList.add(isCorrect ? 'correct-option' : 'wrong-choice');
    cell.classList.add('animate__animated', isCorrect ? 'animate__pulse' : 'animate__headShake');
    
    setTimeout(() => {
        if (isCorrect) {
            handleLevelSuccess(); // Вызываем нашу новую функцию
        } else {
            handleGameOver();
        }
        state.isAnimating = false;
    }, 500);
}


// Запуск игры
checkMobile();
document.addEventListener('DOMContentLoaded', init);