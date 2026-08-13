import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnSanGlyphToken } from "./types.js";
import * as T from "./tokens.js";

export interface HandleSanGlyphState {
    state: number;
    proc: number;
}

export function handleSanGlyph(
    state: HandleSanGlyphState, 
    reader: AbstractReader,
): PgnSanGlyphToken {
    if (state.state === 0){
        reader.copyStart();
        state.state++;
    }

    if (state.state === 1){
        if (reader.match(T.QUESTION_MARK) || reader.match(T.EXCLAMATION_MARK))
            state.proc = 1;
        else if (reader.match(T.HASHTAG))
            state.proc = 2;
        else if (reader.match(T.PLUS))
            state.proc = 3;

        state.state++;
    }

    if (state.state === 2){
        if (state.proc === 1){
            while (
                !reader.isAtEnd() &&
                (reader.get() == T.EXCLAMATION_MARK || reader.get() == T.QUESTION_MARK)
            ){
                reader.advance();
            }
        }else if (state.proc === 3){
            reader.match(T.PLUS);
        }

        const content: string = reader.copyEnd();
        return {
            type: "san glyph",
            content,
        };
    }
    throw new Error(`handleSanGlyph entered an illegal state: ${state.state}`);
}
