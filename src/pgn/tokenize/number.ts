import { AbstractReader } from "../read/abstract-reader.js";
import { isNumber } from "../read/utils.js";

export async function handleNumber(reader: AbstractReader): Promise<number> {
    let num = 0;
    while (!reader.isAtEnd() && isNumber(reader.get())){
        num = num * 10 + reader.get() - 48;
        reader.advance();
        if (!reader.isDataAvailable(4)) await reader.getDataPromise();
    }
    return num;
}
