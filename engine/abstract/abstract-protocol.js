
export class AbstractBotProtocol {
    constructor(botProcess){
        this.bot = botProcess;
    }

    async isAssignableTo(process){}
    setFEN(fen){}
    playMove(lan){}
    async thinkFor(ms, timeoutPaddingMs){}
}
