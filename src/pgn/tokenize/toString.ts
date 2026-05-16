import { PgnToken } from "./types.js";

export function pgnTokenToString(token: PgnToken): string {
    if (token.type == "move")
        return token.content;
    else if (token.type == "move num")
        return `${token.num}${token.threeDots ? "..." : "."}`;
    else if (token.type == "result")
        return token.value;
    else if (token.type == "tag")
        return `[${token.header} "${token.value}"]`;
    return "";
}
