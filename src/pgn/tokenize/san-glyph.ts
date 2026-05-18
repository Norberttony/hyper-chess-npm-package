import { AbstractReader } from "../read/abstract-reader.js";
import { EXCLAMATION_MARK, HASHTAG, PgnSanGlyphToken, PLUS, QUESTION_MARK } from "./types.js";

export function handleSanGlyph(reader: AbstractReader): PgnSanGlyphToken {
    reader.copyStart();

    if (reader.match(QUESTION_MARK) || reader.match(EXCLAMATION_MARK)){
        while (
            !reader.isAtEnd() &&
            (reader.get() == EXCLAMATION_MARK || reader.get() == QUESTION_MARK)
        ){
            reader.advance();
        }
    }else if (reader.match(HASHTAG)){
    }else if (reader.match(PLUS)){
        reader.match(PLUS);
    }

    const content: string = reader.copyEnd();
    return {
        type: "san glyph",
        content
    };
}
