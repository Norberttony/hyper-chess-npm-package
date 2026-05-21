import { Board } from "../../src/game/board";
import { sharedBoardTests } from "../shared/shared-board";

sharedBoardTests("Board", () => new Board());
