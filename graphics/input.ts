import { setAllMoveHighlightsToPool, getMoveHighlightFromPool } from "./pool.js";
import type { BoardGraphics } from "./board-graphics.js";
import { Move } from "../game/move.js";

// This file handles the way that the user might interact with the game board via dragging pieces.

interface Input {
    currentMoves: Move[],
    selected?: HTMLElement,
    draggingElem?: HTMLElement,
    gameState?: BoardGraphics,
    testMove?: Move,
    dragging?: HTMLElement
};

// make pieces draggable
const INPUT: Input = {
    currentMoves: []
};

export function initInput(): void {
    document.body.addEventListener("pointerup", draggingPointerup);
    document.body.addEventListener("pointermove", pointerMove);
    document.body.addEventListener("touchmove", touchMove, { passive: false });
}

export function setInputTarget(gameState: BoardGraphics, draggingElem: HTMLElement, event: PointerEvent): void {
    INPUT.gameState = gameState;
    INPUT.draggingElem = draggingElem;

    piecePointerdown(event);
}

// sets the elements dragging position based on the user's pointer position
function setDraggingElemPos(pageX: number, pageY: number): void {
    if (!INPUT.dragging)
        return;
    if (INPUT.draggingElem){
        INPUT.draggingElem.style.left = `calc(${pageX}px - var(--piece-width) / 2)`;
        INPUT.draggingElem.style.top = `calc(${pageY}px - var(--piece-height) / 2)`;
    }
}

function pointerMove(event: PointerEvent): void {
    if (INPUT.dragging)
        event.preventDefault();
    setDraggingElemPos(event.pageX, event.pageY);
}

// prevent scrolling and glitches on mobile devices when thing is being dragged
function touchMove(event: TouchEvent): void {
    if (INPUT.dragging)
        event.preventDefault();
}

function piecePointerdown(event: PointerEvent): void {
    const elem = event.target as HTMLElement;
    if (event.button !== undefined && event.button != 0)
        return;

    if (!elem.classList.contains("board-graphics__move-highlight"))
        setAllMoveHighlightsToPool(INPUT.gameState!.skeleton);
    else
        return draggingPointerup(event);

    if (!elem.dataset["coords"])
        return;

    const coords = elem.dataset["coords"].split("_");
    const square = parseInt(coords[0]!) + parseInt(coords[1]!) * 8;

    // check with gameState if the piece can move
    if (!INPUT.gameState!.canMove(square))
        return;

    const piece = INPUT.gameState!.getPiece(square);

    INPUT.dragging = elem;
    INPUT.selected = elem;
    elem.classList.add("board-graphics__piece--dragged");
    if (INPUT.draggingElem){
        // copy over graphics
        INPUT.draggingElem.style.backgroundPositionY = INPUT.dragging.style.backgroundPositionY;
        INPUT.draggingElem.className = "board-graphics__dragging";
        INPUT.draggingElem.classList.add(`board-graphics__piece--type-${INPUT.dragging.dataset["pieceType"]}`);
        INPUT.draggingElem.style.display = "block";
    }

    setDraggingElemPos(event.pageX, event.pageY);

    // get moves for selected piece and display them
    INPUT.currentMoves = INPUT.gameState!.generatePieceMoves(square, piece);
    for (let i = 0; i < INPUT.currentMoves.length; i++){
        const move = INPUT.currentMoves[i]!;
        
        const highlight = getMoveHighlightFromPool(move.to % 8, Math.floor(move.to / 8), INPUT.gameState!.isFlipped);
        highlight.dataset["index"] = i.toString();

        // if move is a capture, update highlight graphically to indicate that
        if (move.captures.length > 0)
            highlight.classList.add("board-graphics__move-highlight--capture");

        INPUT.gameState!.piecesDiv.appendChild(highlight);
    }
}

function draggingPointerup(event: PointerEvent): void {
    if (event.button == 2)
        return;

    if (INPUT.dragging){
        INPUT.dragging.classList.remove("board-graphics__piece--dragged");
        INPUT.draggingElem!.style.display = "none";
    }
    
    let highlight = event.target as HTMLElement;

    // handle touch events
    if (event.pointerType == "touch")
        highlight = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    
    // player let go at a highlight, indicating they're moving the piece there.
    if (highlight.classList.contains("board-graphics__move-highlight")){
        INPUT.testMove = INPUT.currentMoves[parseInt(highlight.dataset["index"]!)]!;

        // testMove handlers
        INPUT.gameState!.playMove(INPUT.testMove);
        INPUT.gameState!.applyChanges(true);
        delete INPUT.testMove;

        // clear all moves from board
        setAllMoveHighlightsToPool(INPUT.gameState!.skeleton);
    }

    if (!INPUT.dragging){
        // clear all moves from board
        if (INPUT.gameState)
            setAllMoveHighlightsToPool(INPUT.gameState.skeleton);
    }else{
        delete INPUT.dragging;
    }
}
