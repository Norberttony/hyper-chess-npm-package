import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnToken } from "./types.js";
import { handleTag } from "./tag.js";
import { isWhitespace } from "../read/utils.js";
import { handleMovetext } from "./movetext.js";
import { handleComment } from "./comment.js";
import { handleSanGlyph } from "./san-glyph.js";
import { handleNag } from "./nag.js";
import * as T from "./tokens.js";

export class PgnTokenizer {
    private gen: Generator<PgnToken, undefined, void>;

    constructor(private reader: AbstractReader){
        this.gen = tokenizerMainLoop(this.reader);
    }

    public async nextToken(): Promise<PgnToken | undefined> {
        let res: IteratorResult<PgnToken, undefined>;
        do {
            res = this.gen.next();
        }
        while (!res.value && !res.done);
        return res.value;
    }
}

function* tokenizerMainLoop(reader: AbstractReader): Generator<PgnToken, undefined, void> {
    while (!reader.isAtEnd()){
        const v: number = reader.get();
        if (isWhitespace(v)){
            reader.advance();
        }else if (v === T.LEFT_BRACE || v === T.SEMICOLON){
            yield handleComment(reader).next().value!;
        }else if (v === T.LEFT_SQ_BRACKET){
            yield handleTag(reader).next().value!;
        }else if (T.SAN_GLYPHS.has(v)){
            yield handleSanGlyph(reader).next().value!;
        }else if (v === T.DOLLAR_SIGN){
            yield handleNag(reader).next().value!;
        }else{
            yield handleMovetext(reader).next().value!;
        }
    }
    return undefined;
}
