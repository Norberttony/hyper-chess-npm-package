import path from "node:path";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";

const fixturesPath = path.join(".", "tests", "fixtures");

describe("BufferedReader", () => {
    const pathToFile = path.join(fixturesPath, "test.txt");
    let reader: BufferedReader;

    beforeEach(async () => {
        reader = new BufferedReader(pathToFile, 2);
        await reader.open();
    });
    afterEach(() => reader.close());

    test("reads chunk by chunk", async () => {
        const a = "a".charCodeAt(0);
        for (let i = 0; i < 26; i += 2){
            expect(await reader.read()).toEqual(
                Buffer.from([ a + i, a + i + 1 ])
            );
            expect(reader.getPosition()).toBe(i + 2);
        }
        expect(await reader.read()).toEqual(Buffer.from([]));
    });

    test("reads from position", async () => {
        const a = "a".charCodeAt(0);
        const offset = 4;
        reader.setPosition(offset);
        expect(await reader.read()).toEqual(
            Buffer.from([ a + offset, a + offset + 1 ])
        );
    });
});
