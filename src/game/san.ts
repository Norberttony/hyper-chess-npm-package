import { PieceType } from "./piece.js";

export const PieceStrings = [ "?", "K", "Q", "B", "N", "R", "P", "U" ] as const;
export type PieceSanChar = typeof PieceStrings[number];

export type San = string & { __brand: "San" };

// removes all glyphs from SAN
export function removeGlyphs(san: San): San {
    san = san.replace(/[#+?!]/g, "") as San;
    return san;
}

export function attachGlyph(san: San, glyph: string): San {
    return `${san}${glyph}` as San;
}

export function getSanCharFromPieceType(p: PieceType): PieceSanChar {
    return PieceStrings[p];
}
