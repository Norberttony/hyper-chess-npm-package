import { BufferedReader } from "../read/buffered-reader.js"
import { PgnToken } from "./types.js";
import { handleTag } from "./tag.js";
import { LEFT_SQ_BRACKET } from "./types.js";

export class PgnTokenizer {
    constructor(private reader: BufferedReader){}

    public async nextToken(): Promise<PgnToken | undefined> {
        if (this.reader.getBufferStartPosition() === undefined)
            await this.reader.read();

        const buffer = this.reader.getBuffer();
        for (let i = this.reader.getBufferPosition(); i < buffer.length; i++){
            const v: number = buffer[i]!;
            if (v == LEFT_SQ_BRACKET){
                this.reader.setBufferPosition(i);
                return await handleTag(this.reader);
            }
        }

        return undefined;
    }
}
