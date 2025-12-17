import { getFENCharFromPieceType, Side, PieceType } from "../index.js";

// handles generating elements to represent the pieces. Whenever a piece is taken, its element
// is put into a pool for later use.

// fetches an element from the pool
export function fetchElem(className: string, f: number, r: number, boardFlipped: boolean): HTMLElement {
    let elem = document.getElementById("element-pool");
    if (!elem){
        elem = document.createElement("div");
    }

    elem.id = "";
    setElemLocation(elem, f, r, boardFlipped);
    elem.className = className;

    return elem;
}

// sets the location of an element on the board
export function setElemLocation(elem: HTMLElement, f: number, r: number, boardFlipped: boolean): void {
    elem.style.transform = `translate(${(boardFlipped ? 7 - f : f) * 100}%, ${(boardFlipped ? r : 7 - r) * 100}%)`;
}

// either creates a completely new move highlight, or fetches an unused element.
export function getMoveHighlightFromPool(f: number, r: number, boardFlipped: boolean): HTMLElement {
    return fetchElem("board-graphics__move-highlight", f, r, boardFlipped);
}

// either creates a completely new move highlight, or fetches an unused element.
export function getLastMoveHighlightFromPool(f: number, r: number, boardFlipped: boolean): HTMLElement {
    return fetchElem("board-graphics__move-highlight--last", f, r, boardFlipped);
}

// either creates a completely new piece, or fetches an unused element.
export function getPieceFromPool(f: number, r: number, boardFlipped: boolean, pieceType: PieceType, pieceSide: Side): HTMLElement {
    let piece = fetchElem("board-graphics__piece", f, r, boardFlipped);

    const coords = `${f}_${r}`;
    const fen = getFENCharFromPieceType(pieceType);

    piece.dataset["coords"] = coords;
    piece.dataset["pieceType"] = fen;
    
    piece.classList.add(coords);
    piece.classList.add(`board-graphics__piece--type-${fen}`);
    
    piece.style.backgroundPositionY = pieceSide == Side.White ? "0%" : "100%";
    
    return piece;
}

// puts an element back into the pool.
export function setElemToPool(elem: HTMLElement): void {
    elem.id = "element-pool";
    elem.className = "";
    elem.innerHTML = "";

    for (const key in elem.dataset)
        delete elem.dataset[key];

    elem.onpointerdown = function(){}
    elem.onpointerup = function(){}
}

// puts a class into the pool
export function setClassToPool(classSelector: string, container: HTMLElement): void {
    let elems = container.getElementsByClassName(classSelector);
    while (elems.length > 0)
        setElemToPool(elems[0] as HTMLElement);
}

// puts all pieces back into the pool.
export function setAllPiecesToPool(container: HTMLElement): void {
    setClassToPool("board-graphics__piece", container);
}

// puts all highlights back into pool.
export function setAllMoveHighlightsToPool(container: HTMLElement): void {
    setClassToPool("board-graphics__move-highlight", container);
}

// puts all last move highlights back into pool.
export function setAllLastMoveHighlightsToPool(container: HTMLElement): void {
    setClassToPool("board-graphics__move-highlight--last", container);
}

// attaches a glyph to the piece element
export function attachGlyph(elem: HTMLElement, src: string): void {
    const div = document.createElement("div");
    div.classList.add("glyph");
    div.style.backgroundImage = `url(${src})`;
    elem.appendChild(div);
}
