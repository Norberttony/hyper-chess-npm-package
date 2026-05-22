import { PgnSplitter } from "./pgn-splitter.js";
import { Reader } from "../read/reader.js";
import { Pgn, PgnHeaders } from "./types.js";
import { Board, StartingFen } from "../../game/board.js";
import { Side } from "../../game/piece.js";
import { SAN } from "../../game/san.js";
import { PgnTokenizer } from "../tokenize/pgn-tokenizer.js";
import { PgnToken } from "../tokenize/types.js";

export function parsePgn(pgn: string): Pgn | undefined {
    return new PgnSplitter(new Reader(pgn)).nextPgn();
}

// splits the given string into each individual game.
// returns an array of the individual games.
export function splitPgns(pgns: string): Pgn[] {
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

export function getWinner(resultTag: string): Side {
    if (resultTag == "1-0")
        return Side.White;
    else if (resultTag == "0-1")
        return Side.Black;
    else
        return Side.None;
}

export function PgnHeadersToString(headers: PgnHeaders): string {
    let pgn = "";
    for (const [ name, value ] of Object.entries(headers))
        pgn += `[${name} "${value}"]\n`;
    return pgn;
}

export function pgnToString(pgnObj: Pgn, board: Board = new Board()): string {
    let pgn = `${PgnHeadersToString(pgnObj.headers)}\n`;

    const fen: string = pgnObj.headers["From Position"] || StartingFen;
    board.loadFen(fen);

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
export function extractHeaders(pgn: string): PgnHeaders {
    const headers: PgnHeaders = {};

    const tokenizer = new PgnTokenizer(new Reader(pgn));
    let t: PgnToken | undefined;
    while ((t = tokenizer.nextToken()) && t.type == "tag")
        headers[t.header] = t.value;

    return headers;
}

// returns the current date in the form YYYY.MM.DD
export function getPgnDateNow(): string {
    const date = new Date();
    const y = date.getFullYear().toString().padStart(4, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = (date.getDay() + 1).toString().padStart(2, "0");

    return `${y}.${m}.${d}`;
}
