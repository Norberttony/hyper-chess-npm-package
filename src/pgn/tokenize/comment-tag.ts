import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import { LEFT_SQ_BRACKET, RIGHT_SQ_BRACKET, CommentTag, PERCENT } from "./types.js";

export function handleCommentTag(reader: AbstractReader): CommentTag | undefined {
    if (!reader.match(LEFT_SQ_BRACKET))
        throw new Error(
            `handleCommentTag got ${reader.get()} but expected ${LEFT_SQ_BRACKET}`);

    reader.skipWhitespace();
    if (reader.match(PERCENT)){
        reader.skipWhitespace();

        // match name
        reader.copyStart();
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != RIGHT_SQ_BRACKET
        ){
            reader.advance();
        }
        const name: string = reader.copyEnd();

        // possibly no value given
        reader.skipWhitespace();
        if (reader.match(RIGHT_SQ_BRACKET)){
            return { name, value: "" };
        }

        // match value
        reader.copyStart();
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != RIGHT_SQ_BRACKET
        ){
            reader.advance();
        }
        const value = reader.copyEnd();

        // skip past the right square bracket
        while (!reader.isAtEnd() && reader.get() != RIGHT_SQ_BRACKET)
            reader.advance();
        reader.advance();

        // return comment tag
        return { name, value };
    }else{
        // just skip until the end
        while (!reader.isAtEnd() && reader.get() != RIGHT_SQ_BRACKET)
            reader.advance();
        reader.advance();
    }
    return undefined;
}
