import { testReader } from "./abstract-reader";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";

testBufferedReader(2);
testBufferedReader(3);
testBufferedReader(4);

function testBufferedReader(chunkSize: number): void {
    testReader(
        `BufferedReader chunkSize ${chunkSize}`,
        async (pathToFile: string) => await createBufferedReader(pathToFile, 2),
    );
}

async function createBufferedReader(
    pathToFile: string,
    chunkSize: number
): Promise<BufferedReader> {
    const reader = new BufferedReader(pathToFile, chunkSize);
    await reader.open();
    return reader;
}
