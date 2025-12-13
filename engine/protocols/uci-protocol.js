
import { AbstractBotProtocol } from "../abstract/abstract-protocol";
import { StartingFEN } from "../../game/board";

export class UCIBotProtocol extends AbstractBotProtocol {
    constructor(botProcess){
        super(botProcess);
        this.startFEN = "";
        this.moves = [];
        this.setFEN(StartingFEN);
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

    setFEN(fen){
        this.startFEN = fen;
        this.bot.write(`position fen ${fen}`);
    }

    playMove(lan){
        this.moves.push(lan);
        this.bot.write(`position fen ${this.startFEN} moves ${this.moves.join(" ")}`);
    }

    async thinkFor(ms, timeoutPaddingMs = 500){
        const line = await this.bot.prompt(`go movetime ${ms}`, "bestmove", ms + timeoutPaddingMs);
        return line.trim().split(" ").filter(v => v.length > 0)[1];
    }
}
