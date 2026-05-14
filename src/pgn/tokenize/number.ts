import { BufferedReader } from "../read/buffered-reader.js";
import { isNumber, isWhitespace } from "../read/utils.js";
import { PgnNumberToken, PgnFractionToken, ZERO, FORWARD_SLASH } from "./types.js";

export async function handleNumber(
    reader: BufferedReader
): Promise<PgnNumberToken | PgnFractionToken> {

    let num: number = 0;
    let den: number = 0;

    let isFraction = false;

    await reader.extractParts(
        (i: number, v: number) => {
            if (isNumber(v)){
                if (!isFraction){
                    num = num * 10 + v - ZERO;
                }else{
                    den = den * 10 + v - ZERO;
                }
            }else if (v == FORWARD_SLASH){
                isFraction = true;
            }else if (isWhitespace(v)){
                // ignore whitespace
            }else{
                return true;
            }
            return false;
        }
    );

    if (isFraction){
        return {
            type: "fraction",
            numerator: num,
            denominator: den
        };
    }else{
        return {
            type: "number",
            num
        };
    }
}

export function pgnNumberToString(
    token: PgnNumberToken | PgnFractionToken
): string {
    if (token.type == "number")
        return token.num.toString();
    else if (token.type == "fraction")
        return `${token.numerator}/${token.denominator}`;
    return "0";
}
