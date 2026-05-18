export const LEFT_BRACE = '{'.charCodeAt(0);
export const RIGHT_BRACE = '}'.charCodeAt(0);
export const LEFT_SQ_BRACKET = '['.charCodeAt(0);
export const RIGHT_SQ_BRACKET = ']'.charCodeAt(0);
export const LEFT_PARENTHESIS = '('.charCodeAt(0);
export const RIGHT_PARENTHESIS = ')'.charCodeAt(0);
export const DOUBLE_QUOTES = '"'.charCodeAt(0);
export const BACK_SLASH = '\\'.charCodeAt(0);
export const DOT = '.'.charCodeAt(0);
export const DASH = '-'.charCodeAt(0);
export const FORWARD_SLASH = '/'.charCodeAt(0);
export const ZERO = '0'.charCodeAt(0);
export const ONE = '1'.charCodeAt(0);
export const TWO = '2'.charCodeAt(0);
export const ASTERISK = '*'.charCodeAt(0);
export const NEWLINE = '\n'.charCodeAt(0);

// any characters that cannot be part of a move.
export const NON_MOVE_CHARACTERS = new Set<number>([
    // tags, comments, variations, move numbers, results
    LEFT_BRACE, RIGHT_BRACE, LEFT_SQ_BRACKET, RIGHT_SQ_BRACKET,
    LEFT_PARENTHESIS, RIGHT_PARENTHESIS, DOT, DASH, ASTERISK,

    // whitespace characters
    32, 9, 10, 13, 12, 11,
]);

export interface PgnTagToken {
    type: "tag";
    header: string;
    value: string;
}

export interface PgnMoveNumToken {
    type: "move num";
    num: number;
    threeDots: boolean;
}

export interface PgnMoveToken {
    type: "move";
    content: string;
}

export interface PgnResultToken {
    type: "result";
    value: string;
}

export interface PgnCommentToken {
    type: "comment";
    content: string;
}

export interface PgnVariationToken {
    type: "variation";
    movetext: PgnMovetextToken[];
}

export type PgnMovetextToken =
    | PgnMoveNumToken
    | PgnMoveToken
    | PgnResultToken
    | PgnCommentToken
    | PgnVariationToken;

export type PgnToken =
    | PgnTagToken
    | PgnMovetextToken;
