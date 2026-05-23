import path from "node:path";
import { AbstractReader } from "../../../src/pgn/read/abstract-reader";
import { describe, expect, test, beforeEach } from "vitest";
import { fixturesPath } from "../../shared/utils";

export type AbstractReaderFactory = (filePath: string) => Promise<AbstractReader>;

export function testReader(name: string, factory: AbstractReaderFactory){
    describe(name, () => {
        const pathToFile = path.join(fixturesPath, "test.txt");
        let reader: AbstractReader;

        beforeEach(async () => {
            reader = await factory(pathToFile);
        });

        test("able to get, peek, and detect end", () => {
            const a = "a".charCodeAt(0);
            for (let i = 0; i < 26; i++){
                expect(reader.get()).toBe(a + i);
                expect(reader.peek()).toBe(i < 25 ? a + i + 1 : 0);
                expect(reader.peekNext()).toBe(i < 24 ? a + i + 2: 0);
                reader.advance();
            }
            expect(reader.isAtEnd()).toBeTruthy();
        });

        test("matches correctly", () => {
            const a = "a".charCodeAt(0);
            const b = "b".charCodeAt(0);
            expect(reader.match(a)).toBeTruthy();
            expect(reader.match(a)).toBeFalsy();
            expect(reader.match(b)).toBeTruthy();
        });

        test("copies correctly", () => {
            reader.advance();
            reader.advance();

            reader.copyStart();
            const y = "y".charCodeAt(0);
            while (reader.get() != y)
                reader.advance();

            const content: string = reader.copyEnd();
            expect(content).toBe("cdefghijklmnopqrstuvwx");
        });

        test("can copy multiple things at once", () => {
            reader.advance();

            reader.copyStart();
            const i = "i".charCodeAt(0);
            const q = "p".charCodeAt(0);
            let iToQ: string | undefined;
            const z = "z".charCodeAt(0);
            while (reader.get() != z){
                if (reader.get() == i)
                    reader.copyStart();
                else if (reader.get() == q)
                    iToQ = reader.copyEnd();
                reader.advance();
            }

            const bToZ: string = reader.copyEnd();
            // this must be an odd number of characters to properly test
            // BufferedReader's implementation.
            expect(iToQ).toBe("ijklmno");
            expect(bToZ).toBe("bcdefghijklmnopqrstuvwxy");
        });
    });
}
