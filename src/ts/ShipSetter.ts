export default class ShipSetter{
    ships: number[];
    container: HTMLElement;
    selected: number;
    direction: boolean;
    placed: number = 0;
    constructor(ships: number[]){
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
                if(a) a.classList.remove("selected");
                const el = e.currentTarget as HTMLElement;
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
    getContainer = () => this.container;
    updateDirection = () => this.direction = !this.direction;
    isSetting = () => this.selected != null;
    shipPlaced(){
        document.getElementsByClassName("selected")[0].remove();
        this.selected = null;
        this.placed++
        if(this.placed === this.ships.length){
            const startButton = <HTMLButtonElement> document.getElementById('start');
            startButton.disabled = false;
            document.getElementById('ships').remove();
            const sexi = document.getElementById('sexi-text') as HTMLElement;
            sexi.innerHTML = "Rozpocznij grę";
        }
    }
}