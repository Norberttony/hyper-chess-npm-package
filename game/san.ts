import { PieceType } from "./piece.js";

export const PieceStrings = [ "?", "K", "Q", "B", "N", "R", "P", "U" ] as const;
export type PieceSANChar = typeof PieceStrings[number];

export type SAN = string & { __brand: "SAN" };

// removes all glyphs from SAN
export function removeGlyphs(san: SAN): SAN {
    san = san.replace(/[#+?!]/g, "") as SAN;
    return san;
}

export function attachGlyph(san: SAN, glyph: string): SAN {
    return `${san}${glyph}` as SAN;
}

export function getSANCharFromPieceType(p: PieceType): PieceSANChar {
    return PieceStrings[p];
}
