import { fileURLToPath } from "node:url";

export const GRAPHICS_DIR = fileURLToPath(new URL("./graphics/", import.meta.url));

export * from "./engine/index.js";
export * from "./game/index.js";
export * from "./pgn/index.js";
