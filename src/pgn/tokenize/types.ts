export const LEFT_SQ_BRACKET = '['.charCodeAt(0);
export const RIGHT_SQ_BRACKET = ']'.charCodeAt(0);
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

export interface PgnNumberToken {
    type: "number",
    num: number
}

export interface PgnFractionToken {
    type: "fraction",
    numerator: number,
    denominator: number
}

export interface PgnTagToken {
    type: "tag",
    header: string,
    value: string
}

export interface PgnMoveNumToken {
    type: "move num",
    num: number,
    threeDots: boolean
}

export interface PgnMoveToken {
    type: "move",
    content: string
}

export interface PgnResultToken {
    type: "result",
    value: string
}

export type PgnToken = PgnTagToken | PgnMoveNumToken | PgnMoveToken | PgnResultToken;
