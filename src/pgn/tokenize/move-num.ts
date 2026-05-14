import { BufferedReader } from "../read/buffered-reader.js";
import { isNumber } from "../read/utils.js";
import { PgnMoveNumToken, DOT, ZERO } from "./types.js";

export async function handleMoveNum(
    reader: BufferedReader
): Promise<PgnMoveNumToken> {
    let dotCount = 0;
    let num = 0;

    await reader.extractParts(
        (i: number, v: number) => {
            if (isNumber(v)){
                num = num * 10 + v - ZERO;
            }else if (v == DOT){
                dotCount++;
            }else{
                if (dotCount > 0)
                    return true;
            }
            return false;
        }
    );

    return {
        type: "move num",
        num,
        threeDots: dotCount >= 3
    }
}
