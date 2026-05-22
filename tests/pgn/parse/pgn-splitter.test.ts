import { describe, test, expect, beforeEach } from "vitest";
import { PgnSplitter } from "../../../src/pgn/parse/pgn-splitter";
import { Reader } from "../../../src/pgn/read/reader";
import { Pgn } from "../../../src/pgn/parse/types";
import { TestCase, fetchTestCases } from "../../shared/load-game-fixtures";

describe("PgnSplitter", () => {
    let cases: TestCase[];
    let pgnDb: string;

    beforeEach(() => {
        const d = fetchTestCases();
        cases = d.cases;
        pgnDb = d.pgnDb;
    });

    test("splits concatenated PGN correctly", () => {
        const splitter = new PgnSplitter(new Reader(pgnDb));

        for (const { tokens } of cases){
            const t = splitter.nextPgnInTokens();
            expect(t).toEqual(tokens);
        }
        expect(splitter.nextPgnInTokens()).toEqual([]);
    });

    test("nextPgn", () => {
        const splitter = new PgnSplitter(new Reader(pgnDb));

        for (const { pgnObj } of cases){
            const nextPgnObj: Pgn = splitter.nextPgn()!;
            expect(nextPgnObj).toEqual(pgnObj);
        }
        expect(splitter.nextPgn()).toBeUndefined();
    });
});
