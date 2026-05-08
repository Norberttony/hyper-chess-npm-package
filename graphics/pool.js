
import { PieceTypeToFEN, Piece } from "../index.js";

// handles generating elements to represent the pieces. Whenever a piece is taken, its element
// is put into a pool for later use.

// fetches an element from the pool
export function fetchElem(className, f, r, boardFlipped, container = document){
    const elems = container.getElementsByClassName("element-pool");

    let elem = elems[0];
    if (!elem){
        elem = document.createElement("div");
        if (container != document){
            container.appendChild(elem);
        }
    }

    setElemLocation(elem, f, r, boardFlipped);
    elem.className = className;

    return elem;
}

// sets the location of an element on the board
export function setElemLocation(elem, f, r, boardFlipped){
    elem.style.transform = `translate(${(boardFlipped ? 7 - f : f) * 100}%, ${(boardFlipped ? r : 7 - r) * 100}%)`;
}

// either creates a completely new move highlight, or fetches an unused element.
export function getMoveHighlightFromPool(f, r, boardFlipped, container = document){
    return fetchElem("board-graphics__move-highlight", f, r, boardFlipped, container);
}

// either creates a completely new move highlight, or fetches an unused element.
export function getLastMoveHighlightFromPool(f, r, boardFlipped, container = document){
    return fetchElem("board-graphics__move-highlight--last", f, r, boardFlipped, container);
}

// either creates a completely new piece, or fetches an unused element.
export function getPieceFromPool(f, r, boardFlipped, pieceType, pieceColor, container = document){
    let piece = fetchElem("board-graphics__piece", f, r, boardFlipped, container);

    const coords = `${f}_${r}`;
    const fen = PieceTypeToFEN[pieceType];

    piece.dataset.coords = coords;
    piece.dataset.pieceType = fen;
    
    piece.classList.add(coords, `board-graphics__piece--type-${fen}`);
    
    piece.style.backgroundPositionY = pieceColor == Piece.white ? "0%" : "100%";
    
    return piece;
}

// puts an element back into the pool.
export function setElemToPool(elem){
    elem.className = "element-pool";
    elem.innerHTML = "";
}

// puts a class into the pool
export function setClassToPool(classSelector, container){
    let elems = container.getElementsByClassName(classSelector);
    while (elems.length > 0)
        setElemToPool(elems[0]);
}

// puts all pieces back into the pool.
export function setAllPiecesToPool(container){
    setClassToPool("board-graphics__piece", container);
}

// puts all highlights back into pool.
export function setAllMoveHighlightsToPool(container){
    setClassToPool("board-graphics__move-highlight", container);
}

// puts all last move highlights back into pool.
export function setAllLastMoveHighlightsToPool(container){
    setClassToPool("board-graphics__move-highlight--last", container);
}

// attaches a glyph to the piece element
export function attachGlyph(elem, src){
    const div = document.createElement("div");
    div.classList.add("glyph");
    div.style.backgroundImage = `url(${src})`;
    elem.appendChild(div);
}
