import fs from "node:fs";
import path from "node:path";
import { describe, test, expect, beforeEach } from "vitest";
import { fixturesPath, readJSONFile } from "../../shared/utils";
import { PgnSplitter } from "../../../src/pgn/parse/pgn-splitter";
import { PgnToken } from "../../../src/pgn/tokenize/types";
import { Reader } from "../../../src/pgn/read/reader";
import { Pgn } from "../../../src/pgn/parse/types";

interface TestCase {
    tokens: PgnToken[];
    pgn: string;
    pgnObj: Pgn;
}

describe("PgnSplitter", () => {
    let cases: TestCase[];
    let pgnDb: string;

    beforeEach(() => {
        cases = [];
        for (let i = 1; i <= 4; i++){
            const pgnPath = path.join(fixturesPath, `game-${i}.pgn`);
            const pgn: string = fs.readFileSync(pgnPath).toString();

            const tokensPath = path.join(fixturesPath, `game-${i}-tokens.json`);
            const tokens: PgnToken[] = readJSONFile(tokensPath);

            const pgnObjPath = path.join(fixturesPath, `game-${i}-pgn.json`);
            const pgnObj: Pgn = readJSONFile(pgnObjPath);
            cases.push({ tokens, pgn, pgnObj });
        }

        pgnDb = "";
        for (const { pgn } of cases)
            pgnDb += pgn + "\n";
    });

    test("splits concatenated PGN correctly", () => {
        const splitter = new PgnSplitter(new Reader(pgnDb));

        for (const { tokens } of cases)
            expect(splitter.nextPgnInTokens()).toEqual(tokens);
        expect(splitter.nextPgnInTokens()).toEqual([]);
    });

    test("nextPgn", () => {
        const splitter = new PgnSplitter(new Reader(pgnDb));

        for (const { pgnObj } of cases)
            expect(splitter.nextPgn()).toEqual(pgnObj);
        expect(splitter.nextPgn()).toBeUndefined();
    });
});
