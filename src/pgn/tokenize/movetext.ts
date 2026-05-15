import { AbstractReader } from "../read/abstract-reader.js";
import { PgnMoveToken, PgnMoveNumToken, PgnResultToken, DOT, DASH, ASTERISK, ONE, TWO, FORWARD_SLASH } from "./types.js";
import { isNumber, isWhitespace } from "../read/utils.js";
import { handleNumber } from "./number.js";

export function handleMovetext(
    reader: AbstractReader
): PgnMoveToken | PgnMoveNumToken | PgnResultToken {

    // asterisk indicates ongoing or incomplete game
    if (reader.match(ASTERISK)){
        return {
            type: "result",
            value: "*"
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
    while (!reader.isAtEnd() && !isWhitespace(reader.get()))
        reader.advance();

    const move: string = reader.copyEnd();
    return {
        type: "move",
        content: move
    };
}
