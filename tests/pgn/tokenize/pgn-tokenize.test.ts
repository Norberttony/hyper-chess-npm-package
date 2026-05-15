import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PgnTokenizer } from "../../../src/pgn/tokenize/pgn-tokenizer";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";
import { PgnToken } from "../../../src/pgn/tokenize/types";

const fixturesPath = path.join(".", "tests", "fixtures");

describe("PgnTokenizer", () => {
    for (let i = 1; i <= 4; i++){
        test("fetches all tokens", async () => {
            const reader = new BufferedReader(
                path.join(fixturesPath, `game-${i}.pgn`),
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
