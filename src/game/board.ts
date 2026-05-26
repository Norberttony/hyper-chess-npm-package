import {
    AlgebraicSquare,
    algebraicToSquare, Lan, squareToAlgebraic,
    squareToAlgebraicFile, squareToAlgebraicRank
} from "./coords.js";
import { arePiecesSameType, getPieceSide, getPieceType, getPieceFromFenChar, isPieceOfType, PieceType, Side } from "./piece.js";
import { numSquaresToEdge, dirOffsets } from "./pre-game.js";
import { attachGlyphToSan, removeGlyphs, San, getSanCharFromPieceType } from "./san.js";
import { MoveGenerator } from "./move-gen.js";
import { Move } from "./move.js";

// contains all of the game logic

// this code REPEATEDLY violates the DRY principle. read at your own risk.

export const StartingFen = "unbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNU w 0 1";

export interface GameResult {
    termination: string,
    winner: Side
};

// The Board object contains a game state of the board. Certain moves can be done or undone, but
// they are not stored.
export class Board extends MoveGenerator {
    private result?: GameResult;

    constructor(fen = StartingFen){
        super();
        this._boardLoadFen(fen);
    }

    public override loadFen(fen: string): void {
        this._boardLoadFen(fen);
    }

    public getResult(): GameResult | undefined {
        return this.isGameOver();
    }

    protected setResult(termination: string, winner: Side): GameResult {
        this.result = { termination, winner };
        return this.result;
    }

    private _boardLoadFen(fen: string): void {
        super.loadFen(fen);
        delete this.result;
    }

    private _boardMakeMove(move: Move): void {
        super.makeMove(move);
    
        if (this.getOccurrencesOfCurrentPosition() >= 3)
            this.setResult("threefold", Side.None);
    
        if (this.history[0]!.halfmove >= 100)
            this.setResult("fifty move rule", Side.None);
    }

    public override makeMove(move: Move): void {
        this._boardMakeMove(move);
    }

    private _boardUnmakeMove(move: Move): void {
        super.unmakeMove(move);
        delete this.result;
    }

    public override unmakeMove(move: Move): void {
        this._boardUnmakeMove(move);
    }

    // checks if the current player is checkmated... or stalemated...
    public isGameOver(moves?: Move[]): GameResult | undefined {
        if (this.result)
            return this.result;

        if (!moves)
            moves = this.generateMoves();

        // no legal moves?!
        if (moves.length == 0){
            this.nextTurn();
            if (this.isAttacked(this.getKingSq(true))){
                // CHECKMATE!!!
                this.setResult("checkmate", this.turn);
            }else{
                // stalemate...!
                this.setResult("stalemate", Side.None);
            }
            this.nextTurn();
        }else{
            // determine if it is a draw by insufficient material
            let sufficient = false;
            for (let i = PieceType.King; i <= PieceType.Immobilizer; i++){
                if (i == PieceType.King || i == PieceType.Straddler)
                    continue;
                if (this.getPieceCount(Side.White | i) != 0 || this.getPieceCount(Side.Black | i) != 0){
                    sufficient = true;
                    break;
                }
            }

            if (!sufficient){
                // KvK, KPvK, KPPvK, KPPvKP are all immediate draws.
                const whiteStraddlerCount = this.getPieceCount(Side.White | PieceType.Straddler);
                const blackStraddlerCount = this.getPieceCount(Side.Black | PieceType.Straddler);
                let most = Math.max(whiteStraddlerCount, blackStraddlerCount);
                let least = Math.min(whiteStraddlerCount, blackStraddlerCount);
                if (most <= 1 || most == 2 && least <= 1){
                    // certain draw.
                    this.setResult("insufficient material", Side.None);
                }
            }
        }

        return this.result;
    }

    // gets move given SAN
    public getMoveOfSan(san: San): Move | undefined {
        // take a short cut by considering the destination square of the san and the move piece's type
        san = removeGlyphs(san);
        const toSq = algebraicToSquare(san.substring(san.length - 2) as AlgebraicSquare);
        const fenChar = this.turn == Side.White ? san[0]! : san[0]!.toLowerCase();
        const pieceValue = getPieceFromFenChar(fenChar);

        if (toSq < 0 || toSq >= 64 || isNaN(toSq))
            return;

        const possibleMoves: Move[] = [];
        for (let j = 0; j < dirOffsets.length; j++){
            let blockerCase = isPieceOfType(pieceValue, PieceType.Springer) || isPieceOfType(pieceValue, PieceType.Chameleon) ? 1 : 0;
            const isCham = isPieceOfType(pieceValue, PieceType.Chameleon);
            for (let i = 1; i <= numSquaresToEdge[toSq]![j]!; i++){
                const startSq = toSq + i * dirOffsets[j]!;
                const val = this.getPiece(startSq);
                if (val){
                    if (val == pieceValue){
                        const pieceMoves = this.generatePieceMoves(startSq, val, false);
                        for (const m of pieceMoves){
                            if (m.to == toSq){
                                possibleMoves.push(m);
                            }
                        }
                    }
                    if (getPieceSide(pieceValue) != getPieceSide(val)){
                        if (blockerCase && (!isCham || isPieceOfType(val, PieceType.Springer)))
                            blockerCase--;
                        else
                            break;
                    }else{
                        break;
                    }
                }
            }
        }

        for (const m of possibleMoves){
            // only consider SAN if to squares and piece types match
            if (m.to != toSq || this.getPiece(m.from) != pieceValue)
                continue;

            const San = this.getMoveSan(m, possibleMoves, false);
            if (removeGlyphs(San) == san){
                return m;
            }
        }

        console.error(`Could not find move ${san} at position ${this.getFen()} from the possible candidates`, possibleMoves);
        return undefined;
    }

    public getMoveOfLan(Lan: Lan): Move | undefined {
        const moves = this.generateMoves(true);

        for (const m of moves){
            if (m.lan == Lan){
                return m;
            }
        }
        return undefined;
    }

    // returns the SAN For the given move
    public getMoveSan(move: Move, pseudoMoves = this.generateMoves(false), withGlyphs = true): San {
        let San: San;

        const movingPiece = this.getPiece(move.from);
    
        /* collects information on move collision ambiguity */
        let sameMove = false;
        let sameFile = false;
        let sameRank = false;
        for (const other of pseudoMoves){
            if (!(move.from == other.from) && move.to == other.to && arePiecesSameType(movingPiece, this.getPiece(other.from))){
    
                // of course, ambiguity is only caused if the move is legal.
                if (!this.isMoveLegal(other))
                    continue;
    
                // oh no, the move is ambiguous!
                sameMove = true;
    
                // do we need to specify the rank (first & foremost?)
                if (squareToAlgebraicRank(move.from) == squareToAlgebraicRank(other.from))
                    sameRank = true;
                
                // what about the file
                if (squareToAlgebraicFile(move.from) == squareToAlgebraicFile(other.from))
                    sameFile = true;
            }
        }
    
        let movingPieceType = getPieceType(movingPiece);
    
        // using information from move collision ambiguity, determine the resolving square
        let resolvedSquare = "";
        if (sameMove){
            if (sameRank || (!sameRank && !sameFile))
                resolvedSquare += squareToAlgebraicFile(move.from);
            if (sameFile)
                resolvedSquare += squareToAlgebraicRank(move.from);
        }

        const SanChar = getSanCharFromPieceType(movingPieceType);
        San = `${SanChar}${resolvedSquare}${move.captures.length > 0 ? "x": ""}${squareToAlgebraic(move.to)}` as San;

        if (withGlyphs){
            this._boardMakeMove(move);
    
            // is game over?
            let result = this.isGameOver();
            if (result && result.termination == "checkmate"){
                San = attachGlyphToSan(San, "#");
            }else{
                // does this move threaten to take the king on the next turn?
                this.nextTurn();
                const moves = this.generateMoves(false);
                this.nextTurn();
    
                let isCheck = false;
                for (const m of moves){
                    for (const c of m.captures){
                        if (isPieceOfType(c.captured, PieceType.King)){
                            isCheck = true;
                            break;
                        }
                    }
                    if (isCheck)
                        break;
                }
                if (isCheck)
                    attachGlyphToSan(San, "+");
            }
            this._boardUnmakeMove(move);
        }
    
        return San;
    }
}
