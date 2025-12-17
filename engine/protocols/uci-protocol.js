import { BotProtocol } from "../abstract/protocol.js";
import { StartingFEN } from "../../game/board.js";
import { readWords, Score } from "./utils.js";

export class UCIBotProtocol extends BotProtocol {
    constructor(botProcess){
        super(botProcess);
        this.startFEN = "";
        this.moves = [];
        this.setFEN(StartingFEN);

        botProcess.addReadLineListener(line => this.#readThinkStats(line));
    }

    // tries to perform a handshake and figure out what protocol this engine uses
    // for now only UCI is supported
    static async isAssignableTo(botProcess, timeoutMs = 1000){
        try {
            await botProcess.prompt("uci", "uciok", timeoutMs);
            return true;
        }
        catch(err){
            return false;
        }
    }

    #readThinkStats(line){
        const words = readWords(line);
        if (line.startsWith("info")){
            this.updateThinkStats({
                depth: extractInfo(line, "depth"),
                score: extractScore(line),
                nodes: extractInfo(line, "nodes"),
                time: extractInfo(line, "time"),
                pv: extractPV(line)
            });
        }else if (line.startsWith("bestmove")){
            this.updateThinkStats({ bestmove: words[1] });
        }
    }

    setFEN(fen){
        this.startFEN = fen;
        this.bot.write(`position fen ${fen}`);
    }

    playMove(lan){
        this.moves.push(lan);
        this.bot.write(`position fen ${this.startFEN} moves ${this.moves.join(" ")}`);
    }

    async thinkForMoveTime(ms, allowTimeout = false, timeoutPaddingMs = 500){
        let timeoutMs = undefined;
        if (allowTimeout)
            timeoutMs = ms + timeoutPaddingMs;
        await this.bot.prompt(`go movetime ${ms}`, "bestmove", timeoutMs);
        return this.thinkStats.bestmove;
    }

    async thinkTimedGame(wtime, btime, winc, binc, allowTimeout = false, timeoutPaddingMs = 500){

    }

    async thinkForDepth(depth){

    }
}

// to-do: this function assumes that the info line is formatted without any
// unnecessary spaces between the words. This should be fixed to allow for
// such spaces
function extractInfo(line, name){
    const idx = line.indexOf(` ${name} `);
    if (idx == -1)
        return;

    const leftSpace = idx + 1 + name.length;
    const rightSpace = line.indexOf(" ", leftSpace + 1);
    return line.substring(leftSpace + 1, rightSpace);
}

function extractPV(line){
    const idx = line.indexOf(" pv ");
    return line.substring(idx + 4).trim();
}

function extractScore(line){
    const mateScore = extractInfo(line, "score mate");
    const cpScore = extractInfo(line, "score cp");
    if (mateScore)
        return new Score(mateScore, true);
    else if (cpScore)
        return new Score(cpScore, false);
    else
        return undefined;
}
