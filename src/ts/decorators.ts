import { PlayerMoves } from './Board';


export function comment(targert: any, name: string, descriptor: any) {
    const original: Function = descriptor.value;
    const txt = document.getElementById('machine-text') as HTMLElement;
    descriptor.value = function (...args: any[]) {
        const result = original.apply(this, args);
        switch (result) {
            case PlayerMoves.AlreadyShot: {
                const t = ["Uważaj, strzeliłeś tam c:", "Lepiej spróbuj gdzie indziej :-)", "Wybierz mądrze :)"]
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case PlayerMoves.CantShoot: {
                const t = ["Poczekaj chwilkę :)", "Już strzelam ;)", "Prawie wybrałem :D"]
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case PlayerMoves.Hit: {
                const t = ["Niezły strzał :)", "Świetnie Ci idzie c:", "Dobry jesteś!"]
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
            case PlayerMoves.Miss: {
                const t = ["Było blisko :)", "Następnym razem się uda :D", "Prawie trafiłeś :-)"]
                txt.innerHTML = t[Math.floor(Math.random() * t.length)];
                break;
            }
        }
    }

}