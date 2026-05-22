import path from "node:path";
import fs from "node:fs";
import { readJSONFile, gameFixturesAmt, fixturesPath } from "./utils";
import { PgnToken } from "../../src/pgn";
import { Pgn } from "../../src/pgn/parse/types";

export interface TestCase {
    tokens: PgnToken[];
    pgn: string;
    pgnObj: Pgn;
    baseFileName: string;
}

export function fetchTestCases(): { cases: TestCase[], pgnDb: string } {
    const cases: TestCase[] = [];
    let pgnDb: string = "";
    for (let i = 1; i <= gameFixturesAmt; i++){
        const base: string = `game-${i}`;
        const pgnPath = path.join(fixturesPath, `${base}.pgn`);
        const pgn: string = fs.readFileSync(pgnPath).toString();

        const tokensPath = path.join(fixturesPath, `${base}-tokens.json`);
        const tokens: PgnToken[] = readJSONFile(tokensPath);

        const pgnObjPath = path.join(fixturesPath, `${base}-pgn.json`);
        const pgnObj: Pgn = readJSONFile(pgnObjPath);
        cases.push({
            tokens,
            pgn,
            pgnObj,
            baseFileName: base,
        });
    }

    pgnDb = "";
    for (const { pgn } of cases)
        pgnDb += pgn + "\n";

    return { cases, pgnDb };
}
