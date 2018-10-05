import {config} from "./../config";
import Board from "./Board";



const machineBoard: Board = new Board(config.board[0], config.board[1]);
const playerBoard: Board = new Board(config.board[0], config.board[1]);

document.getElementById("machine").appendChild(machineBoard.getHMTLBoard());
document.getElementById("player").appendChild(playerBoard.getHMTLBoard());

machineBoard.drawShips(config.shipsSizes.slice());