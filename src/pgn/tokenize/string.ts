import { BufferedReader } from "../read/buffered-reader.js";
import { PgnStringToken } from "./types.js";
import { BACK_SLASH, DOUBLE_QUOTES } from "./types.js";

// to-do: string implementation should start on a double quotes, not after it
// furthermore, it should consume final quote
export async function handleString(
    reader: BufferedReader
): Promise<PgnStringToken> {
    let prevEscaped = false;

    // keep extracting until we end up on a double quote.
    const parts: Buffer[] = await reader.extractParts(
        (i: number, v: number) => {
            if (v == BACK_SLASH){
                if (prevEscaped){
                    prevEscaped = false;
                    return false;
                }
                prevEscaped = true;
                return false;
            }else if (v == DOUBLE_QUOTES && !prevEscaped){
                return true;
            }
            prevEscaped = false;
            return false;
        }
    );

    // to-do: using replaceAll to get double quotes escaped is a bit of a shoddy
    // fix and should be replaced with some kind of buffer logic somehow.
    return {
        type: "string",
        content: parts.join("").replaceAll("\\\"", '"')
    };
}
