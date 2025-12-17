// Contains helper functions for pieces, such as their numerical representations
// FEN to piece conversions are also stored here.

export const enum Side {
    None = 0,
    White = 8,
    Black = 16
};

export const enum PieceType {
    None,
    King,
    Retractor,
    Chameleon,
    Springer,
    Coordinator,
    Straddler,
    Immobilizer
};

// to-do: explore type branding to ensure better type safety
export type Piece = Side | PieceType;

const pieceSideMask = 0b11000;
const pieceTypeMask = 0b00111;

export function getPieceType(p: Piece): PieceType {
    return p & pieceTypeMask;
}

export function getPieceSide(p: Piece): Side {
    return p & pieceSideMask;
}

export function setPieceType(p: Piece | Side, t: PieceType): Piece {
    return getPieceSide(p) | t;
}

export function isPieceOfType(p: Piece, o: PieceType): boolean {
    return getPieceType(p) == o;
}

export function isPieceOfSide(p: Piece, o: Side): boolean {
    return getPieceSide(p) == o;
}

export function arePiecesSameSide(p1: Piece, p2: Piece): boolean {
    return getPieceSide(p1) == getPieceSide(p2);
}

export function arePiecesSameType(p1: Piece, p2: Piece): boolean {
    return getPieceType(p1) == getPieceType(p2);
}

export const PieceStrings: readonly string[] = [ "?", "K", "Q", "B", "N", "R", "P", "U" ];

const FENCharToPiece: { [fen: string]: Piece } = {
    k: Side.Black | PieceType.King,
    q: Side.Black | PieceType.Retractor,
    b: Side.Black | PieceType.Chameleon,
    n: Side.Black | PieceType.Springer,
    r: Side.Black | PieceType.Coordinator,
    p: Side.Black | PieceType.Straddler,
    u: Side.Black | PieceType.Immobilizer,

    K: Side.White | PieceType.King,
    Q: Side.White | PieceType.Retractor,
    B: Side.White | PieceType.Chameleon,
    N: Side.White | PieceType.Springer,
    R: Side.White | PieceType.Coordinator,
    P: Side.White | PieceType.Straddler,
    U: Side.White | PieceType.Immobilizer
};

const PieceTypeToFENChar: { [t: number]: string } = {
    [PieceType.King]: "k",
    [PieceType.Retractor]: "q",
    [PieceType.Chameleon]: "b",
    [PieceType.Springer]: "n",
    [PieceType.Coordinator]: "r",
    [PieceType.Straddler]: "p",
    [PieceType.Immobilizer]: "u"
};

export function getFENCharFromPieceType(p: PieceType): string {
    return PieceTypeToFENChar[p]!;
}

export function getPieceTypeFromFENChar(char: string): PieceType {
    return getPieceType(FENCharToPiece[char]!);
}

export function getSANCharFromPieceType(p: PieceType): string {
    return PieceStrings[p]!;
}
