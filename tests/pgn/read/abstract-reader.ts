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
    
            const content: string = reader.copyEnd();
            expect(content).toBe("bcdefghijklmnopqrstuvwxyz");
        });
    });
}
