import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnToken } from "./types.js";
import { HandleTagState, defaultTagState, handleTag } from "./tag.js";
import { defaultMovetextState, handleMovetext, HandleMovetextState } from "./movetext.js";
import { defaultCommentState, handleComment, HandleCommentState } from "./comment.js";
import { handleSanGlyph, HandleSanGlyphState } from "./san-glyph.js";
import { handleNag, HandleNagState } from "./nag.js";
import * as T from "./tokens.js";

export class PgnTokenizer {
    private proc: number = 0;

    private tagState: HandleTagState = defaultTagState();
    private nagState: HandleNagState = { numState: { num: 0 } };
    private sanGlyphState: HandleSanGlyphState = { state: 0, proc: 0 };
    private commentState: HandleCommentState = defaultCommentState();
    private movetextState: HandleMovetextState = defaultMovetextState();

    constructor(private reader: AbstractReader){}

    public nextToken(): PgnToken | undefined {
        const tok = this.mainLoop();
        if (tok)
            return tok;
        return undefined;
    }

    private mainLoop(): PgnToken | undefined {
        while (!this.reader.isAtEnd()){
            let t: PgnToken | undefined = undefined;
            if (this.proc === 1){
                t = handleTag(this.tagState, this.reader);
                this.tagState = defaultTagState();
            }else if (this.proc === 2){
                t = handleComment(this.commentState, this.reader);
                this.commentState = defaultCommentState();
            }else if (this.proc === 3){
                t = handleSanGlyph(this.sanGlyphState, this.reader);
                this.sanGlyphState.state = 0;
                this.sanGlyphState.proc = 0;
            }else if (this.proc === 4){
                t = handleNag(this.nagState, this.reader);
                this.nagState.numState.num = 0;
            }else if (this.proc === 5){
                t = handleMovetext(this.movetextState, this.reader);
                this.movetextState = defaultMovetextState();
            }else{
                // not processing any tokens
                this.handleNoToken();
            }
            if (t !== undefined){
                this.proc = 0;
                return t;
            }
        }
        return undefined;
    }

    // not currently processing any tokens
    private handleNoToken(): void {
        this.reader.skipWhitespace();

        if (this.reader.isAtEnd())
            return;

        // identify a new token to process
        const v: number = this.reader.get();
        if (this.reader.match(T.LEFT_SQ_BRACKET))
            this.proc = 1;
        else if (v === T.LEFT_BRACE || v === T.SEMICOLON)
            this.proc = 2;
        else if (T.SAN_GLYPHS.has(v))
            this.proc = 3;
        else if (this.reader.match(T.DOLLAR_SIGN))
            this.proc = 4;
        else
            this.proc = 5;
    }
}
