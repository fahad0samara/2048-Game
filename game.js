class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameStarted = false;
        this.moveHistory = [];
        this.startTime = null;
        this.timerInterval = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.achievements = new Set(JSON.parse(localStorage.getItem('achievements')) || []);
        
        this.initGrid();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
        this.setupGameTips();
        this.updateSoundButton();
        this.renderAchievements();
    }

    initGrid() {
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill(0)
        );
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (!this.gameStarted) {
                    this.startGame();
                }
                switch(e.key) {
                    case 'ArrowUp': this.move('up'); break;
                    case 'ArrowDown': this.move('down'); break;
                    case 'ArrowLeft': this.move('left'); break;
                    case 'ArrowRight': this.move('right'); break;
                }
            }
        });

        // Touch support
        let touchStartX, touchStartY;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                if (!this.gameStarted) {
                    this.startGame();
                }
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                } else {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('sound-btn').addEventListener('click', () => {
            this.toggleSound();
        });
    }

    startGame() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        this.showGameTip("Great start! Try to keep your highest numbers in a corner.");
    }

    updateTimer() {
        const seconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        this.updateSoundButton();
    }

    updateSoundButton() {
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.textContent = this.soundEnabled ? '🔊' : '🔈';
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const sounds = {
            merge: [440, 0.1],
            move: [220, 0.05],
            achievement: [660, 0.15]
        };

        const [frequency, duration] = sounds[type] || sounds.move;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }

    move(direction) {
        // Save current state for undo
        this.moveHistory.push({
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        });
        document.getElementById('undo-btn').disabled = false;

        let moved = false;
        const rotatedGrid = this.rotateGrid(direction);
        
        for (let r = 0; r < this.gridSize; r++) {
            const row = rotatedGrid[r].filter(cell => cell !== 0);
            
            for (let c = 0; c < row.length - 1; c++) {
                if (row[c] === row[c + 1]) {
                    row[c] *= 2;
                    this.score += row[c];
                    row.splice(c + 1, 1);
                    moved = true;
                    this.playSound('merge');
                    this.checkAchievement(row[c]);
                }
            }
            
            while (row.length < this.gridSize) {
                row.push(0);
            }
            
            rotatedGrid[r] = row;
        }
        
        this.grid = this.unrotateGrid(rotatedGrid, direction);
        
        if (moved) {
            this.addRandomTile();
            this.renderGrid();
            this.updateScores();
            this.checkGameStatus();
            this.playSound('move');
        }
    }

    undo() {
        if (this.moveHistory.length === 0) return;
        
        const lastState = this.moveHistory.pop();
        this.grid = lastState.grid;
        this.score = lastState.score;
        
        this.renderGrid();
        this.updateScores();
        
        document.getElementById('undo-btn').disabled = this.moveHistory.length === 0;
    }

    checkAchievement(value) {
        const achievements = {
            '64': { emoji: '🎯', text: 'First 64 tile!' },
            '128': { emoji: '🎮', text: 'Power player: 128 reached!' },
            '256': { emoji: '⭐', text: 'Star player: 256 achieved!' },
            '512': { emoji: '🏆', text: 'Trophy hunter: 512 conquered!' },
            '1024': { emoji: '👑', text: 'Crown worthy: 1024 mastered!' },
            '2048': { emoji: '🎉', text: 'Game master: 2048 reached!' }
        };

        if (achievements[value] && !this.achievements.has(String(value))) {
            this.achievements.add(String(value));
            localStorage.setItem('achievements', JSON.stringify([...this.achievements]));
            this.showAchievement(achievements[value]);
            this.playSound('achievement');
        }
    }

    showAchievement(achievement) {
        const achievementsList = document.getElementById('achievements-list');
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement-item';
        achievementElement.innerHTML = `
            <span class="emoji">${achievement.emoji}</span>
            <span class="text">${achievement.text}</span>
        `;
        achievementsList.appendChild(achievementElement);
    }

    renderAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        
        const achievements = {
            '64': { emoji: '🎯', text: 'First 64 tile!' },
            '128': { emoji: '🎮', text: 'Power player: 128 reached!' },
            '256': { emoji: '⭐', text: 'Star player: 256 achieved!' },
            '512': { emoji: '🏆', text: 'Trophy hunter: 512 conquered!' },
            '1024': { emoji: '👑', text: 'Crown worthy: 1024 mastered!' },
            '2048': { emoji: '🎉', text: 'Game master: 2048 reached!' }
        };

        this.achievements.forEach(value => {
            if (achievements[value]) {
                this.showAchievement(achievements[value]);
            }
        });
    }

    setupGameTips() {
        this.tips = [
            "Keep your highest number in a corner!",
            "Try to maintain a chain of decreasing numbers",
            "Don't spread out your big numbers",
            "Plan ahead! Look at where new tiles might appear",
            "Sometimes it's worth making a suboptimal move to set up a better one",
            "Keep multiple merge options open",
            "Build towards your highest tile methodically"
        ];
        this.showGameTip("Welcome! Start by moving tiles with arrow keys.");
    }

    showGameTip(tip) {
        const tipElement = document.getElementById('game-tip');
        tipElement.textContent = tip;
        tipElement.classList.remove('highlight');
        void tipElement.offsetWidth; // Trigger reflow
        tipElement.classList.add('highlight');
    }

    restartGame() {
        this.grid = [];
        this.score = 0;
        this.gameStarted = false;
        this.moveHistory = [];
        this.startTime = null;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
        this.showGameTip("New game started! Good luck!");
        document.getElementById('undo-btn').disabled = true;
        document.getElementById('time').textContent = '00:00';
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    rotateGrid(direction) {
        let rotated = JSON.parse(JSON.stringify(this.grid));
        
        switch(direction) {
            case 'left': return rotated;
            case 'right': 
                return rotated.map(row => row.reverse());
            case 'up':
                return rotated[0].map((_, colIndex) => 
                    rotated.map(row => row[colIndex]).reverse()
                );
            case 'down':
                return rotated[0].map((_, colIndex) => 
                    rotated.map(row => row[colIndex])
                );
        }
    }

    unrotateGrid(rotatedGrid, direction) {
        switch(direction) {
            case 'left': return rotatedGrid;
            case 'right': 
                return rotatedGrid.map(row => row.reverse());
            case 'up':
                return rotatedGrid[0].map((_, colIndex) => 
                    rotatedGrid.map(row => row[colIndex]).reverse()
                );
            case 'down':
                return rotatedGrid[0].map((_, colIndex) => 
                    rotatedGrid.map(row => row[colIndex])
                );
        }
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tileValue = this.grid[r][c];
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile');
                
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`);
                    tileElement.classList.add('new-tile');
                }
                
                gridElement.appendChild(tileElement);
            }
        }
    }

    updateScores() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            document.getElementById('best-score').textContent = this.bestScore;
            this.showGameTip("New high score! Keep going!");
        } else {
            document.getElementById('best-score').textContent = this.bestScore;
        }
    }

    checkGameStatus() {
        // Check for win condition (2048 tile)
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 2048) {
                    this.showGameTip("Congratulations! You've reached 2048! Keep going for a higher score!");
                    return;
                }
            }
        }

        // Check for lose condition (no moves possible)
        const hasEmptyCell = this.grid.some(row => row.includes(0));
        const canMerge = this.checkMergePossible();

        if (!hasEmptyCell && !canMerge) {
            this.showGameTip("Game Over! Click 'New Game' to try again!");
        } else if (!hasEmptyCell && this.gameStarted) {
            this.showGameTip("Board is filling up! Plan your moves carefully!");
        }
    }

    checkMergePossible() {
        // Check if any adjacent tiles can be merged
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const current = this.grid[r][c];
                
                // Check right
                if (c < this.gridSize - 1 && current === this.grid[r][c + 1]) return true;
                
                // Check down
                if (r < this.gridSize - 1 && current === this.grid[r + 1][c]) return true;
            }
        }
        return false;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
