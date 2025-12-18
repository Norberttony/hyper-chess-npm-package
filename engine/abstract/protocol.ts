import { LAN } from "../../game/coords.js";
import type { GameTime, ThinkStats } from "../utils.js";
import type { BotProcess } from "./bot-process.js";

type ThinkStatsUpdateListener = (stats: ThinkStats) => any;

export abstract class BotProtocol {
    protected bot: BotProcess;
    protected thinkStats: { [depth: number]: ThinkStats } = {};
    protected currDepth: number = -1;

    private thinkStatsUpdateListeners: ThinkStatsUpdateListener[] = [];

    private engineName: string = "???";
    private authorName: string = "???";

    constructor(botProcess: BotProcess){
        this.bot = botProcess;
        this.bot.start();
    }

    protected setEngineName(name: string): void {
        this.engineName = name;
    }

    protected setAuthorName(name: string): void {
        this.authorName = name;
    }

    public getEngineName(): string {
        return this.engineName;
    }

    public getAuthorName(): string {
        return this.authorName;
    }

    public addThinkStatsUpdateListener(listener: ThinkStatsUpdateListener){
        this.thinkStatsUpdateListeners.push(listener);
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
        for (const l of this.thinkStatsUpdateListeners)
            l(this.thinkStats[this.currDepth]!);
    }

    public getThinkStats(): ThinkStats {
        return this.thinkStats[this.currDepth] || {};
    }

    public resetThinkStats(){
        this.thinkStats = {};
    }

    public abstract setFEN(fen: string, moves: LAN[]): void;
    public abstract playMove(lan: LAN): void;
    public abstract thinkForMoveTime(ms: number, allowTimeout: boolean, timeoutPaddingMs: number): Promise<string | undefined>;
    public abstract thinkTimedGame(time: GameTime, allowTimeout: boolean, isWhite: boolean, timeoutPaddingMs: number): Promise<string | undefined>;
    public abstract thinkForDepth(depth: number): Promise<string | undefined>;
    public abstract startThink(): void;
    public abstract stopThink(): void;
    public abstract isReady(timeoutMs: number): Promise<boolean>;
}
