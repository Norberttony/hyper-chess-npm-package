import { describe, expect, it } from "vitest";
import { VariationsBoard } from "../../src/game/variations-board";
import { sharedBoardTests } from "../shared/shared-board";
import { LAN } from "../../src/game/coords";
import { PgnMove } from "../../src/pgn/parse/types";

sharedBoardTests(() => new VariationsBoard());

describe("VariationsBoard", () => {
    it("updates pgn correctly", () => {
        const board = new VariationsBoard();
        board.loadPGN("1. Pe4 ");
        expect(board.nextVariation()).toBeTruthy();

        const e7e5 = board.getMoveOfLAN("e7e5" as LAN)!;
        expect(e7e5).not.toBeUndefined();
        board.playMove(e7e5);

        const expectedMoves = [ "Pe4", "Pe5" ];
        const expectedMoveList: PgnMove[] = [
            {
                san: "Pe4",
                comments: [],
                nags: [],
                glyphs: [],
                variations: [],
            },
            {
                san: "Pe5",
                comments: [],
                nags: [],
                glyphs: [],
                variations: [],
            },
        ];

        expect(board.getPgn().moves).toEqual(expectedMoves);
        expect(board.getPgn().moveList).toEqual(expectedMoveList);

        // go back a variation
        expect(board.previousVariation()).toBeTruthy();

        const d7d5 = board.getMoveOfLAN("d7d5" as LAN)!;
        expect(d7d5).not.toBeUndefined();
        board.playMove(d7d5);
        expectedMoveList[1].variations.push([{
            san: "Pd5",
            comments: [],
            nags: [],
            glyphs: [],
            variations: [],
        }]);

        expect(board.getPgn().moves).toEqual(expectedMoves);
        expect(board.getPgn().moveList).toEqual(expectedMoveList);
    });
});
