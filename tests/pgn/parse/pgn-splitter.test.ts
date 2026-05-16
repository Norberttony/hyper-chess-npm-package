import fs from "node:fs";
import path from "node:path";
import { describe, test, expect, beforeEach } from "vitest";
import { fixturesPath, readJSONFile } from "../../shared/utils";
import { PgnSplitter } from "../../../src/pgn/parse/pgn-splitter";
import { PgnToken } from "../../../src/pgn/tokenize/types";
import { Reader } from "../../../src/pgn/read/reader";

interface TestCase {
    tokens: PgnToken[];
    pgn: string;
}

describe("PgnSplitter", () => {
    let cases: TestCase[];

    beforeEach(() => {
        cases = [];
        for (let i = 1; i <= 4; i++){
            const pgnPath = path.join(fixturesPath, `game-${i}.pgn`);
            const tokensPath = path.join(fixturesPath, `game-${i}-tokens.json`);
            const tokens: PgnToken[] = readJSONFile(tokensPath);
            const pgn: string = fs.readFileSync(pgnPath).toString();
            cases.push({ tokens, pgn });
        }
    });

    test("splits concatenated PGN correctly", () => {
        let pgnDb = "";
        for (const { pgn } of cases)
            pgnDb += pgn + "\n";

        const splitter = new PgnSplitter(new Reader(pgnDb));

        for (const { tokens } of cases)
            expect(splitter.nextPgnInTokens()).toEqual(tokens);
        expect(splitter.nextPgnInTokens()).toEqual([]);
    });
});
