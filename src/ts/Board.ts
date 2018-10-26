import ShipSetter from './ShipSetter';
import {comment} from './decorators';

interface shipSetting {
    x: number;
    y: number;
    direction: boolean;
    size: number;
}

enum State {
    Empty,
    Taken,
    Hit,
    Miss
};
export enum Win{
    Player,
    Machine
}
export enum PlayerMoves{
    AlreadyShot,
    CantShoot,
    Hit,
    Miss,
}


export default class Board {
    board: number[][] = [];
    shots: number[][] = []
    width: number;
    height: number;
    htmlBoard: HTMLElement[][] = [];
    boardContainer: HTMLElement;
    lastProposed: shipSetting = null;
    allowShoot: boolean = false;
    toHit: number;
    hits: number = 0;
    endGame: Function;
    gameFinished: boolean = false;
    constructor(width: number, height: number, endGame:Function = null) {
        this.endGame = endGame;
        [this.width, this.height] = [width, height];
        for (let i = 0; i < height; i++) {
            const row: number[] = [];
            for (let j = 0; j < width; j++) {
                row.push(State.Empty);
                this.shots.push([i, j]);
            }
            this.board.push(row)
        }
    }
    createHTMLBoard(shipSetter: ShipSetter = null, board2: Board = null) {
        this.boardContainer = document.createElement("div")
        this.boardContainer.className = "board";        
        for (let i = 0; i < this.height; i++) {
            const row: HTMLElement[] = [];
            const rowDiv = document.createElement('div');
            rowDiv.className = "row";
            for (let j = 0; j < this.width; j++) {
                const cell = document.createElement("div");
                if (shipSetter) {
                    this.toHit = shipSetter.ships.reduce((a, b) => a + b);
                    cell.addEventListener('mouseover', (e) => this.checkShip(e, shipSetter, true));
                    cell.addEventListener('click', (e) => this.checkAndAddShip(e, shipSetter));

                }
                else {
                    cell.addEventListener('click', (e) => this.shoot(i, j, board2))
                }
                cell.className = "cell";
                cell.id = `${j}-${i}`;
                row.push(cell);
                rowDiv.appendChild(cell);

            }
            this.htmlBoard.push(row)
            this.boardContainer.appendChild(rowDiv);
        }
    }
    getHMTLBoard() { return this.boardContainer }
    addShip(x: number, y: number, length: number, direction: boolean, show: boolean = false) {
        for (let i = 0; i < length; i++) {
            let [X, Y] = [x, y];
            if (direction) Y = y + i;
            else X = x + i;
            this.board[Y][X] = State.Taken;
            if (show) {
                this.htmlBoard[Y][X].classList.add('blue');
            }
        }
    }
    drawShips(shipSizes: number[]) {
        this.toHit = shipSizes.reduce((a, b) => a + b);
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
                const s: shipSetting = {
                    x,
                    y,
                    direction,
                    size
                }
                const [shipsPos, surroundings] = generateCheckPositions(s, this.width, this.height);
                found = this.checkPositions(shipsPos, surroundings)
                if (found) this.addShip(x, y, size, direction);
            }
        }
    }
    checkPositions(ships: number[][], surroundings: number[][]): boolean {
        const s = ships.filter(pos => {
            return this.board[pos[1]][pos[0]] === State.Empty
        })
        const sur = surroundings.filter(pos => {
            return this.board[pos[1]][pos[0]] === State.Empty
        })
        return (ships.length === s.length && surroundings.length === sur.length)
    }
    viewShip(color: string, s: shipSetting) {
        const { x, y, direction, size } = s;
        for (let i = 0; i < size; i++) {
            let [X, Y] = [x, y];
            if (direction) Y = y + i;
            else X = x + i;
            if (X >= 0 && X < this.width && Y >= 0 && Y < this.height) {
                this.htmlBoard[Y][X].style.backgroundColor = color;
            }
        }
        this.lastProposed = s;
    }

    checkShip(e: Event, shipSetter: ShipSetter, view: boolean) {
        if (!shipSetter.selected) return false;
        const el = e.target as HTMLElement;
        const pos = el.id.split("-").map(a => parseInt(a));
        const ship: shipSetting = {
            x: pos[0],
            y: pos[1],
            direction: shipSetter.direction,
            size: shipSetter.selected
        }
        if (ship.x + ship.size > this.width && !ship.direction) {
            ship.x = this.width - ship.size;
        }
        if (ship.y + ship.size > this.height && ship.direction) {
            ship.y = this.width - ship.size;
        }
        const [shipsPos, surroundings] = generateCheckPositions(ship, this.width, this.height);
        const shipValid = this.checkPositions(shipsPos, surroundings);
        if (view) {
            if (this.lastProposed) {
                this.viewShip("", this.lastProposed);
            }
            this.viewShip(shipValid ? "green" : "red", ship);
        }
        return shipValid;
    }
    updateLastShip(dir: boolean) {
        if (!this.lastProposed) return;
        const s = { ...this.lastProposed };
        s.direction = dir;
        if (s.x + s.size > this.width && !s.direction) {
            s.x = this.width - s.size;
        }
        if (s.y + s.size > this.height && s.direction) {
            s.y = this.width - s.size;
        }
        const [shipsPos, surroundings] = generateCheckPositions(s, this.width, this.height);
        const shipValid = this.checkPositions(shipsPos, surroundings);
        this.viewShip("", this.lastProposed);
        this.viewShip(shipValid ? "green" : "red", s);
    }
    checkAndAddShip(e: Event, shipS: ShipSetter) {
        if (this.checkShip(e, shipS, false)) {
            this.viewShip("", this.lastProposed);
            const { x, y, direction, size } = this.lastProposed;
            this.addShip(x, y, size, direction, true);
            shipS.shipPlaced();
        }
    }
    @comment
    shoot(y: number, x: number, board2: Board) {
        if(this.gameFinished) return;
        if (!this.allowShoot) {
            document.getElementById('sexi-text').innerHTML = "Nie możesz teraz strzelać";
            return PlayerMoves.CantShoot;
        }
        if (this.board[y][x] === State.Miss || this.board[y][x] === State.Hit) {
            document.getElementById('sexi-text').innerHTML = "Już tam strzeliłeś";
            return PlayerMoves.AlreadyShot;
        }
        const hit = this.board[y][x] === State.Taken;
        this.board[y][x] = hit ? State.Hit : State.Miss;
        this.htmlBoard[y][x].classList.add(hit ? 'hit' : 'miss');
        document.getElementById('sexi-text').innerHTML = hit ? "Trafiony!<br>Ruch komputera" : "Pudło<br>Ruch komputera";
        this.allowShoot = false;
        if(hit) this.hits++;
        if(this.hits === this.toHit){
            this.endGame(Win.Player);
            this.gameFinished = true;
            return;
        }
        board2.randomShoot().then(([y, x, hit]) => {
            board2.htmlBoard[y][x].classList.add(hit ? 'hit' : 'miss');
            this.allowShoot = true;
            document.getElementById('sexi-text').innerHTML = "Twój ruch";
            if(board2.hits === board2.toHit) {
                this.endGame(Win.Machine);
                this.gameFinished = true;
            }
        });
        return hit ? PlayerMoves.Hit : PlayerMoves.Miss;

        
    }
    randomShoot() {
        return new Promise((resolve, reject) => {
            const r = Math.floor(Math.random() * this.shots.length);
            const [y, x] = this.shots[r];
            const hit = this.board[y][x] === State.Taken;            
            this.shots.splice(r, 1);
            if(hit) this.hits++;
            setTimeout(() => { resolve([y, x, hit]) }, 1000);
        });
    }
}

function generateCheckPositions(ship: shipSetting, width: number, height: number): number[][][] {
    const { x, y, size, direction } = ship;
    const positions: number[][] = []
    for (let i = -1; i < 2; i++) {
        if (!direction) {
            for (let j = -1; j < size + 1; j++) {
                positions.push([x + j, y + i]);
            }
        } else {
            for (let j = -1; j < size + 1; j++) {
                positions.push([x + i, y + j]);
            }
        }
    }
    const shipPos = positions.splice(size + 3, size);
    return [shipPos, positions.filter(pos => {
        return (pos[0] >= 0 && pos[0] < width) && (pos[1] >= 0 && pos[1] < height)
    })];
}
