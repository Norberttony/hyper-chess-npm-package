import path from "node:path";
import { AbstractReader } from "../../../src/pgn/read/abstract-reader";
import { describe, expect, test, beforeEach } from "vitest";
import { fixturesPath } from "../../shared/utils";

export type AbstractReaderFactory = (filePath: string) => Promise<AbstractReader>;

export function testReader(name: string, factory: AbstractReaderFactory){
    describe(name, () => {
        const pathToFile = path.join(fixturesPath, "test.txt");
        const pathToMultilineFile = path.join(fixturesPath, "multiline-reader-test.txt");
        let reader: AbstractReader;

        beforeEach(async () => {
            reader = await factory(pathToFile);
        });

        test("able to get, peek, and detect end", async () => {
            const a = "a".charCodeAt(0);
            for (let i = 0; i < 26; i++){
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
                expect(reader.get()).toBe(a + i);
                expect(reader.peek()).toBe(i < 25 ? a + i + 1 : 0);
                expect(reader.peekNext()).toBe(i < 24 ? a + i + 2: 0);
                reader.advance();
            }
            expect(reader.isAtEnd()).toBeTruthy();
        });

        test("matches correctly", async () => {
            const a = "a".charCodeAt(0);
            const b = "b".charCodeAt(0);
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            expect(reader.match(a)).toBeTruthy();
            expect(reader.match(a)).toBeFalsy();
            expect(reader.match(b)).toBeTruthy();
        });

        test("copies correctly", async () => {
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            reader.advance();
            reader.advance();

            reader.copyStart();
            const y = "y".charCodeAt(0);
            while (reader.get() != y){
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }

            const content: string = reader.copyEnd();
            expect(content).toBe("cdefghijklmnopqrstuvwx");
        });

        test("can pause and continue", async () => {
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            reader.advance();

            reader.copyStart();
            const e = "e".charCodeAt(0);
            const g = "g".charCodeAt(0);
            const j = "j".charCodeAt(0);
            const t = "t".charCodeAt(0);
            while (!reader.isAtEnd()){
                if (reader.get() == e)
                    reader.copyPause();
                else if (reader.get() == g)
                    reader.copyContinue();
                else if (reader.get() == j)
                    reader.copyPause();
                else if (reader.get() == t)
                    reader.copyContinue();
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }

            expect(reader.copyEnd()).toBe("bcdghituvwxyz");
        });

        test("can copy multiple things at once", async () => {
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            reader.advance();

            reader.copyStart();
            const i = "i".charCodeAt(0);
            const p = "p".charCodeAt(0);
            let iToQ: string | undefined;
            const z = "z".charCodeAt(0);
            while (reader.get() != z){
                if (reader.get() == i)
                    reader.copyStart();
                else if (reader.get() == p)
                    iToQ = reader.copyEnd();
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }

            const bToZ: string = reader.copyEnd();
            expect(iToQ).toBe("ijklmno");
            expect(bToZ).toBe("bcdefghijklmnopqrstuvwxy");
        });

        test("can pause one and copyStart another", async () => {
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            reader.advance();

            reader.copyStart();
            const i = "i".charCodeAt(0);
            const p = "p".charCodeAt(0);
            const z = "z".charCodeAt(0);
            let iToQ: string | undefined;
            while (reader.get() != z){
                if (reader.get() == i){
                    reader.copyPause();
                    reader.copyStart();
                }else if (reader.get() == p){
                    iToQ = reader.copyEnd();
                    reader.copyContinue();
                }
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }
            const bToHAndPToY = reader.copyEnd();

            expect(iToQ).toBe("ijklmno");
            expect(bToHAndPToY).toBe("bcdefghpqrstuvwxy");
        });

        test("can reject one and copyStart another", async () => {
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            reader.advance();

            reader.copyStart();
            const i = "i".charCodeAt(0);
            const z = "z".charCodeAt(0);
            while (reader.get() != z){
                if (reader.get() == i){
                    reader.copyPause();
                    reader.copyStart();
                }
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }
            reader.copyReject();
            const bToH = reader.copyEnd();

            expect(bToH).toBe("bcdefgh");
        });

        describe("Fetching Reader Context", () => {
            beforeEach(async () => {
                reader = await factory(pathToMultilineFile);
            });

            test("offset is updated", async () => {
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
                reader.advance();
                reader.advance();
                expect(reader.getContext()).toEqual({ line: 1, offset: 2 });
            });
            
            test("line is updated", async () => {
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
                reader.advance();
                reader.advance();
                reader.advance();
                expect(reader.getContext()).toEqual({ line: 2, offset: 0 });
            });
        });
    });
}
