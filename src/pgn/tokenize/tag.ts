import { BufferedReader } from "../read/buffered-reader.js";
import { isWhitespace } from "../read/utils.js";
import { BACK_SLASH, DOUBLE_QUOTES, LEFT_SQ_BRACKET, NEWLINE, PgnTagToken, RIGHT_SQ_BRACKET } from "./types.js";

// assumes that the first character is left square bracket '['
export function handleTag(reader: BufferedReader): PgnTagToken {
    if (!reader.match(LEFT_SQ_BRACKET))
        throw new Error(
            `handleTag: expected first character to be ${LEFT_SQ_BRACKET} but got ${reader.get()} instead`
        );

    // extract header
    reader.copyStart();
    while (
        !reader.isAtEnd() &&
        reader.get() != DOUBLE_QUOTES &&
        reader.get() != RIGHT_SQ_BRACKET &&
        !isWhitespace(reader.get())
    )
        reader.advance();

    const header: string = reader.copyEnd().join("");

    // incomplete tag! missing value!
    if (reader.get() == RIGHT_SQ_BRACKET || reader.isAtEnd())
        throw new Error(`PgnTagToken is missing value but has header ${header}`);

    // extract value
    reader.skipWhitespace();
    reader.match(DOUBLE_QUOTES);
    reader.copyStart();
    while (!reader.isAtEnd() && reader.get() != DOUBLE_QUOTES){
        if (reader.get() == BACK_SLASH && reader.peek() == DOUBLE_QUOTES)
            reader.advance();
        reader.advance();
    }

    const value: string = reader.copyEnd().join("");

    reader.advance();
    // skip next right bracket or the end of the line
    while (
        !reader.isAtEnd() &&
        reader.get() != NEWLINE &&
        reader.get() != RIGHT_SQ_BRACKET
    )
        reader.advance();

    reader.advance();

    return {
        type: "tag",
        header,
        value
    };
}
