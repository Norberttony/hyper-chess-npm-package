import { Board, StartingFen } from "./board.js";
import { getResultTag, PgnSplitter, Reader } from "../pgn/index.js";
import { VariationMove, VariationNode, VariationRoot } from "./variation.js";
import { Move } from "./move.js";
import { San } from "./san.js";
import { Lan } from "./coords.js";
import { Side } from "./piece.js";
import { GameResult } from "./board.js";
import { Pgn, PgnMove } from "../pgn/parse/types.js";
import { createVariationTree } from "./pgn-utils.js";

export class VariationsBoard extends Board {
    // variations in the position are stored via a tree. The root is the very
    // first empty variation (sentinel node).
    private variationRoot: VariationRoot;

    // This set-up allows quickly adding more moves at the end of the main variation, without
    // performing any additional tree searches.
    private mainVariation: VariationNode;

    // currentVariation points to the currently active variation that a piece of code or the
    // user is viewing. It is not necessarily the variation currently displayed to the user.
    private currentVariation: VariationNode;

    // any meta information about the board that represents this game.
    private pgn: Pgn = { headers: {}, moves: [], moveList: [], result: "*" };

    private startingFen: string = StartingFen;

    constructor(){
        super();
        this.variationRoot = new VariationRoot(this.pgn.moveList);
        this.mainVariation = this.variationRoot;
        this.currentVariation = this.variationRoot;
    }

    public override makeMove(move: Move): void {
        this.playMove(move);
    }

    public override unmakeMove(move: Move): void {
        const prev = this.currentVariation.prev;
        if (!prev || prev.type == "root")
            return;
        if (prev.move.equals(move))
            this.previousVariation();
        else
            throw new Error("Cannot unmake a move that was not in the previous variation");
    }

    public override getResult(): GameResult | undefined {
        if (this.currentVariation.type == "root")
            return;
        const res: GameResult | undefined = this.currentVariation.result;
        return res || super.getResult();
    }

    public override setResult(termination: string, winner: Side): GameResult {
        const res: GameResult = super.setResult(termination, winner);
        this.currentVariation.result = res;
        if (this.currentVariation.type == "move")
            this.currentVariation.pgnMove.result = getResultTag(winner);
        return res;
    }

    public getVariationRoot(): VariationRoot {
        return this.variationRoot;
    }

    public getMainVariation(): VariationNode {
        return this.mainVariation;
    }

    public getCurrentVariation(): VariationNode {
        return this.currentVariation;
    }

    public getPgn(): Pgn {
        return this.pgn;
    }

    public getStartingFen(): string {
        return this.startingFen;
    }

    public override loadFen(fen: string): void {
        super.loadFen(fen);

        this.startingFen = fen;

        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];
    }

    public loadPgn(pgnStr: string): void {
        let fen: string = StartingFen;

        const pgn: Pgn | undefined = new PgnSplitter(
            new Reader(pgnStr)
        ).nextPgn();
        if (!pgn)
            throw new Error("Could not load PGN");

        // check if we have to load from position
        if (pgn.headers["Variant"] == "From Position" && pgn.headers["FEN"]){
            fen = pgn.headers["FEN"];
        }

        this.loadFen(fen);

        // start reading san
        const { root, newPgn } = createVariationTree(pgn);
        this.variationRoot = root;
        this.mainVariation = this.variationRoot;
        this.currentVariation = this.variationRoot;
        this.pgn = newPgn;
    }

    public getMovesToCurrentVariation(): Move[] {
        const moves: Move[] = [];
        
        let iter: VariationNode | undefined = this.currentVariation;
        while (iter && iter.type == "move"){
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
        if (this.currentVariation.prev && this.currentVariation.type == "move"){
            if (this.currentVariation.move)
                super.unmakeMove(this.currentVariation.move);
            this.currentVariation = this.currentVariation.prev;
            return true;
        }
        return false;
    }

    // board jumps to the given variation
    public jumpToVariation(variation: VariationNode): void {
        const ca = this.currentVariation.type == "root" ?
            this.currentVariation :
            this.currentVariation.findCommonAncestor(variation);

        // build the path of nodes from the common ancestor to the given variation
        const path = [];
        let iter: VariationNode | undefined = variation;
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
        for (const n of variation.next)
            this.deleteVariation(n, true);

        // if removing part of the main variation, scroll back
        if (variation == this.mainVariation && variation.prev)
            this.mainVariation = variation.prev;

        if (variation.isMain())
            this.pgn.moves.splice(variation.level - 1, this.pgn.moves.length);

        const moveList: PgnMove[] = variation.moveList;
        moveList.splice(moveList.indexOf(variation.pgnMove), moveList.length);

        this.pgn.result = "*";

        if (variation == this.currentVariation)
            this.previousVariation();

        // only apply changes if this is the root of the call tree
        if (!isHelper)
            variation.prev!.next.splice(variation.prev!.next.indexOf(variation), 1);
    }

    public addMoveToEnd(san: San): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.getMoveOfSan(san);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    public addMoveToEndLan(lan: Lan): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);

        const move = this.getMoveOfLan(lan);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    // assumes move is legal
    public playMove(move: Move, San = super.getMoveSan(move)): VariationMove | undefined {
        // search for an existing variation with this move
        for (const v of this.currentVariation.next){
            if (v.pgnMove!.san == San){
                this.nextVariation(v.location);
                return;
            }
        }

        const pgnMove: PgnMove = {
            san: San,
            comments: [],
            glyphs: [],
            nags: [],
            variations: [],
        };

        // otherwise create a new variation
        const variation = this.currentVariation.attach(pgnMove, move);

        // update main move list
        if (variation.isMain())
            this.pgn.moves.push(variation.pgnMove.san);

        this.currentVariation = variation;

        // continue the main variation if necessary
        if (variation.prev == this.mainVariation)
            this.mainVariation = variation;

        super.makeMove(move);

        const res: GameResult | undefined = super.isGameOver();
        if (res){
            const resultTag: string = getResultTag(res.winner);
            this.currentVariation.result = res;
            this.currentVariation.pgnMove!.result = resultTag;

            if (this.currentVariation.isMain())
                this.pgn.result = resultTag;
        }

        return variation;
    }
}
