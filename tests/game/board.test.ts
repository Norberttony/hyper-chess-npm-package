import { Board } from "../../src/game/board";
import { sharedBoardTests } from "../shared/shared-board";

sharedBoardTests(() => new Board());
