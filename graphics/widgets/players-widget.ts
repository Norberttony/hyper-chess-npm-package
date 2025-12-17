import { BoardGraphics } from "../board-graphics.js";
import { BoardWidget } from "./board-widget.js";

// technically takes up two locations at once but oh well

export class PlayersWidget extends BoardWidget {
    private topPlyr: HTMLElement;
    private bottomPlyr: HTMLElement;

    constructor(boardgfx: BoardGraphics){
        super(boardgfx);

        const topPlyr = document.createElement("div");
        topPlyr.classList.add("board-graphics__top-player");
        boardgfx.getWidgetContainer("Top_Bar").appendChild(topPlyr);

        const bottomPlyr = document.createElement("div");
        bottomPlyr.classList.add("board-graphics__bottom-player");
        boardgfx.getWidgetContainer("Bottom_Bar").appendChild(bottomPlyr);

        this.topPlyr = topPlyr;
        this.bottomPlyr = bottomPlyr;

        // whenever the board flips, update the player names.
        boardgfx.skeleton.addEventListener("player-names", (event) => {
            const { whiteName, blackName } = (event as CustomEvent).detail;
            this.setNames(whiteName, blackName);
        });
        boardgfx.skeleton.addEventListener("flip", () => {
            const temp = topPlyr.innerText;
            topPlyr.innerText = bottomPlyr.innerText;
            bottomPlyr.innerText = temp;
        });
    }

    public override disable(): void {
        this.topPlyr.style.display = "none";
        this.bottomPlyr.style.display = "none";
    }

    public override enable(): void {
        this.topPlyr.style.display = "";
        this.bottomPlyr.style.display = "";
    }

    private setNames(white: string, black: string): void {
        if (!this.boardgfx.isFlipped){
            this.topPlyr.innerText = black;
            this.bottomPlyr.innerText = white;
        }else{
            this.topPlyr.innerText = white;
            this.bottomPlyr.innerText = black;
        }
    }
}
