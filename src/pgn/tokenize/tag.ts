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
    while (!reader.isAtEnd()){
        const byte: number = reader.get();

        if (byte === T.DOUBLE_QUOTES ||
            byte === T.RIGHT_SQ_BRACKET ||
            isWhitespace(byte)
        )
            break;

        reader.advance();
    }

    // this MIGHT be the header, but it's possible that the user accidentally
    // added spaces to it. So, put this on pause and start copying the whitespace
    // to preserve it in the header.
    reader.copyPause();
    reader.copyStart();
    reader.skipWhitespace();

    let header: string;

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
        reader.copyReject();
        header = reader.copyEnd();
    }else if (reader.get() != T.DOUBLE_QUOTES){
        // badly formatted header!
        (errors ??= []).push("Incomplete tag: spaces are not allowed in the header");

        // keep going until line break or start value or end tag
        while (!reader.isAtEnd()){
            const byte: number = reader.get();

            if (byte === T.DOUBLE_QUOTES ||
                byte === T.RIGHT_SQ_BRACKET ||
                byte === T.NEWLINE ||
                byte === T.LEFT_SQ_BRACKET
            )
                break;

            reader.advance();
        }
        header = reader.copyEnd();
        header = reader.copyEnd() + header;
        header = header.trim();
    }else{
        reader.copyReject();
        header = reader.copyEnd();
    }

    // extract value
    reader.match(T.DOUBLE_QUOTES);
    reader.copyStart();
    while (!reader.isAtEnd()){
        const byte = reader.get();

        if (byte === T.DOUBLE_QUOTES || byte === T.NEWLINE)
            break;

        if (byte === T.BACK_SLASH && reader.peek() === T.DOUBLE_QUOTES)
            reader.advance();
        reader.advance();
    }

    const value: string = reader.copyEnd().replaceAll("\\\"", "\"");

    if (reader.get() != T.DOUBLE_QUOTES){
        (errors ??= []).push("Unclosed value in tag: missing end double quote");
    }

    reader.advance();
    // skip next right bracket or the end of the line
    while (!reader.isAtEnd()){
        const byte = reader.get();

        if (byte === T.LEFT_SQ_BRACKET ||
            byte == T.RIGHT_SQ_BRACKET ||
            byte === T.NEWLINE
        )
            break;

        reader.advance();
    }

    // the start of a new tag when this one hasn't finished
    if (reader.get() != T.RIGHT_SQ_BRACKET){
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
