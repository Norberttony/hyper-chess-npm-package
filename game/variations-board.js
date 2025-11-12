
import { Board, StartingFEN } from "./board.js";
import { VariationMove, PGNData, extractHeaders, extractMoves } from "../graphics/pgn/index.js";

export class VariationsBoard extends Board {
    constructor(){
        super();

        // variations in the position are stored via a tree. The root is the very first empty
        // variation (sentinel node).
        this.variationRoot = new VariationMove();
        
        // This set-up allows quickly adding more moves at the end of the main variation, without
        // performing any additional tree searches.
        this.mainVariation = this.variationRoot;

        // pgnData allows reading in the current variation.
        this.pgnData = new PGNData(this.variationRoot);

        // currentVariation points to the currently active variation that a piece of code or the
        // user is viewing. It is not necessarily the variation currently displayed to the user.
        this.currentVariation = this.variationRoot;
    }

    loadFEN(fen){
        super.loadFEN(fen);

        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];
    }

    loadPGN(pgn){
        let fen = StartingFEN;
        
        const headers = extractHeaders(pgn);
        
        // check if we have to load from position
        if (headers.Variant == "From Position"){
            fen = headers.FEN;
        }

        let whiteScore = "";
        let blackScore = "";
        if (headers.Result)
            [ whiteScore, blackScore ] = headers.Result.split("-");

        this.loadFEN(fen);

        // set headers of pgnData
        this.pgnData.clearHeaders();
        for (const [ name, value ] of Object.entries(headers))
            this.pgnData.setHeader(name, value);

        // start reading san
        const pgnSplit = extractMoves(pgn).split(" ");
        this.readVariation(pgnSplit, 0);
    }

    // chooses one of the next variations to play
    nextVariation(index = 0){
        const variation = this.currentVariation.next[index];
        if (variation){
            this.makeMove(variation.move);
            this.currentVariation = variation;
            return true;
        }
        return false;
    }

    // goes back a variation
    previousVariation(){
        if (this.currentVariation.prev){
            this.unmakeMove(this.currentVariation.move);
            this.currentVariation = this.currentVariation.prev;
            return true;
        }
        return false;
    }

    // board jumps to the given variation
    jumpToVariation(variation){
        const ca = this.currentVariation.findCommonAncestor(variation);

        // build the path of nodes from the common ancestor to the given variation
        const path = [];
        let iter = variation;
        while (iter != ca){
            path.unshift(iter.location);
            iter = iter.prev;
        }

        // go to the common ancestor
        while (this.currentVariation != ca)
            this.previousVariation();

        // go forth to the given variation
        for (const n of path)
            this.nextVariation(n);
    }

    deleteVariation(variation, isHelper = false){
        for (const n of variation.next)
            this.deleteVariation(n, true);

        // if removing part of the main variation, scroll back
        if (variation == this.mainVariation)
            this.mainVariation = variation.prev;

        if (variation == this.currentVariation)
            this.previousVariation();

        // only apply changes if this is the root of the call tree
        if (!isHelper){
            variation.prev.next.splice(variation.prev.next.indexOf(variation), 1);
            this.applyChanges(false);
        }
    }

    addMoveToEnd(san){
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.getMoveOfSAN(san);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    addMoveToEndLAN(lan){
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
    playMove(move, SAN = this.getMoveSAN(move)){
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

        this.dispatchEvent("new-variation", { variation });

        // continue the main variation if necessary
        if (variation.prev == this.mainVariation)
            this.mainVariation = variation;

        super.makeMove(move);
    }

    // parses a list of PGN tokens
    readVariation(pgnSplit, start){
        let toUndo = 0;

        for (let i = start; i < pgnSplit.length; i++){
            const pgn = pgnSplit[i];

            if (pgn.startsWith("(")){

                this.previousVariation();

                // start a variation!
                i = this.readVariation(pgnSplit, i + 1);

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
    }
}
