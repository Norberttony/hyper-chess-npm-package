import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PgnTokenizer } from "../../../src/pgn/tokenize/pgn-tokenizer";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";
import { PgnToken } from "../../../src/pgn/tokenize/types";
import { fixturesPath } from "../../shared/utils";

describe("PgnTokenizer", () => {
    for (let i = 1; i <= 4; i++){
        const fileName = `game-${i}.pgn`;
        test(`fetches all tokens in ${fileName}`, async () => {
            const reader = new BufferedReader(
                path.join(fixturesPath, fileName),
                1024 * 1024
            );
            await reader.open();
            const tokenizer = new PgnTokenizer(reader);
    
            const actualTokens: PgnToken[] = JSON.parse(fs.readFileSync(
                path.join(fixturesPath, `game-${i}-tokens.json`)
            ).toString());
            let actualIdx: number = 0;
    
            let token: PgnToken | undefined;
            while (token = tokenizer.nextToken())
                expect(token).toEqual(actualTokens[actualIdx++]);
        });
    }
});
