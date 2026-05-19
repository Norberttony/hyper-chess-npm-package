import { VariationMove } from "../graphics/pgn/variation.js";
import { Pgn, PgnMove } from "../pgn/parse/types.js";
import { SAN } from "./san.js";

// returns the root VariationMove based on the given PGN. The root is always a
// sentinel node.
export function createVariationTree(pgn: Pgn): VariationMove {
    const root = new VariationMove();

    createVariationTreeHelper(root, pgn.moveList);

    return root;
}

// takes in a moveList and creates a variation tree based on it.
function createVariationTreeHelper(
    prev: VariationMove,
    moveList: PgnMove[]
): void {
    for (const pgnMove of moveList){
        const curr = new VariationMove(undefined, pgnMove.san as SAN);
        curr.attachTo(prev);

        // handle alternatives to this current move
        for (const variation of pgnMove.variations)
            createVariationTreeHelper(prev, variation);

        prev = curr;
    }
}
