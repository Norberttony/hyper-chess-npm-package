import { Board, StartingFEN } from "./board.js";
import { VariationMove, PGNData, extractHeaders, extractMoves } from "../graphics/pgn/index.js";
import { PGNHeader } from "../graphics/pgn/pgn-data.js";
import { Move } from "./move.js";

export class VariationsBoard extends Board {
    // variations in the position are stored via a tree. The root is the very
    // first empty variation (sentinel node).
    public variationRoot: VariationMove = new VariationMove();

    // This set-up allows quickly adding more moves at the end of the main variation, without
    // performing any additional tree searches.
    public mainVariation: VariationMove = this.variationRoot;

    // currentVariation points to the currently active variation that a piece of code or the
    // user is viewing. It is not necessarily the variation currently displayed to the user.
    public currentVariation = this.variationRoot;

    // pgnData allows reading in the current variation.
    public pgnData = new PGNData(this.variationRoot);

    constructor(){
        super();
    }

    public override loadFEN(fen: string): void {
        super.loadFEN(fen);

        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];
    }

    public loadPGN(pgn: string): void {
        let fen: string = StartingFEN;
        
        const headers = extractHeaders(pgn);
        
        // check if we have to load from position
        if (headers.Variant == "From Position" && headers.FEN){
            fen = headers.FEN;
        }

        this.loadFEN(fen);

        // set headers of pgnData
        this.pgnData.clearHeaders();
        for (const [ name, value ] of Object.entries(headers))
            this.pgnData.setHeader(name as PGNHeader, value);

        // start reading san
        const pgnSplit = extractMoves(pgn).split(" ");
        this.readVariation(pgnSplit, 0);
    }

    // chooses one of the next variations to play
    public nextVariation(index = 0): boolean {
        const variation = this.currentVariation.next[index];
        if (variation){
            if (variation.move)
                this.makeMove(variation.move);
            this.currentVariation = variation;
            return true;
        }
        return false;
    }

    // goes back a variation
    public previousVariation(): boolean {
        if (this.currentVariation.prev){
            if (this.currentVariation.move)
                this.unmakeMove(this.currentVariation.move);
            this.currentVariation = this.currentVariation.prev;
            return true;
        }
        return false;
    }

    // board jumps to the given variation
    public jumpToVariation(variation: VariationMove): void {
        const ca = this.currentVariation.findCommonAncestor(variation);

        // build the path of nodes from the common ancestor to the given variation
        const path = [];
        let iter: VariationMove | undefined = variation;
        while (iter != ca){
            if (iter){
                path.unshift(iter.location);
                iter = iter.prev;
            }else{
                throw new Error(`Common Ancestor was invalid, cannot find path`);
            }
        }

        // go to the common ancestor
        while (this.currentVariation != ca)
            this.previousVariation();

        // go forth to the given variation
        for (const n of path)
            this.nextVariation(n);
    }

    public deleteVariation(variation: VariationMove, isHelper = false): void {
        // cannot delete root.
        if (variation == this.variationRoot)
            return;

        for (const n of variation.next)
            this.deleteVariation(n, true);

        // if removing part of the main variation, scroll back
        if (variation == this.mainVariation && variation.prev)
            this.mainVariation = variation.prev;

        if (variation == this.currentVariation)
            this.previousVariation();

        // only apply changes if this is the root of the call tree
        if (!isHelper)
            variation.prev!.next.splice(variation.prev!.next.indexOf(variation), 1);
    }

    public addMoveToEnd(san: string): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.getMoveOfSAN(san);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    public addMoveToEndLAN(lan: string): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.getMoveOfLAN(lan);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    // assumes move is legal
    public playMove(move: Move, SAN = this.getMoveSAN(move)): VariationMove | undefined {
        // search for an existing variation with this move
        for (const v of this.currentVariation.next){
            if (v.san == SAN){
                this.nextVariation(v.location);
                return;
            }
        }
        
        // otherwise create a new variation
        const variation = new VariationMove(move);
        variation.san = SAN;

        variation.attachTo(this.currentVariation);

        this.currentVariation = variation;

        // continue the main variation if necessary
        if (variation.prev == this.mainVariation)
            this.mainVariation = variation;

        super.makeMove(move);
        return variation;
    }

    // parses a list of PGN tokens
    public readVariation(pgnSplit: string[], start: number): number | undefined {
        let toUndo = 0;

        for (let i = start; i < pgnSplit.length; i++){
            const pgn = pgnSplit[i]!;

            if (pgn.startsWith("(")){

                this.previousVariation();

                // start a variation!
                i = this.readVariation(pgnSplit, i + 1)!;

                // continue with main variation
                this.nextVariation(0);

            }else if (pgn.startsWith(")")){

                for (let j = 0; j < toUndo; j++){
                    this.previousVariation();
                }

                return i;
            }else if (pgn.length == 0){
                // avoid having to search for a move that clearly doesn't exist.
                continue;
            }else{
                const move = this.getMoveOfSAN(pgn);
                if (move){
                    this.playMove(move, pgn);
                    toUndo++;
                }
            }
        }
        return;
    }
}
