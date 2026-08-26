import { Board } from "./board.js";

export function perft(depth: number, board: Board): number {
    if (depth == 0)
        return 1;

    let counter = 0;
    const moves = board.generateMoves();
    for (const m of moves){
        board.makeMove(m);
        counter += perft(depth - 1, board);
        board.unmakeMove(m);
    }

    return counter;
}
