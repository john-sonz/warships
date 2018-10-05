export default class Cell{
    x:number;
    y:number;
    hit:boolean = false;
    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}