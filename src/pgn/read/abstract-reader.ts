export interface ReaderContext {
    line: number;
    offset: number;
}

export abstract class AbstractReader {
    constructor(){}

    // returns where the reader currently is
    public abstract getContext(): ReaderContext;

    // begins copying any characters the reader passes
    public abstract copyStart(): void;

    // pauses the current copy operation
    public abstract copyPause(): void;

    // continues the previously paused copy operation
    public abstract copyContinue(): void;

    // stops copying and returns the resulting string
    public abstract copyEnd(): string;

    // stops copying without returning anything
    public abstract copyReject(): void;

    // returns true if there is no more content to parse, false otherwise
    public abstract isAtEnd(): boolean;

    // moves the cursor to the next byte
    public abstract advance(): void;

    // gets the byte at the current position
    public abstract get(): number;

    // returns true if the byte matches the current byte, false otherwise
    // if it matches, it also advances by one
    public abstract match(byte: number): boolean;

    // returns the next byte (or if no such byte, 0)
    public abstract peek(): number;

    // returns the next next byte (or if no such byte, 0)
    public abstract peekNext(): number;

    // keeps reading whitespace characters until none are left
    public abstract skipWhitespace(): void;
}
