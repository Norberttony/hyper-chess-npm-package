import { Side } from "../../game/piece.js";
import { BoardWidget, WidgetLocation } from "./board-widget.js";
import { addPointerHoldListener } from "../pgn-control.js";
import type { BoardGraphics } from "../board-graphics.js";
import { VariationMove, VariationNode } from "../../game/variation.js";
import { getResultMarker } from "../../pgn/parse/utils.js";
import { DeleteVariationEvent, ResultEvent, VariationChangeEvent } from "../board-events.js";

// handles displaying any of the moves in a separate panel, splitting the PGN into variations as
// necessary.

// The PGN list structure is a little complicated as it must allow a practically infinite nesting
// of different variations, with a way to style main variation elements.

//  <div class="pgn-viewer__pgn-list">
//      <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-moveline">
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-num">1.</div>
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pd4</div>
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pf5</div>
//      </div>
//      <div class="pgn-viewer__pgn-moveline--type-variation">
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-moveline">
//              <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pe3</div>
//              <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Ph3</div>
//          </div>
//      </div>
//  </div>

export class PgnWidget extends BoardWidget {
    // determines the current next variation the user is selecting
    private selectedVariation: number = 0;
    private pgnElem: HTMLElement;
    private resultElem?: HTMLElement;
    // maps each VarationMove to its corresponding HTML element.
    private elementMap = new Map<VariationMove, HTMLElement>;

    constructor(boardgfx: BoardGraphics, location: WidgetLocation){
        super(boardgfx);

        const container = document.createElement("div");
        container.classList.add("pgn-viewer");
        boardgfx.getWidgetContainer(location).appendChild(container);

        const pgnControl = document.createElement("div");
        pgnControl.classList.add("pgn-viewer__pgn-control");
        pgnControl.innerHTML = `
            <button class = "pgn-viewer__first">&lt;&lt;</button>
            <button class = "pgn-viewer__back">&lt;</button>
            <button class = "pgn-viewer__next">&gt;</button>
            <button class = "pgn-viewer__last">&gt;&gt;</button>`;
        container.appendChild(pgnControl);

        const back = pgnControl.getElementsByClassName("pgn-viewer__back")[0] as HTMLElement;
        addPointerHoldListener(back, () => {
            this.PgnMoveBack();
        });

        const next = pgnControl.getElementsByClassName("pgn-viewer__next")[0] as HTMLElement;
        addPointerHoldListener(next, () => {
            this.PgnMoveForward();
        });

        const first = pgnControl.getElementsByClassName("pgn-viewer__first")[0] as HTMLElement;
        first.addEventListener("click", () => {
            // displays position with no moves made on the board
            this.PgnMoveFirst();
        });

        const last = pgnControl.getElementsByClassName("pgn-viewer__last")[0] as HTMLElement;
        last.addEventListener("click", () => {
            // displays position of the last committed move in the main variation
            this.PgnMoveLast();
        });

        const pgnElem = document.createElement("div");
        // TO-DO: this should be here until the CSS class names are converted to a better format
        pgnElem.classList.add("pgn-viewer__pgn-list");
        container.appendChild(pgnElem);

        this.pgnElem = pgnElem;

        // event listeners
        boardgfx.skeleton.addEventListener("new-variation", () => this.updatePgnList());
        boardgfx.skeleton.addEventListener("result", (event) => {
            this.onResult(event);
        });
        boardgfx.skeleton.addEventListener("loadFen", () => this.updatePgnList());
        boardgfx.skeleton.addEventListener("variation-change", (event) => {
            this.onVariationChange(event);
        });
        boardgfx.skeleton.addEventListener("delete-variation", (event) => {
            this.onDeleteVariation(event);
        });

        document.body.addEventListener("keydown", (event) => this.keydown(event));
    }

    private keydown(event: KeyboardEvent){
        if (event.target == this.boardgfx.skeleton){
            switch (event.key.toLowerCase()){
                case "arrowleft":
                    this.PgnMoveBack();
                    break;
                case "arrowright":
                    this.PgnMoveForward();
                    break;
                case "arrowup":
                    this.PgnUpVariation();
                    break;
                case "arrowdown":
                    this.PgnDownVariation();
                    break;

                case "f":
                    this.boardgfx.flip();
                    break;

                // if no bound key was hit, do not prevent event default.
                default:
                    return;
            }
            event.preventDefault();
        }
    }

    private PgnMoveBack(): void {
        if (this.boardgfx.previousVariation())
            this.boardgfx.applyChanges();
        this.selectedVariation = 0;
    }

    private PgnMoveForward(): void {
        if (this.boardgfx.nextVariation(this.selectedVariation))
            this.boardgfx.applyChanges();
        this.selectedVariation = 0;
    }

    private PgnUpVariation(): void {
        this.selectedVariation--;
        if (this.selectedVariation < 0)
            this.selectedVariation = this.boardgfx.getCurrentVariation().next.length - 1;
    }

    private PgnDownVariation(): void {
        const max = this.boardgfx.getCurrentVariation().next.length;
        this.selectedVariation = (this.selectedVariation + 1) % max;
    }

    private PgnMoveFirst(): void {
        // displays position with no moves made on the board
        this.boardgfx.jumpToVariation(this.boardgfx.getVariationRoot());
        this.boardgfx.applyChanges();
    }

    private PgnMoveLast(): void {
        // displays position of the last committed move in the main variation
        let iter = this.boardgfx.getCurrentVariation();
        while (iter.next[0]){
            iter = iter.next[0];
        }

        this.boardgfx.jumpToVariation(iter);
        this.boardgfx.applyChanges();
    }

    private clearPgnList(): void {
        while (this.pgnElem.firstChild)
            this.pgnElem.removeChild(this.pgnElem.firstChild);
    }

    // rebuilds whole list
    private updatePgnList(): void {
        this.elementMap = new Map();
        const root = this.boardgfx.getVariationRoot();
        const next = root.next[0];
        this.clearPgnList();
        if (next)
            this.buildPgnList(this.pgnElem, next);
    }

    private buildPgnList(container: HTMLElement, variation: VariationMove): void {
        console.log(variation.san);
        if (!variation.prev)
            return;

        const { turn, san } = variation;
        const moveNum = variation.fullMoveNum;
        const prev: VariationNode = variation.prev;
        const nextMain = variation.next[0];

        let whiteSanElem: HTMLElement;
        let blackSanElem: HTMLElement | undefined;
        let split = false; // whether or not to split a moveline due to an intermediate variation

        if (turn === Side.Black){
            // only build half of the move
            whiteSanElem = newBlankSanElem(this.boardgfx, this.pgnElem);
            blackSanElem = newSanElem(this.boardgfx, this.pgnElem, san, variation);

            this.elementMap.set(variation, blackSanElem);
        }else{
            // build full moveline if possible
            whiteSanElem = newSanElem(this.boardgfx, this.pgnElem, san, variation);
            this.elementMap.set(variation, whiteSanElem);

            // check if black's move exists
            if (nextMain){
                // check if white's move has variations, which would force a split
                if (variation.location !== 0 || prev.next.length === 1){
                    blackSanElem = newSanElem(this.boardgfx, this.pgnElem, nextMain.san, nextMain);
                    this.elementMap.set(nextMain, blackSanElem);
                }else{
                    split = true;
                    blackSanElem = newBlankSanElem(this.boardgfx, this.pgnElem);
                }
            }
        }

        // must build VariationsElem carefully, what if moveline should be split?
        const moveline = newMovelineElem(moveNum, whiteSanElem, blackSanElem);
        container.appendChild(moveline);

        // build variationsElem if exists
        if (turn !== Side.Black && variation.location === 0 && prev.next.length > 1){
            for (let i = 1; i < prev.next.length; i++){
                const varElem = newVariationElem();
                this.buildPgnList(varElem, prev.next[i]!);
                container.appendChild(varElem);
            }
        }else if (variation.next.length > 1){
            for (let i = 1; i < variation.next.length; i++){
                const varElem = newVariationElem();
                this.buildPgnList(varElem, variation.next[i]!);
                container.appendChild(varElem);
            }
        }

        // build next moveline if exists
        if ((turn === Side.Black || split) && nextMain)
            this.buildPgnList(container, nextMain);
        else if (!split && nextMain && nextMain.next[0])
            this.buildPgnList(container, nextMain.next[0]);
    }

    private onResult(event: ResultEvent): void {
        const { winner, termination, variation } = event.detail;

        // do not alert on results occurring in pgn variations
        if (!variation.isMain())
            return;

        // based on the result number, add some result text and flavor text
        const result = getResultMarker(winner);
        const resultText = result.split("-").join(" - ");
        let flavorText;
        if (result == "1/2-1/2"){
            flavorText = "Game ended by";
        }else if (result == "0-1"){
            flavorText = "Black wins by";
        }else if (result == "1-0"){
            flavorText = "White wins by";
        }

        // displays result
        if (!this.resultElem || !this.resultElem.parentNode){
            const pgn_resultElem = document.createElement("div");
            pgn_resultElem.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-result");
            this.pgnElem.appendChild(pgn_resultElem);
            this.resultElem = pgn_resultElem;
        }
        this.resultElem.innerHTML = `<span>${resultText}</span><br /><span style = "font-size: large;">${flavorText} ${termination}</span>`;
    }
    
    private onVariationChange(event: VariationChangeEvent): void {
        const { variation } = event.detail;

        if (variation.type !== "move")
            return selectPgnElem(this.pgnElem, undefined);

        const elem = this.elementMap.get(variation);
        if (elem)
            selectPgnElem(this.pgnElem, elem);
    }

    private onDeleteVariation(event: DeleteVariationEvent): void {
        const { variation } = event.detail;

        if (variation == this.boardgfx.getMainVariation() && this.resultElem && this.resultElem.parentNode){
            this.resultElem.parentNode.removeChild(this.resultElem);
            delete this.resultElem;
        }

        this.updatePgnList();
    }
}

function selectPgnElem(pgnElem: HTMLElement, elem: HTMLElement | undefined): void {
    (document.getElementsByClassName("pgn-viewer__pgn-elem--selected")[0] || elem || document.body).classList.remove("pgn-viewer__pgn-elem--selected");
    if (elem){
        elem.classList.add("pgn-viewer__pgn-elem--selected");
        
        // scrolls to selected pgn
        let pgnRect = pgnElem.getBoundingClientRect();
        let elemRect = elem.getBoundingClientRect();
        let elemPos = elemRect.top - pgnRect.top; // element's position relative to the PGN scroll view

        // already in view! don't scroll!
        if (elemPos > 0 && elemPos + elemRect.height < pgnRect.height)
            return;

        // determine direction of scroll
        if (elemPos <= 0){
            // so we've scrolled past element, set it to top (as that is first occurrence)
            pgnElem.scrollBy(0, elemRect.top - pgnRect.top);
        }else{
            pgnElem.scrollBy(0, elemRect.bottom - pgnRect.bottom);
        }
    }else{
        pgnElem.scrollTo(0, 0);
    }
}

// creates and returns the new moveline with the given number and white elem.
function newMovelineElem(num: number, whiteSanElem: HTMLElement, blackSanElem?: HTMLElement): HTMLDivElement {
    const moveline = document.createElement("div");

    moveline.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-moveline");

    const numElem = document.createElement("div");
    numElem.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-num");
    numElem.innerText = `${num}.`;
    
    moveline.appendChild(numElem);
    moveline.appendChild(whiteSanElem);
    if (blackSanElem)
        moveline.appendChild(blackSanElem);

    return moveline;
}

function newSanElem(gameState: BoardGraphics, pgnElem: HTMLElement, san: string, variation?: VariationMove): HTMLDivElement {
    const div = document.createElement("div");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-san");
    div.innerText = san;

    if (variation){
        div.addEventListener("click", () => {
            gameState.jumpToVariation(variation);
            gameState.applyChanges();
            selectPgnElem(pgnElem, div);
        });
    }

    return div;
}

function newBlankSanElem(gameState: BoardGraphics, pgnElem: HTMLElement): HTMLDivElement {
    const div = newSanElem(gameState, pgnElem, "...");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-blank");
    return div;
}

function newVariationElem(): HTMLDivElement {
    const div = document.createElement("div");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-variation");
    return div;
}
