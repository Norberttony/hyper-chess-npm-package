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
        test("tokenizes tags", () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event"][Round "1.1"]\n[Date "2025.12.03"]`
            );
            expectNextToken(tokenizer, tagToken("Event", "Some Event"));
            expectNextToken(tokenizer, tagToken("Round", "1.1"));
            expectNextToken(tokenizer, tagToken("Date", "2025.12.03"));
        });

        test("escapes strings in tags", () => {
            const tokenizer = createTokenizer(`[Event "\\"Tournament\\""]`);
            expectNextToken(tokenizer, tagToken("Event", "\"Tournament\""));
        });

        test("catches unclosed tag", () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event"\n[Round "1.1"]`
            );
            expectNextError(tokenizer, {
                type: "tag",
                header: "Event",
                value: "Some Event"
            });
            expectNextToken(tokenizer, tagToken("Round", "1.1"));
        });

        test("catches headers with spaces", () => {
            const tokenizer = createTokenizer(
                `[Event Header "Some Event"]\n[Round "1.1"]`
            );
            expectNextError(tokenizer, {
                type: "tag",
                header: "Event Header",
                value: "Some Event",
            });
            expectNextToken(tokenizer, tagToken("Round", "1.1"));
        });

        test("does not consume movetext as tag after newline", () => {
            const tokenizer = createTokenizer(
                `[Event "Some Event\n1. d4`
            );
            expectNextError(tokenizer, {
                type: "tag",
                header: "Event",
                value: "Some Event"
            });
        });
    });

    describe("Moves and Move Numbers", () => {
        test("tokenizes moves", () => {
            const tokenizer = createTokenizer(`d4 d5 c4`);
            expectNextToken(tokenizer, moveToken("d4"));
            expectNextToken(tokenizer, moveToken("d5"));
            expectNextToken(tokenizer, moveToken("c4"));
        });

        test("tokenizes move numbers", () => {
            const tokenizer = createTokenizer("1. d4 d5 2. c4 2... Bf4");
            expectNextToken(tokenizer, moveNum(1));
            expectNextToken(tokenizer, moveToken("d4"));
            expectNextToken(tokenizer, moveToken("d5"));
            expectNextToken(tokenizer, moveNum(2));
            expectNextToken(tokenizer, moveToken("c4"));
            expectNextToken(tokenizer, moveNum(2, true));
            expectNextToken(tokenizer, moveToken("Bf4"));
        });

        test("ignores whitespace between move numbers and moves", () => {
            const tokenizer = createTokenizer("1.d4 d5");
            expectNextToken(tokenizer, moveNum(1));
            expectNextToken(tokenizer, moveToken("d4"));
            expectNextToken(tokenizer, moveToken("d5"));
        });

        test("catches move numbers with no dots", () => {
            const tokenizer = createTokenizer("1 d4 d5");
            expectNextError(tokenizer, { type: "move num", num: 1 });
            expectNextToken(tokenizer, moveToken("d4"));
            expectNextToken(tokenizer, moveToken("d5"));
        });
    });

    describe("Result Markers", () => {
        test("tokenizes result markers", () => {
            const tokenizer = createTokenizer("1-0 0-1 1/2-1/2 *");
            expectNextToken(tokenizer, resultToken("1-0"));
            expectNextToken(tokenizer, resultToken("0-1"));
            expectNextToken(tokenizer, resultToken("1/2-1/2"));
            expectNextToken(tokenizer, resultToken("*"));
        });

        test("ignores whitespace in result markers", () => {
            const tokenizer = createTokenizer("1 - 0 0 - 1 1 / 2 - 1 / 2");
            expectNextToken(tokenizer, resultToken("1-0"));
            expectNextToken(tokenizer, resultToken("0-1"));
            expectNextToken(tokenizer, resultToken("1/2-1/2"));
        });
    });

    describe("Glyphs", () => {
        test("tokenizes san glyphs", () => {
            const tokenizer = createTokenizer("! !! ? ?? !? ?!");
            expectNextToken(tokenizer, sanGlyph("!"));
            expectNextToken(tokenizer, sanGlyph("!!"));
            expectNextToken(tokenizer, sanGlyph("?"));
            expectNextToken(tokenizer, sanGlyph("??"));
            expectNextToken(tokenizer, sanGlyph("!?"));
            expectNextToken(tokenizer, sanGlyph("?!"));
        });

        test("tokenizes nags", () => {
            const tokenizer = createTokenizer("$1 $10 $255 $9132984");
            expectNextToken(tokenizer, nag(1));
            expectNextToken(tokenizer, nag(10));
            expectNextToken(tokenizer, nag(255));
            expectNextToken(tokenizer, nag(9132984));
        });
    });

    describe("Comments", () => {
        test("tokenizes comments", () => {
            const tokenizer = createTokenizer("{ Comment }{ Next }");
            expectNextToken(tokenizer, comment(" Comment "));
            expectNextToken(tokenizer, comment(" Next "));
        });

        test("tokenizes comment tags at start or end or middle", () => {
            const tokenizer = createTokenizer(
                "{[%tag val] Comment }{ Comment [%tag val]}{ Comm[%tag val]ent }"
            );
            // it's the same token every time
            const token = comment(" Comment ", [ commentTag("tag", "val") ]);
            expectNextToken(tokenizer, token);
            expectNextToken(tokenizer, token);
            expectNextToken(tokenizer, token);
        });

        test("tokenizes multiple comment tags", () => {
            const tokenizer = createTokenizer("{[%tag val][%tag2 val2] Comment }");
            expectNextToken(
                tokenizer,
                comment(" Comment ", [
                    commentTag("tag", "val"),
                    commentTag("tag2", "val2")
                ])
            );
        });

        test("tokenizes one-line comments", () => {
            const tokenizer = createTokenizer("; This is a comment\n; Another\nd4");
            expectNextToken(tokenizer, comment(" This is a comment"));
            expectNextToken(tokenizer, comment(" Another"));
            expectNextToken(tokenizer, moveToken("d4"));
        });

        test("handles non-ASCII characters in comments", () => {
            const tokenizer = createTokenizer("{ é ñ Ω Ж 中 😀 ✓ }");
            expectNextToken(tokenizer, comment(" é ñ Ω Ж 中 😀 ✓ "));
        });
    });

    describe("Variations", () => {
        test("tokenizes variations", () => {
            const tokenizer = createTokenizer(
                "1. d4 (1... e4) d5"
            );
            expectNextToken(tokenizer, moveNum(1));
            expectNextToken(tokenizer, moveToken("d4"));
            expectNextToken(
                tokenizer,
                variation([ moveNum(1, true), moveToken("e4") ])
            );
            expectNextToken(tokenizer, moveToken("d5"));
        });
    });

    // tests to see if having tokens follow each other consecutively (with extra
    // whitespace OR with no whitespace) causes any problems.
    describe("Boundary Conditions", () => {
        test("moves and variations", () => {
            const tokenizer = createTokenizer("e4(d4)");
            expectNextToken(tokenizer, moveToken("e4"));
            expectNextToken(tokenizer, variation([ moveToken("d4") ]));
        });

        test("moves and comments", () => {
            const tokenizer = createTokenizer("e4{Comment}");
            expectNextToken(tokenizer, moveToken("e4"));
            expectNextToken(tokenizer, comment("Comment"));
        });

        test("moves and nags", () => {
            const tokenizer = createTokenizer("e4$99");
            expectNextToken(tokenizer, moveToken("e4"));
            expectNextToken(tokenizer, nag(99));
        });

        test("moves and san glyphs", () => {
            const tokenizer = createTokenizer("e4 !! d5?!");
            expectNextToken(tokenizer, moveToken("e4"));
            expectNextToken(tokenizer, sanGlyph("!!"));
            expectNextToken(tokenizer, moveToken("d5"));
            expectNextToken(tokenizer, sanGlyph("?!"));
        });

        test("comments and variations", () => {
            const tokenizer = createTokenizer("{Comment}( 3... Nd6 )");
            expectNextToken(tokenizer, comment("Comment"));
            expectNextToken(tokenizer,
                variation([ moveNum(3, true), moveToken("Nd6") ])
            );
        });

        test("comments in variations", () => {
            const tokenizer = createTokenizer("({Comment})");
            expectNextToken(tokenizer, variation([ comment("Comment") ]));
        });
        
        test("variations and variations", () => {
            const tokenizer = createTokenizer("(e4)(d4)");
            expectNextToken(tokenizer, variation([ moveToken("e4") ]));
            expectNextToken(tokenizer, variation([ moveToken("d4") ]));
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
            while (token = tokenizer.nextToken())
                tokens.push(token);

            expect(tokens).toEqual(actualTokens);
        });
    }
});

function createTokenizer(pgnStr: string): PgnTokenizer {
    const reader = new Reader(pgnStr);
    return new PgnTokenizer(reader);
}

function expectNextToken(tokenizer: PgnTokenizer, token: PgnToken): void {
    expect(tokenizer.nextToken()).toEqual(token);
}

function expectNextError(tokenizer: PgnTokenizer, partial: PartialToken): void {
    const token: PgnToken = tokenizer.nextToken()!;
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
