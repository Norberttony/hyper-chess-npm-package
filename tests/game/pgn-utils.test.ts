import { expect, it } from "vitest";
import { parsePgn } from "../../src/pgn/parse/utils";
import { Pgn } from "../../src/pgn/parse/types";
import { createVariationTree } from "../../src/game/pgn-utils";

it("attaches variations to the previous node", () => {
    const pgn: Pgn = parsePgn("1. Pe4 (1. Pd4 Pd5) Pe5")!;

    const { root } = createVariationTree(pgn);

    const Pe4 = root.next[0]!;
    const Pd4 = root.next[1]!;

    expect(Pe4.pgnMove!.san).toBe("Pe4");
    expect(Pd4.pgnMove!.san).toBe("Pd4");
    expect(Pe4.prev).toBe(root);
    expect(Pd4.prev).toBe(root);
});
