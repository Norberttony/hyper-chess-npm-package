import { expect, describe, test, afterAll, beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { AbstractReader } from "../../../src/pgn/read/abstract-reader";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";
import { handleNumber } from "../../../src/pgn/tokenize/number";
import { handleNag } from "../../../src/pgn/tokenize/nag";
import { handleTag } from "../../../src/pgn/tokenize/tag";
import { handleSanGlyph } from "../../../src/pgn/tokenize/san-glyph";
import { handleCommentTag } from "../../../src/pgn/tokenize/comment-tag";
import { handleComment } from "../../../src/pgn/tokenize/comment";
import { handleMovetext } from "../../../src/pgn/tokenize/movetext";
import { skipWhitespace } from "../../../src/pgn/tokenize/utils";

const TESTS_TMP_PATH = path.resolve(".", "tests", "_tmp");

describe("Integration Test Tokens and BufferedReader", () => {
    beforeAll(() => fs.mkdirSync(TESTS_TMP_PATH, { recursive: true }));

    testTokenUtilityFunction(handleNumber, "12345678", 12345678, 8);
    testTokenUtilityFunction(handleNag, "$12345678", { type: "nag", id: 12345678 }, 8);
    testTokenUtilityFunction(handleTag, "[Event \"Example\"]", { type: "tag", header: "Event", value: "Example" }, 8);
    testTokenUtilityFunction(handleSanGlyph, "!?!?!?!?", { type: "san glyph", content: "!?!?!?!?" }, 8);
    testTokenUtilityFunction(handleCommentTag, "[%eval -3.55]", { name: "eval", value: "-3.55" }, 8);
    testTokenUtilityFunction(handleComment, "{ Some kind of comment }", { type: "comment", tags: [], content: " Some kind of comment " }, 8);
    // move text handles a couple tokens via branching, so they are handled individually here.
    // draw result
    testTokenUtilityFunction(handleMovetext, "1 /  2   -    1     /      2", { type: "result", value: "1/2-1/2" }, 8);
    // win result
    testTokenUtilityFunction(handleMovetext, "1 - 0", { type: "result", value: "1-0" }, 8);
    // move number
    testTokenUtilityFunction(handleMovetext, "1...", { type: "move num", num: 1, threeDots: true }, 8);
    // move
    testTokenUtilityFunction(handleMovetext, "abcdefghijklmnopqrstuvwxyz", { type: "move", content: "abcdefghijklmnopqrstuvwxyz" }, 8);
    // variation
    testTokenUtilityFunction(handleMovetext, "(abcdefghi)", { type: "variation", movetext: [ { type: "move", content: "abcdefghi" } ] }, 8);

    afterAll(() => fs.rmSync(TESTS_TMP_PATH, { recursive: true, force: true }));
});

class BufferedReaderFacade extends BufferedReader {
    constructor(uuid: string, str: string){
        const fileName = uuid;
        const filePath = path.join(TESTS_TMP_PATH, fileName);
        fs.writeFileSync(filePath, str);
        super(filePath, 8);
    }
}

export function testTokenUtilityFunction<T>(
    func: (r: AbstractReader) => Promise<T>,
    input: string,
    val: T,
    offsets: number,
): void {
    describe(`${func.name}`, () => {
        for (let o = 0; o < offsets; o++){
            test(`offset ${o}`, async () => {
                const offset: string = " ".repeat(o);
                const reader = new BufferedReaderFacade(
                    `${func.name}${o}`,
                    `${offset}${input}`,
                );
                await reader.open();
                
                // skip whitespace on the reader because tokens assume that the
                // starting character is valid
                await skipWhitespace(reader);
                expect(await func(reader)).toEqual(val);
            });
        }
    });
}
