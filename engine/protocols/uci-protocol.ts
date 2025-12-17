import { BotProtocol } from "../abstract/protocol.js";
import { StartingFEN } from "../../game/board.js";
import { readWords } from "./utils.js";
import type { BotProcess } from "../abstract/bot-process.js";
import { GameTime, Score } from "../utils.js";

export class UCIBotProtocol extends BotProtocol {
    private startFEN: string = "";
    private moves: string[] = [];

    constructor(botProcess: BotProcess){
        super(botProcess);
        this.setFEN(StartingFEN);
        botProcess.addReadLineListener(line => this.#readThinkStats(line));
    }

    #readThinkStats(line: string): void {
        const words = readWords(line);
        if (line.startsWith("info")){
            this.updateThinkStats({
                depth: parseInt(extractInfo(line, "depth")),
                score: extractScore(line),
                nodes: parseInt(extractInfo(line, "nodes")),
                time:  parseInt(extractInfo(line, "time")),
                pv: extractPV(line)
            });
        }else if (line.startsWith("bestmove")){
            this.updateThinkStats({ bestmove: words[1]! });
        }else if (line.startsWith("id")){
            if (words[1] == "name"){
                words.splice(0, 2);
                this.setEngineName(words.join(" "));
            }else if (words[1] == "author"){
                words.splice(0, 2);
                this.setAuthorName(words.join(" "));
            }
        }
    }

    public setFEN(fen: string): void {
        this.startFEN = fen;
        this.bot.write(`position fen ${fen}`);
    }

    public playMove(lan: string): void {
        this.moves.push(lan);
        this.bot.write(`position fen ${this.startFEN} moves ${this.moves.join(" ")}`);
    }

    public override async thinkForMoveTime(ms: number , allowTimeout = false, timeoutPaddingMs = 500): Promise<string | undefined> {
        let timeoutMs: number | undefined = undefined;
        if (allowTimeout)
            timeoutMs = ms + timeoutPaddingMs;
        await this.bot.prompt(`go movetime ${ms}`, "bestmove", timeoutMs);
        return this.getThinkStats().bestmove;
    }

    public override async thinkTimedGame(time: GameTime, allowTimeout = false, isWhite = false, timeoutPaddingMs = 500): Promise<string | undefined> {
        let timeoutMs: number | undefined = undefined;
        if (allowTimeout)
            timeoutMs = (isWhite ? time.wtime : time.btime) + timeoutPaddingMs;
        await this.bot.prompt(`go wtime ${time.wtime} btime ${time.btime} winc ${time.winc} binc ${time.binc}`, "bestmove", timeoutMs);
        return this.getThinkStats().bestmove;
    }

    public override async thinkForDepth(depth: number): Promise<string | undefined> {
        await this.bot.prompt(`go depth ${depth}`, "bestmove");
        return this.getThinkStats().bestmove;
    }

    public override startThink(): void {
        this.bot.write("go");
    }

    public override stopThink(): void {
        this.bot.write("stop");
    }

    public override async isReady(timeoutMs: number = 1000): Promise<boolean> {
        try {
            await this.bot.prompt(`uciready`, `uciok`, timeoutMs);
        }
        catch(err){
            return false;
        }
        return true;
    }
}

// to-do: this function assumes that the info line is formatted without any
// unnecessary spaces between the words. This should be fixed to allow for
// such spaces
function extractInfo(line: string, name: string): string {
    const idx = line.indexOf(` ${name} `);
    if (idx == -1)
        return "";

    const leftSpace = idx + 1 + name.length;
    const rightSpace = line.indexOf(" ", leftSpace + 1);
    return line.substring(leftSpace + 1, rightSpace);
}

function extractPV(line: string): string {
    const idx = line.indexOf(" pv ");
    return line.substring(idx + 4).trim();
}

function extractScore(line: string): Score | undefined {
    const mateScore = parseInt(extractInfo(line, "score mate"));
    const cpScore = parseInt(extractInfo(line, "score cp"));
    if (mateScore)
        return { value: mateScore, isMate: true };
    else if (cpScore)
        return { value: cpScore, isMate: false };
    else
        return undefined;
}
