import Cell from './Cell.js';

class Board {
    constructor(parent) {
        this.game = parent;

        this.boardWidth = parent.boardSize[1];
        this.boardHeight = parent.boardSize[0];

        this.mineCount = this.boardWidth * this.boardHeight * 0.1;
        this.data = [];

        this.init();
    }

    init() {
        this.el = document.createElement('div');
        this.el.classList.add('board');

        for (let i = 0; i < this.boardHeight; i++) {
            let rowDiv = document.createElement('div');
            rowDiv.classList.add('row');
            this.data.push([]);
            for (let j = 0; j < this.boardWidth; j++) {
                let cell = new Cell(this);
                cell.position = [i, j];
                cell.init();

                this.data[i].push(cell);
                rowDiv.append(cell.el);
                cell.render();
            }
            this.el.append(rowDiv);
        }
    }

    createMine(startPosition) {
        let mines = 0;
        while (mines < this.mineCount) {
            const randomX = Math.floor(Math.random() * this.boardWidth);
            const randomY = Math.floor(Math.random() * this.boardHeight);

            if(randomX === startPosition[0] || randomY === startPosition[1]) continue;
            
            if (this.data[randomX][randomY].isMine) {
                continue;
            }

            this.data[randomX][randomY].isMine = true;
            this.data[randomX][randomY].render();

            this.data[randomX][randomY].getNearTile().forEach(tile => {
              tile.count ++;
              tile.render();
            })
            mines++;
        }
    }
}

export default Board;
