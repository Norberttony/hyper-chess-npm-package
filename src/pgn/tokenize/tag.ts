import { AbstractReader } from "../browser-index.js";
import { PartialToken, PgnError, PgnErrorToken, PgnTagToken } from "./types.js";
import { isWhitespace } from "../read/utils.js";
import * as T from "./tokens.js";

export interface HandleTagState {
    header: string | undefined;
    value: string | undefined;
    state: number;
    errors: PgnError[] | undefined;
}

export function defaultTagState(): HandleTagState {
    return {
        state: 0, header: undefined, value: undefined, errors: undefined
    };
}

export function handleTag(
    state: HandleTagState,
    reader: AbstractReader,
): PgnTagToken | PgnErrorToken {
    if (state.state === 0){
        reader.skipWhitespace();
        reader.copyStart();
        state.state++;
    }

    if (state.state === 1){
        // extract header
        while (!reader.isAtEnd()){
            const byte: number = reader.get();

            if (byte === T.DOUBLE_QUOTES ||
                byte === T.RIGHT_SQ_BRACKET ||
                isWhitespace(byte)
            )
                break;

            reader.advance();
        }

        // state MIGHT be the header, but it's possible that the user
        // accidentally added spaces to it. So, put state on pause and start
        // copying the whitespace to preserve it in the header.
        reader.copyPause();
        reader.copyStart();
        state.state++;
    }

    if (state.state === 2){
        // skip whitespace and perform error checking
        reader.skipWhitespace();

        if (reader.get() === T.RIGHT_SQ_BRACKET || reader.isAtEnd()){
            // the tag ended prematurely
            (state.errors ??= []).push({
                msg: "Incomplete tag: missing value",
                context: reader.getContext(),
            });
            reader.copyReject();
            state.header = reader.copyEnd();
        }else if (reader.get() !== T.DOUBLE_QUOTES){
            // badly formatted header!
            (state.errors ??= []).push({
                msg: "Incomplete tag: spaces are not allowed in the header",
                context: reader.getContext(),
            });
            // because we want +1 but later we do += 2
            // in other words, this is the special error state and we don't want
            // to jump over it
            state.state--;
        }else{
            reader.copyReject();
            state.header = reader.copyEnd();
        }

        // next state deals with a special error, so jump over it
        state.state += 2;
    }

    if (state.state === 3){
        // special error state
        // there are spaces in the header, so assume a human added a custom
        // header with spaces

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
        state.header = reader.copyEnd();
        state.header = reader.copyEnd() + state.header;
        state.header = state.header.trim();
        state.state++;
    }

    if (state.state === 4){
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
    
        state.value = reader.copyEnd().replaceAll("\\\"", "\"");

        // since reader.advance() can error
        state.state++;
        if (reader.get() != T.DOUBLE_QUOTES){
            (state.errors ??= []).push({
                msg: "Unclosed value in tag: missing end double quote",
                context: reader.getContext(),
            });
        }else{
            // skip the end double quote
            reader.advance();
        }
    }

    if (state.state === 5){
        state.state++;

        // the start of a new tag when this one hasn't finished
        if (reader.get() != T.RIGHT_SQ_BRACKET){
            (state.errors ??= []).push({
                msg: "Unclosed tag: missing a closing right square bracket",
                context: reader.getContext(),
            });
        }else{
            reader.advance();
        }
    }

    if (state.state === 6){
        // handle returning either an error token or the actual tag token
        if (state.errors){
            const partial: PartialToken = { type: "tag" };
            if (state.header)
                partial.header = state.header;
            if (state.value)
                partial.value = state.value;
            return { type: "error", partial, errors: state.errors };
        }

        return {
            type: "tag",
            header: state.header!,
            value: state.value!,
        };
    }
    throw new Error(`handleTag entered illegal state ${state.state}`);
}
