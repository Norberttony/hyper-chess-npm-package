import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import type { CommentTag } from "./types.js";
import * as T from "./tokens.js";
import { skipWhitespace } from "./utils.js";

export async function handleCommentTag(reader: AbstractReader): Promise<CommentTag | undefined> {
    if (!reader.match(T.LEFT_SQ_BRACKET))
        throw new Error(
            `handleCommentTag got ${reader.get()} but expected ${T.LEFT_SQ_BRACKET}`);

    // we don't have to check if data is available because the parent function
    // handleComment already peeked the percent symbol.
    await skipWhitespace(reader);
    if (reader.match(T.PERCENT)){
        await skipWhitespace(reader);

        // match name
        reader.copyStart();
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != T.RIGHT_SQ_BRACKET
        ){
            reader.advance();
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }
        const name: string = reader.copyEnd();

        // possibly no value given
        await skipWhitespace(reader);
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
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }
        const value = reader.copyEnd();

        // skip past the right square bracket
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET){
            reader.advance();
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }
        reader.advance();

        // return comment tag
        return { name, value };
    }else{
        // just skip until the end
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET){
            reader.advance();
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }
        reader.advance();
    }
    return undefined;
}
