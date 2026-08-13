import { AbstractReader } from "../read/abstract-reader.js";
import { isNumber } from "../read/utils.js";

export interface HandleNumberState {
    num: number;
}

export function handleNumber(
    reader: AbstractReader,
    state: HandleNumberState = { num: 0 },
): number {
    while (!reader.isAtEnd() && isNumber(reader.get())){
        state.num = state.num * 10 + reader.get() - 48;
        reader.advance();
    }
    return state.num;
}
