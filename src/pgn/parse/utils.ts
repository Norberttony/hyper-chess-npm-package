import { PgnSplitter } from "./pgn-splitter.js";
import { Reader } from "../read/reader.js";
import { Pgn, PgnHeaders } from "./types.js";
import { Board, StartingFEN } from "../../game/board.js";
import { Side } from "../../game/piece.js";
import type { PGNHeader, PGNHeaders } from "../../graphics/pgn/pgn-data.js";
import { SAN } from "../../game/san.js";

// splits the given string into each individual game.
// returns an array of the individual games.
export function splitPGNs(pgns: string): Pgn[] {
    const pgnObjs: Pgn[] = [];
    const splitter = new PgnSplitter(new Reader(pgns));

    let pgn: Pgn | undefined;
    while (pgn = splitter.nextPgn())
        pgnObjs.push(pgn);

    return pgnObjs;
}

export function getResultTag(winner: Side): string {
    if (winner == Side.None)
        return "1/2-1/2";
    else if (winner == Side.White)
        return "1-0";
    else if (winner == Side.Black)
        return "0-1";
    return "*";
}

export function PGNHeadersToString(headers: PgnHeaders): string {
    let pgn = "";
    for (const [ name, value ] of Object.entries(headers))
        pgn += `[${name} "${value}"]\n`;
    return pgn;
}

// takes in a list of moves
export function convertToPGN(pgnObj: Pgn, board: Board): string {
    let pgn = `${PGNHeadersToString(pgnObj.headers)}\n`;

    const fen: string = pgnObj.headers["From Position"] || StartingFEN;
    board.loadFEN(fen);

    // play out each move
    let counter = board.getFullMove();
    if (board.getTurn() == Side.Black)
        pgn += `${counter++}... `;
    for (const san of pgnObj.moves){
        const move = board.getMoveOfSAN(san as SAN)!;
        board.makeMove(move);

        if (board.getTurn() == Side.Black){
            pgn += `${counter++}. ${san} `;
        }else{
            pgn += `${san} `;
        }
    }

    pgn += pgnObj.result;
    return pgn.trim();
}

// returns a dictionary where keys are header names and values are header values.
export function extractHeaders(pgn: string): PGNHeaders {
    const headers: PGNHeaders = {};

    let leftBracket = pgn.indexOf("[");
    while (leftBracket > -1){
        let rightBracket = pgn.indexOf("]");
        const field = pgn.substring(leftBracket, rightBracket + 1);

        let leftQuote = field.indexOf("\"") + leftBracket;
        let rightQuote = field.indexOf("\"", leftQuote + 1) + leftBracket;

        if (leftQuote > -1 && rightQuote > -1){
            let value = pgn.substring(leftQuote + 1, rightQuote).trim();
            let name = pgn.substring(leftBracket + 1, leftQuote).trim() as PGNHeader;
            headers[name] = value;
        }

        // remove header now that we've extracted it
        pgn = pgn.substring(rightBracket + 1);

        leftBracket = pgn.indexOf("[");
    }

    return headers;
}

// returns the current date in the form YYYY.MM.DD
export function getPGNDateNow(): string {
    const date = new Date();
    const y = date.getFullYear().toString().padStart(4, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = (date.getDay() + 1).toString().padStart(2, "0");

    return `${y}.${m}.${d}`;
}
