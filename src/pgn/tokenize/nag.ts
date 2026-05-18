import { AbstractReader } from "../read/abstract-reader.js";
import { handleNumber } from "./number.js";
import { DOLLAR_SIGN, PgnNagToken } from "./types.js";

export function handleNag(reader: AbstractReader): PgnNagToken {
    if (!reader.match(DOLLAR_SIGN)){
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
