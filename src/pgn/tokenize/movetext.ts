import { BufferedReader } from "../read/buffered-reader.js";
import { PgnMoveToken, PgnMoveNumToken, PgnResultToken, DOT, DASH, ASTERISK } from "./types.js";
import { isNumber } from "../read/utils.js";
import { handleNumber, pgnNumberToString } from "./number.js";
import { handleMove } from "./move.js";

export async function handleMovetext(
    reader: BufferedReader
): Promise<PgnMoveToken | PgnMoveNumToken | PgnResultToken> {
    const firstByte: number = reader.getBuffer()[reader.getBufferPosition()]!;
    if (isNumber(firstByte)){
        const firstNum = await handleNumber(reader);
        const afterByte: number = reader.getBuffer()[reader.getBufferPosition()]!;
        if (afterByte == DASH){
            // this is a result
            reader.setBufferPosition(reader.getBufferPosition() + 1);
            const secondNum = await handleNumber(reader);
            return {
                type: "result",
                value: `${pgnNumberToString(firstNum)}-${pgnNumberToString(secondNum)}`
            };
        }else if (firstNum.type == "number" && afterByte == DOT){
            // this is a move number
            let dotsAmt = 0;
            await reader.extractParts(
                (i: number, v: number) => {
                    if (v == DOT)
                        dotsAmt++;
                    else
                        return true;
                    return false;
                }
            );
            return {
                type: "move num",
                num: firstNum.num,
                threeDots: dotsAmt >= 3
            };
        }else{
            // this is troublesome.
        }
    }else if (firstByte == ASTERISK){
        reader.setBufferPosition(reader.getBufferPosition() + 1);
        return {
            type: "result",
            value: "*"
        };
    }
    // handle move
    return await handleMove(reader);
}
