import fs from "node:fs";

// to-do: add a string decoder which will handle variable-length encodings and
// prevent corruption.
export class BufferedReader {
    private fd: number | undefined = undefined;
    private buffer: Buffer;
    private position: number = 0;
    private bufferPosition: number | undefined = undefined;
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

    public setPosition(pos: number): void {
        this.position = pos;
    }

    public getPosition(): number {
        return this.position;
    }

    public getBuffer(): Buffer {
        return this.buffer.subarray(0, this.bufferValidBytes);
    }

    public getBufferPosition(): number | undefined {
        return this.bufferPosition;
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
                    this.bufferPosition = readAt;
                    this.position += bytesRead;
                    this.bufferValidBytes = bytesRead;
                    res(this.buffer.subarray(0, bytesRead));
                }
            );
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
}
