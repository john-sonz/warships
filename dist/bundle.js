(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    board: [10, 10],
    shipsSizes: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4]
};

},{}],2:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorators_1 = require("./decorators");
var State;
(function (State) {
    State[State["Empty"] = 0] = "Empty";
    State[State["Taken"] = 1] = "Taken";
    State[State["Hit"] = 2] = "Hit";
    State[State["Miss"] = 3] = "Miss";
})(State || (State = {}));
;
var Win;
(function (Win) {
    Win[Win["Player"] = 0] = "Player";
    Win[Win["Machine"] = 1] = "Machine";
})(Win = exports.Win || (exports.Win = {}));
var PlayerMoves;
(function (PlayerMoves) {
    PlayerMoves[PlayerMoves["AlreadyShot"] = 0] = "AlreadyShot";
    PlayerMoves[PlayerMoves["CantShoot"] = 1] = "CantShoot";
    PlayerMoves[PlayerMoves["Hit"] = 2] = "Hit";
    PlayerMoves[PlayerMoves["Miss"] = 3] = "Miss";
})(PlayerMoves = exports.PlayerMoves || (exports.PlayerMoves = {}));
class Board {
    constructor(width, height, endGame = null) {
        this.board = [];
        this.shots = [];
        this.htmlBoard = [];
        this.lastProposed = null;
        this.allowShoot = false;
        this.hits = 0;
        this.gameFinished = false;
        this.endGame = endGame;
        [this.width, this.height] = [width, height];
        for (let i = 0; i < height; i++) {
            const row = [];
            for (let j = 0; j < width; j++) {
                row.push(State.Empty);
                this.shots.push([i, j]);
            }
            this.board.push(row);
        }
    }
    createHTMLBoard(shipSetter = null, board2 = null) {
        this.boardContainer = document.createElement("div");
        this.boardContainer.className = "board";
        for (let i = 0; i < this.height; i++) {
            const row = [];
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
                    cell.addEventListener('click', (e) => this.shoot(i, j, board2));
                }
                cell.className = "cell";
                cell.id = `${j}-${i}`;
                row.push(cell);
                rowDiv.appendChild(cell);
            }
            this.htmlBoard.push(row);
            this.boardContainer.appendChild(rowDiv);
        }
    }
    getHMTLBoard() { return this.boardContainer; }
    addShip(x, y, length, direction, show = false) {
        for (let i = 0; i < length; i++) {
            let [X, Y] = [x, y];
            if (direction)
                Y = y + i;
            else
                X = x + i;
            this.board[Y][X] = State.Taken;
            if (show) {
                this.htmlBoard[Y][X].classList.add('blue');
            }
        }
    }
    drawShips(shipSizes) {
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
                    this.addShip(x, y, size, direction);
                    break;
                }
                const s = {
                    x,
                    y,
                    direction,
                    size
                };
                const [shipsPos, surroundings] = generateCheckPositions(s, this.width, this.height);
                found = this.checkPositions(shipsPos, surroundings);
                if (found)
                    this.addShip(x, y, size, direction);
            }
        }
    }
    checkPositions(ships, surroundings) {
        const s = ships.filter(pos => {
            return this.board[pos[1]][pos[0]] === State.Empty;
        });
        const sur = surroundings.filter(pos => {
            return this.board[pos[1]][pos[0]] === State.Empty;
        });
        return (ships.length === s.length && surroundings.length === sur.length);
    }
    viewShip(color, s) {
        const { x, y, direction, size } = s;
        for (let i = 0; i < size; i++) {
            let [X, Y] = [x, y];
            if (direction)
                Y = y + i;
            else
                X = x + i;
            if (X >= 0 && X < this.width && Y >= 0 && Y < this.height) {
                this.htmlBoard[Y][X].style.backgroundColor = color;
            }
        }
        this.lastProposed = s;
    }
    checkShip(e, shipSetter, view) {
        if (!shipSetter.selected)
            return false;
        const el = e.target;
        const pos = el.id.split("-").map(a => parseInt(a));
        const ship = {
            x: pos[0],
            y: pos[1],
            direction: shipSetter.direction,
            size: shipSetter.selected
        };
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
    updateLastShip(dir) {
        if (!this.lastProposed)
            return;
        const s = Object.assign({}, this.lastProposed);
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
    checkAndAddShip(e, shipS) {
        if (this.checkShip(e, shipS, false)) {
            this.viewShip("", this.lastProposed);
            const { x, y, direction, size } = this.lastProposed;
            this.addShip(x, y, size, direction, true);
            shipS.shipPlaced();
        }
    }
    shoot(y, x, board2) {
        if (this.gameFinished)
            return;
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
        if (hit)
            this.hits++;
        if (this.hits === this.toHit) {
            this.endGame(Win.Player);
            this.gameFinished = true;
            return;
        }
        board2.randomShoot().then(([y, x, hit]) => {
            board2.htmlBoard[y][x].classList.add(hit ? 'hit' : 'miss');
            this.allowShoot = true;
            document.getElementById('sexi-text').innerHTML = "Twój ruch";
            if (board2.hits === board2.toHit) {
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
            if (hit)
                this.hits++;
            setTimeout(() => { resolve([y, x, hit]); }, 1000);
        });
    }
}
__decorate([
    decorators_1.comment
], Board.prototype, "shoot", null);
exports.default = Board;
function generateCheckPositions(ship, width, height) {
    const { x, y, size, direction } = ship;
    const positions = [];
    for (let i = -1; i < 2; i++) {
        if (!direction) {
            for (let j = -1; j < size + 1; j++) {
                positions.push([x + j, y + i]);
            }
        }
        else {
            for (let j = -1; j < size + 1; j++) {
                positions.push([x + i, y + j]);
            }
        }
    }
    const shipPos = positions.splice(size + 3, size);
    return [shipPos, positions.filter(pos => {
            return (pos[0] >= 0 && pos[0] < width) && (pos[1] >= 0 && pos[1] < height);
        })];
}

},{"./decorators":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShipSetter {
    constructor(ships) {
        this.placed = 0;
        this.getContainer = () => this.container;
        this.updateDirection = () => this.direction = !this.direction;
        this.isSetting = () => this.selected != null;
        this.direction = true;
        this.ships = ships.slice();
        this.container = document.getElementById("ships");
        this.selected = Math.max(...ships);
        for (let i = ships.length - 1; i >= 0; i--) {
            const ship = document.createElement("div");
            ship.id = `${ships[i]}`;
            ship.className = "ship";
            ship.addEventListener("click", e => {
                const a = document.getElementsByClassName("selected")[0];
                if (a)
                    a.classList.remove("selected");
                const el = e.currentTarget;
                el.classList.add('selected');
                this.selected = parseInt(el.id);
            });
            for (let j = 0; j < ships[i]; j++) {
                const cell = document.createElement("div");
                ship.appendChild(cell);
            }
            this.container.appendChild(ship);
        }
        document.getElementsByClassName('ship')[0].classList.add("selected");
    }
    shipPlaced() {
        document.getElementsByClassName("selected")[0].remove();
        this.selected = null;
        this.placed++;
        if (this.placed === this.ships.length) {
            const startButton = document.getElementById('start');
            startButton.disabled = false;
            document.getElementById('ships').remove();
            const sexi = document.getElementById('sexi-text');
            sexi.innerHTML = "Rozpocznij grę";
        }
    }
}
exports.default = ShipSetter;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Board_1 = require("./Board");
function comment(targert, name, descriptor) {
    const original = descriptor.value;
    const txt = document.getElementById('machine-text');
    descriptor.value = function (...args) {
        const result = original.apply(this, args);
        switch (result) {
            case Board_1.PlayerMoves.AlreadyShot: {
                const t = ["Uważaj, strzeliłeś tam c:", "Lepiej spróbuj gdzie indziej :-)", "Wybierz mądrze :)"];
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case Board_1.PlayerMoves.CantShoot: {
                const t = ["Poczekaj chwilkę :)", "Już strzelam ;)", "Prawie wybrałem :D"];
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case Board_1.PlayerMoves.Hit: {
                const t = ["Niezły strzał :)", "Świetnie Ci idzie c:", "Dobry jesteś!"];
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case Board_1.PlayerMoves.Miss: {
                const t = ["Było blisko :)", "Następnym razem się uda :D", "Prawie trafiłeś :-)"];
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
        }
    };
}
exports.comment = comment;

},{"./Board":2}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./../config");
const Board_1 = require("./Board");
const ShipSetter_1 = require("./ShipSetter");
function endGame(who) {
    if (who === Board_1.Win.Player) {
        document.getElementById('sexi-text').innerHTML = "Wygrałeś!";
        document.getElementById('machine-text').innerHTML = "Gratulacje!";
    }
    else {
        document.getElementById('sexi-text').innerHTML = "Przegrałeś!";
        document.getElementById('machine-text').innerHTML = "Nie przejmuj się Świetnie Ci szło :)";
    }
}
const { board, shipsSizes } = config_1.config;
const machineBoard = new Board_1.default(board[0], board[1], endGame);
const playerBoard = new Board_1.default(board[0], board[1], endGame);
const shipSetter = new ShipSetter_1.default(shipsSizes);
machineBoard.createHTMLBoard(null, playerBoard);
playerBoard.createHTMLBoard(shipSetter);
document.getElementById("machine").appendChild(machineBoard.getHMTLBoard());
document.getElementById("player").appendChild(playerBoard.getHMTLBoard());
machineBoard.drawShips(shipsSizes.slice());
document.body.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (shipSetter.isSetting()) {
        shipSetter.updateDirection();
        playerBoard.updateLastShip(shipSetter.direction);
    }
});
const startButton = document.getElementById('start');
startButton.disabled = true;
startButton.addEventListener('click', (e) => {
    document.getElementById('sexi-text').innerHTML = "Twój ruch";
    document.getElementById('machine-comments').style.display = "flex";
    machineBoard.allowShoot = true;
    startButton.remove();
});

},{"./../config":1,"./Board":2,"./ShipSetter":3}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29uZmlnLnRzIiwic3JjL3RzL0JvYXJkLnRzIiwic3JjL3RzL1NoaXBTZXR0ZXIudHMiLCJzcmMvdHMvZGVjb3JhdG9ycy50cyIsInNyYy90cy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNLYSxRQUFBLE1BQU0sR0FBVztJQUMxQixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2YsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQzdDLENBQUE7Ozs7Ozs7Ozs7O0FDUEQsNkNBQXFDO0FBU3JDLElBQUssS0FLSjtBQUxELFdBQUssS0FBSztJQUNOLG1DQUFLLENBQUE7SUFDTCxtQ0FBSyxDQUFBO0lBQ0wsK0JBQUcsQ0FBQTtJQUNILGlDQUFJLENBQUE7QUFDUixDQUFDLEVBTEksS0FBSyxLQUFMLEtBQUssUUFLVDtBQUFBLENBQUM7QUFDRixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDWCxpQ0FBTSxDQUFBO0lBQ04sbUNBQU8sQ0FBQTtBQUNYLENBQUMsRUFIVyxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUFHZDtBQUNELElBQVksV0FLWDtBQUxELFdBQVksV0FBVztJQUNuQiwyREFBVyxDQUFBO0lBQ1gsdURBQVMsQ0FBQTtJQUNULDJDQUFHLENBQUE7SUFDSCw2Q0FBSSxDQUFBO0FBQ1IsQ0FBQyxFQUxXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBS3RCO0FBR0QsTUFBcUIsS0FBSztJQWF0QixZQUFZLEtBQWEsRUFBRSxNQUFjLEVBQUUsVUFBbUIsSUFBSTtRQVpsRSxVQUFLLEdBQWUsRUFBRSxDQUFDO1FBQ3ZCLFVBQUssR0FBZSxFQUFF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YyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUM1RSxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUUxRSxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBRTNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFO0lBQzlDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUNuQixJQUFJLFVBQVUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUN4QixVQUFVLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDN0IsV0FBVyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDcEQ7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFzQixDQUFDO0FBQzFFLFdBQVcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzVCLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUN4QyxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7SUFDN0QsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0lBQ25FLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImludGVyZmFjZSBDb25maWcge1xuICAgIGJvYXJkOiBudW1iZXJbXTtcbiAgICBzaGlwc1NpemVzOiBudW1iZXJbXVxufVxuXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XG4gICAgYm9hcmQ6IFsxMCwgMTBdLFxuICAgIHNoaXBzU2l6ZXM6IFsxLCAxLCAxLCAxLCAyLCAyLCAyLCAzLCAzLCA0XVxufVxuXG4iLCJpbXBvcnQgU2hpcFNldHRlciBmcm9tICcuL1NoaXBTZXR0ZXInO1xuaW1wb3J0IHtjb21tZW50fSBmcm9tICcuL2RlY29yYXRvcnMnO1xuXG5pbnRlcmZhY2Ugc2hpcFNldHRpbmcge1xuICAgIHg6IG51bWJlcjtcbiAgICB5OiBudW1iZXI7XG4gICAgZGlyZWN0aW9uOiBib29sZWFuO1xuICAgIHNpemU6IG51bWJlcjtcbn1cblxuZW51bSBTdGF0ZSB7XG4gICAgRW1wdHksXG4gICAgVGFrZW4sXG4gICAgSGl0LFxuICAgIE1pc3Ncbn07XG5leHBvcnQgZW51bSBXaW57XG4gICAgUGxheWVyLFxuICAgIE1hY2hpbmVcbn1cbmV4cG9ydCBlbnVtIFBsYXllck1vdmVze1xuICAgIEFscmVhZHlTaG90LFxuICAgIENhbnRTaG9vdCxcbiAgICBIaXQsXG4gICAgTWlzcyxcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb2FyZCB7XG4gICAgYm9hcmQ6IG51bWJlcltdW10gPSBbXTtcbiAgICBzaG90czogbnVtYmVyW11bXSA9IFtdXG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICBodG1sQm9hcmQ6IEhUTUxFbGVtZW50W11bXSA9IFtdO1xuICAgIGJvYXJkQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcbiAgICBsYXN0UHJvcG9zZWQ6IHNoaXBTZXR0aW5nID0gbnVsbDtcbiAgICBhbGxvd1Nob290OiBib29sZWFuID0gZmFsc2U7XG4gICAgdG9IaXQ6IG51bWJlcjtcbiAgICBoaXRzOiBudW1iZXIgPSAwO1xuICAgIGVuZEdhbWU6IEZ1bmN0aW9uO1xuICAgIGdhbWVGaW5pc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBlbmRHYW1lOkZ1bmN0aW9uID0gbnVsbCkge1xuICAgICAgICB0aGlzLmVuZEdhbWUgPSBlbmRHYW1lO1xuICAgICAgICBbdGhpcy53aWR0aCwgdGhpcy5oZWlnaHRdID0gW3dpZHRoLCBoZWlnaHRdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhlaWdodDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByb3c6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcbiAgICAgICAgICAgICAgICByb3cucHVzaChTdGF0ZS5FbXB0eSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG90cy5wdXNoKFtpLCBqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJvYXJkLnB1c2gocm93KVxuICAgICAgICB9XG4gICAgfVxuICAgIGNyZWF0ZUhUTUxCb2FyZChzaGlwU2V0dGVyOiBTaGlwU2V0dGVyID0gbnVsbCwgYm9hcmQyOiBCb2FyZCA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5jbGFzc05hbWUgPSBcImJvYXJkXCI7ICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmhlaWdodDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByb3c6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJvd0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgcm93RGl2LmNsYXNzTmFtZSA9IFwicm93XCI7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMud2lkdGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIGlmIChzaGlwU2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9IaXQgPSBzaGlwU2V0dGVyLnNoaXBzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIpO1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIChlKSA9PiB0aGlzLmNoZWNrU2hpcChlLCBzaGlwU2V0dGVyLCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4gdGhpcy5jaGVja0FuZEFkZFNoaXAoZSwgc2hpcFNldHRlcikpO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHRoaXMuc2hvb3QoaSwgaiwgYm9hcmQyKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2VsbC5jbGFzc05hbWUgPSBcImNlbGxcIjtcbiAgICAgICAgICAgICAgICBjZWxsLmlkID0gYCR7an0tJHtpfWA7XG4gICAgICAgICAgICAgICAgcm93LnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgcm93RGl2LmFwcGVuZENoaWxkKGNlbGwpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmh0bWxCb2FyZC5wdXNoKHJvdylcbiAgICAgICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuYXBwZW5kQ2hpbGQocm93RGl2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRITVRMQm9hcmQoKSB7IHJldHVybiB0aGlzLmJvYXJkQ29udGFpbmVyIH1cbiAgICBhZGRTaGlwKHg6IG51bWJlciwgeTogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgZGlyZWN0aW9uOiBib29sZWFuLCBzaG93OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IFtYLCBZXSA9IFt4LCB5XTtcbiAgICAgICAgICAgIGlmIChkaXJlY3Rpb24pIFkgPSB5ICsgaTtcbiAgICAgICAgICAgIGVsc2UgWCA9IHggKyBpO1xuICAgICAgICAgICAgdGhpcy5ib2FyZFtZXVtYXSA9IFN0YXRlLlRha2VuO1xuICAgICAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxCb2FyZFtZXVtYXS5jbGFzc0xpc3QuYWRkKCdibHVlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZHJhd1NoaXBzKHNoaXBTaXplczogbnVtYmVyW10pIHtcbiAgICAgICAgdGhpcy50b0hpdCA9IHNoaXBTaXplcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiKTtcbiAgICAgICAgd2hpbGUgKHNoaXBTaXplcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gc2hpcFNpemVzLnBvcCgpO1xuICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB3aGlsZSAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgbGV0IFt4LCB5LCBkaXJlY3Rpb25dID0gW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMud2lkdGgpLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLmhlaWdodCksIE1hdGgucmFuZG9tKCkgPCAwLjVdO1xuICAgICAgICAgICAgICAgIGlmICh4ID4gdGhpcy53aWR0aCAtIHNpemUgJiYgIWRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHkgPiB0aGlzLmhlaWdodCAtIHNpemUgJiYgZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA9PT0gNCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkU2hpcCh4LCB5LCBzaXplLCBkaXJlY3Rpb24pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzOiBzaGlwU2V0dGluZyA9IHtcbiAgICAgICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgICAgICAgeSxcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzaXplXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IFtzaGlwc1Bvcywgc3Vycm91bmRpbmdzXSA9IGdlbmVyYXRlQ2hlY2tQb3NpdGlvbnMocywgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGZvdW5kID0gdGhpcy5jaGVja1Bvc2l0aW9ucyhzaGlwc1Bvcywgc3Vycm91bmRpbmdzKVxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkgdGhpcy5hZGRTaGlwKHgsIHksIHNpemUsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2hlY2tQb3NpdGlvbnMoc2hpcHM6IG51bWJlcltdW10sIHN1cnJvdW5kaW5nczogbnVtYmVyW11bXSk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBzID0gc2hpcHMuZmlsdGVyKHBvcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ib2FyZFtwb3NbMV1dW3Bvc1swXV0gPT09IFN0YXRlLkVtcHR5XG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IHN1ciA9IHN1cnJvdW5kaW5ncy5maWx0ZXIocG9zID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJvYXJkW3Bvc1sxXV1bcG9zWzBdXSA9PT0gU3RhdGUuRW1wdHlcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIChzaGlwcy5sZW5ndGggPT09IHMubGVuZ3RoICYmIHN1cnJvdW5kaW5ncy5sZW5ndGggPT09IHN1ci5sZW5ndGgpXG4gICAgfVxuICAgIHZpZXdTaGlwKGNvbG9yOiBzdHJpbmcsIHM6IHNoaXBTZXR0aW5nKSB7XG4gICAgICAgIGNvbnN0IHsgeCwgeSwgZGlyZWN0aW9uLCBzaXplIH0gPSBzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgbGV0IFtYLCBZXSA9IFt4LCB5XTtcbiAgICAgICAgICAgIGlmIChkaXJlY3Rpb24pIFkgPSB5ICsgaTtcbiAgICAgICAgICAgIGVsc2UgWCA9IHggKyBpO1xuICAgICAgICAgICAgaWYgKFggPj0gMCAmJiBYIDwgdGhpcy53aWR0aCAmJiBZID49IDAgJiYgWSA8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sQm9hcmRbWV1bWF0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0UHJvcG9zZWQgPSBzO1xuICAgIH1cblxuICAgIGNoZWNrU2hpcChlOiBFdmVudCwgc2hpcFNldHRlcjogU2hpcFNldHRlciwgdmlldzogYm9vbGVhbikge1xuICAgICAgICBpZiAoIXNoaXBTZXR0ZXIuc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgY29uc3QgZWwgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgY29uc3QgcG9zID0gZWwuaWQuc3BsaXQoXCItXCIpLm1hcChhID0+IHBhcnNlSW50KGEpKTtcbiAgICAgICAgY29uc3Qgc2hpcDogc2hpcFNldHRpbmcgPSB7XG4gICAgICAgICAgICB4OiBwb3NbMF0sXG4gICAgICAgICAgICB5OiBwb3NbMV0sXG4gICAgICAgICAgICBkaXJlY3Rpb246IHNoaXBTZXR0ZXIuZGlyZWN0aW9uLFxuICAgICAgICAgICAgc2l6ZTogc2hpcFNldHRlci5zZWxlY3RlZFxuICAgICAgICB9XG4gICAgICAgIGlmIChzaGlwLnggKyBzaGlwLnNpemUgPiB0aGlzLndpZHRoICYmICFzaGlwLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgc2hpcC54ID0gdGhpcy53aWR0aCAtIHNoaXAuc2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hpcC55ICsgc2hpcC5zaXplID4gdGhpcy5oZWlnaHQgJiYgc2hpcC5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHNoaXAueSA9IHRoaXMud2lkdGggLSBzaGlwLnNpemU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgW3NoaXBzUG9zLCBzdXJyb3VuZGluZ3NdID0gZ2VuZXJhdGVDaGVja1Bvc2l0aW9ucyhzaGlwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNoaXBWYWxpZCA9IHRoaXMuY2hlY2tQb3NpdGlvbnMoc2hpcHNQb3MsIHN1cnJvdW5kaW5ncyk7XG4gICAgICAgIGlmICh2aWV3KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sYXN0UHJvcG9zZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdTaGlwKFwiXCIsIHRoaXMubGFzdFByb3Bvc2VkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudmlld1NoaXAoc2hpcFZhbGlkID8gXCJncmVlblwiIDogXCJyZWRcIiwgc2hpcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoaXBWYWxpZDtcbiAgICB9XG4gICAgdXBkYXRlTGFzdFNoaXAoZGlyOiBib29sZWFuKSB7XG4gICAgICAgIGlmICghdGhpcy5sYXN0UHJvcG9zZWQpIHJldHVybjtcbiAgICAgICAgY29uc3QgcyA9IHsgLi4udGhpcy5sYXN0UHJvcG9zZWQgfTtcbiAgICAgICAgcy5kaXJlY3Rpb24gPSBkaXI7XG4gICAgICAgIGlmIChzLnggKyBzLnNpemUgPiB0aGlzLndpZHRoICYmICFzLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgcy54ID0gdGhpcy53aWR0aCAtIHMuc2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocy55ICsgcy5zaXplID4gdGhpcy5oZWlnaHQgJiYgcy5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHMueSA9IHRoaXMud2lkdGggLSBzLnNpemU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgW3NoaXBzUG9zLCBzdXJyb3VuZGluZ3NdID0gZ2VuZXJhdGVDaGVja1Bvc2l0aW9ucyhzLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNoaXBWYWxpZCA9IHRoaXMuY2hlY2tQb3NpdGlvbnMoc2hpcHNQb3MsIHN1cnJvdW5kaW5ncyk7XG4gICAgICAgIHRoaXMudmlld1NoaXAoXCJcIiwgdGhpcy5sYXN0UHJvcG9zZWQpO1xuICAgICAgICB0aGlzLnZpZXdTaGlwKHNoaXBWYWxpZCA/IFwiZ3JlZW5cIiA6IFwicmVkXCIsIHMpO1xuICAgIH1cbiAgICBjaGVja0FuZEFkZFNoaXAoZTogRXZlbnQsIHNoaXBTOiBTaGlwU2V0dGVyKSB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrU2hpcChlLCBzaGlwUywgZmFsc2UpKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdTaGlwKFwiXCIsIHRoaXMubGFzdFByb3Bvc2VkKTtcbiAgICAgICAgICAgIGNvbnN0IHsgeCwgeSwgZGlyZWN0aW9uLCBzaXplIH0gPSB0aGlzLmxhc3RQcm9wb3NlZDtcbiAgICAgICAgICAgIHRoaXMuYWRkU2hpcCh4LCB5LCBzaXplLCBkaXJlY3Rpb24sIHRydWUpO1xuICAgICAgICAgICAgc2hpcFMuc2hpcFBsYWNlZCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIEBjb21tZW50XG4gICAgc2hvb3QoeTogbnVtYmVyLCB4OiBudW1iZXIsIGJvYXJkMjogQm9hcmQpIHtcbiAgICAgICAgaWYodGhpcy5nYW1lRmluaXNoZWQpIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLmFsbG93U2hvb3QpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIk5pZSBtb8W8ZXN6IHRlcmF6IHN0cnplbGHEh1wiO1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllck1vdmVzLkNhbnRTaG9vdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5ib2FyZFt5XVt4XSA9PT0gU3RhdGUuTWlzcyB8fCB0aGlzLmJvYXJkW3ldW3hdID09PSBTdGF0ZS5IaXQpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIkp1xbwgdGFtIHN0cnplbGnFgmXFm1wiO1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllck1vdmVzLkFscmVhZHlTaG90O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhpdCA9IHRoaXMuYm9hcmRbeV1beF0gPT09IFN0YXRlLlRha2VuO1xuICAgICAgICB0aGlzLmJvYXJkW3ldW3hdID0gaGl0ID8gU3RhdGUuSGl0IDogU3RhdGUuTWlzcztcbiAgICAgICAgdGhpcy5odG1sQm9hcmRbeV1beF0uY2xhc3NMaXN0LmFkZChoaXQgPyAnaGl0JyA6ICdtaXNzJyk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBoaXQgPyBcIlRyYWZpb255ITxicj5SdWNoIGtvbXB1dGVyYVwiIDogXCJQdWTFgm88YnI+UnVjaCBrb21wdXRlcmFcIjtcbiAgICAgICAgdGhpcy5hbGxvd1Nob290ID0gZmFsc2U7XG4gICAgICAgIGlmKGhpdCkgdGhpcy5oaXRzKys7XG4gICAgICAgIGlmKHRoaXMuaGl0cyA9PT0gdGhpcy50b0hpdCl7XG4gICAgICAgICAgICB0aGlzLmVuZEdhbWUoV2luLlBsYXllcik7XG4gICAgICAgICAgICB0aGlzLmdhbWVGaW5pc2hlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYm9hcmQyLnJhbmRvbVNob290KCkudGhlbigoW3ksIHgsIGhpdF0pID0+IHtcbiAgICAgICAgICAgIGJvYXJkMi5odG1sQm9hcmRbeV1beF0uY2xhc3NMaXN0LmFkZChoaXQgPyAnaGl0JyA6ICdtaXNzJyk7XG4gICAgICAgICAgICB0aGlzLmFsbG93U2hvb3QgPSB0cnVlO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpLmlubmVySFRNTCA9IFwiVHfDs2ogcnVjaFwiO1xuICAgICAgICAgICAgaWYoYm9hcmQyLmhpdHMgPT09IGJvYXJkMi50b0hpdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5kR2FtZShXaW4uTWFjaGluZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lRmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGhpdCA/IFBsYXllck1vdmVzLkhpdCA6IFBsYXllck1vdmVzLk1pc3M7XG5cbiAgICAgICAgXG4gICAgfVxuICAgIHJhbmRvbVNob290KCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuc2hvdHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IFt5LCB4XSA9IHRoaXMuc2hvdHNbcl07XG4gICAgICAgICAgICBjb25zdCBoaXQgPSB0aGlzLmJvYXJkW3ldW3hdID09PSBTdGF0ZS5UYWtlbjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2hvdHMuc3BsaWNlKHIsIDEpO1xuICAgICAgICAgICAgaWYoaGl0KSB0aGlzLmhpdHMrKztcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyByZXNvbHZlKFt5LCB4LCBoaXRdKSB9LCAxMDAwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUNoZWNrUG9zaXRpb25zKHNoaXA6IHNoaXBTZXR0aW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IG51bWJlcltdW11bXSB7XG4gICAgY29uc3QgeyB4LCB5LCBzaXplLCBkaXJlY3Rpb24gfSA9IHNoaXA7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXVtdID0gW11cbiAgICBmb3IgKGxldCBpID0gLTE7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgaWYgKCFkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAtMTsgaiA8IHNpemUgKyAxOyBqKyspIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaChbeCArIGosIHkgKyBpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gLTE7IGogPCBzaXplICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goW3ggKyBpLCB5ICsgal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHNoaXBQb3MgPSBwb3NpdGlvbnMuc3BsaWNlKHNpemUgKyAzLCBzaXplKTtcbiAgICByZXR1cm4gW3NoaXBQb3MsIHBvc2l0aW9ucy5maWx0ZXIocG9zID0+IHtcbiAgICAgICAgcmV0dXJuIChwb3NbMF0gPj0gMCAmJiBwb3NbMF0gPCB3aWR0aCkgJiYgKHBvc1sxXSA+PSAwICYmIHBvc1sxXSA8IGhlaWdodClcbiAgICB9KV07XG59XG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBTaGlwU2V0dGVye1xuICAgIHNoaXBzOiBudW1iZXJbXTtcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50O1xuICAgIHNlbGVjdGVkOiBudW1iZXI7XG4gICAgZGlyZWN0aW9uOiBib29sZWFuO1xuICAgIHBsYWNlZDogbnVtYmVyID0gMDtcbiAgICBjb25zdHJ1Y3RvcihzaGlwczogbnVtYmVyW10pe1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IHRydWU7XG4gICAgICAgIHRoaXMuc2hpcHMgPSBzaGlwcy5zbGljZSgpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hpcHNcIik7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBNYXRoLm1heCguLi5zaGlwcyk7ICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IHNoaXBzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBzaGlwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNoaXAuaWQgPSBgJHtzaGlwc1tpXX1gO1xuICAgICAgICAgICAgc2hpcC5jbGFzc05hbWUgPSBcInNoaXBcIjtcbiAgICAgICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwic2VsZWN0ZWRcIilbMF07XG4gICAgICAgICAgICAgICAgaWYoYSkgYS5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gcGFyc2VJbnQoZWwuaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNoaXBzW2ldOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICBzaGlwLmFwcGVuZENoaWxkKGNlbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoc2hpcCk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2hpcCcpWzBdLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgXG4gICAgfVxuICAgIGdldENvbnRhaW5lciA9ICgpID0+IHRoaXMuY29udGFpbmVyO1xuICAgIHVwZGF0ZURpcmVjdGlvbiA9ICgpID0+IHRoaXMuZGlyZWN0aW9uID0gIXRoaXMuZGlyZWN0aW9uO1xuICAgIGlzU2V0dGluZyA9ICgpID0+IHRoaXMuc2VsZWN0ZWQgIT0gbnVsbDtcbiAgICBzaGlwUGxhY2VkKCl7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzZWxlY3RlZFwiKVswXS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IG51bGw7XG4gICAgICAgIHRoaXMucGxhY2VkKytcbiAgICAgICAgaWYodGhpcy5wbGFjZWQgPT09IHRoaXMuc2hpcHMubGVuZ3RoKXtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0QnV0dG9uID0gPEhUTUxCdXR0b25FbGVtZW50PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhcnQnKTtcbiAgICAgICAgICAgIHN0YXJ0QnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hpcHMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIGNvbnN0IHNleGkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2V4aS10ZXh0JynCoGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgc2V4aS5pbm5lckhUTUwgPSBcIlJvenBvY3puaWogZ3LEmVwiO1xuICAgICAgICB9XG4gICAgfVxufSIsImltcG9ydCB7IFBsYXllck1vdmVzIH0gZnJvbSAnLi9Cb2FyZCc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1lbnQodGFyZ2VydDogYW55LCBuYW1lOiBzdHJpbmcsIGRlc2NyaXB0b3I6IGFueSkge1xuICAgIGNvbnN0IG9yaWdpbmFsOiBGdW5jdGlvbiA9IGRlc2NyaXB0b3IudmFsdWU7XG4gICAgY29uc3QgdHh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hY2hpbmUtdGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHN3aXRjaCAocmVzdWx0KSB7XG4gICAgICAgICAgICBjYXNlIFBsYXllck1vdmVzLkFscmVhZHlTaG90OiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IFtcIlV3YcW8YWosIHN0cnplbGnFgmXFmyB0YW0gYzpcIiwgXCJMZXBpZWogc3Byw7NidWogZ2R6aWUgaW5kemllaiA6LSlcIiwgXCJXeWJpZXJ6IG3EhWRyemUgOilcIl1cbiAgICAgICAgICAgICAgICB0eHQuaW5uZXJIVE1MID0gdFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0Lmxlbmd0aCldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBQbGF5ZXJNb3Zlcy5DYW50U2hvb3Q6IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gW1wiUG9jemVrYWogY2h3aWxrxJkgOilcIiwgXCJKdcW8IHN0cnplbGFtIDspXCIsIFwiUHJhd2llIHd5YnJhxYJlbSA6RFwiXVxuICAgICAgICAgICAgICAgIHR4dC5pbm5lckhUTUwgPSB0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHQubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFBsYXllck1vdmVzLkhpdDoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBbXCJOaWV6xYJ5IHN0cnphxYIgOilcIiwgXCLFmndpZXRuaWUgQ2kgaWR6aWUgYzpcIiwgXCJEb2JyeSBqZXN0ZcWbIVwiXVxuICAgICAgICAgICAgICAgIHR4dC5pbm5lckhUTUwgPSB0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHQubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFBsYXllck1vdmVzLk1pc3M6IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gW1wiQnnFgm8gYmxpc2tvIDopXCIsIFwiTmFzdMSZcG55bSByYXplbSBzacSZIHVkYSA6RFwiLCBcIlByYXdpZSB0cmFmacWCZcWbIDotKVwiXVxuICAgICAgICAgICAgICAgIHR4dC5pbm5lckhUTUwgPSB0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHQubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBjb25maWcgfSBmcm9tIFwiLi8uLi9jb25maWdcIjtcbmltcG9ydCBCb2FyZCwge1dpbn0gZnJvbSBcIi4vQm9hcmRcIjtcbmltcG9ydCBTaGlwU2V0dGVyIGZyb20gJy4vU2hpcFNldHRlcic7XG5cbmZ1bmN0aW9uIGVuZEdhbWUod2hvOiBudW1iZXIpe1xuICAgIGlmKHdobyA9PT0gV2luLlBsYXllcil7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIld5Z3JhxYJlxZshXCI7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWNoaW5lLXRleHQnKS5pbm5lckhUTUwgPSBcIkdyYXR1bGFjamUhXCI7XG4gICAgfWVsc2V7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIlByemVncmHFgmXFmyFcIjtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hY2hpbmUtdGV4dCcpLmlubmVySFRNTCA9IFwiTmllIHByemVqbXVqIHNpxJkgxZp3aWV0bmllIENpIHN6xYJvIDopXCI7XG4gICAgfVxufVxuXG5jb25zdCB7IGJvYXJkLCBzaGlwc1NpemVzIH0gPSBjb25maWc7XG5cbmNvbnN0IG1hY2hpbmVCb2FyZDogQm9hcmQgPSBuZXcgQm9hcmQoYm9hcmRbMF0sIGJvYXJkWzFdLCBlbmRHYW1lKTtcbmNvbnN0IHBsYXllckJvYXJkOiBCb2FyZCA9IG5ldyBCb2FyZChib2FyZFswXSwgYm9hcmRbMV0sIGVuZEdhbWUpO1xuY29uc3Qgc2hpcFNldHRlciA9IG5ldyBTaGlwU2V0dGVyKHNoaXBzU2l6ZXMpO1xuXG5tYWNoaW5lQm9hcmQuY3JlYXRlSFRNTEJvYXJkKG51bGwsIHBsYXllckJvYXJkKTtcbnBsYXllckJvYXJkLmNyZWF0ZUhUTUxCb2FyZChzaGlwU2V0dGVyKTtcblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWNoaW5lXCIpLmFwcGVuZENoaWxkKG1hY2hpbmVCb2FyZC5nZXRITVRMQm9hcmQoKSk7XG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXllclwiKS5hcHBlbmRDaGlsZChwbGF5ZXJCb2FyZC5nZXRITVRMQm9hcmQoKSk7XG5cbm1hY2hpbmVCb2FyZC5kcmF3U2hpcHMoc2hpcHNTaXplcy5zbGljZSgpKTtcblxuZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChzaGlwU2V0dGVyLmlzU2V0dGluZygpKSB7XG4gICAgICAgIHNoaXBTZXR0ZXIudXBkYXRlRGlyZWN0aW9uKCk7XG4gICAgICAgIHBsYXllckJvYXJkLnVwZGF0ZUxhc3RTaGlwKHNoaXBTZXR0ZXIuZGlyZWN0aW9uKTtcbiAgICB9XG59KTtcbmNvbnN0IHN0YXJ0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0JykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5zdGFydEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG5zdGFydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7ICAgIFxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIlR3w7NqIHJ1Y2hcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFjaGluZS1jb21tZW50cycpLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICBtYWNoaW5lQm9hcmQuYWxsb3dTaG9vdCA9IHRydWU7XG4gICAgc3RhcnRCdXR0b24ucmVtb3ZlKCk7XG59KTtcblxuXG4iXX0=
