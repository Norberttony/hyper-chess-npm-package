import { AbstractReader } from "../browser-index.js";
import { isWhitespace } from "../read/utils.js";

export async function skipWhitespace(reader: AbstractReader): Promise<void> {
    // extra buffer space allows for more matching to be done.
    if (!reader.isDataAvailable(4)) await reader.getDataPromise();
    while (isWhitespace(reader.get())){
        reader.advance();
        if (!reader.isDataAvailable(4)) await reader.getDataPromise();
    }
}
