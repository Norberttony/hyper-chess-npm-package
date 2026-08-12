import { AbstractReader } from "../read/abstract-reader.js";
import { handleNumber } from "./number.js";
import type { PgnNagToken } from "./types.js";
import * as T from "./tokens.js";

export async function handleNag(reader: AbstractReader): Promise<PgnNagToken> {
    if (!reader.match(T.DOLLAR_SIGN)){
        throw new Error(
            `PGN NAGs must start with a dollar sign (got ${reader.get()})`
        );
    }

    const num: number = await handleNumber(reader);

    return {
        type: "nag",
        id: num
    };
}
