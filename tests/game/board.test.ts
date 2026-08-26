import { Board } from "../../src/game/board/board";
import { sharedBoardTests } from "../shared/shared-board";

sharedBoardTests("Board", () => new Board());
