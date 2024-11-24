class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameStarted = false;
        this.canMove = true;
        
        this.initGrid();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScore();
        
        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'classic';
        this.setTheme(savedTheme);
        if (document.getElementById('theme-selector')) {
            document.getElementById('theme-selector').value = savedTheme;
        }
    }

    initGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.canMove) return;
            
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(e.key)) {
                e.preventDefault();
                let direction = e.key;
                
                // Map WASD to arrow keys
                if (e.key === "a") direction = "ArrowLeft";
                if (e.key === "d") direction = "ArrowRight";
                if (e.key === "w") direction = "ArrowUp";
                if (e.key === "s") direction = "ArrowDown";
                
                this.move(direction);
            }
        });

        // Theme selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        // New game button
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // Undo button
        const undoBtn = document.getElementById('undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        const bestScoreElement = document.getElementById('best-score');
        
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score}`;
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        
        if (bestScoreElement) {
            bestScoreElement.textContent = `Best: ${this.bestScore}`;
        }
    }

    move(direction) {
        let moved = false;
        const oldGrid = JSON.parse(JSON.stringify(this.grid));
        const oldScore = this.score;

        switch(direction) {
            case "ArrowLeft":
                moved = this.moveLeft();
                break;
            case "ArrowRight":
                moved = this.moveRight();
                break;
            case "ArrowUp":
                moved = this.moveUp();
                break;
            case "ArrowDown":
                moved = this.moveDown();
                break;
        }

        if (moved) {
            this.addRandomTile();
            this.renderGrid();
            this.updateScore();
            
            if (this.checkGameOver()) {
                alert('Game Over! Click New Game to try again.');
            }
        }
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.gridSize; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                    moved = true;
                }
            }
            while (row.length < this.gridSize) {
                row.push(0);
            }
            if (row.join(',') !== this.grid[i].join(',')) {
                moved = true;
            }
            this.grid[i] = row;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < this.gridSize; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    moved = true;
                    j--;
                }
            }
            while (row.length < this.gridSize) {
                row.unshift(0);
            }
            if (row.join(',') !== this.grid[i].join(',')) {
                moved = true;
            }
            this.grid[i] = row;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < this.gridSize; j++) {
            let column = [];
            for (let i = 0; i < this.gridSize; i++) {
                column.push(this.grid[i][j]);
            }
            column = column.filter(cell => cell !== 0);
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                    moved = true;
                }
            }
            while (column.length < this.gridSize) {
                column.push(0);
            }
            for (let i = 0; i < this.gridSize; i++) {
                if (this.grid[i][j] !== column[i]) {
                    moved = true;
                }
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < this.gridSize; j++) {
            let column = [];
            for (let i = 0; i < this.gridSize; i++) {
                column.push(this.grid[i][j]);
            }
            column = column.filter(cell => cell !== 0);
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                    moved = true;
                    i--;
                }
            }
            while (column.length < this.gridSize) {
                column.unshift(0);
            }
            for (let i = 0; i < this.gridSize; i++) {
                if (this.grid[i][j] !== column[i]) {
                    moved = true;
                }
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        if (!gridElement) return;
        
        gridElement.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                if (this.grid[i][j] !== 0) {
                    const tileInner = document.createElement('div');
                    tileInner.className = 'tile-inner';
                    tileInner.textContent = this.grid[i][j];
                    tile.classList.add(`tile-${this.grid[i][j]}`);
                    tile.appendChild(tileInner);
                }
                
                gridElement.appendChild(tile);
            }
        }
    }

    checkGameOver() {
        // Check for any empty cells
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for any possible merges
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                
                // Check right
                if (j < this.gridSize - 1 && current === this.grid[i][j + 1]) return false;
                
                // Check down
                if (i < this.gridSize - 1 && current === this.grid[i + 1][j]) return false;
            }
        }

        return true;
    }

    resetGame() {
        this.grid = [];
        this.score = 0;
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScore();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
