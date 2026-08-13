import { AbstractReader } from "../read/abstract-reader.js";
import { isWhitespace } from "../read/utils.js";
import type { CommentTag } from "./types.js";
import * as T from "./tokens.js";

export interface HandleCommentTagState {
    state: number;
    isValid: boolean;
    name: string | undefined;
    value: string | undefined;
}

export function handleCommentTag(
    state: HandleCommentTagState,
    reader: AbstractReader
): CommentTag | undefined {
    if (state.state === 0){
        reader.match(T.LEFT_SQ_BRACKET)
        state.state++;
    }

    if (state.state === 1){
        reader.skipWhitespace();
        state.isValid = reader.match(T.PERCENT);
        state.state++;
    }

    if (state.state === 2){
        if (state.isValid){
            reader.skipWhitespace();
            reader.copyStart();
        }else{
            // just skip until the end
            while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET)
                reader.advance();
        }
        state.state++;
    }

    if (state.state === 3){
        if (state.isValid){
            // match name
            while (
                !reader.isAtEnd() &&
                !isWhitespace(reader.get()) &&
                reader.get() != T.RIGHT_SQ_BRACKET
            ){
                reader.advance();
            }
            state.name = reader.copyEnd();
            state.state++;
        }else{
            reader.advance();
            return undefined;
        }
    }

    if (state.state === 4){
        // possibly no value given
        reader.skipWhitespace();
        if (reader.match(T.RIGHT_SQ_BRACKET))
            return { name: state.name!, value: "" };
        reader.copyStart();
        state.state++;
    }

    if (state.state === 5){
        // match value
        while (
            !reader.isAtEnd() &&
            !isWhitespace(reader.get()) &&
            reader.get() != T.RIGHT_SQ_BRACKET
        ){
            reader.advance();
        }
        state.value = reader.copyEnd();
        state.state++;
    }

    if (state.state === 6){
        // skip to the right square bracket
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_SQ_BRACKET)
            reader.advance();
        state.state++;
    }

    if (state.state === 7){
        // skip past the right square bracket
        reader.advance();
        state.state++;
    }

    if (state.state === 8){
        // return comment tag
        return { name: state.name!, value: state.value! };
    }

    throw new Error(`handleCommentTag entered an illegal state: ${state.state}`);
}
