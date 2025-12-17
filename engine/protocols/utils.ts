export function readWords(line: string): string[] {
    return line.trim().split(" ").filter(v => v.length > 0);
}
