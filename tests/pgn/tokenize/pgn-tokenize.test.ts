import path from "node:path";
import { describe, expect, test } from "vitest";
import { PgnTokenizer } from "../../../src/pgn/tokenize/pgn-tokenizer";
import { BufferedReader } from "../../../src/pgn/read/buffered-reader";
import { Reader } from "../../../src/pgn/read/reader";
import { CommentTag, PartialToken, PgnCommentToken, PgnErrorToken, PgnMoveNumToken, PgnMovetextToken, PgnMoveToken, PgnNagToken, PgnResultToken, PgnSanGlyphToken, PgnTagToken, PgnToken, PgnVariationToken } from "../../../src/pgn/tokenize/types";
import { fixturesPath, readJSONFile } from "../../shared/utils";
import { gameFixturesAmt } from "../../shared/utils";

describe("PgnTokenizer", () => {
    describe("Tags", () => {
        test("tokenizes tags", async () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event"][Round "1.1"]\n[Date "2025.12.03"]`
            );
            await expectNextToken(tokenizer, tagToken("Event", "Some Event"));
            await expectNextToken(tokenizer, tagToken("Round", "1.1"));
            await expectNextToken(tokenizer, tagToken("Date", "2025.12.03"));
        });

        test("escapes strings in tags", async () => {
            const tokenizer = createTokenizer(`[Event "\\"Tournament\\""]`);
            await expectNextToken(tokenizer, tagToken("Event", "\"Tournament\""));
        });

        test("catches unclosed tag", async () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event"\n[Round "1.1"]`
            );
            await expectNextError(tokenizer, {
                type: "tag",
                header: "Event",
                value: "Some Event"
            });
            await expectNextToken(tokenizer, tagToken("Round", "1.1"));
        });

        test("catches headers with spaces", async () => {
            const tokenizer = createTokenizer(
                `[Event Header "Some Event"]\n[Round "1.1"]`
            );
            await expectNextError(tokenizer, {
                type: "tag",
                header: "Event Header",
                value: "Some Event",
            });
            await expectNextToken(tokenizer, tagToken("Round", "1.1"));
        });

        test("does not consume movetext as tag after newline", async () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event\n1. d4`
            );
            await expectNextError(tokenizer, {
                type: "tag",
                header: "Event",
                value: "Some Event"
            });
        });
    });

    describe("Moves and Move Numbers", () => {
        test("tokenizes moves", async () => {
            const tokenizer = createTokenizer(`d4 d5 c4`);
            await expectNextToken(tokenizer, moveToken("d4"));
            await expectNextToken(tokenizer, moveToken("d5"));
            await expectNextToken(tokenizer, moveToken("c4"));
        });

        test("tokenizes move numbers", async () => {
            const tokenizer = createTokenizer("1. d4 d5 2. c4 2... Bf4");
            await expectNextToken(tokenizer, moveNum(1));
            await expectNextToken(tokenizer, moveToken("d4"));
            await expectNextToken(tokenizer, moveToken("d5"));
            await expectNextToken(tokenizer, moveNum(2));
            await expectNextToken(tokenizer, moveToken("c4"));
            await expectNextToken(tokenizer, moveNum(2, true));
            await expectNextToken(tokenizer, moveToken("Bf4"));
        });

        test("ignores whitespace between move numbers and moves", async () => {
            const tokenizer = createTokenizer("1.d4 d5");
            await expectNextToken(tokenizer, moveNum(1));
            await expectNextToken(tokenizer, moveToken("d4"));
            await expectNextToken(tokenizer, moveToken("d5"));
        });

        test("catches move numbers with no dots", async () => {
            const tokenizer = createTokenizer("1 d4 d5");
            await expectNextError(tokenizer, { type: "move num", num: 1 });
            await expectNextToken(tokenizer, moveToken("d4"));
            await expectNextToken(tokenizer, moveToken("d5"));
        });
    });

    describe("Result Markers", () => {
        test("tokenizes result markers", async () => {
            const tokenizer = createTokenizer("1-0 0-1 1/2-1/2 *");
            await expectNextToken(tokenizer, resultToken("1-0"));
            await expectNextToken(tokenizer, resultToken("0-1"));
            await expectNextToken(tokenizer, resultToken("1/2-1/2"));
            await expectNextToken(tokenizer, resultToken("*"));
        });

        test("ignores whitespace in result markers", async () => {
            const tokenizer = createTokenizer("1 - 0 0 - 1 1 / 2 - 1 / 2");
            await expectNextToken(tokenizer, resultToken("1-0"));
            await expectNextToken(tokenizer, resultToken("0-1"));
            await expectNextToken(tokenizer, resultToken("1/2-1/2"));
        });
    });

    describe("Glyphs", () => {
        test("tokenizes san glyphs", async () => {
            const tokenizer = createTokenizer("! !! ? ?? !? ?! + ++ #");
            await expectNextToken(tokenizer, sanGlyph("!"));
            await expectNextToken(tokenizer, sanGlyph("!!"));
            await expectNextToken(tokenizer, sanGlyph("?"));
            await expectNextToken(tokenizer, sanGlyph("??"));
            await expectNextToken(tokenizer, sanGlyph("!?"));
            await expectNextToken(tokenizer, sanGlyph("?!"));
            await expectNextToken(tokenizer, sanGlyph("+"));
            await expectNextToken(tokenizer, sanGlyph("++"));
            await expectNextToken(tokenizer, sanGlyph("#"));
        });

        test("tokenizes nags", async () => {
            const tokenizer = createTokenizer("$1 $10 $255 $9132984");
            await expectNextToken(tokenizer, nag(1));
            await expectNextToken(tokenizer, nag(10));
            await expectNextToken(tokenizer, nag(255));
            await expectNextToken(tokenizer, nag(9132984));
        });
    });

    describe("Comments", () => {
        test("tokenizes comments", async () => {
            const tokenizer = createTokenizer("{ Comment }{ Next }");
            await expectNextToken(tokenizer, comment(" Comment "));
            await expectNextToken(tokenizer, comment(" Next "));
        });

        test("tokenizes comment tags at start or end or middle", async () => {
            const tokenizer = createTokenizer(
                "{[%tag val] Comment }{ Comment [%tag val]}{ Comm[%tag val]ent }"
            );
            // it's the same token every time
            const token = comment(" Comment ", [ commentTag("tag", "val") ]);
            await expectNextToken(tokenizer, token);
            await expectNextToken(tokenizer, token);
            await expectNextToken(tokenizer, token);
        });

        test("tokenizes multiple comment tags", async () => {
            const tokenizer = createTokenizer("{[%tag val][%tag2 val2] Comment }");
            await expectNextToken(
                tokenizer,
                comment(" Comment ", [
                    commentTag("tag", "val"),
                    commentTag("tag2", "val2")
                ])
            );
        });

        test("tokenizes one-line comments", async () => {
            const tokenizer = createTokenizer("; This is a comment\n; Another\nd4");
            await expectNextToken(tokenizer, comment(" This is a comment"));
            await expectNextToken(tokenizer, comment(" Another"));
            await expectNextToken(tokenizer, moveToken("d4"));
        });

        test("handles non-ASCII characters in comments", async () => {
            const tokenizer = createTokenizer("{ é ñ Ω Ж 中 😀 ✓ }");
            await expectNextToken(tokenizer, comment(" é ñ Ω Ж 中 😀 ✓ "));
        });
    });

    describe("Variations", () => {
        test("tokenizes variations", async () => {
            const tokenizer = createTokenizer(
                "1. d4 (1... e4) d5"
            );
            await expectNextToken(tokenizer, moveNum(1));
            await expectNextToken(tokenizer, moveToken("d4"));
            await expectNextToken(
                tokenizer,
                variation([ moveNum(1, true), moveToken("e4") ])
            );
            await expectNextToken(tokenizer, moveToken("d5"));
        });
    });

    // tests to see if having tokens follow each other consecutively (with extra
    // whitespace OR with no whitespace) causes any problems.
    describe("Boundary Conditions", () => {
        test("moves and variations", async () => {
            const tokenizer = createTokenizer("e4(d4)");
            await expectNextToken(tokenizer, moveToken("e4"));
            await expectNextToken(tokenizer, variation([ moveToken("d4") ]));
        });

        test("moves and comments", async () => {
            const tokenizer = createTokenizer("e4{Comment}");
            await expectNextToken(tokenizer, moveToken("e4"));
            await expectNextToken(tokenizer, comment("Comment"));
        });

        test("moves and nags", async () => {
            const tokenizer = createTokenizer("e4$99");
            await expectNextToken(tokenizer, moveToken("e4"));
            await expectNextToken(tokenizer, nag(99));
        });

        test("moves and san glyphs", async () => {
            const tokenizer = createTokenizer("e4 !! d5?!");
            await expectNextToken(tokenizer, moveToken("e4"));
            await expectNextToken(tokenizer, sanGlyph("!!"));
            await expectNextToken(tokenizer, moveToken("d5"));
            await expectNextToken(tokenizer, sanGlyph("?!"));
        });

        test("comments and variations", async () => {
            const tokenizer = createTokenizer("{Comment}( 3... Nd6 )");
            await expectNextToken(tokenizer, comment("Comment"));
            await expectNextToken(tokenizer,
                variation([ moveNum(3, true), moveToken("Nd6") ])
            );
        });

        test("comments in variations", async () => {
            const tokenizer = createTokenizer("({Comment})");
            await expectNextToken(tokenizer, variation([ comment("Comment") ]));
        });
        
        test("variations and variations", async () => {
            const tokenizer = createTokenizer("(e4)(d4)");
            await expectNextToken(tokenizer, variation([ moveToken("e4") ]));
            await expectNextToken(tokenizer, variation([ moveToken("d4") ]));
        });
    });

    for (let i = 1; i <= gameFixturesAmt; i++){
        const fileName = `game-${i}.pgn`;
        test(`fetches all tokens in ${fileName}`, async () => {
            const reader = new BufferedReader(
                path.join(fixturesPath, fileName),
                1024 * 1024
            );
            await reader.open();
            const tokenizer = new PgnTokenizer(reader);
            
            const actualTokens: PgnToken[] = readJSONFile(
                path.join(fixturesPath, `game-${i}-tokens.json`)
            );

            const tokens: PgnToken[] = [];
    
            let token: PgnToken | undefined;
            while (token = await tokenizer.nextToken())
                tokens.push(token);

            expect(tokens).toEqual(actualTokens);
        });
    }
});

function createTokenizer(pgnStr: string): PgnTokenizer {
    const reader = new Reader(pgnStr);
    return new PgnTokenizer(reader);
}

async function expectNextToken(tokenizer: PgnTokenizer, token: PgnToken): Promise<void> {
    expect(await tokenizer.nextToken()).toEqual(token);
}

async function expectNextError(tokenizer: PgnTokenizer, partial: PartialToken): Promise<void> {
    const token: PgnToken = (await tokenizer.nextToken())!;
    expect(token.type).toBe("error");
    expect((token as PgnErrorToken).partial).toEqual(partial);
}

function tagToken(header: string, value: string): PgnTagToken {
    return { type: "tag", header, value };
}

function moveToken(content: string): PgnMoveToken {
    return { type: "move", content }
}

function moveNum(
    num: number,
    threeDots: boolean = false
): PgnMoveNumToken {
    return { type: "move num", num, threeDots };
}

function resultToken(res: string): PgnResultToken {
    return { type: "result", value: res };
}

function sanGlyph(glyph: string): PgnSanGlyphToken {
    return { type: "san glyph", content: glyph };
}

function nag(id: number): PgnNagToken {
    return { type: "nag", id };
}

function comment(content: string, tags: CommentTag[] = []): PgnCommentToken {
    return { type: "comment", content, tags };
}

function commentTag(name: string, value: string): CommentTag {
    return { name, value };
}

function variation(tokens: PgnMovetextToken[]): PgnVariationToken {
    return { type: "variation", movetext: tokens };
}
