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

    test("able to get, peek, and detect end", async () => {
        const a = "a".charCodeAt(0);
        for (let i = 0; i < 26; i++){
            expect(reader.get()).toBe(a + i);
            expect(reader.peek()).toBe(i < 25 ? a + i + 1 : 0);
            expect(reader.peekNext()).toBe(i < 24 ? a + i + 2: 0);
            reader.advance();
        }
        expect(reader.isAtEnd()).toBeTruthy();
    });

    test("matches and copies correctly", async () => {
        const a = "a".charCodeAt(0);
        expect(reader.match(a)).toBeTruthy();
        expect(reader.match(a)).toBeFalsy();

        reader.copyStart();
        while (!reader.isAtEnd())
            reader.advance();

        const content: string = reader.copyEnd().join("");
        expect(content).toBe("bcdefghijklmnopqrstuvwxyz");
    });
});
