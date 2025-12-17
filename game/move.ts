import { squareToAlgebraic } from "./coords.js";
import { Piece } from "./piece.js";

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

    public get lan(): string {
        return `${squareToAlgebraic(this.from)}${squareToAlgebraic(this.to)}`;
    }
}
