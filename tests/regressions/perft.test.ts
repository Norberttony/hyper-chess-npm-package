import { describe, expect, test } from "vitest";
import { Board } from "../../src/game/board.js";
import { perft } from "../../src/game/perft.js";
import { Move } from "../../src/game/move.js";
import { Lan } from "../../src/game/coords.js";
import { fetchPerftTestCases } from "../shared/load-game-fixtures.js";

describe("perft", () => {
    const MAX_NODES = 20000;
    const testSuite = fetchPerftTestCases();

    for (const { fen, nodes } of testSuite){
        for (const depthStr of Object.keys(nodes)){
            const depth = parseInt(depthStr);
            const expected = nodes[depthStr]!;

            // for speed purposes
            const run = expected > MAX_NODES ? test.skip : test;

            run(`perft fen=${fen} depth=${depth} expectedNodes=${expected}`,
                { timeout: 30000 },
                () => {
                    const pv: Lan[] = [];
                    const b = new Board();
                    b.loadFen(fen);
            
                    // we'll be comparing this FEN to avoid any slight
                    // formatting changes like adding/removing extra spaces.
                    const startFen = b.getFen();

                    const actual = perft(depth, b);

                    // collect more debug info by using count moves
                    if (actual != expected){
                        countMoves(depth, b, pv);
                    }

                    // ensure we're back where we started
                    expect(b.getFen()).toBe(startFen);

                    // ensure node count matches
                    expect(actual).toBe(expected);
                }
            );
        }
    }
});

function countMoves(depth: number, board: Board, pv: string[] = [], prevMove?: Move): number[] {
    if (depth == 0){
        if (prevMove)
            return [
                1,
                prevMove.captures.length > 0 ? 1 : 0,
                prevMove.captures.length,
                board.isGameOver() && board.isGameOver()!.termination == "checkmate" ? 1 : 0
            ];
        else
            return [ 1, 0, 0, 0 ];
    }

    const counter = [ 0, 0, 0, 0 ];
    const moves = board.generateMoves();
    for (const m of moves){
        const startFen = board.getFen();
        board.makeMove(m);
        pv.push(m.lan);

        const res = countMoves(depth - 1, board, pv, m);
        for (let i = 0; i < 4; i++)
            counter[i]! += res[i]!;

        if (!prevMove)
            console.log(m.lan, res[0]);

        board.unmakeMove(m);
        const endFen = board.getFen();
        if (startFen != endFen){
            throw new Error(`startFen does not match with endFen, PV: ${pv.join(" ")}`);
        }
        pv.pop();
    }

    return counter;
}

