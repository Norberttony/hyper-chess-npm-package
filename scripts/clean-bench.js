import { rmSync } from "fs";

rmSync("dist-bench", {
  recursive: true,
  force: true,
});
