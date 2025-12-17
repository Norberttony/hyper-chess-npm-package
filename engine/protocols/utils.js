import { UCIBotProtocol } from "./uci-protocol"

export const PROTOCOLS = [ UCIBotProtocol ];

export class Score {
    constructor(value, isMate){
        this.value = parseInt(value);
        this.isMate = isMate;
    }
}

export async function assignProtocol(botProcess, timeoutMs = 1000){
    for (const prot of PROTOCOLS){
        if (await prot.isAssignableTo(botProcess, timeoutMs))
            return new prot(botProcess);
    }
    console.error("Could not find a valid protocol for bot:", botProcess);
    throw new Error("Protocol not found");
}

export function readWords(line){
    return line.trim().split(" ").filter(v => v.length > 0);
}
