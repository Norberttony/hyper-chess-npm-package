import fs from "node:fs";
import { AbstractReader, ReaderContext } from "./abstract-reader.js";
import { NEWLINE } from "../tokenize/tokens.js";

export interface BufferWrapper {
    data: Buffer;
    validBytes: number;
    maxSize: number;
    promise: Promise<void> | undefined;
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

    private context: ReaderContext = {
        line: 1,
        offset: 0,
    };

    constructor(private pathToFile: string, private chunkSizeBytes: number){
        super();
        // minimum chunk size to allow for peek and peekNext to work as well as
        // any extra space that the tokenizer ensures exists
        if (chunkSizeBytes < 8){
            throw new Error(
                `chunkSizeBytes must be set to greater than 8 (is ${chunkSizeBytes})`
            );
        }
        const buf1Size = Math.ceil(chunkSizeBytes / 2);
        const buf2Size = Math.floor(chunkSizeBytes / 2);

        this.buffer = {
            data: Buffer.alloc(buf1Size),
            validBytes: 0,
            maxSize: buf1Size,
            promise: undefined,
        };
        this.nextBuffer = {
            data: Buffer.alloc(buf2Size),
            validBytes: 0,
            maxSize: buf2Size,
            promise: undefined,
        };
    }

    public getPartCount(): number {
        return this.parts.length;
    }

    public getContext(): ReaderContext {
        return { ...this.context };
    }

    public override getDataPromise(): Promise<void> | undefined {
        return this.buffer.promise || this.nextBuffer.promise;
    }

    public copyStart(): void {
        this.parts.push([]);
        this.copyBufferPosStart.push(this.bufferPosition);
    }

    public copyPause(): void {
        this.addPart(this.parts.length - 1);
        this.copyBufferPosStart[0] = -1;
    }

    public copyContinue(): void {
        this.copyBufferPosStart[0] = this.bufferPosition;
    }

    private addPartToAll(): void {
        for (let p = 0; p < this.parts.length; p++)
            this.addPart(p);
    }

    private addPart(idx: number): void {
        const start: number = this.copyBufferPosStart[idx]!;
        if (start == -1)
            return;
        const slice: Buffer = this.buffer.data.subarray(
            start, this.bufferPosition
        );
        this.parts[idx]!.push(Buffer.from(slice));
    }

    public copyEnd(): string {
        this.addPart(this.parts.length - 1);
        const parts: Buffer[] = this.parts.pop()!;
        this.copyBufferPosStart.pop();
        if (parts.length === 1)
            return parts[0]!.toString();
        else
            return parts.join("");
    }

    public copyReject(): void {
        this.parts.pop();
        this.copyBufferPosStart.pop();
    }

    public override isDataAvailable(range: number): boolean {
        return this.buffer.validBytes - this.bufferPosition > range
            || (this.nextBuffer.promise === undefined && this.buffer.promise === undefined);
    }

    public isAtEnd(): boolean {
        return this.bufferPosition >= this.buffer.validBytes && !this.nextBuffer.promise;
    }

    public advance(): void {
        this.context.offset++;
        if (this.get() === NEWLINE){
            this.context.line++;
            this.context.offset = 0;
        }
        this.position++;
        this.bufferPosition++;

        if (this.isAtEnd()){
            this.addPartToAll();
            for (let i = 0; i < this.copyBufferPosStart.length; i++){
                if (this.copyBufferPosStart[i] != -1)
                    this.copyBufferPosStart[i] = 0;
            }
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

    public async open(): Promise<void> {
        return new Promise((res, rej) => {
            fs.open(this.pathToFile, "r", async (err, fd: number) => {
                if (err){
                    rej(err);
                    return;
                }
                this.fd = fd;
                await this.read(this.buffer);
                this.read(this.nextBuffer);
                res();
            });
        });
    }

    public isOpen(): boolean {
        return this.fd !== undefined;
    }

    public close(): void {
        if (this.fd !== undefined){
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

        // read new content for nextBuffer to match only if we expect content
        if (this.buffer.validBytes === this.buffer.data.byteLength)
            this.read(this.nextBuffer);
        else
            this.nextBuffer.validBytes = 0;
    }

    // populates buffer with next bytes, starting from position
    private read(buffer: BufferWrapper): Promise<void> {
        buffer.validBytes = 0;
        buffer.promise = new Promise((res, rej) => {
            if (this.fd === undefined)
                throw new Error("File is closed");
            fs.read(this.fd, buffer.data, 0, buffer.data.byteLength, null,
                (err, bytesRead) => {
                    if (err) rej(err);
                    buffer.promise = undefined;
                    buffer.validBytes = bytesRead;
                    res();
                }
            );
        });
        return buffer.promise;
    }

    private getNAway(n: number): number {
        let p = this.bufferPosition + n;
        if (p >= this.chunkSizeBytes){
            throw new Error(
                `Tried peeking ${p} when cannot peek farther than chunkSizeBytes = ${this.chunkSizeBytes}`
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
