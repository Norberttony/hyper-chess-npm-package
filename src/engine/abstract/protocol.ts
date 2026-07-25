import { Lan } from "../../game/coords.js";
import type { EngineOption, GameTime, ThinkStats } from "../utils.js";
import type { BotProcess } from "./bot-process.js";

export type ThinkStatsUpdateListener = (stats: ThinkStats) => any;

export abstract class BotProtocol {
    protected bot: BotProcess;
    protected thinkStats: { [depth: number]: ThinkStats } = {};
    protected currDepth: number = -1;
    protected options: { [name: string]: EngineOption } = {};

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

    public resetThinkStats(): void {
        this.thinkStats = {};
    }

    public hasOption(name: string): boolean {
        return name in this.options;
    }

    public abstract setFen(fen: string, moves: Lan[]): void;
    public abstract playMove(lan: Lan): void;
    public abstract thinkForMoveTime(ms: number, allowTimeout: boolean, timeoutPaddingMs: number): Promise<string | undefined>;
    public abstract thinkTimedGame(time: GameTime, allowTimeout: boolean, isWhite: boolean, timeoutPaddingMs: number): Promise<string | undefined>;
    public abstract thinkForDepth(depth: number): Promise<string | undefined>;
    public abstract startThink(): void;
    public abstract stopThink(): void;
    public abstract isReady(timeoutMs: number): Promise<boolean>;
    public abstract setOption(name: string, value: unknown): void;
}

export function trySetOptionValue(option: EngineOption, value: unknown): { status: "ok" } | { status: "error", msg: string } {
    const type = option.type;
    let msg: string | null = null;
    switch (type){
        case "action":
            if (value)
                msg = "value must not be set";
            break;
        case "boolean":
            if (typeof value === "boolean")
                option.value = value;
            else
                msg = "value must be boolean";
            break;
        case "choice":
            if (typeof value === "string" && option.choices.includes(value))
                option.value = value;
            else
                msg = `value must be a string and one of these choices: ${option.choices.join(", ")}`;
            break;
        case "number":
            if (typeof value === "number" && isInRange(value, option.min, option.max))
                option.value = value;
            else
                msg = `value must be a number and in between ${option.min} and ${option.max}`;
            break;
        case "text":
            if (typeof value === "string")
                option.value = value;
            else
                msg = "value must be a string";
            break;
    }

    if (!msg)
        return { status: "ok" };
    else
        return { status: "error", msg };
}

export function isInRange(n: number, min?: number, max?: number): boolean {
    if (min && n < min)
        return false;
    if (max && n > max)
        return false;
    return true;
}
