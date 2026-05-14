/*
import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PgnDatabase } from "../../src/pgn/index";

const fixturesPath = path.join(".", "tests", "fixtures");

describe("PGN splits", () => {
    // read in the individual PGNs
    const pgnGames = 5;
    const pgns: string[] = [];
    for (let i = 1; i <= pgnGames; i++){
        const pathToFile = path.join(fixturesPath, `game-${i}.pgn`);
        const pgn = fs.readFileSync(pathToFile).toString().trim();
        pgns.push(pgn);
    }

    // test splitting each individual file
    for (let i = 1; i <= pgnGames; i++){
        test(`splitPGNs game ${i}`, () => {
            expect(splitPGNs(pgns[i - 1])[0]!).toBe(pgns[i - 1]);
        });
    }

    // test splitting a concatenated file
    const concatenated = pgns.join("\n\n");
    test("splitPGNs all games", () => {
        expect(splitPGNs(concatenated)).toEqual(pgns);
    });
});
*/
