import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnMovetextToken } from "./types.js";
import { isNumber, isWhitespace } from "../read/utils.js";
import { handleNumber } from "./number.js";
import { handleComment } from "./comment.js";
import { handleSanGlyph } from "./san-glyph.js";
import { handleNag } from "./nag.js";
import * as T from "./tokens.js";
import { skipWhitespace } from "./utils.js";

export async function handleMovetext(reader: AbstractReader): Promise<PgnMovetextToken> {
    // asterisk indicates ongoing or incomplete game
    if (reader.match(T.ASTERISK)){
        return {
            type: "result",
            value: "*"
        };
    }

    // handle variations
    if (reader.match(T.LEFT_PARENTHESIS)){
        const movetextTokens: PgnMovetextToken[] = [];
        while (!reader.isAtEnd() && reader.get() != T.RIGHT_PARENTHESIS){
            const v: number = reader.get();
            if (isWhitespace(v)){
                reader.advance();
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }else if (v == T.LEFT_BRACE){
                movetextTokens.push(await handleComment(reader));
            }else if (T.SAN_GLYPHS.has(v)){
                movetextTokens.push(await handleSanGlyph(reader));
            }else if (v == T.DOLLAR_SIGN){
                movetextTokens.push(await handleNag(reader));
            }else{
                movetextTokens.push(await handleMovetext(reader));
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
        const firstNum = await handleNumber(reader);
        const hasWhitespace = isWhitespace(reader.get());

        // inlined skipWhitespace for speed
        if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        while (isWhitespace(reader.get())){
            reader.advance();
            if (!reader.isDataAvailable(4)) await reader.getDataPromise();
        }

        if (reader.match(T.DOT)){
            reader.copyReject();
            // move number
            let dotsAmt = 1;
            while (reader.match(T.DOT)){
                dotsAmt++;
                if (!reader.isDataAvailable(4)) await reader.getDataPromise();
            }
            return {
                type: "move num",
                num: firstNum,
                threeDots: dotsAmt >= 3
            };
        }else if (reader.match(T.FORWARD_SLASH)){
            // 1/2-1/2 result, match the remaining symbols
            const rest = [ T.TWO, T.DASH, T.ONE, T.FORWARD_SLASH, T.TWO ];
            for (const symbol of rest){
                await skipWhitespace(reader);
                if (!reader.match(symbol)){
                    const res: string = reader.copyEnd();
                    return {
                        type: "error",
                        partial: {
                            type: "result",
                            value: res,
                        },
                        errors: [{
                            msg: `Expected 1/2-1/2 but got ${res}`,
                            context: reader.getContext(),
                        }],
                    };
                }
            }
            reader.copyReject();
            return {
                type: "result",
                value: "1/2-1/2"
            };
        }else if (reader.match(T.DASH)){
            reader.copyReject();
            await skipWhitespace(reader);
            const secondNum = await handleNumber(reader);
            return {
                type: "result",
                value: `${firstNum}-${secondNum}`
            };
        }else{
            if (hasWhitespace){
                // indicates that this is likely a move number
                reader.copyReject();
                return {
                    type: "error",
                    partial: {
                        type: "move num",
                        num: firstNum,
                    },
                    errors: [{
                        msg: `Move number with no dot`,
                        context: reader.getContext(),
                    }],
                };
            }else{
                // interpret as a move, handle at the end of the function.
            }
        }
    }

    // else...

    // scan until whitespace
    while (!reader.isAtEnd() && !T.NON_MOVE_CHARACTERS.has(reader.get())){
        reader.advance();
        if (!reader.isDataAvailable(4)) await reader.getDataPromise();
    }

    return {
        type: "move",
        content: reader.copyEnd(),
    };
}
