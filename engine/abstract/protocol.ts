import type { ThinkStats } from "../utils.js";
import type { BotProcess } from "./bot-process.js";

export abstract class BotProtocol {
    protected bot: BotProcess;
    private thinkStats: { [depth: number]: ThinkStats };
    private currDepth: number;

    constructor(botProcess: BotProcess){
        this.bot = botProcess;
        this.thinkStats = {};
        this.currDepth = -1;
    }

    protected updateThinkStats(stats: ThinkStats){
        if (stats.depth)
            this.currDepth = stats.depth;
        const currStats: ThinkStats | undefined = this.thinkStats[this.currDepth];
        if (currStats){
            Object.assign(currStats, stats);
        }else{
            this.thinkStats[this.currDepth] = stats;
        }
    }

    public getThinkStats(){
        return this.thinkStats[this.currDepth];
    }

    public resetThinkStats(){
        this.thinkStats = {};
    }

    public static async isAssignableTo(botProcess: BotProcess, timeoutMs: number){}
    public setFEN(fen: string){}
    public playMove(lan: string){}
    public async thinkFor(ms: number, timeoutPaddingMs: number){}
}
