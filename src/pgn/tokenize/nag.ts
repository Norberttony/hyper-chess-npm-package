import { AbstractReader } from "../read/abstract-reader.js";
import { handleNumber, HandleNumberState } from "./number.js";
import type { PgnNagToken } from "./types.js";

export interface HandleNagState {
    numState: HandleNumberState
}

export function handleNag(state: HandleNagState, reader: AbstractReader): PgnNagToken {
    const num: number = handleNumber(reader, state.numState);

    return {
        type: "nag",
        id: num,
    };
}
