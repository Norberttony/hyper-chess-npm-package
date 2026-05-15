import { testReader } from "./abstract-reader";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";

testReader("BufferedReader", (pathToFile: string) => {
    return new Promise<BufferedReader>(async (res, _) => {
        const reader = new BufferedReader(pathToFile, 2);
        await reader.open();
        res(reader);
    });
});
