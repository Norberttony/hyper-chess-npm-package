import { AbstractReader } from "../read/abstract-reader.js";
import { PgnTokenizer } from "../tokenize/pgn-tokenizer.js";
import { PgnToken, PgnVariationToken } from "../tokenize/types.js";
import { Pgn, PgnHeaders, PgnMove } from "./types.js";

export class PgnSplitter {
    private tokenizer: PgnTokenizer;
    private lastToken: PgnToken | undefined = undefined;

    constructor(reader: AbstractReader){
        this.tokenizer = new PgnTokenizer(reader);
    }

    public nextPgn(): Pgn | undefined {
        const tokens = this.nextPgnInTokens();
        if (tokens.length == 0)
            return undefined;

        const headers: PgnHeaders = {};
        const moves: string[] = [];
        const moveList: PgnMove[] = [];
        let prev: PgnMove | undefined = undefined;
        let result: string = "*";

        for (const token of tokens){
            if (token.type == "tag")
                headers[token.header] = token.value;
            else if (token.type == "move")
                moves.push(token.content);
            else if (token.type == "result")
                result = token.value;
            prev = this.handleToken(moveList, prev, token);
        }

        return {
            headers,
            moves,
            result,
            moveList
        };
    }

    // returns the next PGN as a list of tokens.
    public nextPgnInTokens(): PgnToken[] {
        const pgnTokens: PgnToken[] = [];

        if (this.lastToken)
            pgnTokens.push(this.lastToken);

        let token: PgnToken | undefined;
        let isInMoveText: boolean = false;
        while (token = this.tokenizer.nextToken()){
            if (token.type != "tag")
                isInMoveText = true;
            else if (token.type == "tag" && isInMoveText)
                break;
            pgnTokens.push(token);
            if (token.type == "result")
                break;
        }

        // given that a new tag marks the start of a new game, we store it for
        // the next game we'll scan in
        if (token && token.type == "tag")
            this.lastToken = token;
        else
            this.lastToken = undefined;

        return pgnTokens;
    }

    private handleVariationToken(
        token: PgnVariationToken,
        prev: PgnMove
    ): void {
        let varPrev: PgnMove | undefined = undefined;
        const moveList: PgnMove[] = [];
        for (const t of token.movetext)
            varPrev = this.handleToken(moveList, varPrev, t);
        prev.variations.push(moveList);
    }

    private handleToken(
        moveList: PgnMove[],
        prev: PgnMove | undefined,
        t: PgnToken
    ): PgnMove | undefined {

        if (t.type == "move"){
            // create new pgn move and add it to children
            const move: PgnMove = {
                san: t.content,
                comments: [],
                nags: [],
                glyphs: [],
                variations: [],
            };
            moveList.push(move);
            return move;
        }
        
        if (!prev)
            return;

        if (t.type == "comment")
            prev.comments.push(t.content);
        else if (t.type == "nag")
            prev.nags.push(t.id);
        else if (t.type == "result")
            prev.result = t.value;
        else if (t.type == "san glyph")
            prev.glyphs.push(t.content);
        else if (t.type == "variation")
            this.handleVariationToken(t, prev);
        return prev;
    }
}
