import { AbstractReader } from "../read/abstract-reader.js";
import { handleNumber } from "./number.js";
import type { PgnNagToken } from "./types.js";
import * as T from "./tokens.js";

export function handleNag(reader: AbstractReader): PgnNagToken {
    if (!reader.match(T.DOLLAR_SIGN)){
        throw new Error(
            `PGN NAGs must start with a dollar sign (got ${reader.get()})`
        );
    }

    const num: number = handleNumber(reader);

    return {
        type: "nag",
        id: num
    };
}
