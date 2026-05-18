import { AbstractReader } from "../read/abstract-reader.js";
import { PgnMovetextToken, DOT, DASH, ASTERISK, ONE, TWO, FORWARD_SLASH, LEFT_PARENTHESIS, RIGHT_PARENTHESIS, LEFT_BRACE, NON_MOVE_CHARACTERS, SAN_GLYPHS, DOLLAR_SIGN } from "./types.js";
import { isNumber, isWhitespace } from "../read/utils.js";
import { handleNumber } from "./number.js";
import { handleComment } from "./comment.js";
import { handleSanGlyph } from "./san-glyph.js";
import { handleNag } from "./nag.js";

export function handleMovetext(reader: AbstractReader): PgnMovetextToken {
    // asterisk indicates ongoing or incomplete game
    if (reader.match(ASTERISK)){
        return {
            type: "result",
            value: "*"
        };
    }

    // handle variations
    if (reader.match(LEFT_PARENTHESIS)){
        const movetextTokens: PgnMovetextToken[] = [];
        while (!reader.isAtEnd() && reader.get() != RIGHT_PARENTHESIS){
            const v: number = reader.get();
            if (isWhitespace(v)){
                reader.advance();
            }else if (v == LEFT_BRACE){
                movetextTokens.push(handleComment(reader));
            }else if (SAN_GLYPHS.has(v)){
                movetextTokens.push(handleSanGlyph(reader));
            }else if (v == DOLLAR_SIGN){
                movetextTokens.push(handleNag(reader));
            }else{
                movetextTokens.push(handleMovetext(reader));
            }
        }
        // skip right parenthesis
        reader.advance();
        return {
            type: "variation",
            movetext: movetextTokens
        };
    }
    
    reader.copyStart();
    if (isNumber(reader.get())){
        const firstNum = handleNumber(reader);
        reader.skipWhitespace();
        if (reader.match(DOT)){
            reader.copyReject();
            // move number
            let dotsAmt = 1;
            while (reader.match(DOT))
                dotsAmt++;
            return {
                type: "move num",
                num: firstNum,
                threeDots: dotsAmt >= 3
            };
        }else if (reader.match(FORWARD_SLASH)){
            // 1/2-1/2 result
            for (const symbol of [ TWO, DASH, ONE, FORWARD_SLASH, TWO ]){
                reader.skipWhitespace();
                if (!reader.match(symbol)){
                    const res: string = reader.copyEnd();
                    throw new Error(`expected 1/2-1/2 but got ${res}`);
                }
            }
            return {
                type: "result",
                value: "1/2-1/2"
            };
        }else if (reader.match(DASH)){
            reader.copyReject();
            const secondNum = handleNumber(reader);
            return {
                type: "result",
                value: `${firstNum}-${secondNum}`
            };
        }else{
            reader.advance();
            const res: string = reader.copyEnd();
            throw new Error(
                `handleMovetext: last symbol unrecognized in "${res}"`
            );
        }
    }

    // else...

    // scan until whitespace
    while (!reader.isAtEnd() && !NON_MOVE_CHARACTERS.has(reader.get()))
        reader.advance();

    const move: string = reader.copyEnd();
    return {
        type: "move",
        content: move
    };
}
