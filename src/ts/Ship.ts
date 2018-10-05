import Cell from './Cell';

export default class Ship {
    positions: Cell[];
    length:number;
    direction: boolean;    
    sinked: boolean = false;
    constructor(cells: Cell[], length: number, direction: boolean = false) {
        this.direction = direction;
        this.length = length;
        this.positions = cells;
    }
}