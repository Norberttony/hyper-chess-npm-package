import { AbstractReader } from "../read/abstract-reader.js";
import { PgnToken } from "./types.js";
import { handleTag } from "./tag.js";
import { isWhitespace } from "../read/utils.js";
import { LEFT_SQ_BRACKET } from "./types.js";
import { handleMovetext } from "./movetext.js";

export class PgnTokenizer {
    constructor(private reader: AbstractReader){}

    public nextToken(): PgnToken | undefined {
        while (true && !this.reader.isAtEnd()){
            const v: number = this.reader.get();
            if (isWhitespace(v)){
                this.reader.advance();
            }else if (v == LEFT_SQ_BRACKET){
                return handleTag(this.reader);
            }else{
                return handleMovetext(this.reader);
            }
        }
        return undefined;
    }
}
