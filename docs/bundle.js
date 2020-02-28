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
                const t = ["Wa :)", "Już strzelam ;)", "Prawie wybrałem :D"];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29uZmlnLnRzIiwic3JjL3RzL0JvYXJkLnRzIiwic3JjL3RzL1NoaXBTZXR0ZXIudHMiLCJzcmMvdHMvZGVjb3JhdG9ycy50cyIsInNyYy90cy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNLYSxRQUFBLE1BQU0sR0FBVztJQUMxQixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2YsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQzdDLENBQUE7Ozs7Ozs7Ozs7QUNQRCw2Q0FBdUM7QUFTdkMsSUFBSyxLQUtKO0FBTEQsV0FBSyxLQUFLO0lBQ04sbUNBQUssQ0FBQTtJQUNMLG1DQUFLLENBQUE7SUFDTCwrQkFBRyxDQUFBO0lBQ0gsaUNBQUksQ0FBQTtBQUNSLENBQUMsRUFMSSxLQUFLLEtBQUwsS0FBSyxRQUtUO0FBQUEsQ0FBQztBQUNGLElBQVksR0FHWDtBQUhELFdBQVksR0FBRztJQUNYLGlDQUFNLENBQUE7SUFDTixtQ0FBTyxDQUFBO0FBQ1gsQ0FBQyxFQUhXLEdBQUcsR0FBSCxXQUFHLEtBQUgsV0FBRyxRQUdkO0FBQ0QsSUFBWSxXQUtYO0FBTEQsV0FBWSxXQUFXO0lBQ25CLDJEQUFXLENBQUE7SUFDWCx1REFBUyxDQUFBO0lBQ1QsMkNBQUcsQ0FBQTtJQUNILDZDQUFJLENBQUE7QUFDUixDQUFDLEVBTFcsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUFLdEI7QUFHRCxNQUFxQixLQUFLO0lBaUJ0QixZQUFZLEtBQWEsRUFBRSxNQUFjLEVBQUUsVUFBb0IsSUFBSTtRQWhCbkUsVUFBSyxHQUFlLEVBQUUsQ0FBQztRQUN2QixVQUFLLEdBQWUsRUFB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QUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBRTFFLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7QUFFM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDOUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25CLElBQUksVUFBVSxDQUFDLFNBQVMsRUFBRSxFQUFFO1FBQ3hCLFVBQVUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUM3QixXQUFXLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNwRDtBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQXNCLENBQUM7QUFDMUUsV0FBVyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDNUIsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3hDLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztJQUM3RCxRQUFRLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDbkUsWUFBWSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDL0IsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW50ZXJmYWNlIENvbmZpZyB7XHJcbiAgICBib2FyZDogbnVtYmVyW107XHJcbiAgICBzaGlwc1NpemVzOiBudW1iZXJbXVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XHJcbiAgICBib2FyZDogWzEwLCAxMF0sXHJcbiAgICBzaGlwc1NpemVzOiBbMSwgMSwgMSwgMSwgMiwgMiwgMiwgMywgMywgNF1cclxufVxyXG5cclxuIiwiaW1wb3J0IFNoaXBTZXR0ZXIgZnJvbSAnLi9TaGlwU2V0dGVyJztcclxuaW1wb3J0IHsgY29tbWVudCB9IGZyb20gJy4vZGVjb3JhdG9ycyc7XHJcblxyXG5pbnRlcmZhY2Ugc2hpcFNldHRpbmcge1xyXG4gICAgeDogbnVtYmVyO1xyXG4gICAgeTogbnVtYmVyO1xyXG4gICAgZGlyZWN0aW9uOiBib29sZWFuO1xyXG4gICAgc2l6ZTogbnVtYmVyO1xyXG59XHJcblxyXG5lbnVtIFN0YXRlIHtcclxuICAgIEVtcHR5LFxyXG4gICAgVGFrZW4sXHJcbiAgICBIaXQsXHJcbiAgICBNaXNzXHJcbn07XHJcbmV4cG9ydCBlbnVtIFdpbiB7XHJcbiAgICBQbGF5ZXIsXHJcbiAgICBNYWNoaW5lXHJcbn1cclxuZXhwb3J0IGVudW0gUGxheWVyTW92ZXMge1xyXG4gICAgQWxyZWFkeVNob3QsXHJcbiAgICBDYW50U2hvb3QsXHJcbiAgICBIaXQsXHJcbiAgICBNaXNzLFxyXG59XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQm9hcmQge1xyXG4gICAgYm9hcmQ6IG51bWJlcltdW10gPSBbXTtcclxuICAgIHNob3RzOiBudW1iZXJbXVtdID0gW11cclxuXHJcbiAgICB3aWR0aDogbnVtYmVyO1xyXG4gICAgaGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgaHRtbEJvYXJkOiBIVE1MRWxlbWVudFtdW10gPSBbXTtcclxuICAgIGJvYXJkQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICBsYXN0UHJvcG9zZWQ6IHNoaXBTZXR0aW5nID0gbnVsbDtcclxuICAgIGFsbG93U2hvb3Q6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHRvSGl0OiBudW1iZXI7XHJcbiAgICBoaXRzOiBudW1iZXIgPSAwO1xyXG4gICAgZW5kR2FtZTogRnVuY3Rpb247XHJcbiAgICBnYW1lRmluaXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgZW5kR2FtZTogRnVuY3Rpb24gPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5lbmRHYW1lID0gZW5kR2FtZTtcclxuICAgICAgICBbdGhpcy53aWR0aCwgdGhpcy5oZWlnaHRdID0gW3dpZHRoLCBoZWlnaHRdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGVpZ2h0OyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3Qgcm93OiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIHJvdy5wdXNoKFN0YXRlLkVtcHR5KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvdHMucHVzaChbaSwgal0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYm9hcmQucHVzaChyb3cpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUhUTUxCb2FyZChzaGlwU2V0dGVyOiBTaGlwU2V0dGVyID0gbnVsbCwgYm9hcmQyOiBCb2FyZCA9IG51bGwpIHtcclxuICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG4gICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuY2xhc3NOYW1lID0gXCJib2FyZFwiO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5oZWlnaHQ7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCByb3c6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuICAgICAgICAgICAgY29uc3Qgcm93RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHJvd0Rpdi5jbGFzc05hbWUgPSBcInJvd1wiO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMud2lkdGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hpcFNldHRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9IaXQgPSBzaGlwU2V0dGVyLnNoaXBzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgKGUpID0+IHRoaXMuY2hlY2tTaGlwKGUsIHNoaXBTZXR0ZXIsIHRydWUpKTtcclxuICAgICAgICAgICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHRoaXMuY2hlY2tBbmRBZGRTaGlwKGUsIHNoaXBTZXR0ZXIpKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHRoaXMuc2hvb3QoaSwgaiwgYm9hcmQyKSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNlbGwuY2xhc3NOYW1lID0gXCJjZWxsXCI7XHJcbiAgICAgICAgICAgICAgICBjZWxsLmlkID0gYCR7an0tJHtpfWA7XHJcbiAgICAgICAgICAgICAgICByb3cucHVzaChjZWxsKTtcclxuICAgICAgICAgICAgICAgIHJvd0Rpdi5hcHBlbmRDaGlsZChjZWxsKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5odG1sQm9hcmQucHVzaChyb3cpXHJcbiAgICAgICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuYXBwZW5kQ2hpbGQocm93RGl2KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SE1UTEJvYXJkKCkgeyByZXR1cm4gdGhpcy5ib2FyZENvbnRhaW5lciB9XHJcblxyXG4gICAgYWRkU2hpcCh4OiBudW1iZXIsIHk6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIGRpcmVjdGlvbjogYm9vbGVhbiwgc2hvdzogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgW1gsIFldID0gW3gsIHldO1xyXG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uKSBZID0geSArIGk7XHJcbiAgICAgICAgICAgIGVsc2UgWCA9IHggKyBpO1xyXG4gICAgICAgICAgICB0aGlzLmJvYXJkW1ldW1hdID0gU3RhdGUuVGFrZW47XHJcbiAgICAgICAgICAgIGlmIChzaG93KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxCb2FyZFtZXVtYXS5jbGFzc0xpc3QuYWRkKCdibHVlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd1NoaXBzKHNoaXBTaXplczogbnVtYmVyW10pIHtcclxuICAgICAgICB0aGlzLnRvSGl0ID0gc2hpcFNpemVzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIpO1xyXG4gICAgICAgIHdoaWxlIChzaGlwU2l6ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gc2hpcFNpemVzLnBvcCgpO1xyXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgd2hpbGUgKCFmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFt4LCB5LCBkaXJlY3Rpb25dID0gW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMud2lkdGgpLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLmhlaWdodCksIE1hdGgucmFuZG9tKCkgPCAwLjVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHggPiB0aGlzLndpZHRoIC0gc2l6ZSAmJiAhZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoeSA+IHRoaXMuaGVpZ2h0IC0gc2l6ZSAmJiBkaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzaXplID09PSA0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkU2hpcCh4LCB5LCBzaXplLCBkaXJlY3Rpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzOiBzaGlwU2V0dGluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB4LFxyXG4gICAgICAgICAgICAgICAgICAgIHksXHJcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpemVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IFtzaGlwc1Bvcywgc3Vycm91bmRpbmdzXSA9IGdlbmVyYXRlQ2hlY2tQb3NpdGlvbnMocywgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgZm91bmQgPSB0aGlzLmNoZWNrUG9zaXRpb25zKHNoaXBzUG9zLCBzdXJyb3VuZGluZ3MpXHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHRoaXMuYWRkU2hpcCh4LCB5LCBzaXplLCBkaXJlY3Rpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrUG9zaXRpb25zKHNoaXBzOiBudW1iZXJbXVtdLCBzdXJyb3VuZGluZ3M6IG51bWJlcltdW10pOiBib29sZWFuIHtcclxuICAgICAgICBjb25zdCBzID0gc2hpcHMuZmlsdGVyKHBvcyA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJvYXJkW3Bvc1sxXV1bcG9zWzBdXSA9PT0gU3RhdGUuRW1wdHlcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IHN1ciA9IHN1cnJvdW5kaW5ncy5maWx0ZXIocG9zID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9hcmRbcG9zWzFdXVtwb3NbMF1dID09PSBTdGF0ZS5FbXB0eVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIChzaGlwcy5sZW5ndGggPT09IHMubGVuZ3RoICYmIHN1cnJvdW5kaW5ncy5sZW5ndGggPT09IHN1ci5sZW5ndGgpXHJcbiAgICB9XHJcblxyXG4gICAgdmlld1NoaXAoY29sb3I6IHN0cmluZywgczogc2hpcFNldHRpbmcpIHtcclxuICAgICAgICBjb25zdCB7IHgsIHksIGRpcmVjdGlvbiwgc2l6ZSB9ID0gcztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgW1gsIFldID0gW3gsIHldO1xyXG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uKSBZID0geSArIGk7XHJcbiAgICAgICAgICAgIGVsc2UgWCA9IHggKyBpO1xyXG4gICAgICAgICAgICBpZiAoWCA+PSAwICYmIFggPCB0aGlzLndpZHRoICYmIFkgPj0gMCAmJiBZIDwgdGhpcy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEJvYXJkW1ldW1hdLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGFzdFByb3Bvc2VkID0gcztcclxuICAgIH1cclxuXHJcbiAgICBjaGVja1NoaXAoZTogRXZlbnQsIHNoaXBTZXR0ZXI6IFNoaXBTZXR0ZXIsIHZpZXc6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoIXNoaXBTZXR0ZXIuc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBjb25zdCBlbCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xyXG4gICAgICAgIGNvbnN0IHBvcyA9IGVsLmlkLnNwbGl0KFwiLVwiKS5tYXAoYSA9PiBwYXJzZUludChhKSk7XHJcbiAgICAgICAgY29uc3Qgc2hpcDogc2hpcFNldHRpbmcgPSB7XHJcbiAgICAgICAgICAgIHg6IHBvc1swXSxcclxuICAgICAgICAgICAgeTogcG9zWzFdLFxyXG4gICAgICAgICAgICBkaXJlY3Rpb246IHNoaXBTZXR0ZXIuZGlyZWN0aW9uLFxyXG4gICAgICAgICAgICBzaXplOiBzaGlwU2V0dGVyLnNlbGVjdGVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzaGlwLnggKyBzaGlwLnNpemUgPiB0aGlzLndpZHRoICYmICFzaGlwLmRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICBzaGlwLnggPSB0aGlzLndpZHRoIC0gc2hpcC5zaXplO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2hpcC55ICsgc2hpcC5zaXplID4gdGhpcy5oZWlnaHQgJiYgc2hpcC5kaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgc2hpcC55ID0gdGhpcy53aWR0aCAtIHNoaXAuc2l6ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgW3NoaXBzUG9zLCBzdXJyb3VuZGluZ3NdID0gZ2VuZXJhdGVDaGVja1Bvc2l0aW9ucyhzaGlwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY29uc3Qgc2hpcFZhbGlkID0gdGhpcy5jaGVja1Bvc2l0aW9ucyhzaGlwc1Bvcywgc3Vycm91bmRpbmdzKTtcclxuICAgICAgICBpZiAodmlldykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXN0UHJvcG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld1NoaXAoXCJcIiwgdGhpcy5sYXN0UHJvcG9zZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudmlld1NoaXAoc2hpcFZhbGlkID8gXCJncmVlblwiIDogXCJyZWRcIiwgc2hpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaGlwVmFsaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlTGFzdFNoaXAoZGlyOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxhc3RQcm9wb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IHMgPSB7IC4uLnRoaXMubGFzdFByb3Bvc2VkIH07XHJcbiAgICAgICAgcy5kaXJlY3Rpb24gPSBkaXI7XHJcbiAgICAgICAgaWYgKHMueCArIHMuc2l6ZSA+IHRoaXMud2lkdGggJiYgIXMuZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHMueCA9IHRoaXMud2lkdGggLSBzLnNpemU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzLnkgKyBzLnNpemUgPiB0aGlzLmhlaWdodCAmJiBzLmRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICBzLnkgPSB0aGlzLndpZHRoIC0gcy5zaXplO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBbc2hpcHNQb3MsIHN1cnJvdW5kaW5nc10gPSBnZW5lcmF0ZUNoZWNrUG9zaXRpb25zKHMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICBjb25zdCBzaGlwVmFsaWQgPSB0aGlzLmNoZWNrUG9zaXRpb25zKHNoaXBzUG9zLCBzdXJyb3VuZGluZ3MpO1xyXG4gICAgICAgIHRoaXMudmlld1NoaXAoXCJcIiwgdGhpcy5sYXN0UHJvcG9zZWQpO1xyXG4gICAgICAgIHRoaXMudmlld1NoaXAoc2hpcFZhbGlkID8gXCJncmVlblwiIDogXCJyZWRcIiwgcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tBbmRBZGRTaGlwKGU6IEV2ZW50LCBzaGlwUzogU2hpcFNldHRlcikge1xyXG4gICAgICAgIGlmICh0aGlzLmNoZWNrU2hpcChlLCBzaGlwUywgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld1NoaXAoXCJcIiwgdGhpcy5sYXN0UHJvcG9zZWQpO1xyXG4gICAgICAgICAgICBjb25zdCB7IHgsIHksIGRpcmVjdGlvbiwgc2l6ZSB9ID0gdGhpcy5sYXN0UHJvcG9zZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkU2hpcCh4LCB5LCBzaXplLCBkaXJlY3Rpb24sIHRydWUpO1xyXG4gICAgICAgICAgICBzaGlwUy5zaGlwUGxhY2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tZW50XHJcbiAgICBzaG9vdCh5OiBudW1iZXIsIHg6IG51bWJlciwgYm9hcmQyOiBCb2FyZCkge1xyXG4gICAgICAgIGlmICh0aGlzLmdhbWVGaW5pc2hlZCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICghdGhpcy5hbGxvd1Nob290KSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIk5pZSBtb8W8ZXN6IHRlcmF6IHN0cnplbGHEh1wiO1xyXG4gICAgICAgICAgICByZXR1cm4gUGxheWVyTW92ZXMuQ2FudFNob290O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5ib2FyZFt5XVt4XSA9PT0gU3RhdGUuTWlzcyB8fCB0aGlzLmJvYXJkW3ldW3hdID09PSBTdGF0ZS5IaXQpIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpLmlubmVySFRNTCA9IFwiSnXFvCB0YW0gc3RyemVsacWCZcWbXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBQbGF5ZXJNb3Zlcy5BbHJlYWR5U2hvdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaGl0ID0gdGhpcy5ib2FyZFt5XVt4XSA9PT0gU3RhdGUuVGFrZW47XHJcbiAgICAgICAgdGhpcy5ib2FyZFt5XVt4XSA9IGhpdCA/IFN0YXRlLkhpdCA6IFN0YXRlLk1pc3M7XHJcbiAgICAgICAgdGhpcy5odG1sQm9hcmRbeV1beF0uY2xhc3NMaXN0LmFkZChoaXQgPyAnaGl0JyA6ICdtaXNzJyk7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpLmlubmVySFRNTCA9IGhpdCA/IFwiVHJhZmlvbnkhPGJyPlJ1Y2gga29tcHV0ZXJhXCIgOiBcIlB1ZMWCbzxicj5SdWNoIGtvbXB1dGVyYVwiO1xyXG4gICAgICAgIHRoaXMuYWxsb3dTaG9vdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChoaXQpIHRoaXMuaGl0cysrO1xyXG4gICAgICAgIGlmICh0aGlzLmhpdHMgPT09IHRoaXMudG9IaXQpIHtcclxuICAgICAgICAgICAgdGhpcy5lbmRHYW1lKFdpbi5QbGF5ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmdhbWVGaW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYm9hcmQyLnJhbmRvbVNob290KCkudGhlbigoW3ksIHgsIGhpdF0pID0+IHtcclxuICAgICAgICAgICAgYm9hcmQyLmh0bWxCb2FyZFt5XVt4XS5jbGFzc0xpc3QuYWRkKGhpdCA/ICdoaXQnIDogJ21pc3MnKTtcclxuICAgICAgICAgICAgdGhpcy5hbGxvd1Nob290ID0gdHJ1ZTtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpLmlubmVySFRNTCA9IFwiVHfDs2ogcnVjaFwiO1xyXG4gICAgICAgICAgICBpZiAoYm9hcmQyLmhpdHMgPT09IGJvYXJkMi50b0hpdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmRHYW1lKFdpbi5NYWNoaW5lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBoaXQgPyBQbGF5ZXJNb3Zlcy5IaXQgOiBQbGF5ZXJNb3Zlcy5NaXNzO1xyXG4gICAgfVxyXG5cclxuICAgIHJhbmRvbVNob290KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLnNob3RzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IFt5LCB4XSA9IHRoaXMuc2hvdHNbcl07XHJcbiAgICAgICAgICAgIGNvbnN0IGhpdCA9IHRoaXMuYm9hcmRbeV1beF0gPT09IFN0YXRlLlRha2VuO1xyXG4gICAgICAgICAgICB0aGlzLnNob3RzLnNwbGljZShyLCAxKTtcclxuICAgICAgICAgICAgaWYgKGhpdCkgdGhpcy5oaXRzKys7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyByZXNvbHZlKFt5LCB4LCBoaXRdKSB9LCAxMDAwKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVDaGVja1Bvc2l0aW9ucyhzaGlwOiBzaGlwU2V0dGluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBudW1iZXJbXVtdW10ge1xyXG4gICAgY29uc3QgeyB4LCB5LCBzaXplLCBkaXJlY3Rpb24gfSA9IHNoaXA7XHJcbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdW10gPSBbXVxyXG4gICAgZm9yIChsZXQgaSA9IC0xOyBpIDwgMjsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCFkaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IC0xOyBqIDwgc2l6ZSArIDE7IGorKykge1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goW3ggKyBqLCB5ICsgaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IC0xOyBqIDwgc2l6ZSArIDE7IGorKykge1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goW3ggKyBpLCB5ICsgal0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3Qgc2hpcFBvcyA9IHBvc2l0aW9ucy5zcGxpY2Uoc2l6ZSArIDMsIHNpemUpO1xyXG4gICAgcmV0dXJuIFtzaGlwUG9zLCBwb3NpdGlvbnMuZmlsdGVyKHBvcyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIChwb3NbMF0gPj0gMCAmJiBwb3NbMF0gPCB3aWR0aCkgJiYgKHBvc1sxXSA+PSAwICYmIHBvc1sxXSA8IGhlaWdodClcclxuICAgIH0pXTtcclxufVxyXG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBTaGlwU2V0dGVyIHtcclxuICAgIHNoaXBzOiBudW1iZXJbXTtcclxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICBzZWxlY3RlZDogbnVtYmVyO1xyXG4gICAgZGlyZWN0aW9uOiBib29sZWFuO1xyXG4gICAgcGxhY2VkOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNoaXBzOiBudW1iZXJbXSkge1xyXG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnNoaXBzID0gc2hpcHMuc2xpY2UoKTtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hpcHNcIik7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IE1hdGgubWF4KC4uLnNoaXBzKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHNoaXBzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoaXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICBzaGlwLmlkID0gYCR7c2hpcHNbaV19YDtcclxuICAgICAgICAgICAgc2hpcC5jbGFzc05hbWUgPSBcInNoaXBcIjtcclxuICAgICAgICAgICAgc2hpcC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNlbGVjdGVkXCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGEpIGEuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHBhcnNlSW50KGVsLmlkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNoaXBzW2ldOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2hpcC5hcHBlbmRDaGlsZChjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoc2hpcCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzaGlwJylbMF0uY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbnRhaW5lciA9ICgpID0+IHRoaXMuY29udGFpbmVyO1xyXG5cclxuICAgIHVwZGF0ZURpcmVjdGlvbiA9ICgpID0+IHRoaXMuZGlyZWN0aW9uID0gIXRoaXMuZGlyZWN0aW9uO1xyXG5cclxuICAgIGlzU2V0dGluZyA9ICgpID0+IHRoaXMuc2VsZWN0ZWQgIT0gbnVsbDtcclxuXHJcbiAgICBzaGlwUGxhY2VkKCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzZWxlY3RlZFwiKVswXS5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgICB0aGlzLnBsYWNlZCsrXHJcblxyXG4gICAgICAgIGlmICh0aGlzLnBsYWNlZCA9PT0gdGhpcy5zaGlwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnRCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0Jyk7XHJcbiAgICAgICAgICAgIHN0YXJ0QnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaGlwcycpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBzZXhpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgICAgICAgICBzZXhpLmlubmVySFRNTCA9IFwiUm96cG9jem5paiBncsSZXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUGxheWVyTW92ZXMgfSBmcm9tICcuL0JvYXJkJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29tbWVudCh0YXJnZXJ0OiBhbnksIG5hbWU6IHN0cmluZywgZGVzY3JpcHRvcjogYW55KSB7XHJcbiAgICBjb25zdCBvcmlnaW5hbDogRnVuY3Rpb24gPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG4gICAgY29uc3QgdHh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hY2hpbmUtdGV4dCcpIGFzIEhUTUxFbGVtZW50O1xyXG5cclxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICBzd2l0Y2ggKHJlc3VsdCkge1xyXG4gICAgICAgICAgICBjYXNlIFBsYXllck1vdmVzLkFscmVhZHlTaG90OiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gW1wiVXdhxbxhaiwgc3RyemVsacWCZcWbIHRhbSBjOlwiLCBcIkxlcGllaiBzcHLDs2J1aiBnZHppZSBpbmR6aWVqIDotKVwiLCBcIld5YmllcnogbcSFZHJ6ZSA6KVwiXVxyXG4gICAgICAgICAgICAgICAgdHh0LmlubmVySFRNTCA9IHRbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdC5sZW5ndGgpXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgUGxheWVyTW92ZXMuQ2FudFNob290OiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gW1wiV2EgOilcIiwgXCJKdcW8IHN0cnplbGFtIDspXCIsIFwiUHJhd2llIHd5YnJhxYJlbSA6RFwiXVxyXG4gICAgICAgICAgICAgICAgdHh0LmlubmVySFRNTCA9IHRbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdC5sZW5ndGgpXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgUGxheWVyTW92ZXMuSGl0OiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gW1wiTmllesWCeSBzdHJ6YcWCIDopXCIsIFwixZp3aWV0bmllIENpIGlkemllIGM6XCIsIFwiRG9icnkgamVzdGXFmyFcIl1cclxuICAgICAgICAgICAgICAgIHR4dC5pbm5lckhUTUwgPSB0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHQubGVuZ3RoKV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFBsYXllck1vdmVzLk1pc3M6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBbXCJCecWCbyBibGlza28gOilcIiwgXCJOYXN0xJlwbnltIHJhemVtIHNpxJkgdWRhIDpEXCIsIFwiUHJhd2llIHRyYWZpxYJlxZsgOi0pXCJdXHJcbiAgICAgICAgICAgICAgICB0eHQuaW5uZXJIVE1MID0gdFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0Lmxlbmd0aCldO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSBcIi4vLi4vY29uZmlnXCI7XHJcbmltcG9ydCBCb2FyZCwgeyBXaW4gfSBmcm9tIFwiLi9Cb2FyZFwiO1xyXG5pbXBvcnQgU2hpcFNldHRlciBmcm9tICcuL1NoaXBTZXR0ZXInO1xyXG5cclxuZnVuY3Rpb24gZW5kR2FtZSh3aG86IG51bWJlcikge1xyXG4gICAgaWYgKHdobyA9PT0gV2luLlBsYXllcikge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIld5Z3JhxYJlxZshXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hY2hpbmUtdGV4dCcpLmlubmVySFRNTCA9IFwiR3JhdHVsYWNqZSFcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NleGktdGV4dCcpLmlubmVySFRNTCA9IFwiUHJ6ZWdyYcWCZcWbIVwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWNoaW5lLXRleHQnKS5pbm5lckhUTUwgPSBcIk5pZSBwcnplam11aiBzacSZIMWad2lldG5pZSBDaSBzesWCbyA6KVwiO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCB7IGJvYXJkLCBzaGlwc1NpemVzIH0gPSBjb25maWc7XHJcblxyXG5jb25zdCBtYWNoaW5lQm9hcmQ6IEJvYXJkID0gbmV3IEJvYXJkKGJvYXJkWzBdLCBib2FyZFsxXSwgZW5kR2FtZSk7XHJcbmNvbnN0IHBsYXllckJvYXJkOiBCb2FyZCA9IG5ldyBCb2FyZChib2FyZFswXSwgYm9hcmRbMV0sIGVuZEdhbWUpO1xyXG5jb25zdCBzaGlwU2V0dGVyID0gbmV3IFNoaXBTZXR0ZXIoc2hpcHNTaXplcyk7XHJcblxyXG5tYWNoaW5lQm9hcmQuY3JlYXRlSFRNTEJvYXJkKG51bGwsIHBsYXllckJvYXJkKTtcclxucGxheWVyQm9hcmQuY3JlYXRlSFRNTEJvYXJkKHNoaXBTZXR0ZXIpO1xyXG5cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWNoaW5lXCIpLmFwcGVuZENoaWxkKG1hY2hpbmVCb2FyZC5nZXRITVRMQm9hcmQoKSk7XHJcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWVyXCIpLmFwcGVuZENoaWxkKHBsYXllckJvYXJkLmdldEhNVExCb2FyZCgpKTtcclxuXHJcbm1hY2hpbmVCb2FyZC5kcmF3U2hpcHMoc2hpcHNTaXplcy5zbGljZSgpKTtcclxuXHJcbmRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIGUgPT4ge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYgKHNoaXBTZXR0ZXIuaXNTZXR0aW5nKCkpIHtcclxuICAgICAgICBzaGlwU2V0dGVyLnVwZGF0ZURpcmVjdGlvbigpO1xyXG4gICAgICAgIHBsYXllckJvYXJkLnVwZGF0ZUxhc3RTaGlwKHNoaXBTZXR0ZXIuZGlyZWN0aW9uKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCBzdGFydEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydCcpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xyXG5zdGFydEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbnN0YXJ0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXhpLXRleHQnKS5pbm5lckhUTUwgPSBcIlR3w7NqIHJ1Y2hcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWNoaW5lLWNvbW1lbnRzJykuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG4gICAgbWFjaGluZUJvYXJkLmFsbG93U2hvb3QgPSB0cnVlO1xyXG4gICAgc3RhcnRCdXR0b24ucmVtb3ZlKCk7XHJcbn0pO1xyXG5cclxuXHJcbiJdfQ==
