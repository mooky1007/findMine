class Cell {
    constructor(parent) {
        this.game = parent.game;
        this.count = 0;
        this.isMine = false;
        this.isOpen = false;
    }

    init() {
        this.el = document.createElement('div');
        this.el.classList.add('cell');
        this.el.addEventListener('click', () => {
            this.open();
        });
    }

    getNearTile() {
        const [x, y] = this.position;
        let result = [];

        for (let i = y - 1; i <= y + 1; i++) {
            for (let j = x - 1; j <= x + 1; j++) {
                if (x === j && y === i) continue;
                if (i < 0 || j < 0 || i > this.game.boardSize[1] - 1 || j > this.game.boardSize[0] - 1) continue;
                result.push(this.game.board.data[j][i]);
            }
        }
        return result;
    }

    open() {
        if (!this.game.isPlay) {
            this.game.board.createMine(this.position);
            this.game.isPlay = true;
        }

        if (this.isOpen) return;
        this.isOpen = true;

        if (this.count === 0) {
            this.getNearTile().forEach((el) => {
                el.open();
            });
        }
        this.render();
    }

    render() {
        if (!this.isOpen) {
            return this.el.classList.add('close');
        } else {
            this.el.classList.remove('close');
        }

        this.el.innerHTML = this.count ? this.count : '';

        if (this.isMine) {
            this.el.innerHTML = 'x';
            this.el.style.border = `1px solid red`;
        }
    }
}

export default Cell;
