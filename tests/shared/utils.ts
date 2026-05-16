import path from "node:path";
import fs from "node:fs";

export const fixturesPath = path.join(process.cwd(), "tests", "fixtures");
export const gameFixturesAmt = 4;

export function readJSONFile(pathToFile: string): any {
    return JSON.parse(fs.readFileSync(pathToFile).toString());
}
