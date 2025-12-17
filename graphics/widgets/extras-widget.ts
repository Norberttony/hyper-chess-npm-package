import { BoardGraphics } from "../board-graphics.js";
import { BoardWidget, getFirstElemOfClass, WidgetLocation } from "./board-widget.js";

// Allows user to copy or set the FEN or PGN

export class ExtrasWidget extends BoardWidget {
    private pgnText: HTMLTextAreaElement;
    private fenText: HTMLInputElement;
    private pgnButton: HTMLElement;
    private fenButton: HTMLElement;

    constructor(boardgfx: BoardGraphics, location: WidgetLocation = "Bottom"){
        super(boardgfx);

        const container = document.createElement("div");
        container.classList.add("board-graphics__extras");
        container.innerHTML = `
            <textarea class = "extras__pgn" onfocus = "this.select();" spellcheck = "false"></textarea>
            <button class = "extras__set-pgn-button" onclick = "setPGN();">Set PGN</button>
            <input class = "extras__fen" onfocus = "this.select();">
            <button class = "extras__set-fen-button" onclick = "setFEN();" spellcheck = "false">Set FEN</button>`;
        boardgfx.getWidgetContainer(location).appendChild(container);

        const pgnText = getFirstElemOfClass(container, "extras__pgn") as HTMLTextAreaElement;
        const fenText = getFirstElemOfClass(container, "extras__fen") as HTMLInputElement;

        this.boardgfx = boardgfx;
        this.pgnText = pgnText;
        this.fenText = fenText;
        this.pgnButton = getFirstElemOfClass(container, "extras__set-pgn-button") as HTMLElement;
        this.fenButton = getFirstElemOfClass(container, "extras__set-fen-button") as HTMLElement;

        this.updateFENText();
        this.updatePGNText();

        // clicking buttons
        this.pgnButton.onclick = () => {
            boardgfx.loadPGN(pgnText.value);
        }
        this.fenButton.onclick = () => {
            boardgfx.loadFEN(fenText.value);
        }

        // listening to game state events
        boardgfx.skeleton.addEventListener("variation-change", () => this.updateFENText());
        boardgfx.skeleton.addEventListener("new-variation", () => this.updatePGNText());
        boardgfx.skeleton.addEventListener("loadFEN", () => {
            this.updateFENText();
            this.updatePGNText();
        });
    }

    public override enable(): void {
        this.pgnButton.removeAttribute("disabled");
        this.fenButton.removeAttribute("disabled");
    }

    public override disable(): void {
        this.pgnButton.setAttribute("disabled", "true");
        this.fenButton.setAttribute("disabled", "true");
    }

    private updateFENText(): void {
        this.fenText.value = this.boardgfx.getFEN();
    }

    private updatePGNText(): void {
        this.pgnText.value = this.boardgfx.pgnData.toString();
    }
}
