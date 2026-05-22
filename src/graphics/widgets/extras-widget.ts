import { BoardGraphics } from "../board-graphics.js";
import { pgnToString } from "../../pgn/index.js";
import { BoardWidget, getFirstElemOfClass, WidgetLocation } from "./board-widget.js";

// Allows user to copy or set the FEN or PGN

export class ExtrasWidget extends BoardWidget {
    private pgnText: HTMLTextAreaElement;
    private fenText: HTMLInputElement;
    private pgnButton: HTMLElement;
    private fenButton: HTMLElement;

    constructor(
        boardgfx: BoardGraphics,
        location: WidgetLocation = WidgetLocation.Bottom
    ){
        super(boardgfx);

        const container = document.createElement("div");
        container.classList.add("board-graphics__extras");
        container.innerHTML = `
            <textarea class = "extras__pgn" onfocus = "this.select();" spellcheck = "false"></textarea>
            <button class = "extras__set-pgn-button">Set PGN</button>
            <input class = "extras__fen" onfocus = "this.select();">
            <button class = "extras__set-fen-button" spellcheck = "false">Set FEN</button>`;
        boardgfx.getWidgetContainer(location).appendChild(container);

        const pgnText = getFirstElemOfClass(container, "extras__pgn") as HTMLTextAreaElement;
        const fenText = getFirstElemOfClass(container, "extras__fen") as HTMLInputElement;

        this.boardgfx = boardgfx;
        this.pgnText = pgnText;
        this.fenText = fenText;
        this.pgnButton = getFirstElemOfClass(container, "extras__set-pgn-button") as HTMLElement;
        this.fenButton = getFirstElemOfClass(container, "extras__set-fen-button") as HTMLElement;

        this.updateFenText();
        this.updatePgnText();

        // clicking buttons
        this.pgnButton.onclick = () => {
            boardgfx.loadPgn(pgnText.value);
        }
        this.fenButton.onclick = () => {
            boardgfx.loadFen(fenText.value);
        }

        // listening to game state events
        boardgfx.skeleton.addEventListener("variation-change", () => this.updateFenText());
        boardgfx.skeleton.addEventListener("new-variation", () => this.updatePgnText());
        boardgfx.skeleton.addEventListener("loadFen", () => {
            this.updateFenText();
            this.updatePgnText();
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

    private updateFenText(): void {
        this.fenText.value = this.boardgfx.getFen();
    }

    private updatePgnText(): void {
        this.pgnText.value = pgnToString(this.boardgfx.getPgn());
    }
}
