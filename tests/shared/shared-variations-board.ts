import { describe, it, expect, beforeEach } from "vitest";
import { VariationsBoard } from "../../src/game/variations-board";
import { PgnMove } from "../../src/pgn/parse/types";
import { Lan } from "../../src/game/coords";
import { VariationMove } from "../../src/game/variation";
import { removeGlyphs, San } from "../../src/game/san";

type VariationsBoardFactory = () => VariationsBoard;

export function sharedVariationsBoardTests(
    name: string,
    boardFactory: VariationsBoardFactory
): void {
    let board: VariationsBoard;

    beforeEach(() => {
        board = boardFactory();
        board.loadPgn("1. Pe4");
        board.nextVariation();
    });

    describe(`${name} loading PGN`, () => {
        it("sets pgn object correctly", () => {
            // check pgn moves and pgn move list
            expect(board.getPgn().moves).toEqual([ "Pe4" ]);
            expect(board.getPgn().moveList).toEqual([ move("Pe4") ]);
        });

        it("sets variation tree correctly", () => {
            // check variation tree structure
            expect(getSan(board)).toBe("Pe4");
        });
    });

    describe(`${name} playing mainline moves`, () => {
        it("updates pgn object correctly", () => {
            play(board, "e7e5");

            // testing loading PGN and making moves
            expect(board.getPgn().moves).toEqual([ "Pe4", "Pe5" ]);
            expect(board.getPgn().moveList).toEqual([
                move("Pe4"), move("Pe5")
            ]);
        });

        it("updates variation tree correctly", () => {
            play(board, "e7e5");

            expect(getSan(board)).toBe("Pe5");

            board.previousVariation();
            expect(getSan(board)).toBe("Pe4");
        });

        it("jumps to move", () => {
            const vm = play(board, "e7e5")!;
            board.jumpToVariation(vm);
            expect(getSan(board)).toBe("Pe5");
        });

        describe("deletes move", () => {
            it("updates pgn object correctly", () => {
                const e7e5 = play(board, "e7e5")!;
                play(board, "d2d4");
                board.deleteVariation(e7e5);
                expect(board.getPgn().moves).toEqual([ "Pe4" ]);
                expect(board.getPgn().moveList).toEqual([ move("Pe4") ]);
            });

            it("updates variation tree correctly", () => {
                const e7e5 = play(board, "e7e5")!;
                play(board, "d2d4");
                board.deleteVariation(e7e5);
                expect(getSan(board)).toBe("Pe4");
                expect(board.nextVariation()).toBeFalsy();
            });
        });
    });

    describe(`${name} playing variations`, () => {
        it("updates pgn object correctly", () => {
            play(board, "e7e5");

            // test making a variation
            board.previousVariation();
            play(board, "d7d5");

            expect(board.getPgn().moves).toEqual([ "Pe4", "Pe5" ]);
            expect(board.getPgn().moveList).toEqual([
                move("Pe4"),
                move("Pe5", [
                    [ move("Pd5") ]
                ])
            ]);
        });

        it("updates variation tree correctly", () => {
            play(board, "e7e5");

            board.previousVariation();
            play(board, "d7d5");

            expect(getSan(board)).toBe("Pd5");
            board.previousVariation();
            expect(getSan(board)).toBe("Pe4");
            board.nextVariation();
            expect(getSan(board)).toBe("Pe5");
        });
    });
}

export function move(san: string, variations: PgnMove[][] = []): PgnMove {
    const glyph = san.replace(removeGlyphs(san as San), "");
    return {
        san: removeGlyphs(san as San),
        comments: [],
        nags: [],
        glyphs: glyph != "" ? [ glyph ] : [],
        variations,
    };
}

function play(board: VariationsBoard, lan: string): VariationMove | undefined {
    const move = board.getMoveOfLan(lan as Lan);
    if (!move)
        throw new Error(`Move ${lan} is not defined (FEN: ${board.getFen()})`);
    return board.playMove(move);
}

function getSan(board: VariationsBoard): string {
    const cv = board.getCurrentVariation();
    if (cv.type != "move")
        throw new Error("Expected a move in VariationTree");
    return cv.pgnMove.san;
}
