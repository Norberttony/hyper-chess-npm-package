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
export const HASHTAG = '#'.charCodeAt(0);
export const PLUS = '+'.charCodeAt(0);
export const QUESTION_MARK = '?'.charCodeAt(0);
export const EXCLAMATION_MARK = '!'.charCodeAt(0);
export const DOLLAR_SIGN = '$'.charCodeAt(0);
export const PERCENT = '%'.charCodeAt(0);

export const SAN_GLYPHS = new Set<number>([
    HASHTAG, PLUS, QUESTION_MARK, EXCLAMATION_MARK,
]);

// any characters that cannot be part of a move.
export const NON_MOVE_CHARACTERS = new Set<number>([
    // tags, comments, variations, move numbers, results
    LEFT_BRACE, RIGHT_BRACE, LEFT_SQ_BRACKET, RIGHT_SQ_BRACKET,
    LEFT_PARENTHESIS, RIGHT_PARENTHESIS, DOT, DASH, ASTERISK,

    // whitespace characters
    32, 9, 10, 13, 12, 11,

    // glyphs
    ...[ ...SAN_GLYPHS ],
    DOLLAR_SIGN,
]);
