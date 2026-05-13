export const LEFT_SQ_BRACKET = '['.charCodeAt(0);
export const RIGHT_SQ_BRACKET = ']'.charCodeAt(0);
export const DOUBLE_QUOTES = '"'.charCodeAt(0);
export const BACK_SLASH = '\\'.charCodeAt(0);

export interface PgnStringToken {
    type: "string",
    content: string
}

export interface PgnTagToken {
    type: "tag",
    header: string,
    value: PgnStringToken
}

export type PgnToken = PgnTagToken;
