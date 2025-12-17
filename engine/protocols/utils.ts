import { UCIBotProtocol } from "./uci-protocol.js";

export const PROTOCOLS = [ UCIBotProtocol ];

export function readWords(line: string): string[] {
    return line.trim().split(" ").filter(v => v.length > 0);
}
