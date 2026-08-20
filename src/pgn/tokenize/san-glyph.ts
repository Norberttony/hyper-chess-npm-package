import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnSanGlyphToken } from "./types.js";
import * as T from "./tokens.js";

export async function handleSanGlyph(reader: AbstractReader): Promise<PgnSanGlyphToken> {
    reader.copyStart();

    if (reader.match(T.QUESTION_MARK) || reader.match(T.EXCLAMATION_MARK)){
        while (
            !reader.isAtEnd() &&
            (reader.get() == T.EXCLAMATION_MARK || reader.get() == T.QUESTION_MARK)
        ){
            reader.advance();
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }
    }else if (reader.match(T.HASHTAG)){
    }else if (reader.match(T.PLUS)){
        reader.match(T.PLUS);
    }

    const content: string = reader.copyEnd();
    return {
        type: "san glyph",
        content
    };
}
