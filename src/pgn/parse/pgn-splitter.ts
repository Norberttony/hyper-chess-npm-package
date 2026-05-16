import { AbstractReader } from "../read/abstract-reader.js";
import { PgnTokenizer } from "../tokenize/pgn-tokenizer.js";
import { PgnToken } from "../tokenize/types.js";

export class PgnSplitter {
    private tokenizer: PgnTokenizer;
    private lastToken: PgnToken | undefined = undefined;

    constructor(reader: AbstractReader){
        this.tokenizer = new PgnTokenizer(reader);
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
}
