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
    constructor(private reader: AbstractReader){}

    public async nextToken(): Promise<PgnToken | undefined> {
        while (!this.reader.isAtEnd()){
            const v: number = this.reader.get();
            if (isWhitespace(v)){
                this.reader.advance();
            }else if (v === T.LEFT_BRACE || v === T.SEMICOLON){
                return await handleComment(this.reader);
            }else if (v === T.LEFT_SQ_BRACKET){
                return await handleTag(this.reader);
            }else if (T.SAN_GLYPHS.has(v)){
                return await handleSanGlyph(this.reader);
            }else if (v === T.DOLLAR_SIGN){
                return await handleNag(this.reader);
            }else{
                return await handleMovetext(this.reader);
            }
        }
        return undefined;
    }
}
