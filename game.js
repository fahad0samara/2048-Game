class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameStarted = false;
        this.initGrid();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
        this.setupGameTips();
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
                    this.gameStarted = true;
                    this.showGameTip("Great start! Try to keep your highest numbers in a corner.");
                }
                switch(e.key) {
                    case 'ArrowUp': this.move('up'); break;
                    case 'ArrowDown': this.move('down'); break;
                    case 'ArrowLeft': this.move('left'); break;
                    case 'ArrowRight': this.move('right'); break;
                }
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
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
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
        this.showGameTip("New game started! Good luck!");
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

    move(direction) {
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
