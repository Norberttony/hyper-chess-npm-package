import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import type { PgnTagToken } from "./types.js";
import * as T from "./tokens.js";

// assumes that the first character is left square bracket '['
export function handleTag(reader: AbstractReader): PgnTagToken {
    if (!reader.match(T.LEFT_SQ_BRACKET))
        throw new Error(
            `handleTag: expected first character to be ${T.LEFT_SQ_BRACKET} but got ${reader.get()} instead`
        );

    // extract header
    reader.copyStart();
    while (
        !reader.isAtEnd() &&
        reader.get() != T.DOUBLE_QUOTES &&
        reader.get() != T.RIGHT_SQ_BRACKET &&
        !isWhitespace(reader.get())
    )
        reader.advance();

    const header: string = reader.copyEnd();

    // incomplete tag! missing value!
    if (reader.get() == T.RIGHT_SQ_BRACKET || reader.isAtEnd())
        throw new Error(`PgnTagToken is missing value but has header ${header}`);

    // extract value
    reader.skipWhitespace();
    reader.match(T.DOUBLE_QUOTES);
    reader.copyStart();
    while (!reader.isAtEnd() && reader.get() != T.DOUBLE_QUOTES){
        if (reader.get() == T.BACK_SLASH && reader.peek() == T.DOUBLE_QUOTES)
            reader.advance();
        reader.advance();
    }

    const value: string = reader.copyEnd().replaceAll("\\\"", "\"");

    reader.advance();
    // skip next right bracket or the end of the line
    while (
        !reader.isAtEnd() &&
        reader.get() != T.NEWLINE &&
        reader.get() != T.RIGHT_SQ_BRACKET
    )
        reader.advance();

    reader.advance();

    return {
        type: "tag",
        header,
        value
    };
}
