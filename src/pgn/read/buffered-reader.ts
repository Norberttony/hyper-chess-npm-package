import fs from "node:fs";
import { AbstractReader } from "./abstract-reader.js";
import { isWhitespace } from "./utils.js";

export interface BufferWrapper {
    data: Buffer;
    validBytes: number;
}

// to-do: add a string decoder which will handle variable-length encodings and
// prevent corruption.
export class BufferedReader extends AbstractReader {
    private fd: number | undefined = undefined;
    private buffer: BufferWrapper;
    private nextBuffer: BufferWrapper;
    private position: number = 0;
    private bufferPosition: number = 0;

    private copyBufferPosStart: number[] = [];
    private parts: Buffer[][] = [];

    constructor(private pathToFile: string, private chunkSizeBytes: number){
        super();
        // at least size of 2 to allow for peek and peekNext to work
        if (chunkSizeBytes < 2){
            throw new Error(
                `chunkSizeBytes must be set to greater than 2 (is ${chunkSizeBytes})`
            );
        }
        this.buffer = {
            data: Buffer.alloc(this.chunkSizeBytes),
            validBytes: 0
        };
        this.nextBuffer = {
            data: Buffer.alloc(this.chunkSizeBytes),
            validBytes: 0
        };
    }

    public copyStart(): void {
        this.parts.unshift([]);
        this.copyBufferPosStart.unshift(this.bufferPosition);
    }

    private addPart(): void {
        for (let p = 0; p < this.parts.length; p++){
            const slice: Buffer = this.buffer.data.subarray(
                this.copyBufferPosStart[p]!, this.bufferPosition
            );
            this.parts[p]!.push(Buffer.from(slice));
        }
    }

    public copyEnd(): string {
        this.addPart();
        const parts: Buffer[] = this.parts.shift()!;
        this.copyBufferPosStart.shift();
        return parts.join("");
    }

    public copyReject(): void {
        this.parts.shift();
        this.copyBufferPosStart.shift();
    }

    public isAtEnd(): boolean {
        return this.bufferPosition >= this.buffer.validBytes;
    }

    public advance(): void {
        this.position++;
        this.bufferPosition++;

        if (this.isAtEnd()){
            this.addPart();
            for (let i = 0; i < this.copyBufferPosStart.length; i++)
                this.copyBufferPosStart[i] = 0;
            this.readNextBuffer();
            if (this.isAtEnd())
                this.close();
        }
    }

    // gets the byte at the current position
    public get(): number {
        if (this.isAtEnd())
            return 0;
        return this.buffer.data[this.bufferPosition]!;
    }

    public match(byte: number): boolean {
        if (this.isAtEnd())
            return false;
        if (this.get() == byte){
            this.advance();
            return true;
        }
        return false;
    }

    public peek(): number {
        return this.getNAway(1);
    }

    public peekNext(): number {
        return this.getNAway(2);
    }

    public skipWhitespace(): void {
        while (isWhitespace(this.get()))
            this.advance();
    }

    public async open(): Promise<void> {
        return new Promise((res, rej) => {
            fs.open(this.pathToFile, "r", (err, fd: number) => {
                if (err){
                    rej(err.message);
                    throw err;
                }
                this.fd = fd;
                this.read(this.buffer);
                this.read(this.nextBuffer);
                res();
            });
        });
    }

    public isOpen(): boolean {
        return this.fd !== undefined;
    }

    public close(): void {
        if (this.fd){
            fs.close(this.fd);
            this.fd = undefined;
        }
    }

    private readNextBuffer(): void {
        this.bufferPosition -= this.buffer.validBytes;

        // swap buffers
        const temp: BufferWrapper = this.buffer;
        this.buffer = this.nextBuffer;
        this.nextBuffer = temp;

        // read new content for nextBuffer to match
        this.read(this.nextBuffer);
    }

    // populates buffer with next bytes, starting from position
    private read(buffer: BufferWrapper): void {
        if (!this.fd)
            throw new Error("File is closed");
        buffer.validBytes = fs.readSync(
            this.fd,
            buffer.data,
            0,
            buffer.data.byteLength,
            null
        );
    }

    private getNAway(n: number): number {
        let p = this.bufferPosition + n;
        if (p >= this.chunkSizeBytes * 2){
            throw new Error(
                `Tried peeking ${p} when cannot peek farther than 2 * chunkSizeBytes = ${2 * this.chunkSizeBytes}`
            );
        }
        if (p >= this.buffer.validBytes){
            // goes past this buffer, try next
            p -= this.buffer.validBytes;
            if (p >= this.nextBuffer.validBytes){
                // goes past all buffers, return null character (0)
                return 0;
            }else{
                return this.nextBuffer.data[p]!;
            }
        }else{
            return this.buffer.data[p]!;
        }
    }
}
