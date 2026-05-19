import { Board, StartingFEN } from "./board.js";
import { PgnSplitter, Reader, VariationMove } from "../graphics/pgn/index.js";
import { Move } from "./move.js";
import { SAN } from "./san.js";
import { LAN } from "./coords.js";
import { Side } from "./piece.js";
import { GameResult } from "./board.js";
import { Pgn } from "../pgn/parse/types.js";
import { createVariationTree } from "./pgn-utils.js";

export class VariationsBoard extends Board {
    // variations in the position are stored via a tree. The root is the very
    // first empty variation (sentinel node).
    protected variationRoot: VariationMove = new VariationMove();

    // This set-up allows quickly adding more moves at the end of the main variation, without
    // performing any additional tree searches.
    protected mainVariation: VariationMove = this.variationRoot;

    // currentVariation points to the currently active variation that a piece of code or the
    // user is viewing. It is not necessarily the variation currently displayed to the user.
    protected currentVariation = this.variationRoot;

    // represents the current Pgn object that represents this board.
    protected pgn: Pgn = { headers: {}, moves: [], moveList: [], result: "*" };

    private startingFEN: string = StartingFEN;

    constructor(){
        super();
    }

    public override makeMove(move: Move): void {
        this.playMove(move);
    }

    public override unmakeMove(move: Move): void {
        if (this.currentVariation.prev?.move?.equals(move))
            this.previousVariation();
        else
            throw new Error("Cannot unmake a move that was not in the previous variation");
    }

    public override getResult(): GameResult | undefined {
        return this.currentVariation.result || super.getResult();
    }

    public override setResult(termination: string, winner: Side): GameResult {
        const res: GameResult = super.setResult(termination, winner);
        this.currentVariation.result = res;
        return res;
    }

    public getVariationRoot(): VariationMove {
        return this.variationRoot;
    }

    public getMainVariation(): VariationMove {
        return this.mainVariation;
    }

    public getCurrentVariation(): VariationMove {
        return this.currentVariation;
    }

    public getPgn(): Pgn {
        return this.pgn;
    }

    public getStartingFEN(): string {
        return this.startingFEN;
    }

    public override loadFEN(fen: string): void {
        super.loadFEN(fen);

        this.startingFEN = fen;

        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];
    }

    public loadPGN(pgnStr: string): void {
        let fen: string = StartingFEN;

        const pgn: Pgn | undefined = new PgnSplitter(
            new Reader(pgnStr)
        ).nextPgn();
        if (!pgn)
            return;
        
        // check if we have to load from position
        if (pgn.headers["Variant"] == "From Position" && pgn.headers["FEN"]){
            fen = pgn.headers["FEN"];
        }

        this.loadFEN(fen);

        // start reading san
        this.variationRoot = createVariationTree(pgn);
        this.mainVariation = this.variationRoot;
        this.currentVariation = this.variationRoot;
    }

    public getMovesToCurrentVariation(): Move[] {
        const moves: Move[] = [];
        
        let iter: VariationMove | undefined = this.currentVariation;
        while (iter){
            if (iter.move)
                moves.unshift(iter.move);
            iter = iter.prev;
        }

        return moves;
    }

    // chooses one of the next variations to play
    public nextVariation(index = 0): boolean {
        const variation = this.currentVariation.next[index];
        if (variation){
            if (variation.move)
                super.makeMove(variation.move);
            this.currentVariation = variation;
            return true;
        }
        return false;
    }

    // goes back a variation
    public previousVariation(): boolean {
        if (this.currentVariation.prev){
            if (this.currentVariation.move)
                super.unmakeMove(this.currentVariation.move);
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

    public addMoveToEnd(san: SAN): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.getMoveOfSAN(san);
        if (move)
            super.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    public addMoveToEndLAN(lan: LAN): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);

        const move = this.getMoveOfLAN(lan);
        if (move)
            super.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    // assumes move is legal
    public playMove(move: Move, SAN = super.getMoveSAN(move)): VariationMove | undefined {
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

        const res = super.isGameOver();
        if (res)
            this.currentVariation.result = res;

        return variation;
    }
}
