import { BufferedReader } from "../read/buffered-reader.js";
import { isWhitespace } from "../read/utils.js";
import { PgnMoveToken } from "./types.js";

export async function handleMove(
    reader: BufferedReader
): Promise<PgnMoveToken> {

    const parts: Buffer[] = await reader.extractParts(
        (i: number, v: number) => isWhitespace(v)
    );

    return {
        type: "move",
        content: parts.join("")
    }
}
