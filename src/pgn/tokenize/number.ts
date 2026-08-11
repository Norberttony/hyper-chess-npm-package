import { AbstractReader } from "../read/abstract-reader.js";
import { isNumber } from "../read/utils.js";
import { TokenReturn } from "./types.js";

export function* handleNumber(reader: AbstractReader): TokenReturn<number> {
    let num = 0;
    while (!reader.isAtEnd() && isNumber(reader.get())){
        num = num * 10 + reader.get() - 48;
        reader.advance();
        if (reader.isChunkProcessed())
            yield;
    }
    return num;
}
