import { performance } from "node:perf_hooks";
import path from "node:path";
import { PgnSplitter } from "../src/pgn/parse/pgn-splitter.js";
import { BufferedReader } from "../src/pgn/read/buffered-reader.js";
import { fixturesPath } from "../tests/shared/utils.js";
import { Pgn } from "../src/pgn/parse/types.js";

const pathToPgn = path.join(fixturesPath, "large.pgn");

const start = performance.now();

const reader = new BufferedReader(pathToPgn, 1024 * 1024);
await reader.open();
const splitter = new PgnSplitter(
    reader,
);

const wins = { white: 0, draws: 0, black: 0 };
let pgn: Pgn | undefined;
while ((pgn = await splitter.nextPgn())){
    if (pgn.result === "1-0")
        wins.white++;
    else if (pgn.result === "1/2-1/2")
        wins.draws++;
    else if (pgn.result === "0-1")
        wins.black++;
    if (reader.getPartCount() !== 0){
        console.error("Reader part stack did not clear after parsing Pgn: ", pgn);
        break;
    }
}

const end = performance.now();
const elapsed = end - start;

const gameCount = wins.white + wins.draws + wins.black;
console.log(`Time: ${elapsed.toFixed(2)}ms`);
console.log(`Games parsed: ${gameCount}`);
console.log(`Games per second: ${(1000 * gameCount / elapsed).toFixed(2)}`);
console.log(`White | Draws | Black: ${wins.white} | ${wins.draws} | ${wins.black}`);
