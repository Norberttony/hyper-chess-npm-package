import { performance } from "node:perf_hooks";
import { perft } from "../src/game/perft.js";
import { Board } from "../src/game/board.js";
import rawTests from "../tests/fixtures/perft.json" with { type: "json" };

interface PerftTestCase {
    fen: string;
    nodes: Record<string, number>;
}

const tests = rawTests as PerftTestCase[];
const board = new Board();

const start = performance.now();

const MAX_NODES = 10000;
let totalNodes = 0;
for (const { fen, nodes } of tests){
    for (const depthStr of Object.keys(nodes)){
        const depth = Number(depthStr);
        const expected: number = nodes[depthStr] as number;
        if (expected > MAX_NODES)
            continue;

        board.loadFen(fen);
        totalNodes += perft(depth, board);
    }
}

const end = performance.now();
const elapsed = end - start;

console.log(`Time: ${elapsed.toFixed(2)}ms`);
console.log(`Nodes: ${totalNodes}`);
console.log(`Nodes per second: ${(totalNodes / (elapsed / 1000)).toFixed(2)}`);
