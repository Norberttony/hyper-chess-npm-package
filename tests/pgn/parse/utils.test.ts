import { it, expect, describe } from "vitest";
import { pgnToString } from "../../../src/pgn/parse/utils";
import { Pgn } from "../../../src/pgn/parse/types";
import { move } from "../../shared/shared-variations-board";
import { pgnComment } from "./pgn-splitter.test";

describe("pgnToString", () => {
    it("converts puzzle pgn to string correctly", () => {
        const pgn: Pgn = {
            headers: {
                "Variant": "From Position",
                "FEN": "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45"
            },
            moves: [ "Bd7", "Kxd7", "Bxe8" ],
            moveList: [ move("Bd7+"), move("Kxd7"), move("Bxe8#") ],
            result: "1-0",
            leadingComments: [],
            trailingComments: [],
        };

        expect(pgnToString(pgn)).toBe(`[Variant "From Position"]
[FEN "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45"]

45. Bd7+ Kxd7 46. Bxe8# 1-0`);
    });

    it("converts pgn with variations to string correctly", () => {
        const pgn: Pgn = {
            headers: {
                "Variant": "From Position",
                "FEN": "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45"
            },
            moves: [ "Bd7", "Kxd7", "Bxe8" ],
            moveList: [
                move("Bd7+"),
                move("Kxd7"),
                move("Bxe8#", [
                    [ move("Qd6+") ]
                ])
            ],
            result: "1-0",
            leadingComments: [],
            trailingComments: [],
        };

        expect(pgnToString(pgn)).toBe(`[Variant "From Position"]
[FEN "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45"]

45. Bd7+ Kxd7 46. Bxe8# (46. Qd6+) 1-0`);
    });

    it("handles leading comments correctly", () => {
        const pgn: Pgn = {
            headers: { "Event": "Example" },
            moves: [ "Pd4" ],
            moveList: [ move("Pd4") ],
            result: "*",
            leadingComments: [ pgnComment("Comment") ],
            trailingComments: [],
        };

        expect(pgnToString(pgn)).toBe(`[Event "Example"]

{ Comment }

1. Pd4 *`);
    });

    it("handles trailing comments correctly", () => {
        const pgn: Pgn = {
            headers: { "Event": "Example" },
            moves: [ "Pd4" ],
            moveList: [ move("Pd4") ],
            result: "*",
            leadingComments: [],
            trailingComments: [ pgnComment("Comment") ],
        };

        expect(pgnToString(pgn)).toBe(`[Event "Example"]

1. Pd4 * { Comment }`);
    });
});
