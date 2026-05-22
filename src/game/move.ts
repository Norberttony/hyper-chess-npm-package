import { squareToAlgebraic } from "./coords.js";
import { Piece } from "./piece.js";
import { Lan } from "./coords.js";

// The move class contains all relevant information about any move...
//  - "to"          is a square index of where the moving piece is going to
//  - "from"        is a square index of where the moving piece is moving from
//  - "captures"    is an array of {square, captured} where "square" is the location of the
//                      captured piece and "captured" is the piece itself.

export interface Capture {
    sq: number,
    captured: Piece
};

export class Move {
    constructor(
        public to: number,
        public from: number,
        public captures: Capture[] = []
    ){}

    public clone(): Move {
        return new Move(this.to, this.from, [ ...this.captures ]);
    }

    public equals(move: Move): boolean {
        // different squares?
        if (this.from != move.from || this.to != move.to)
            return false;

        // different number of captures?
        if (this.captures.length != move.captures.length)
            return false;

        // different captures?
        for (const c1 of this.captures){
            for (const c2 of move.captures){
                if (c1.captured != c2.captured || c1.sq != c2.sq)
                    return false;
            }
        }

        return true;
    }

    public get lan(): Lan {
        return `${squareToAlgebraic(this.from)}${squareToAlgebraic(this.to)}` as Lan;
    }
}
