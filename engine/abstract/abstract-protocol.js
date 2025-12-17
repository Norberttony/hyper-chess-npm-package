
export class AbstractBotProtocol {
    constructor(botProcess){
        this.bot = botProcess;
        this.thinkStats = {};
        this.currDepth = -1;
    }

    // all of the parameters are optional

    updateThinkStats({ depth, bestmove, nodes, time, pv, score }){
        if (depth)
            this.currDepth = depth;
        const newStats = {
            bestmove,
            nodes,
            time,
            pv,
            score
        };
        const stats = this.thinkStats[this.currDepth];
        if (stats){
            for (const [ k, v ] of Object.entries(newStats)){
                if (v !== undefined)
                    stats[k] = v;
            }
        }else{
            this.thinkStats[this.currDepth] = newStats;
        }
    }

    getThinkStats(){
        return this.thinkStats[this.currDepth];
    }

    resetThinkStats(){
        this.thinkStats = {};
    }

    async isAssignableTo(process){}
    setFEN(fen){}
    playMove(lan){}
    async thinkFor(ms, timeoutPaddingMs){}
}
