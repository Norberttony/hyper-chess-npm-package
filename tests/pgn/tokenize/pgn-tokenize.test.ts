import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PgnTokenizer } from "../../../src/pgn/tokenize/pgn-tokenizer";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";
import { PgnToken } from "../../../src/pgn/tokenize/types";

const fixturesPath = path.join(".", "tests", "fixtures");

describe("PgnTokenizer", () => {
    test("retrieves tags", async () => {
        const reader = new BufferedReader(
            path.join(fixturesPath, "game-1.pgn"),
            1024 * 1024
        );
        await reader.open();
        const tokenizer = new PgnTokenizer(reader);

        const actualTokens: PgnToken[] = JSON.parse(fs.readFileSync(
            path.join(fixturesPath, "game-1-tokens.json")
        ).toString());
        let actualIdx: number = 0;

        let token: PgnToken | undefined;
        while (token = await tokenizer.nextToken()){
            expect(token).toEqual(actualTokens[actualIdx++]);
        }
    });
});
