import { VariationsBoard } from "../../src/game/variations-board";
import { sharedBoardTests } from "../shared/shared-board";
import { sharedVariationsBoardTests } from "../shared/shared-variations-board";

sharedBoardTests("VariationsBoard", () => new VariationsBoard());
sharedVariationsBoardTests("VariationsBoard", () => new VariationsBoard());
