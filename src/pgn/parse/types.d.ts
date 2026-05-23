import type { CommentTag } from "../tokenize/types.ts";

export interface PgnHeaders {
    [k: string]: string;
}

export interface PgnMove {
    san: string;
    glyphs: string[];
    nags: number[];
    comments: string[];
    commentTags: CommentTag[];
    result?: string | undefined;
    variations: PgnMove[][];
}

export interface Pgn {
    headers: PgnHeaders;
    moves: string[];
    result: string;
    moveList: PgnMove[];
}
