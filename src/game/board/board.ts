import { AlgebraicSquare, algebraicToSquare, Lan, squareToAlgebraic, squareToAlgebraicFile, squareToAlgebraicRank } from "../notation/coords.js";
import { Move } from "./move.js";
import { arePiecesSameType, getPieceFromFenChar, getPieceSide, getPieceType, isPieceOfType, Piece, PieceType, Side } from "../notation/piece.js";
import { dirOffsets, numSquaresToEdge } from "./pre-game.js";
import { attachGlyphToSan, getSanCharFromPieceType, removeGlyphs, San } from "../notation/san.js";
import { BoardState } from "./board-state.js";
import { GameResult, MoveGenerator } from "./move-generator.js";

export const StartingFen = "unbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNU w 0 1";

export class Board {
    private state: BoardState;
    private moveGen: MoveGenerator;
    private result: GameResult | undefined = undefined;

    constructor(fen: string = StartingFen){
        this.state = new BoardState(fen);
        this.moveGen = new MoveGenerator(this.state);
    }

    public getState(): BoardState {
        return this.state;
    }

    public getFullMove(): number {
        return this.state.getFullMove();
    }

    public loadFen(fen: string): void {
        this.state.loadFen(fen);
    }

    public getFen(): string {
        return this.state.getFen();
    }

    public getTurn(): Side {
        return this.state.getTurn();
    }

    public getResult(): GameResult | undefined {
        return this.result || this.isGameOver();
    }

    private setResult(termination: string, winner: Side): GameResult {
        this.result = { termination, winner };
        return this.result;
    }

    public makeMove(move: Move): void {
        this.state.makeMove(move);

        if (this.state.getOccurrencesOfCurrentPosition() >= 3)
            this.setResult("threefold", Side.None);

        if (this.state.getHistory()[0]!.halfmove >= 100)
            this.setResult("fifty move rule", Side.None);
    }

    public unmakeMove(move: Move): void {
        this.state.unmakeMove(move);
    }

    public generatePieceMoves(start: number, piece: Piece, filter = true, moves: Move[] = []): Move[] {
        return this.moveGen.generatePieceMoves(start, piece, filter, moves);
    }

    public generateMoves(filter = true): Move[] {
        return this.moveGen.generateMoves(filter);
    }

    public isGameOver(): GameResult | undefined {
        if (this.result)
            return this.result;
        const res = this.moveGen.isGameOver();
        if (res)
            this.setResult(res.termination, res.winner);
        return res;
    }

    // gets move given SAN
    public getMoveOfSan(san: San): Move | undefined {
        // take a short cut by considering the destination square of the san and the move piece's type
        san = removeGlyphs(san);
        const toSq = algebraicToSquare(san.substring(san.length - 2) as AlgebraicSquare);
        const fenChar = this.state.getTurn() == Side.White ? san[0]! : san[0]!.toLowerCase();
        const pieceValue = getPieceFromFenChar(fenChar);

        if (toSq < 0 || toSq >= 64 || isNaN(toSq))
            return;

        const possibleMoves: Move[] = [];
        for (let j = 0; j < dirOffsets.length; j++){
            let blockerCase = isPieceOfType(pieceValue, PieceType.Springer) || isPieceOfType(pieceValue, PieceType.Chameleon) ? 1 : 0;
            const isCham = isPieceOfType(pieceValue, PieceType.Chameleon);
            for (let i = 1; i <= numSquaresToEdge[toSq]![j]!; i++){
                const startSq = toSq + i * dirOffsets[j]!;
                const val = this.state.getPiece(startSq);
                if (val){
                    if (val == pieceValue){
                        const pieceMoves = this.moveGen.generatePieceMoves(startSq, val, false);
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
            if (m.to != toSq || this.state.getPiece(m.from) != pieceValue)
                continue;

            const San = this.getMoveSan(m, possibleMoves, false);
            if (removeGlyphs(San) == san){
                return m;
            }
        }

        console.error(`Could not find move ${san} at position ${this.state.getFen()} from the possible candidates`, possibleMoves);
        return undefined;
    }

    public getMoveOfLan(lan: Lan): Move | undefined {
        const moves = this.generateMoves(true);

        for (const m of moves){
            if (m.lan == lan){
                return m;
            }
        }
        return undefined;
    }

    // returns the SAN For the given move
    public getMoveSan(move: Move, pseudoMoves = this.generateMoves(false), withGlyphs = true): San {
        let san: San;

        const movingPiece = this.state.getPiece(move.from);
    
        /* collects information on move collision ambiguity */
        let sameMove = false;
        let sameFile = false;
        let sameRank = false;
        for (const other of pseudoMoves){
            if (!(move.from == other.from) && move.to == other.to && arePiecesSameType(movingPiece, this.state.getPiece(other.from))){
    
                // of course, ambiguity is only caused if the move is legal.
                if (!this.moveGen.isMoveLegal(other))
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
        san = `${SanChar}${resolvedSquare}${move.captures.length > 0 ? "x": ""}${squareToAlgebraic(move.to)}` as San;

        if (withGlyphs){
            this.state.makeMove(move);
    
            // is game over?
            let result = this.isGameOver();
            if (result && result.termination == "checkmate"){
                san = attachGlyphToSan(san, "#");
            }else{
                // does this move threaten to take the king on the next turn?
                this.state.nextTurn();
                const moves = this.generateMoves(false);
                this.state.nextTurn();
    
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
                    attachGlyphToSan(san, "+");
            }
            this.state.unmakeMove(move);
        }
    
        return san;
    }
}
