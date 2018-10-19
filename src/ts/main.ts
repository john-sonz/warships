import { config } from "./../config";
import Board from "./Board";
import ShipSetter from './ShipSetter';

const { board, shipsSizes } = config;

const machineBoard: Board = new Board(board[0], board[1]);
const playerBoard: Board = new Board(board[0], board[1]);
const shipSetter = new ShipSetter(shipsSizes);

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
const startButton = document.getElementById('start') as HTMLButtonElement;
startButton.addEventListener('click', (e) => {
    document.getElementById('sexi-text').innerHTML = "Twój ruch";
    machineBoard.allowShoot = true;
});