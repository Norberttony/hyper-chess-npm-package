# Hyper Chess NPM Package
This project is written in TypeScript. Contains the necessary tools and utilities for generating moves, checking legality, getting and setting FEN and PGN formats, communicating with hyper chess engines, and displaying a graphical interface for the board.

## Install
To install the package run this command:
```bash
npm install hyper-chess-board
```

## Examples
The most powerful objects are Board and BoardGraphics. Board is meant as a low-level interface to move generation and legality checking.
```ts
import { Board, Move, Lan } from "hyper-chess-board";

const board: Board = new Board();
// load FEN
board.loadFen("2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45");
// generate all legal moves
const moves: Move[] = board.generateMoves();
// play the first move
const first: Move = moves[0]!;
board.makeMove(first);
// print the new FEN
console.log(board.getFen());
// undo the move
board.unmakeMove(first);
// choose a specific move to play using long algebraic notation (Lan)
const move = board.getMoveOfLan("g4d7" as Lan)!;
board.makeMove(move);

// checking if the game has ended on the board
const res: GameResult | undefined = board.isGameOver();
```

BoardGraphics generates and updates an interactive user interface for controlling the underlying board state. It's capable of storing and traversing variations. Be sure to include all of the relevant CSS files in your HTML page, located under ./graphics

```ts
import { BoardGraphics, PgnWidget } from "hyper-chess-board/graphics";

const boardGraphics: BoardGraphics = new BoardGraphics(true, true, document.body);
new PgnWidget(boardGraphics, "Right");

// load FEN and display it
boardGraphics.loadFen("2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 0 45");
boardGraphics.display();

// load a PGN game and display it
boardGraphics.loadPgn(`[Date "2025.12.03"]
[Round "3.1"]
[Event "Test Battle"]
[Site "Hyper Chess Battle Ring"]
[White "orderfirst-fix-779653cadeb9c6f3203f78dc805926ee437cf618"]
[Black "check-moves-bonus-0753cae7970560e5b04f3c4a1ede23a54c39fa0b"]
[Result "1-0"]
[Termination "checkmate"]
[TimeControl "0.6666666666666666+0.4"]
[FEN "unb1kbnr/pp1pq1pp/2p5/p7/P4P1P/5UP1/1PPP4/RNBQKBN1 b 9 9"]
[Variant "From Position"]

9... Pbb5 10. Pbb4 Pgg6 11. Pd5 Pcb6 12. Pe5 Pd4 13. Qd3 Qc5 14. Qxd2 Qxd6 15. Pf6 Pc6 16. Pxh6 Qxc7 17. Pc5 Qd6 18. Ug4 Kd8 19. Qb4 Be8 20. Phh5 Qxe7 21. Qxc3 Qf8 22. Pf7 Pg5 23. Qc5 Bed7 24. Qd5 Pc3 25. Uf4 Nc7 26. Qe6 Bd5 27. Nd3 Bc6 28. Uf6 Qb4 29. Ug7 Qxc4 30. Nd6 Nxe5 31. Qxe7+ Kd7 32. Bcf4 Kxe7 33. Uf8 Rd4+ 34. Nxc5 Qe6 35. Rxa6+ B8b7 36. Bf6# 1-0
`);
boardGraphics.display();

```

