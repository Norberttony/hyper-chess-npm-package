import { BufferedReader } from "../read/buffered-reader.js";
import { handleString } from "./string.js";
import { DOUBLE_QUOTES, PgnStringToken, PgnTagToken } from "./types.js";

export async function handleTag(
    reader: BufferedReader
): Promise<PgnTagToken> {
    // skip first character
    reader.setBufferPosition(reader.getBufferPosition() + 1);

    const headerParts: Buffer[] = await reader.extractParts(
        (i: number, v: number) => {
            if (v == DOUBLE_QUOTES)
                return true;
            return false;
        }
    )

    // skip first character
    reader.setBufferPosition(reader.getBufferPosition() + 1);
    const valueString: PgnStringToken = await handleString(reader);
    return {
        type: "tag",
        header: headerParts.join("").trim(),
        value: valueString
    }
}
