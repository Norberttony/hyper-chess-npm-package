import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import type { CommentTag } from "./types.js";
import * as T from "./tokens.js";

export function handleCommentTag(reader: AbstractReader): CommentTag | undefined {
    if (!reader.match(T.LEFT_SQ_BRACKET))
        throw new Error(
            `handleCommentTag got ${reader.get()} but expected ${T.LEFT_SQ_BRACKET}`);

    reader.skipWhitespace();
    if (reader.match(T.PERCENT)){
        reader.skipWhitespace();

        // match name
        reader.copyStart();
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != T.RIGHT_SQ_BRACKET
        ){
            reader.advance();
        }
        const name: string = reader.copyEnd();

        // possibly no value given
        reader.skipWhitespace();
        if (reader.match(T.RIGHT_SQ_BRACKET)){
            return { name, value: "" };
        }

        // match value
        reader.copyStart();
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != T.RIGHT_SQ_BRACKET
        ){
            reader.advance();
        }
        const value = reader.copyEnd();

        // skip past the right square bracket
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET)
            reader.advance();
        reader.advance();

        // return comment tag
        return { name, value };
    }else{
        // just skip until the end
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET)
            reader.advance();
        reader.advance();
    }
    return undefined;
}
