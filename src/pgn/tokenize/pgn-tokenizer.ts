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

    public nextToken(): PgnToken | undefined {
        while (!this.reader.isAtEnd()){
            const v: number = this.reader.get();
            if (isWhitespace(v)){
                this.reader.advance();
            }else if (v == T.LEFT_BRACE){
                return handleComment(this.reader);
            }else if (v == T.LEFT_SQ_BRACKET){
                return handleTag(this.reader);
            }else if (T.SAN_GLYPHS.has(v)){
                return handleSanGlyph(this.reader);
            }else if (v == T.DOLLAR_SIGN){
                return handleNag(this.reader);
            }else{
                return handleMovetext(this.reader);
            }
        }
        return undefined;
    }
}
