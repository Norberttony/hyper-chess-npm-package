import type { CommentTag } from "../tokenize/types.ts";

export interface PgnHeaders {
    [k: string]: string;
}

export interface PgnComment {
    content: string;
    tags: CommentTag[];
}

export interface PgnMove {
    san: string;
    glyphs: string[];
    nags: number[];
    comments: PgnComment[];
    commentTags: { [k: string]: string[] };
    result?: string | undefined;
    variations: PgnMove[][];
}

export interface Pgn {
    headers: PgnHeaders;
    moves: string[];
    result: string;
    moveList: PgnMove[];
    // comments that occur before the movetext but after tags
    leadingComments: PgnComment[];
    // comments that occur after result markers
    trailingComments: PgnComment[];
}
