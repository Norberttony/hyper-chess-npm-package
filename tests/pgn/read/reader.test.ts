import fs from "node:fs";
import { testReader } from "./abstract-reader";
import { Reader } from "../../../src/pgn/read/reader";

testReader("Reader", (pathToFile: string) => {
    return new Promise<Reader>(async (res, _) => {
        const content = (await fs.promises.readFile(pathToFile)).toString();
        const reader = new Reader(content);
        res(reader);
    });
});
