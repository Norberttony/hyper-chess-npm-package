
import { assignProtocol } from ".";

export class BotCommunicator {
    constructor(botProcess){
        this.proc = botProcess;
        this.prot = assignProtocol(botProcess, 1000);

        this.queuedPromises = [];
    }
}
