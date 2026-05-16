import fs from "node:fs";
import pathModule from "node:path";
import { describe, expect, test } from "vitest";
import { fixturesPath } from "../shared/utils.js";
import { Board } from "../../src/game/board.js";
import { Move } from "../../src/game/move.js";
import { LAN } from "../../src/game/coords.js";

const perftPath = pathModule.join(fixturesPath, "perft.json");

interface TestSuiteCase {
    fen: string,
    nodes: Record<string, number>
}

describe("perft", () => {
    const MAX_NODES = 0;
    const testSuite: TestSuiteCase[] = JSON.parse(fs.readFileSync(perftPath).toString());

    for (const { fen, nodes } of testSuite){
        for (const depthStr of Object.keys(nodes)){
            const depth = parseInt(depthStr);
            const expected = nodes[depthStr]!;

            // for speed purposes
            const run = expected > MAX_NODES ? test.skip : test;

            run(`perft fen=${fen} depth=${depth} expectedNodes=${expected}`,
                { timeout: 30000 },
                () => {
                    const pv: LAN[] = [];
                    const b = new Board();
                    b.loadFEN(fen);
            
                    // we'll be comparing this FEN to avoid any slight
                    // formatting changes like adding/removing extra spaces.
                    const startFEN = b.getFEN();

                    const actual = countMoves(depth, b, pv)[0];

                    // ensure we're back where we started
                    expect(b.getFEN()).toBe(startFEN);

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
        const startFEN = board.getFEN();
        board.makeMove(m);
        pv.push(m.lan);

        const res = countMoves(depth - 1, board, pv, m);
        for (let i = 0; i < 4; i++)
            counter[i]! += res[i]!;

        if (!prevMove)
            console.log(m.lan, res[0]);

        board.unmakeMove(m);
        const endFEN = board.getFEN();
        if (startFEN != endFEN){
            throw new Error(`startFEN does not match with endFEN, PV: ${pv.join(" ")}`);
        }
        pv.pop();
    }

    return counter;
}

