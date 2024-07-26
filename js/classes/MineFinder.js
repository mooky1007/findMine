import Board from "./Board.js";
import Timer from "./Timer.js";

class MineFinder {
    constructor(boardSize) {
      this.boardSize = boardSize || [10,10];

      this.isPlay = false;

      this.board = new Board(this);
      this.timer = new Timer(this);

      this.init();
    }

    init() {
      this.createUI();
    }

    createUI(){
      const container = document.createElement('div');
      container.classList.add('container')
      document.body.prepend(container);

      container.append(this.board.el);
    }
}

export default MineFinder;