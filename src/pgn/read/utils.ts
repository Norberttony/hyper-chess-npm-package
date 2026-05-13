export function isWhitespace(byte: number): boolean {
    return (
        byte === 32 || // space
        byte === 9  || // \t
        byte === 10 || // \n
        byte === 13 || // \r
        byte === 12 || // \f
        byte === 11    // \v
    );
}
