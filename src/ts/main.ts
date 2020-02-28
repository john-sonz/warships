import { config } from "./../config";
import Board, { Win } from "./Board";
import ShipSetter from './ShipSetter';

function endGame(who: number) {
    if (who === Win.Player) {
        document.getElementById('sexi-text').innerHTML = "Wygrałeś!";
        document.getElementById('machine-text').innerHTML = "Gratulacje!";
    } else {
        document.getElementById('sexi-text').innerHTML = "Przegrałeś!";
        document.getElementById('machine-text').innerHTML = "Nie przejmuj się Świetnie Ci szło :)";
    }
}

const { board, shipsSizes } = config;

const machineBoard: Board = new Board(board[0], board[1], endGame);
const playerBoard: Board = new Board(board[0], board[1], endGame);
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
startButton.disabled = true;
startButton.addEventListener('click', (e) => {
    document.getElementById('sexi-text').innerHTML = "Twój ruch";
    document.getElementById('machine-comments').style.display = "flex";
    machineBoard.allowShoot = true;
    startButton.remove();
});


