import { AlgebraicSquare, algebraicToSquare, getFileFromSq, getRankFromSq, Lan, squareToAlgebraic, squareToAlgebraicFile, squareToAlgebraicRank } from "../coords.js";
import { Move } from "../move.js";
import { arePiecesSameSide, arePiecesSameType, getPieceFromFenChar, getPieceSide, getPieceType, isPieceOfSide, isPieceOfType, Piece, PieceType, Side } from "../piece.js";
import { dirOffsets, numSquaresToEdge } from "../pre-game.js";
import { attachGlyphToSan, getSanCharFromPieceType, removeGlyphs, San } from "../san.js";
import { BoardState } from "./board-state.js";

export interface GameResult {
    termination: string,
    winner: Side
};

export class MoveGenerator {
    constructor(private state: BoardState){}

    // checks if the current player is checkmated... or stalemated...
    public isGameOver(moves?: Move[]): GameResult | undefined {
        if (!moves)
            moves = this.generateMoves();

        let res: GameResult | undefined = undefined;

        // no legal moves?!
        if (moves.length == 0){
            this.state.nextTurn();
            if (this.isAttacked(this.state.getKingSq(true))){
                // CHECKMATE!!!
                res = { termination: "checkmate", winner: this.state.getTurn() };
            }else{
                // stalemate...!
                res = { termination: "stalemate", winner: Side.None };
            }
            this.state.nextTurn();
        }else{
            // determine if it is a draw by insufficient material
            let sufficient = false;
            for (let i = PieceType.King; i <= PieceType.Immobilizer; i++){
                if (i == PieceType.King || i == PieceType.Straddler)
                    continue;
                if (this.state.getPieceCount(Side.White | i) != 0 || this.state.getPieceCount(Side.Black | i) != 0){
                    sufficient = true;
                    break;
                }
            }

            if (!sufficient){
                // KvK, KPvK, KPPvK, KPPvKP are all immediate draws.
                const whiteStraddlerCount = this.state.getPieceCount(Side.White | PieceType.Straddler);
                const blackStraddlerCount = this.state.getPieceCount(Side.Black | PieceType.Straddler);
                let most = Math.max(whiteStraddlerCount, blackStraddlerCount);
                let least = Math.min(whiteStraddlerCount, blackStraddlerCount);
                if (most <= 1 || most == 2 && least <= 1){
                    // certain draw.
                    res = { termination: "insufficient material", winner: Side.None };
                }
            }
        }

        return res;
    }

    // returns true if a certain square is attacked
    public isAttacked(sq: number){
        // go through every move
        const test = this.generateMoves(false);
        for (const m of test){
            for (const c of m.captures){
                if (c.sq == sq)
                    return true;
            }
        }

        return false;
    }

    // detects which piece this is, and generates moves for it. Generally used for graphical side of app.
    public generatePieceMoves(start: number, piece: Piece, filter = true, moves: Move[] = []): Move[] {
        if (isPieceOfSide(piece, this.state.getTurn())){
            switch(getPieceType(piece)){
                case PieceType.Straddler:
                    this.generateStraddlerMoves(start, piece, moves);
                    break;
                case PieceType.Coordinator:
                    this.generateCoordinatorMoves(start, piece, moves);
                    break;
                case PieceType.Springer:
                    this.generateSpringerMoves(start, piece, moves);
                    break;
                case PieceType.Retractor:
                    this.generateRetractorMoves(start, piece, moves);
                    break;
                case PieceType.Immobilizer:
                    this.generateImmobilizerMoves(start, piece, moves);
                    break;
                case PieceType.Chameleon:
                    this.generateChameleonMoves(start, piece, moves);
                    break;
                case PieceType.King:
                    this.generateKingMoves(start, piece, moves);
                    break;
            }
        }

        if (filter)
            return this.filterLegalMoves(moves);
        else
            return moves;
    }

    // generates all possible moves for the given turn
    public generateMoves(filter = true): Move[] {
        const moves: Move[] = [];

        for (let s = 0; s < 64; s++){
            const piece = this.state.getPiece(s);
            this.generatePieceMoves(s, piece, false, moves);
        }

        if (filter)
            return this.filterLegalMoves(moves);

        return moves;
    }

    // takes in a list of moves, and gives a list of all legal moves
    public filterLegalMoves(moves: Move[]): Move[] {
        return moves.filter((move) => this.isMoveLegal(move));
    }

    // checks if a move is legal
    public isMoveLegal(move: Move): boolean {
        this.state.makeMove(move);

        // if the move causes the current king to stay in check, then it can't be legal
        const attacksKing = this.isAttacked(this.state.getKingSq(true));

        this.state.unmakeMove(move);

        return !attacksKing;
    }

    public generateChameleonMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        // for copying coordinator moves
        const enemyCoordSq = this.state.getCoordSq(true);
        const enemyCoordRank = getRankFromSq(enemyCoordSq);
        const enemyCoordFile = getFileFromSq(enemyCoordSq);

        const kingSq = this.state.getKingSq(false);
        const kingRank = getRankFromSq(kingSq);
        const kingFile = getFileFromSq(kingSq);

        // for copying king moves
        const coordSq = this.state.getCoordSq(false);
        const coordRank = getRankFromSq(coordSq);
        const coordFile = getFileFromSq(coordSq);

        const enemyKingSq = this.state.getKingSq(true);
        const enemyKingRank = getRankFromSq(enemyKingSq);
        const enemyKingFile = getFileFromSq(enemyKingSq);

        // determines number of valid directions the piece can go through
        for (let i = 0; i < 8; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){

                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                const captures = [];

                // check coordinator type moves
                // checking for targetValue == 0 is fine because a coordinator cannot make a
                // capturing move that occupies the enemy's square.
                if (targetValue == 0 && kingSq != 255 && enemyCoordSq != 255){
                    const targetRank = getRankFromSq(target);
                    const targetFile = getFileFromSq(target);
                    if (kingRank == enemyCoordRank && targetFile == enemyCoordFile || kingFile == enemyCoordFile && targetRank == enemyCoordRank){
                        captures.push({ sq: enemyCoordSq, captured: this.state.getPiece(enemyCoordSq) });
                    }
                }

                // check retractor type moves
                if (targetValue == 0 && j == 0){
                    // check backwards
                    let d = (i + 2) % 4;
                    if (i >= 4)
                        d += 4;

                    if (numSquaresToEdge[start]![d]! > 0){
                        const deathSq = start + dirOffsets[d]!;
                        const deathVal = this.state.getPiece(deathSq);
                        if (deathVal != 0 && !arePiecesSameSide(piece, deathVal) && isPieceOfType(deathVal, PieceType.Retractor)){
                            captures.push({sq: deathSq, captured: deathVal});
                        }
                    }
                }

                // check king type moves
                if (targetValue != 0 && j == 0 && !arePiecesSameSide(piece, targetValue) && isPieceOfType(targetValue, PieceType.King)){
                    // this would cause problems if the king was not a royal piece. but it is :)
                    moves.push(new Move(target, start, [{ sq: target, captured: targetValue }]));
                    break;
                }

                // check springer type moves
                if (targetValue != 0 && !arePiecesSameSide(piece, targetValue) && isPieceOfType(targetValue, PieceType.Springer) && numSquaresToEdge[target]![i]! > 0 && this.state.getPiece(target + dirOffsets[i]!) == 0){
                    // there is actually no way for this move to be covered because of the rules :)
                    moves.push(new Move(target + dirOffsets[i]!, start, [{ sq: target, captured: targetValue }]));
                    break;
                }

                // king type moves, where chameleon acts like king and teams up with own coordinator
                if (targetValue == 0 && j == 0 && coordSq != 255){
                    const targetRank = getRankFromSq(target);
                    const targetFile = getFileFromSq(target);

                    if (targetRank == enemyKingRank && coordFile == enemyKingFile || targetFile == enemyKingFile && coordRank == enemyKingRank){
                        captures.push({ sq: enemyKingSq, captured: this.state.getPiece(enemyKingSq) });
                    }
                }

                // straddler type moves
                if (targetValue == 0 && i < 4){
                    for (let k = -1; k <= 1; k++){
                        const d = (i + 4 + k) % 4;

                        if (numSquaresToEdge[target]![d]! <= 1)
                            continue;

                        const nextTarget = target + dirOffsets[d]!;
                        const nextTargetValue = this.state.getPiece(nextTarget);

                        if (!arePiecesSameSide(piece, nextTargetValue) && isPieceOfType(nextTargetValue, PieceType.Straddler)){
                            const nextNextTarget = target + 2 * dirOffsets[d]!;
                            const nextNextTargetValue = this.state.getPiece(nextNextTarget);

                            if (arePiecesSameSide(piece, nextNextTargetValue) && (isPieceOfType(nextNextTargetValue, PieceType.Chameleon) || isPieceOfType(nextNextTargetValue, PieceType.Straddler))){
                                captures.push({ sq: nextTarget, captured: nextTargetValue });
                            }
                        }
                    }
                }

                if (targetValue == 0)
                    moves.push(new Move(target, start, captures));
                else
                    break;

            }
        }
    }

    public generateImmobilizerMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;
    
        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){
                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                if (targetValue == 0){
                    moves.push(new Move(target, start));
                }else{
                    break;
                }
            }
        }
    }

    public generateRetractorMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;
    
        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){

                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                const captures = [];
                if (targetValue == 0 && j == 0){
                    // check backwards
                    let d = (i + 2) % 4;
                    if (i >= 4)
                        d += 4;

                    if (numSquaresToEdge[start]![d]! > 0){
                        const deathSq = start + dirOffsets[d]!;
                        const deathVal = this.state.getPiece(deathSq);
                        if (deathVal != 0 && !arePiecesSameSide(piece, deathVal))
                            captures.push({ sq: deathSq, captured: deathVal });
                    }
                }
                
                if (targetValue != 0)
                    break;

                moves.push(new Move(target, start, captures));
            }
        }
    }

    public generateSpringerMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        // moves like a chess queen
        for (let i = 0; i < 8; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){

                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                if (targetValue != 0){

                    if (arePiecesSameSide(piece, targetValue))
                        break;

                    if (numSquaresToEdge[target]![i] == 0)
                        continue;

                    const nextTarget = target + dirOffsets[i]!;
                    const nextTargetValue = this.state.getPiece(nextTarget);

                    if (nextTargetValue == 0){
                        // jump over piece
                        moves.push(new Move(nextTarget, start, [ { sq: target, captured: targetValue } ]));
                    }
                    break;

                }else{
                    moves.push(new Move(target, start));
                }
            }
        }
    }

    public generateCoordinatorMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;

        // a chameleon cannot team up with another chameleon to capture the king.
        // that would make two chameleons much too powerful :)
        const considerSquares: number[] = [
            this.state.getKingSq(false),
            this.state.chameleons[this.state.getTurn() == Side.White ? 0 : 2]!,
            this.state.chameleons[this.state.getTurn() == Side.White ? 1 : 3]!
        ].filter(val => val != 255);

        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){

                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                if (targetValue != 0)
                    break;

                const rank = getRankFromSq(target);
                const file = getFileFromSq(target);

                let captures = [];
                for (let s = 0; s < considerSquares.length; s++){
                    const sq = considerSquares[s]!;
                    const sqRank = getRankFromSq(sq)!;
                    const sqFile = getFileFromSq(sq)!;
                    if (sqRank != rank && sqFile != file){
                        // death squares are formed
                        const death1 = rank * 8 + sqFile;
                        const death1Value = this.state.getPiece(death1);
                        const death2 = sqRank * 8 + file;
                        const death2Value = this.state.getPiece(death2);

                        if (death1Value && !arePiecesSameSide(piece, death1Value)){
                            // if chameleon, must be capturing a king
                            if (s == 0 || s > 0 && isPieceOfType(death1Value, PieceType.King))
                                captures.push({ sq: death1, captured: death1Value });
                        }
                        if (death2Value && !arePiecesSameSide(piece, death2Value)){
                            // if chameleon, must be capturing a king
                            if (s == 0 || s > 0 && isPieceOfType(death2Value, PieceType.King))
                                captures.push({ sq: death2, captured: death2Value });
                        }
                    }
                }

                moves.push(new Move(target, start, captures));
            }
        }
    }

    public generateStraddlerMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        // determines number of valid directions the piece can go through
        let canMoveForward = false;
        for (let i = 0; i < 4; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start]![i]!; j++){

                const target = start + dirOffsets[i]! * (j + 1);
                const targetValue = this.state.getPiece(target);

                if (targetValue != 0)
                    break;

                // straddler can now capture a piece ahead of it, to its left, or to its right (relative to movement)
                const captures = [];
                for (let k = -1; k <= 1; k++){
                    const d = (i + 4 + k) % 4;

                    const nextTarget = target + dirOffsets[d]!;
                    const nextTargetValue = this.state.getPiece(nextTarget);

                    if (numSquaresToEdge[target]![d]! <= 1){
                        if (nextTargetValue == 0)
                            canMoveForward = true;
                        continue;
                    }

                    const nextNextTarget = target + dirOffsets[d]! * 2;
                    const nextNextTargetValue = this.state.getPiece(nextNextTarget);

                    // must have a center target and a straddler on the other side for the...
                    // CUSTODIAN CAPTURE.
                    // If any of the encompassing pieces are chameleons, the captured piece must also be a straddler.
                    // must be some of the ugliest code in the whole while world :)
                    const chameleonCapt = isPieceOfType(nextNextTargetValue, PieceType.Chameleon);
                    const canCapture = chameleonCapt && isPieceOfType(nextTargetValue, PieceType.Straddler) || !chameleonCapt && isPieceOfType(nextNextTargetValue, PieceType.Straddler);
                    if (nextTargetValue != 0 && !arePiecesSameSide(piece, nextTargetValue) && arePiecesSameSide(nextNextTargetValue, piece) && canCapture){
                        captures.push({sq: nextTarget, captured: nextTargetValue});
                    }else if (nextTargetValue == 0 && k == 0){
                        canMoveForward = true;
                    }
                }

                moves.push(new Move(target, start, captures));

                if (!canMoveForward){
                    break;
                }
            }
        }
    }

    // generates moves for a king
    public generateKingMoves(start: number, piece: Piece, moves: Move[]): void {
        if (this.state.isImmobilized(start, piece))
            return;

        // king can team up with its own coordinator to create death squares
        const coordSq = this.state.getCoordSq(false);
        const coordRank = getRankFromSq(coordSq);
        const coordFile = getFileFromSq(coordSq);

        // see if king can team up with chameleon and capture an enemy coordinator!
        const enemyCoordSq = this.state.getCoordSq(true);
        const enemyCoordRank = getRankFromSq(enemyCoordSq);
        const enemyCoordFile = getFileFromSq(enemyCoordSq);

        // check all directions
        for (let i = 0; i < dirOffsets.length; i++){
            if (numSquaresToEdge[start]![i]! > 0){

                const target = start + dirOffsets[i]!;
                const targetValue = this.state.getPiece(target);

                if (targetValue != 0 && arePiecesSameSide(piece, targetValue)){
                    continue;
                }

                const rank = getRankFromSq(target);
                const file = getFileFromSq(target);

                const captures = [];
                if (coordSq != 255 && coordRank != rank && coordFile != file){
                    // death squares are formed
                    const death1 = rank * 8 + coordFile;
                    const death1Value = this.state.getPiece(death1);
                    const death2 = coordRank * 8 + file;
                    const death2Value = this.state.getPiece(death2);

                    if (death1Value && !arePiecesSameSide(piece, death1Value)){
                        captures.push({ sq: death1, captured: death1Value });
                    }
                    if (death2Value && !arePiecesSameSide(piece, death2Value)){
                        captures.push({ sq: death2, captured: death2Value });
                    }
                }

                // test for king-chameleon death squares
                if (enemyCoordSq != 255){
                    const thisRank = getRankFromSq(target);
                    const thisFile = getFileFromSq(target);

                    const chamStart = this.state.getTurn() == Side.White ? 0 : 2;
                    const chamEnd = this.state.getTurn() == Side.White ? 2 : 4;
                    for (let i = chamStart; i < chamEnd; i++){
                        if (this.state.chameleons[i] == 255)
                            break;

                        const rank = getRankFromSq(this.state.chameleons[i]!);
                        const file = getFileFromSq(this.state.chameleons[i]!);

                        // forms death squares, but only against the enemy coordinator.
                        // and there's always only one enemy coordinator.
                        // of course, the king isn't actually forming chameleon death squares if the two are aligned (rank/file)
                        if (rank == enemyCoordRank && thisFile == enemyCoordFile && thisFile != file && thisRank != rank){
                            captures.push({ sq: enemyCoordSq, captured: this.state.getPiece(enemyCoordSq) });
                            break;
                        }
                        if (file == enemyCoordFile && thisRank == enemyCoordRank && thisFile != file && thisRank != rank){
                            captures.push({ sq: enemyCoordSq, captured: this.state.getPiece(enemyCoordSq) });
                            break;
                        }
                    }
                }

                if (targetValue != 0 && !arePiecesSameSide(piece, targetValue)){
                    captures.push({ sq: target, captured: targetValue });
                }

                moves.push(new Move(target, start, captures));
            }
        }
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
