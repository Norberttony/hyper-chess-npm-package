import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import type { PgnErrorToken, PgnTagToken } from "./types.js";
import * as T from "./tokens.js";

// assumes that the first character is left square bracket '['
export function handleTag(reader: AbstractReader): PgnTagToken | PgnErrorToken {
    if (!reader.match(T.LEFT_SQ_BRACKET))
        throw new Error(
            `handleTag: expected first character to be ${T.LEFT_SQ_BRACKET} but got ${reader.get()} instead`
        );

    let errors: string[] | undefined;

    // extract header
    reader.skipWhitespace();
    reader.copyStart();
    while (!reader.isAtEnd() &&
        reader.get() != T.DOUBLE_QUOTES &&
        reader.get() != T.RIGHT_SQ_BRACKET &&
        !isWhitespace(reader.get())
    ){
        const byte: number = reader.get();

        if (byte === T.DOUBLE_QUOTES ||
            byte === T.RIGHT_SQ_BRACKET ||
            isWhitespace(byte)
        )
            break;

        reader.advance();
    }

    const header: string = reader.copyEnd();
    reader.skipWhitespace();

    // perform error handling based on the expected next character
    // since we just scanned in the header, we expect to see a value

    if (reader.get() != T.RIGHT_SQ_BRACKET &&
        reader.get() != T.DOUBLE_QUOTES &&
        !reader.isAtEnd()
    ){
        // this indicates that the header never ended. That means there's a
        // space in the middle of it.
        (errors ??= []).push("Incomplete tag: expected '\"'");
    }

    if (reader.get() == T.RIGHT_SQ_BRACKET || reader.isAtEnd()){
        // incomplete tag! missing value!
        (errors ??= []).push("Incomplete tag: missing value");
    }else if (reader.get() != T.DOUBLE_QUOTES){
        // badly formatted header!
        (errors ??= []).push("Incomplete tag: spaces are not allowed in the header");
    }

    // extract value
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
        reader.get() != T.LEFT_SQ_BRACKET &&
        reader.get() != T.RIGHT_SQ_BRACKET
    )
        reader.advance();

    // the start of a new tag when this one hasn't finished
    if (reader.get() == T.LEFT_SQ_BRACKET){
        (errors ??= []).push("Unclosed tag: missing a closing right square bracket");
    }else{
        reader.advance();
    }

    if (errors){
        return {
            type: "error",
            partial: { type: "tag", header, value },
            errors,
        };
    }

    return {
        type: "tag",
        header,
        value,
    };
}
