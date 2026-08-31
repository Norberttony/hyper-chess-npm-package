import { getFenCharFromPieceType, PieceType, Side } from "../../browser-index.js";
import { ElementPool } from "./element-pool.js";

export class BoardElementPool extends ElementPool<"div"> {
    constructor(root: HTMLElement){
        super("div", root);
    }

    protected override cleanElement(elem: HTMLDivElement): void {
        super.cleanElement(elem);

        for (const key in elem.dataset)
            delete elem.dataset[key];

        elem.onpointerdown = function(){}
        elem.onpointerup = function(){}
    }

    // helper functions

    public setElemLocation(elem: HTMLDivElement, f: number, r: number, boardFlipped: boolean): void {
        elem.style.transform = `translate(${(boardFlipped ? 7 - f : f) * 100}%, ${(boardFlipped ? r : 7 - r) * 100}%)`;
    }

    public getMoveHighlightFromPool(f: number, r: number, boardFlipped: boolean): HTMLElement {
        return this.getAndPositionElement("board-graphics__move-highlight", f, r, boardFlipped);
    }

    public getLastMoveHighlightFromPool(f: number, r: number, boardFlipped: boolean): HTMLElement {
        return this.getAndPositionElement("board-graphics__move-highlight--last", f, r, boardFlipped);
    }

    public getPieceFromPool(f: number, r: number, boardFlipped: boolean, pieceType: PieceType, pieceSide: Side): HTMLElement {
        let piece = this.getAndPositionElement("board-graphics__piece", f, r, boardFlipped);
    
        const coords = `${f}_${r}`;
        const fen = getFenCharFromPieceType(pieceType);
    
        piece.dataset["coords"] = coords;
        piece.dataset["pieceType"] = fen;
        
        piece.classList.add(coords);
        piece.classList.add(`board-graphics__piece--type-${fen}`);
        
        piece.style.backgroundPositionY = pieceSide == Side.White ? "0%" : "100%";
        
        return piece;
    }

    public setAllPiecesToPool(): void {
        this.setClassToPool("board-graphics__piece");
    }

    public setAllMoveHighlightsToPool(): void {
        this.setClassToPool("board-graphics__move-highlight");
    }

    public setAllLastMoveHighlightsToPool(): void {
        this.setClassToPool("board-graphics__move-highlight--last");
    }

    public attachGlyph(elem: HTMLElement, src: string): void {
        const div = document.createElement("div");
        div.classList.add("glyph");
        div.style.backgroundImage = `url(${src})`;
        elem.appendChild(div);
    }

    private getAndPositionElement(className: string, f: number, r: number, boardFlipped: boolean): HTMLElement {
        const elem = this.getElement();
        this.setElemLocation(elem, f, r, boardFlipped);
        elem.className = className;
        return elem;
    }
}
