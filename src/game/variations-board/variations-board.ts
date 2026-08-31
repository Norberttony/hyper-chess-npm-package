import { Board, StartingFen } from "../board/board.js";
import { Reader } from "../../pgn/read/reader.js";
import { getResultMarker } from "../../pgn/parse/utils.js";
import { PgnSplitter } from "../../pgn/parse/pgn-splitter.js";
import { Pgn, PgnMove } from "../../pgn/parse/types.js";
import { VariationMove, VariationNode, VariationRoot } from "./variation.js";
import { Move } from "../board/move.js";
import { removeGlyphs, San } from "../notation/san.js";
import { Lan } from "../notation/coords.js";
import { GameResult } from "../board/move-generator.js";
import { createVariationTree } from "./pgn-utils.js";

export class VariationsBoard {
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
    private pgn: Pgn = emptyPgnObject();

    private startingFen: string = StartingFen;

    private board: Board;

    constructor(){
        this.board = new Board(this.startingFen);
        this.variationRoot = new VariationRoot(this.pgn.moveList);
        this.mainVariation = this.variationRoot;
        this.currentVariation = this.variationRoot;
    }

    public getBoard(): Board {
        return this.board;
    }

    public getMoveOfLan(lan: Lan): Move | undefined {
        return this.board.getMoveOfLan(lan);
    }

    public getFen(): string {
        return this.board.getFen();
    }

    public getResult(): GameResult | undefined {
        if (this.currentVariation.type == "root")
            return;
        const res: GameResult | undefined = this.currentVariation.result;
        return res || this.board.getResult();
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

    public loadFen(fen: string): void {
        this.board.loadFen(fen);

        this.startingFen = fen;

        // clear pgn
        this.pgn = emptyPgnObject();

        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];
        this.variationRoot.moveList = this.pgn.moveList;

        // update headers if this is not the default starting position
        if (this.board.getFen() === StartingFen){
            this.pgn.headers.delete("Variant");
            this.pgn.headers.delete("FEN");
        }else{
            this.pgn.headers.set("Variant", "From Position");
            this.pgn.headers.set("FEN", this.startingFen);
        }
    }

    public async loadPgn(pgnStr: string): Promise<void> {
        let fen: string = StartingFen;

        const pgn: Pgn | undefined = await new PgnSplitter(
            new Reader(pgnStr)
        ).nextPgn();
        if (!pgn)
            throw new Error("Could not load PGN");

        // check if we have to load from position
        if (pgn.headers.get("Variant") == "From Position" && pgn.headers.has("FEN")){
            fen = pgn.headers.get("FEN")!;
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
                this.board.makeMove(variation.move);
            this.currentVariation = variation;
            return true;
        }
        return false;
    }

    // goes back a variation
    public previousVariation(): boolean {
        if (this.currentVariation.prev && this.currentVariation.type == "move"){
            if (this.currentVariation.move)
                this.board.unmakeMove(this.currentVariation.move);
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
        
        const move = this.board.getMoveOfSan(san);
        if (move)
            this.board.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    public addMoveToEndLan(lan: Lan): void {
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);

        const move = this.board.getMoveOfLan(lan);
        if (move)
            this.board.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    // assumes move is legal
    public playMove(move: Move, san = this.board.getMoveSan(move)): VariationMove {
        // search for an existing variation with this move
        for (const v of this.currentVariation.next){
            if (v.pgnMove!.san == removeGlyphs(san)){
                this.nextVariation(v.location);
                return v;
            }
        }

        const sanGlyphs: string = san.replace(removeGlyphs(san), "");

        const pgnMove: PgnMove = {
            san: removeGlyphs(san),
            comments: [],
            commentTags: {},
            glyphs: sanGlyphs === "" ? [] : [ sanGlyphs ],
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

        this.board.makeMove(move);

        const res: GameResult | undefined = this.board.isGameOver();
        if (res){
            const resultMarker: string = getResultMarker(res.winner);
            this.currentVariation.result = res;
            this.currentVariation.pgnMove!.result = resultMarker;

            if (this.currentVariation.isMain())
                this.pgn.result = resultMarker;
        }

        return variation;
    }
}

function emptyPgnObject(): Pgn {
    return {
        headers: new Map(),
        moves: [],
        moveList: [],
        result: "*",
        leadingComments: [],
        trailingComments: [],
        tokenErrors: [],
    };
}
