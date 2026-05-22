import { it, expect, describe } from "vitest";
import { pgnToString } from "../../../src/pgn/parse/utils";
import { Pgn } from "../../../src/pgn/parse/types";
import { move } from "../../shared/shared-variations-board";

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
        };

        expect(pgnToString(pgn)).toBe(`[Variant "From Position"]
[FEN "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45"]

45. Bd7+ Kxd7 46. Bxe8# (46. Qd6+) 1-0`);
    });
});
