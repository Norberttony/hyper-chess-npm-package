import { BufferedReader } from "../read/buffered-reader.js";
import { isNumber } from "../read/utils.js";

export function handleNumber(reader: BufferedReader): number {
    let num = 0;
    while (!reader.isAtEnd() && isNumber(reader.get())){
        num = num * 10 + reader.get() - 48;
        reader.advance();
    }
    return num;
}
