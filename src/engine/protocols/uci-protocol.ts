import { BotProtocol, trySetOptionValue } from "../abstract/protocol.js";
import { StartingFen } from "../../game/board.js";
import { readWords } from "./utils.js";
import type { BotProcess } from "../abstract/bot-process.js";
import { EngineOption, GameTime, Score, SetOptionStatus } from "../utils.js";
import { Lan } from "../../game/coords.js";

const optionPropertyNames = new Set([ "name", "option", "default", "min", "max", "var" ]);

export class UCIBotProtocol extends BotProtocol {
    private startFen: string = "";
    private moves: string[] = [];

    constructor(botProcess: BotProcess){
        super(botProcess);
        this.setFen(StartingFen);
        botProcess.addReadLineListener(line => this.readThinkStats(line));
    }

    private readThinkStats(line: string): void {
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
        }else if (line.startsWith("option")){
            const out = buildEngineOption(line);
            if (out.status === "ok"){
                this.options[out.option.name] = out.option;
            }else{
                console.warn("error when interpreting line", line, ": ", out.msg);
            }
        }
    }

    public setFen(fen: string, moves: Lan[] = []): void {
        this.moves = moves;
        this.startFen = fen;
        if (this.moves.length == 0)
            this.bot.write(`position fen ${fen}`);
        else
            this.bot.write(`position fen ${fen} moves ${this.moves.join(" ")}`);
    }

    public playMove(lan: Lan): void {
        this.moves.push(lan);
        this.bot.write(`position fen ${this.startFen} moves ${this.moves.join(" ")}`);
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

    public override setOption(name: string, value?: unknown): SetOptionStatus {
        // always write the option anyway (lenience)
        if (value)
            this.bot.write(`setoption ${name} value ${value}`);
        else
            this.bot.write(`setoption ${name}`);

        const option = this.options[name];

        // ensuring option exists
        if (!option)
            return { status: "error", msg: "option does not exist" };

        // ensuring value is valid
        const res = trySetOptionValue(option, value);
        if (res.status === "ok"){
            
            return { status: "ok" };
        }else{
            return { status: "error", msg: res.msg };
        }
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

function buildEngineOption(line: string): { status: "ok", option: EngineOption } | { status: "error", msg: string } {
    const words = line.split(" ");
    const lastTypeIdx = words.lastIndexOf("type");

    // builds up all of the properties defining the option in "fields"
    // special case for vars which is stored outside of fields
    const fields: Record<string, string> = {};
    const vars: string[] = [];
    let varVal: string | null = null;
    let currField: string | undefined;
    for (let i = 1; i < words.length; i++){
        const w = words[i]!;

        // rhs of && handles cases where name has "type" anywhere
        if (optionPropertyNames.has(w) && (w != "type" || i === lastTypeIdx)){
            currField = w;

            // if before this property we were looking for var, we can add it to the array...
            if (varVal){
                vars.push(varVal);
                varVal = null;
            }
        }else if (currField === "var"){
            // special case for var properties which go into the array
            if (varVal)
                varVal += " " + w;
            else
                varVal = w;
        }else if (currField){
            if (fields[currField])
                fields[currField] += " " + w;
            else
                fields[currField] = w;
        }else{
            // unrecognized
        }
    }

    const name = fields["name"];
    const type = fields["type"];
    if (!name || !type)
        return { status: "error", msg: "name or type not defined" };

    let option: EngineOption | null = null;

    if (type === "button"){
        option = { type: "action", name };
    }else if (type === "spin"){
        let v: number | null = Number(fields["default"]);
        const min = Number(fields["min"]);
        const max = Number(fields["max"]);
        if (isNaN(v))
            v = null;
        option = { type: "number", name, value: v };
        if (!isNaN(min)) option.min = min;
        if (!isNaN(max)) option.max = max;
    }else if (type === "check"){
        let v: string | undefined | null = fields["default"];
        if (v !== "true" && v !== "false")
            v = null;
        option = { type: "boolean", name, value: v ? v === "true" : null };
    }else if (type === "combo"){
        let v: string | undefined | null = fields["default"];
        if (!v || v && !vars.includes(v))
            v = null;
        option = { type: "choice", name, value: v, choices: vars };
    }else if (type === "string"){
        let v: string | undefined | null = fields["default"];
        if (!v)
            v = null;
        option = { type: "text", name, value: v };
    }

    if (!option)
        return { status: "error", msg: "unrecognized type" };

    return { status: "ok", option };
}
