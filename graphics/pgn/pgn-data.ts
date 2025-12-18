import { VariationMove } from "./index.js";

// PGN headers contains all relevant information pertaining to the SAN of some game. This class
// handles the proper text (based on given and missing information) that describes the PGN headers.

// determines all valid headers and their default order
// "as const" is necessary because it prevents TypeScript from seeing this as a
// string[] type ("widening")
export const VALID_HEADERS = [ "Event", "Site", "Round", "TimeControl", "White", "Black", "Result", "Termination", "Variant", "FEN" ] as const;
export type PGNHeader = typeof VALID_HEADERS[number];
export type PGNHeaders = { [key in PGNHeader]?: string };

export class PGNData {
    // whether or not started as white to play
    public startedWTP: boolean = true;
    public headers: PGNHeaders = {};

    constructor(public pgnRoot: VariationMove){
        this.initHeaders();
    }

    private initHeaders(): void {
        this.headers = {
            "Event": "Hyper Chess Analysis",
            "Site": window.location.href,
            "Result": "*",
            "Variant": "Standard"
        };
    }

    public clearHeaders(): void {
        this.headers = {};
    }

    public clear(): void {
        this.initHeaders();
    }

    public setHeader(hdr: PGNHeader, value: string): void {
        this.headers[hdr] = value;

        if (hdr == "FEN"){
            this.startedWTP = value.split(" ")[1] == "w";
        }else if (hdr == "Variant" && value == "Standard"){
            this.startedWTP = true;
        }
    }

    public unsetHeader(hdr: PGNHeader): void {
        delete this.headers[hdr];
    }

    public toString(): string {
        let pgn = "";
        // show all valid headers
        for (const hdr of VALID_HEADERS){
            if (this.headers[hdr])
                pgn += `[${hdr} "${this.headers[hdr]}"]\n`;
        }
        pgn += `\n${this.sanLine}`;
        return pgn;
    }

    // generates a SAN line for this descendant node
    public sanHelper(node: VariationMove | undefined, count: number): string {
        let san = "";
        let iter: VariationMove | undefined = node;

        if (!this.startedWTP && node && node == this.pgnRoot.next[0])
            count++;

        // add full move counter
        if (count % 2 != 0){
            san += `${Math.floor(count / 2) + 1}... `;
        }

        // just prevent crashing :)
        let maxIters = 9999;

        // loop through pgn moves
        while (iter && --maxIters){
            // fullmove
            if (count % 2 == 0)
                san += `${Math.floor(count / 2) + 1}. `;

            san += `${iter.san} `;

            count++;

            // go through each variation and add it as a variation (enclosed in parentheses)
            if (iter.next.length > 1){
                
                // fullmove
                if (count % 2 == 0)
                    san += `${Math.floor(count / 2) + 1}. `;

                san += `${iter.next[0]!.san} `;
                count++;

                for (let i = 1; i < iter.next.length; i++){
                    san += `( ${this.sanHelper(iter.next[i]!, count - 1)}) `;
                }

                iter = iter.next[0];
            }
            if (iter)
                iter = iter.next[0];
        }

        return san;
    }

    public get sanLine(): string {
        return this.sanHelper(this.pgnRoot.next[0], 0);
    }
}
