import { PgnSplitter } from "./pgn-splitter.js";
import { Reader } from "../read/reader.js";
import { Pgn, PgnComment, PgnHeaders, PgnMove } from "./types.js";
import { Board, StartingFen } from "../../game/board.js";
import { Side } from "../../game/piece.js";
import { San } from "../../game/san.js";
import { PgnTokenizer } from "../tokenize/pgn-tokenizer.js";
import { CommentTag, PgnToken } from "../tokenize/types.js";
import { Move } from "../../game/move.js";

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

export function getResultMarker(winner: Side): string {
    if (winner == Side.None)
        return "1/2-1/2";
    else if (winner == Side.White)
        return "1-0";
    else if (winner == Side.Black)
        return "0-1";
    return "*";
}

export function getWinner(resultMarker: string): Side {
    if (resultMarker == "1-0")
        return Side.White;
    else if (resultMarker == "0-1")
        return Side.Black;
    else
        return Side.None;
}

export function pgnHeadersToString(headers: PgnHeaders): string {
    let pgn = "";
    for (const [ name, value ] of Object.entries(headers)){
        const s = value
            .replaceAll("\\", "\\\\")
            .replaceAll('"', '\\"');
        pgn += `[${name} "${s}"]\n`;
    }
    return pgn;
}

export function pgnToString(pgnObj: Pgn): string {
    let pgn = `${pgnHeadersToString(pgnObj.headers)}\n`;

    for (const comment of pgnObj.leadingComments)
        pgn += `${pgnCommentToString(comment)}\n`;

    if (pgnObj.leadingComments.length > 0)
        pgn += "\n";

    const fen: string = pgnObj.headers["FEN"] || StartingFen;

    const board = new Board(fen);

    pgn += variationToString(pgnObj.moveList, board);

    // add back in the result if there's no ending result tag
    const lastMove = pgnObj.moveList[pgnObj.moveList.length - 1];
    if (lastMove && lastMove.result == undefined)
        pgn += pgnObj.result;

    if (pgnObj.trailingComments.length > 0)
        pgn += ` ${pgnObj.trailingComments.map(pgnCommentToString).join(" ")}`;

    return pgn.trim();
}

function variationToString(moveList: PgnMove[], board: Board): string {
    let pgn: string = "";

    // play out each move
    let counter = board.getFullMove();
    if (board.getTurn() == Side.Black)
        pgn += `${counter++}... `;
    for (const pgnMove of moveList){
        const prevFen: string = board.getFen();
        const san: string = `${pgnMove.san}${pgnMove.glyphs.join("")}`;
        const move: Move = board.getMoveOfSan(san as San)!;
        board.makeMove(move);

        if (board.getTurn() == Side.Black){
            pgn += `${counter++}. ${san} `;
        }else{
            pgn += `${san} `;
        }

        if (pgnMove.nags.length > 0)
            pgn += `${pgnMove.nags.map(v => `$${v}`).join(" ")} `;

        // add back comments and comment tags
        for (const comment of pgnMove.comments)
            pgn += pgnCommentToString(comment);

        for (const v of pgnMove.variations)
            pgn += `(${variationToString(v, new Board(prevFen)).trim()}) `;

        if (pgnMove.result)
            pgn += `${pgnMove.result} `;
    }

    return pgn;
}

export function pgnCommentToString(comment: PgnComment): string {
    if (comment.tags.length == 0)
        return `{ ${comment.content.trim()} }`;
    const tagsStr = comment.tags.map(commentTagToString).join(" ");
    return `{ ${comment.content.trim()} ${tagsStr} } `;
}

export function commentTagToString(tag: CommentTag): string {
    return `[%${tag.name} ${tag.value}]`;
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
