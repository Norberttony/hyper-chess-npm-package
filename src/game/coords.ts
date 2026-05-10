// handles functions relating to converting coordinates back and forth

export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type AlgebraicSquare = `${File}${Rank}`;

export type LAN = string & { __brand: "LAN" };

// converts algebraic notation to a square on the board
// consider attaching this directly to Board.
export function algebraicToSquare(a: AlgebraicSquare): number {
    return a.charCodeAt(0) - 97 + 8 * (parseInt(a[1]!) - 1);
}

// converts a square on the board to algebraic notation
export function squareToAlgebraic(sq: number): AlgebraicSquare {
    let r = squareToAlgebraicRank(sq);
    let f = squareToAlgebraicFile(sq);
    return `${f}${r}`;
}

export function squareToAlgebraicFile(sq: number): File {
    return String.fromCharCode(getFileFromSq(sq) + 97) as File;
}

export function squareToAlgebraicRank(sq: number): Rank {
    return (Math.floor(sq / 8) + 1).toString() as Rank;
}

// returns file (0 - 7) of given square
export function getFileFromSq(sq: number): number {
    return sq % 8;
}

// returns rank (0 - 7) of given square
export function getRankFromSq(sq: number): number {
    return Math.floor(sq / 8);
}
