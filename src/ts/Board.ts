import Cell from './Cell';
import Ship from './Ship';
let colors: string[] = ["blue", "red", "green", "yellow"];
export default class Board {
    board: number[][] = [];
    width: number;
    height: number;
    htmlBoard: HTMLElement[][] = [];
    boardContainer: HTMLElement;
    ships: Ship[] = [];
    constructor(width: number, height: number) {
        [this.width, this.height] = [width, height];
        for (let i = 0; i < height; i++) {
            const row: number[] = [];
            for (let j = 0; j < width; j++) {
                row.push(0);
            }
            this.board.push(row)
        }
        this.createHTMLBoard();
    }
    createHTMLBoard() {
        this.boardContainer = document.createElement("div")
        this.boardContainer.className = "board";
        for (let i = 0; i < this.height; i++) {
            const row: HTMLElement[] = [];
            const rowDiv = document.createElement('div');
            rowDiv.className = "row";
            for (let j = 0; j < this.width; j++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                row.push(cell);
                rowDiv.appendChild(cell);

            }
            this.htmlBoard.push(row)
            this.boardContainer.appendChild(rowDiv);
        }
    }
    getHMTLBoard() { return this.boardContainer }
    addShip(x: number, y: number, length: number, direction: boolean = false) {
        for (let i = 0; i < length; i++) {
            let [X, Y] = [x, y];
            if (direction) Y = y + i;
            else X = x + i;
            this.board[Y][X] = 1;
            this.htmlBoard[Y][X].style.backgroundColor = colors[length - 1];
        }
    }
    drawShips(shipSizes: number[]) {
        while (shipSizes.length > 0) {
            const size = shipSizes.pop();
            let found = false;            
            while (!found) {
                let [x, y, direction] = [Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height), Math.random() < 0.5];
                if (x > this.width - size && !direction) {
                    continue;
                }
                if (y > this.height - size && direction) {
                    continue;
                }
                if (size === 4) {

                    this.addShip(x, y, size, direction)
                    break;
                }
                const [shipsPos, surroundings] = generateCheckPositions(x, y, size, this.width, this.height, direction);
                const checkedShipsPos = shipsPos.filter(pos => {
                    return this.board[pos[1]][pos[0]] === 0
                })
                const checkedSurroundings = surroundings.filter(pos => {
                    return this.board[pos[1]][pos[0]] === 0
                })
                found = (shipsPos.length === checkedShipsPos.length && surroundings.length === checkedSurroundings.length);
                if (found) this.addShip(x, y, size, direction);
            }
        }
    }
}
function generateCheckPositions(x: number, y: number, length: number, width: number, height: number, direction: boolean = false, ): number[][][] {
    const positions: number[][] = []
    for (let i = -1; i < 2; i++) {
        if (!direction) {
            for (let j = -1; j < length + 1; j++) {
                positions.push([x + j, y + i]);
            }
        } else {
            for (let j = -1; j < length + 1; j++) {
                positions.push([x + i, y + j]);
            }
        }
    }
    const shipPos = positions.splice(length + 3, length);
    return [shipPos, positions.filter(pos => {
        return (pos[0] >= 0 && pos[0] < width) && (pos[1] >= 0 && pos[1] < height)
    })];
}