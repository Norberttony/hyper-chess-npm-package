import { BufferedReader } from "../read/buffered-reader.js";
import { handleString } from "./string.js";
import { DOUBLE_QUOTES, PgnStringToken, PgnTagToken, RIGHT_SQ_BRACKET } from "./types.js";

export async function handleTag(
    reader: BufferedReader
): Promise<PgnTagToken> {
    // skip first character
    reader.setBufferPosition(reader.getBufferPosition() + 1);

    const headerParts: Buffer[] = await reader.extractParts(
        (i: number, v: number) => v == DOUBLE_QUOTES
    );

    // skip first character
    reader.setBufferPosition(reader.getBufferPosition() + 1);
    const valueString: PgnStringToken = await handleString(reader);

    // skip characters until tag ends
    reader.setBufferPosition(reader.getBufferPosition() + 1);
    await reader.extractParts(
        (i: number, v: number) => v == RIGHT_SQ_BRACKET
    );
    reader.setBufferPosition(reader.getBufferPosition() + 1);

    return {
        type: "tag",
        header: headerParts.join("").trim(),
        value: valueString
    }
}
