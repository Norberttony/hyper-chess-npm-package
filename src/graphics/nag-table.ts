export interface NagEntry {
    id: number;
    icon?: string;
    desc: string;
}

export type NagTable = Record<number, NagEntry>

export function createDefaultNagTable(assetBaseUrl: string): NagTable {
    const t = {};

    registerNagEntries(t,
        // these are defaults defined by the PGN specification
        // some are excluded just for brevity.
        { id: 0, desc: "null annotation" },
        { id: 1, desc: "good move",         icon: joinUrlPath(assetBaseUrl, "images/nags/good-move.svg") },
        { id: 2, desc: "poor move",         icon: joinUrlPath(assetBaseUrl, "images/nags/poor-move.svg") },
        { id: 3, desc: "very good move",    icon: joinUrlPath(assetBaseUrl, "images/nags/very-good-move.svg") },
        { id: 4, desc: "very poor move",    icon: joinUrlPath(assetBaseUrl, "images/nags/very-poor-move.svg") },
        { id: 5, desc: "speculative move" },
        { id: 6, desc: "questionable move" },

        // package-specific glyphs
        { id: 65536, desc: "puzzle correct",    icon: joinUrlPath(assetBaseUrl, "images/glyphs/correct.svg") },
        { id: 65537, desc: "puzzle incorrect",  icon: joinUrlPath(assetBaseUrl, "images/glyphs/incorrect.svg") },
    );

    return t;
}

// Finds and returns the NAG counterpart to the SAN glyph string, or if it does
// not exist, returns undefined.
export function getNagEntryFromSanGlyph(
    nagTable: NagTable,
    glyph: string
): NagEntry | undefined {
    const values = Object.values(nagTable);
    let desc;
    if (glyph === "!")
        desc = "good move";
    else if (glyph === "!!")
        desc = "really good move";
    else if (glyph === "?")
        desc = "poor move";
    else if (glyph === "??")
        desc = "really poor move";
    else
        return undefined;
    return values.filter(v => v.desc === desc)[0];
}

export function registerNagEntry(nagTable: NagTable, nagEntry: NagEntry): void {
    nagTable[nagEntry.id] = nagEntry;
}

export function registerNagEntries(nagTable: NagTable, ...nagEntries: NagEntry[]): void {
    for (const entry of nagEntries)
        registerNagEntry(nagTable, entry);
}

function joinUrlPath(base: string, path: string): string {
    // browser-friendly way of joining paths, while avoiding any absolute URLs
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    if (base === "")
        return normalizedPath;
    return `${normalizedBase}/${normalizedPath}`;
}
