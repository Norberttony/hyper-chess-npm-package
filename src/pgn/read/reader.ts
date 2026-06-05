import { AbstractReader } from "./abstract-reader.js";
import { isWhitespace } from "./utils.js";

export class Reader extends AbstractReader {
    private position: number = 0;
    private copyStartPos: number[][] = [];
    private isPaused: boolean[] = [];

    constructor(private content: string){
        super();
    }

    public copyStart(): void {
        this.copyStartPos.unshift([ this.position ]);
        this.isPaused.unshift(false);
    }

    public copyPause(): void {
        this.copyStartPos[0]?.push(this.position);
        this.isPaused[0] = true;
    }

    public copyContinue(): void {
        this.copyStartPos[0]?.push(this.position);
        this.isPaused[0] = false;
    }

    // something is wrong here.
    public copyEnd(): string {
        const positions: number[] = this.copyStartPos.shift()!;
        let copied = "";
        for (let i = 0; i < positions.length - 1; i += 2){
            copied += this.content.substring(
                positions[i]!,
                positions[i + 1]!
            );
        }
        if (this.isPaused.shift()! == false){
            copied += this.content.substring(
                positions[positions.length - 1]!,
                this.position
            );
        }
        return copied;
    }

    public copyReject(): void {
        this.copyStartPos.shift();
        this.isPaused.shift();
    }

    public isAtEnd(): boolean {
        return this.position >= this.content.length;
    }

    public advance(): void {
        this.position++;
    }

    // gets the byte at the current position
    public get(): number {
        if (this.isAtEnd())
            return 0;
        return this.content[this.position]!.charCodeAt(0);
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

    private getNAway(n: number): number {
        const p = this.position + n;
        if (p >= this.content.length)
            return 0;
        else
            return this.content[p]!.charCodeAt(0);
    }
}
