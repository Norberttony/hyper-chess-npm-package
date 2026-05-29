import { describe, test, expect, beforeEach } from "vitest";
import { PgnSplitter } from "../../../src/pgn/parse/pgn-splitter";
import { Reader } from "../../../src/pgn/read/reader";
import { Pgn, PgnComment, PgnMove } from "../../../src/pgn/parse/types";
import { TestCase, fetchTestCases } from "../../shared/load-game-fixtures";

describe("PgnSplitter", () => {
    let cases: TestCase[];
    let pgnDb: string;

    beforeEach(() => {
        const d = fetchTestCases();
        cases = d.cases;
        pgnDb = d.pgnDb;
    });

    describe("Main Variation", () => {
        test("parses main variation", () => {
            expect(getFirstPgnSplit("1. d4 d5 2. c4").moves).toEqual([
                "d4", "d5", "c4"
            ]);
        });

        test("ignores other variations", () => {
            expect(getFirstPgnSplit("1. d4 (1. e4 e5) d5 2. c4").moves).toEqual([
                "d4", "d5", "c4"
            ]);
        });
    });

    describe("Comment Boundary Conditions", () => {
        test("stores leading comments", () => {
            const pgn = getFirstPgnSplit("{ Comment } 1. d4 d5");
            expect(pgn.moveList).toEqual([ pgnMove("d4"), pgnMove("d5") ]);
            expect(pgn.leadingComments).toEqual([ pgnComment(" Comment ") ]);
        });

        test("stores trailing comments", () => {
            const pgn = getFirstPgnSplit("1. d4 d5 2. c4 1-0 { Comment }");
            expect(pgn.trailingComments).toEqual([ pgnComment(" Comment ") ]);
        });

        test("treats comments as trailing by default", () => {
            const splitter = createPgnSplitter("1. d4 1-0 { Comment } 1. d4 1-0");
            expect(splitter.nextPgn()!.trailingComments).toEqual([
                pgnComment(" Comment ")
            ]);
            expect(splitter.nextPgn()!.leadingComments).toEqual([]);
        });
    });

    test("splits concatenated PGN correctly", () => {
        const splitter = createPgnSplitter(pgnDb);

        for (const { tokens } of cases){
            const t = splitter.nextPgnInTokens();
            expect(t).toEqual(tokens);
        }
        expect(splitter.nextPgnInTokens()).toEqual([]);
    });

    test("nextPgn", () => {
        const splitter = createPgnSplitter(pgnDb);

        for (const { pgnObj } of cases){
            const nextPgnObj: Pgn = splitter.nextPgn()!;
            expect(nextPgnObj).toEqual(pgnObj);
        }
        expect(splitter.nextPgn()).toBeUndefined();
    });
});

function createPgnSplitter(pgnStr: string): PgnSplitter {
    return new PgnSplitter(new Reader(pgnStr));
}

function getFirstPgnSplit(pgnStr: string): Pgn {
    return new PgnSplitter(new Reader(pgnStr)).nextPgn()!;
}

function pgnMove(san: string): PgnMove {
    return {
        san,
        comments: [],
        commentTags: {},
        glyphs: [],
        nags: [],
        variations: [],
    };
}

function pgnComment(content: string): PgnComment {
    return { content, tags: [] };
}
