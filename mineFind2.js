class MineFinder {
    constructor(className, mabSize) {
        this.container = document.querySelector(className);
        this.x = mabSize[1];
        this.y = mabSize[0];

        this.isPlay = false;
        this.isGameover = false;

        this.board = new Board(this);
        this.timer = new Timer(this);

        this.countColor = ['#0099FF', '#12AF30', '#ec4141', '#1020FF', '#801900', '#009E5F', '#C500A0', '#FF8900'];

        this.init();
    }

    init() {
        window.oncontextmenu = () => false;
    }

    result(value) {
        if (!this.isPlay) return;
        this.timer.pause();
        this.isPlay = false;

        const pop = document.createElement('div');
        pop.classList.add('result');
        pop.innerHTML = value ? `🥳` : `🥺`;

        this.board.el.append(pop);

        setTimeout(() => {
            pop.classList.add('on');
            this.pop = pop;
            this.waiting = true;
            pop.addEventListener('click', this.reset.bind(this));
        }, 0);
    }

    reset() {
        this.pop.classList.remove('on');

        this.board.el.removeAttribute('style');

        this.isGameover = false;
        this.waiting = false;

        this.timer.reset();
        this.board.reset();

        setTimeout(() => {
            this.pop?.remove();
            this.pop = null;
        }, 500);
    }

    gameOver() {
        this.isGameover = true;
        this.board.el.style.cssText = `
          animation: gameover 0.4s cubic-bezier(.36,.07,.19,.97) both;
        `;

        this.board.openMine();

        this.result(false);
    }
}

class Timer {
    constructor(parent) {
        this.timer = null;
        this.count = 0;
        this.el = parent.container.querySelector('.timer');

        this.render();
    }

    start() {
        this.timer = setInterval(() => {
            this.count += 1;
            this.render();
        }, 1000);
    }

    pause() {
        clearInterval(this.timer);
    }

    reset() {
        this.count = 0;
        this.render();
    }

    render() {
        this.el.innerHTML = String(this.count).padStart(2, '0');
    }
}

class Board {
    constructor(parnet) {
        this.game = parnet;

        this.el = parnet.container.querySelector('.board');
        this.x = parnet.x;
        this.y = parnet.y;
        this.mineCount = parnet.mineCount || Math.ceil(parnet.x * parnet.y * 0.1);
        this.init();
    }

    init() {
        const { x, y } = this;
        const board = [];
        for (let i = 0; i < x; i++) {
            board.push([]);
            for (let j = 0; j < y; j++) {
                board[i].push(new Cell(this));
                board[i][j].position = [i, j];
            }
        }

        this.board = board;
        this.render();
    }

    reset() {
        this.init();
    }

    openMine(){
      this.board.flat().filter(tile => tile.isMine && !tile.isOpen).forEach(mine => mine.open(false));
      this.board.flat().filter(tile => tile.isFlag && !tile.isMine).forEach(mine => mine.el.classList.add('fail'));
    }

    createMine(startPosition) {
        const { x, y } = this;
        const [startX, startY] = startPosition;
        let count = 0;
        while (count < this.mineCount) {
            let mineX = Math.floor(Math.random() * x),
                mineY = Math.floor(Math.random() * y);

            if (mineX === startX && mineY === startY) continue;

            if (this.board[mineX][mineY].isMine) {
                continue;
            } else {
                this.board[mineX][mineY].isMine = true;

                this.board[mineX][mineY].getNearTile().forEach((tile) => tile.count++);
                this.board[mineX][mineY].render();
                count++;
            }
        }
    }

    checkResult() {
        const result = this.board
            .flat()
            .filter((tile) => !tile.isMine)
            .every((tile) => tile.isOpen);
        if (result) {
            this.game.result(true);
        }
    }

    render() {
        this.el.innerHTML = '';
        this.board.forEach((row) => {
            const div = document.createElement('div');
            div.classList.add('row');
            this.el.append(div);
            row.forEach((col) => {
                div.append(col.el);
            });
        });
    }
}

class Cell {
    constructor(parent) {
        this.count = 0;

        this.game = parent.game;
        this.boardX = parent.x;
        this.boardY = parent.y;

        this.createMine = (...args) => parent.createMine(...args);
        this.checkResult = (...args) => parent.checkResult(...args);
        this.getTile = (x, y) => parent.board[x][y];

        this.isOpen = false;
        this.isFlag = false;
        this.isMine = false;

        this.init();
    }

    init() {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        this.el = cell;

        this.el.addEventListener('mousedown', (e) => {
            if (this.game.isGameover) return;
            if (e.button === 2 || e.witch === 3) {
                if (this.isOpen) {
                    const nearTile = this.getNearTile();
                    nearTile.forEach((tile) => {
                        this.inAnimationNears = true;
                        tile.el.classList.add('press');
                    });
                } else {
                    this.isFlag = !this.isFlag;
                    this.checkResult();
                    this.render();
                }
            } else {
                this.inAnimation = true;
                this.el.classList.add('press');
            }
        });

        this.el.addEventListener('mouseup', (e) => {
            if (this.inAnimation) {
                this.el.classList.remove('press');
                if (!this.isOpen) this.open();
            }

            if (this.inAnimationNears) {
                const nearTile = this.getNearTile();
                if (this.count === nearTile.filter((tile) => tile.isFlag).length) {
                    nearTile.forEach((tile) => {
                        tile.open();
                    });
                }
                nearTile.forEach((tile) => {
                    tile.el.classList.remove('press');
                });
            }
        });

        this.el.addEventListener('mouseleave', (e) => {
            if (this.inAnimation) {
                this.el.classList.remove('press');
            }

            if (this.inAnimationNears) {
                const nearTile = this.getNearTile();
                nearTile.forEach((tile) => {
                    tile.el.classList.remove('press');
                });
            }
        });

        this.render();
    }

    open(firstOpen = true) {
        if (this.isFlag) return;

        if (this.isOpen) return;
        this.isOpen = true;

        if (this.game.waiting) return;

        if (!this.game.isPlay) {
            this.game.isPlay = true;
            this.game.timer.start();
            this.createMine(this.position);
        }

        if (this.isMine) {
            this.render();
            if (firstOpen) this.el.classList.add('gamaover');
            return this.game.gameOver();
        }

        if (this.count === 0) {
            this.getNearTile().forEach((tile) => {
                tile.open(false);
            });
        }

        this.checkResult();
        this.render();
    }

    getNearTile() {
        const [x, y] = this.position;
        const result = [];

        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (x === i && y === j) continue;
                if (i < 0 || j < 0 || i >= this.boardX || j >= this.boardY) {
                    continue;
                } else {
                    result.push(this.getTile(i, j));
                }
            }
        }

        return result;
    }

    render() {
        if (this.isOpen) {
            this.el.classList.remove('close');
            if (this.isMine) {
                this.el.classList.add('mine');
                this.el.innerHTML = '⛭';
            } else {
                this.el.classList.remove('mine');
                if (this.count !== 0) {
                    this.el.style.color = this.game.countColor[this.count - 1];
                    this.el.innerHTML = this.count;
                }
            }
        } else {
            if (this.isFlag) {
                this.el.classList.add('flag');
            } else {
                this.el.classList.remove('flag');
                this.el.classList.add('close');
            }
        }
    }
}
