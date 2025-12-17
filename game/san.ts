
// removes all glyphs from SAN
export function removeGlyphs(san: string): string {
    san = san.replace(/[#+?!]/g, "");
    return san;
}
