import { describe, it, expect } from "vitest";
import { Board, GameResult, StartingFen } from "../../src/game/board";
import { LAN } from "../../src/game/coords";
import { Side } from "../../src/game/piece";

type BoardFactory = () => Board;

export function sharedBoardTests(name: string, boardFactory: BoardFactory){
    describe(`${name} results`, () => {
        function makeMove(b: Board, lan: string, expected: GameResult | undefined){
            const m = b.getMoveOfLAN(lan as LAN)!;
            b.makeMove(m);
            expect(b.isGameOver()).toEqual(expected);
        }

        it("threefold", () => {
            const b = boardFactory();
            b.loadFen(StartingFen);

            // this repeats the starting FEN three times
            makeMove(b, "d2d4", undefined);
            makeMove(b, "d7d5", undefined);
            makeMove(b, "d4d2", undefined);
            makeMove(b, "d5d7", undefined);

            makeMove(b, "d2d4", undefined);
            makeMove(b, "d7d5", undefined);
            makeMove(b, "d4d2", undefined);
            makeMove(b, "d5d7", { termination: "threefold", winner: Side.None });
        });

        it("checkmate", () => {
            const b = boardFactory();
            b.loadFen("2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45");

            makeMove(b, "g4d7", undefined);
            makeMove(b, "e8d7", undefined);
            makeMove(b, "h5e8", { termination: "checkmate", winner: Side.White });
        });

        it("stalemate", () => {
            const b = boardFactory();
            b.loadFen("4k3/2U5/8/8/8/8/8/4K3 w 0 1");
            makeMove(b, "c7d7", { termination: "stalemate", winner: Side.None });
        });

        it("insufficient material", () => {
            const b = boardFactory();
            b.loadFen("4k3/pP6/8/8/2p5/8/1P6/4K3 w 0 1");
            makeMove(b, "e1d2", undefined);
            makeMove(b, "c4c7", { termination: "insufficient material", winner: Side.None});
        });

        it("fifty move rule", () => {
            const b = boardFactory();
            b.loadFen("2bqk1nr/p1pp1ppp/P4p1P/1n1u3P/1bp5/2P3U1/NP1PP1P1/R1BQKBN1 w 17 6");
            const lans = [ "a6d6", "d5c6", "g3e3", "b5c5", "e3e7", "g7g6", "e7f8", "f6f5", "f8g7", "c5e7", "a2a8", "c6b7", "d2d5", "c7c5", "d1d4", "f5e5", "d4e4", "b4a4", "e4e3", "d7d5", "e3e4", "e8d7", "g1f2", "d7c6", "f2f8", "e7e3", "c1f4", "c6b5", "f4f5", "b5b6", "f8b4", "b6a7", "b4b8", "a4d1", "e1d1", "a7b8", "e2e8", "c8c6", "e8e6", "d8d7", "f1f4", "d7c8", "f5f6", "d5d7", "f6e7", "d7c7", "e7d7", "c6f6", "b2b7", "c8c4", "g2g5", "c4c5", "d7d5", "c5b5", "b7f7", "b5b4", "g5d5", "b8a7", "f4d4", "a7b7", "d5f5", "b4e7", "d4d7", "b7b8", "f5e5", "b8b7", "d1c1", "b7b8", "c1b1", "b8b7", "e5c5", "b7b6", "c5c1", "b6b7", "c1h1", "b7b8", "h1h4", "b8b7", "h4g4", "b7b8", "g4a4", "b8b7", "a4h4", "b7b8", "d7c6", "e7e5", "c6f3", "b8b7", "f7e7", "e5d5", "e7e8", "b7b8", "e8e1", "d5c5", "e1e6", "c5d4", "e6d6", "b8b7", "f3e2", "b7b8", "d6d5", "d4c5", "d5d1", "c5d5", "e2f1", "d5c5", "f1f3", "c5d5", "f3e2", "d5f3", "e2d3", "f3d5", "d3e3", "d5e5", "e3f2", "e5c5", "f2f6", "b8b7", "f6f3", "b7b8", "d1c1", "c5d5", "c1c6", "b8b7", "f3e4", "d5c5", "c6f6", "c5e7", "f6f5", "e7c5", "f5f4", "c5d4", "e4e2", "d4e5", "f4d4", "b7b8", "d4d1", "e5d5", "e2f1", "d5c5", "f1f3", "c5d4", "d1g1", "d4d5", "g1g5", "d5d4", "g5a5", "d4d5", "a5a1", "d5d4", "a1a4", "d4e5", "a4d4", "e5c5", "d4f4", "c5e5", "h4h6", "e5f6", "f3e2", "b8c8", "h6h4" ];

            for (let i = 0; i < lans.length - 1; i++){
                makeMove(b, lans[i], undefined);
            }
            makeMove(b, lans[lans.length - 1], {
                termination: "fifty move rule", winner: Side.None
            });
        });
    });
}
