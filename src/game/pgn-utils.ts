import { VariationNode, VariationRoot } from "./variation.js";
import { Pgn, PgnMove } from "../pgn/parse/types.js";
import { Board, StartingFen } from "./board.js";
import { SAN } from "./san.js";

// returns the root VariationMove based on the given PGN.
export function createVariationTree(
    pgn: Pgn
): { root: VariationRoot, newPgn: Pgn } {
    const newPgn: Pgn = { ...pgn, moveList: [] };
    const root = new VariationRoot(newPgn.moveList);
    const board = new Board(pgn.headers["FEN"] || StartingFen);

    createVariationTreeHelper(root, pgn.moveList, board);

    return { root, newPgn };
}

// takes in a moveList and creates a variation tree based on it.
function createVariationTreeHelper(
    prev: VariationNode,
    moveList: PgnMove[],
    board: Board
): void {
    for (const pgnMove of moveList){
        const prevFen: string = board.getFen();
        const san: SAN = pgnMove.san as SAN;
        const move = board.getMoveOfSAN(san);
        if (!move){
            throw new Error(
                `Invalid move when loading PGN (fen: ${prevFen}, move SAN: ${san}, moveList: ${moveList.map(v => v.san).join(" ")})`
            );
        }
        board.makeMove(move);

        const curr = prev.attach(pgnMove, move);

        // handle alternatives to this current move
        for (const variation of pgnMove.variations){
            const dupedBoard = new Board(prevFen);
            createVariationTreeHelper(prev, variation, dupedBoard);
        }

        prev = curr;
    }
}
