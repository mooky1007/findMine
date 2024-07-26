class MineFinder {
    constructor([x, y], difficult) {
        this.boardSize = {
            x: x || 10,
            y: y || 10,
        };
        this.init();

        this.timer = null;
        this.mineCount = Math.ceil((this.boardSize.x * this.boardSize.y) / Math.abs(difficult - 10));
        if (this.mineCount >= this.boardSize.x * this.boardSize.y) this.mineCount = Math.ceil((this.boardSize.x * this.boardSize.y) / 2);

        this.countColors = ['#3544cf', '#eb9824', '#1fa214', '#a026d1', '#d12626', '#4d3e51'];
        this.board = this.createEmptyBoardArr();
        this.createBoard();
    }

    init() {
        window.oncontextmenu = () => false;
        this.gameStatus = false;

        this.timeContainer = document.querySelector('.counter');
    }

    createBoard() {
        const table = document.querySelector('table');
        table.innerHTML = '';

        this.board.forEach((row, x) => {
            const tr = document.createElement('tr');
            row.forEach((col, y) => {
                col.el.addEventListener('mousedown', (e) => {
                    if (e.button === 2 || e.which === 3) {
                        if (col.open) return this.openNearTile(x, y);
                    }
                });
                col.dim.addEventListener('mousedown', (e) => this.clickEvent(e, x, y));
                // col.el.ondblclick = () => this.openNearTile(x, y);
                tr.append(col.el);
            });
            table.append(tr);
        });

        document.body.append(table);
    }

    createEmptyBoardArr() {
        let result = [];
        const { x, y } = this.boardSize;

        for (let i = 0; i < y; i++) {
            result.push([]);
            for (let j = 0; j < x; j++) result[i].push(new Cell());
        }

        return result;
    }

    setCounter() {
        this.time = 0;
        this.timer = setInterval(() => {
            this.time++;
            this.timeContainer.innerHTML = this.time < 10 ? `0${this.time}` : this.time;
        }, 1000);
    }

    start(x, y) {
        this.gameStatus = true;

        this.setCounter();
        this.createMine(x, y);
        this.render();
    }

    createMine(startX, startY) {
        const count = this.mineCount;
        for (let i = 0; i < count; i++) {
            let randomX = Math.floor(Math.random() * this.boardSize.x);
            let randomY = Math.floor(Math.random() * this.boardSize.y);

            if (randomX === startX && randomY === startY) {
                i--;
                continue;
            }

            if (this.board[randomX][randomY].isMine) {
                i--;
                continue;
            }

            this.board[randomX][randomY].isMine = true;

            this.getNearTile(randomX, randomY).forEach(([x, y]) => {
                if (this.board[x][y].isMine) return;
                this.board[x][y].count++;
            });
        }
    }

    restart() {
        console.log('restart');
        this.gameStatus = false;
        this.pop.remove();

        clearInterval(this.timer);
        this.timeContainer.innerHTML = '00';

        this.board = this.createEmptyBoardArr();
        this.createBoard();
        this.render();
    }

    getNearTile(posX, posY) {
        const result = [];
        for (let x = posX - 1; x <= posX + 1; x++) {
            for (let y = posY - 1; y <= posY + 1; y++) {
                if (0 <= x && 0 <= y && x < this.boardSize.x && y < this.boardSize.y) {
                    if (x === posX && y === posY) continue;
                    result.push([x, y]);
                }
            }
        }

        return result;
    }

    openTile(x, y, firstOpen = true) {
        if (!this.gameStatus) this.start(x, y);
        if (this.board[x][y].open) return;
        if (this.board[x][y].isFlag) return;

        if (this.board[x][y].isMine) {
            if (firstOpen) this.board[x][y].el.style.background = '#c30303';
            this.resultOpenAllTiles();
            return this.renderResultPop(false);
        } else {
            this.board[x][y].openCell();
        }

        if (this.board[x][y].count === 0) {
            this.getNearTile(x, y).forEach(([targetX, targetY]) => this.openTile(targetX, targetY, false));
        }

        if (firstOpen) this.checkGame();
    }

    async clickEvent(e, x, y) {
        if (e.button === 2 || e.which === 3) {
            this.board[x][y].flagCell();
            this.checkGame();
        } else {
            await this.board[x][y].pressCell();
            this.openTile(x, y);
        }
    }

    resultOpenAllTiles() {
        this.gameOver = true;
        this.board.forEach((row, rowIdx) => {
            row.forEach((col, colIdx) => {
                if (this.board[rowIdx][colIdx].open) return;
                if (this.board[rowIdx][colIdx].isFlag) {
                    if (!this.board[rowIdx][colIdx].isMine) {
                        this.board[rowIdx][colIdx].dim.innerText = '❌';
                        this.board[rowIdx][colIdx].dim.style.background = `rgba(0,0,0,0.1)`;
                        this.board[rowIdx][colIdx].dim.style.border = 'none';
                        return;
                    } else {
                        return;
                    }
                }

                this.board[rowIdx][colIdx].openCell();
            });
        });
    }

    renderResultPop(result) {
        clearInterval(this.timer);
        const pop = document.createElement('span');
        this.pop = pop;
        pop.style.cssText = `
          font-size: 128px;
          cursor: pointer;
          position: absolute;
          top: 52%;
          z-index: 9999;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: 1s;
        `;
        pop.innerHTML = result ? '🥳' : '🥺';
        document.body.append(pop);

        setTimeout(() => {
            pop.style.top = '50%';
            pop.style.opacity = 1;
            pop.addEventListener('click', () => this.restart());
        }, 50);
    }

    checkGame() {
        if (this.board.flat().filter((el) => el.open).length === this.mineCount) {
            this.resultOpenAllTiles();
            return this.renderResultPop(true);
        }
        if (this.board.flat().filter((el) => el.isFlag && el.isMine).length === this.mineCount) {
            this.resultOpenAllTiles();
            return this.renderResultPop(true);
        }
    }

    openNearTile(x, y) {
        const nearTiles = this.getNearTile(x, y);
        if (this.board[x][y].isFlag) return;

        nearTiles.forEach(([tileX, tileY]) => {
            if (this.board[tileX][tileY].open) return;
            if (this.board[tileX][tileY].isFlag) return;

            this.board[tileX][tileY].pressCell();
        });

        if (nearTiles.filter(([tileX, tileY]) => this.board[tileX][tileY].isFlag).length === this.board[x][y].count) {
            nearTiles.forEach(([tileX, tileY]) => {
                this.openTile(tileX, tileY);
            });
        }
    }

    render() {
        this.board.forEach((row) => {
            row.forEach((col) => {
                if (!col.isMine) {
                    if (col.count) {
                        col.el.style.color = this.countColors[col.count - 1];
                        col.countEl.innerHTML = col.count;
                    } else {
                        col.countEl.innerHTML = '';
                    }
                } else {
                    col.el.style.fontSize = '24px';
                    col.countEl.innerHTML = '✸';
                }

                if (col.isFlag) col.dim.innerHTML = '🚩';
            });
        });
    }
}

class Cell {
    constructor() {
        this.count = 0;
        this.open = false;
        this.isMine = false;
        this.isFlag = false;
        this.el = document.createElement('td');
        this.countEl = document.createElement('span');
        this.countEl.innerHTML = this.count;
        this.dim = document.createElement('div');
        this.dim.classList.add('dim');

        this.el.append(this.countEl, this.dim);
    }

    async pressCell() {
        return new Promise((resolve) => {
            if (this.isFlag) return resolve();
            this.dim.classList.add('press');
            setTimeout(() => {
                this.dim.classList.remove('press');
                return resolve();
            }, 150);
        });
    }

    flagCell() {
        if (this.isFlag) {
            this.isFlag = false;
            this.dim.innerHTML = '';
        } else {
            this.isFlag = true;
            this.dim.innerHTML = '🚩';
        }
    }

    openCell() {
        this.open = true;
        this.dim.remove();
    }
}
