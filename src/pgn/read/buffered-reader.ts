import fs from "node:fs";

// to-do: add a string decoder which will handle variable-length encodings and
// prevent corruption.
export class BufferedReader {
    private fd: number | undefined = undefined;
    private buffer: Buffer;
    private position: number = 0;
    private bufferPosition: number = 0;
    private bufferStartPosition: number | undefined = undefined;
    private bufferValidBytes: number = 0;

    constructor(private pathToFile: string, private chunkSizeBytes: number){
        this.buffer = Buffer.alloc(this.chunkSizeBytes);
    }

    public async open(): Promise<void> {
        return new Promise((res, rej) => {
            fs.open(this.pathToFile, "r", (err, fd: number) => {
                if (err){
                    rej(err.message);
                    throw err;
                }
                this.fd = fd;
                res();
            });
        });
    }

    public setBufferPosition(pos: number): void {
        this.bufferPosition = pos;
    }

    public getBufferPosition(): number {
        return this.bufferPosition;
    }

    public setPosition(pos: number): void {
        this.position = pos;
    }

    public getPosition(): number {
        return this.position;
    }

    public getBuffer(): Buffer {
        return this.buffer.subarray(0, this.bufferValidBytes);
    }

    public getBufferStartPosition(): number | undefined {
        return this.bufferStartPosition;
    }

    // populates buffer with next bytes, starting from position
    public async read(): Promise<Buffer> {
        return new Promise((res, rej) => {
            if (!this.fd)
                return rej("File is closed");
            const readAt = this.position;
            fs.read(
                this.fd,
                this.buffer,
                0,
                this.buffer.byteLength,
                readAt,
                (err, bytesRead: number) => {
                    if (err)
                        return rej(err.message);
                    this.bufferStartPosition = readAt;
                    this.position += bytesRead;
                    this.bufferValidBytes = bytesRead;
                    res(this.buffer.subarray(0, bytesRead));
                }
            );
        });
    }

    public async extractParts(
        callback: (i: number, v: number) => boolean
    ): Promise<Buffer[]> {
        const parts: Buffer[] = [];
        
        let offset: number = this.bufferPosition;

        while (true){
            for (let i = offset; i < this.buffer.length; i++){
                this.bufferPosition = i;
                const v: number = this.buffer[i]!;
                if (callback(i, v)){
                    parts.push(Buffer.from(this.buffer.subarray(offset, i)));
                    return parts;
                }
            }
            parts.push(Buffer.from(this.buffer.subarray(offset)));
            offset = 0;
            await this.read();
            if (this.buffer.length == 0)
                throw new Error("Cannot extract more parts: EOF");
        }
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
}
