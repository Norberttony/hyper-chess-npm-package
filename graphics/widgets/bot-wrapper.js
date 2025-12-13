
import { Board } from "../../index.js";
import { WebBotProcess } from "../../engine/web/web-bot-process.js";
import { assignProtocol } from "../../engine/protocols/index.js";

// A wrapper class for communicating with a Hyper Chess engine.

export class HyperChessBot {
    constructor(path){
        this.proc = new WebBotProcess(path);
        this.prot = assignProtocol(this.proc);
        this.fen = "";
        this.board = new Board();
    }

    setFEN(fen){
        this.prot.setFEN(fen);
        this.board.loadFEN(fen);
    }

    // thinks for ms milliseconds, and then returns the best move.
    async thinkFor(ms){
        this.prot = await this.prot;

        this.prot.thinkFor()

        return new Promise((res, rej) => {
            let t = this;

            
        });

        return new Promise((res, rej) => {
            let t = this;

            // a temporary hotfix, restart worker whenever it doesn't respond in time.
            const timeout = setTimeout(async () => {
                console.log("Hyper chess bot timed out, restarting...");
                this.restart();
                this.setFEN(this.fen);
                this.postMessage(`go movetime ${ms}`);
                t.worker.removeEventListener("message", listener);
                res(await this.thinkFor(ms));
            }, ms + 4000);

            function listener(event){
                if (event.data.startsWith("bestmove")){
                    clearTimeout(timeout);
                    t.worker.removeEventListener("message", listener);

                    const lan = event.data.split(" ")[1].trim();
                    const move = t.board.getMoveOfLAN(lan);
                    if (move){
                        t.worker.postMessage(`position moves ${lan}`);
                        const san = t.board.getMoveSAN(move);
                        res(san);
                        t.board.makeMove(move);
                    }else{
                        console.warn(`Engine's choice of ${lan} does not exist as a valid move. Output was: ${event.data}`);
                    }
                }
            }

            this.worker.addEventListener("message", listener);
            this.worker.postMessage(`go movetime ${ms}`);
        });
    }

    sendCmd(cmd){
        this.worker.postMessage(cmd);
    }

    read(callback){
        let t = this;

        function listener(event){
            if (callback(event.data))
                t.worker.removeEventListener("message", listener);
        }

        this.worker.addEventListener("message", listener);
    }

    playMove(san){
        const move = this.board.getMoveOfSAN(san);
        this.board.makeMove(move);
        this.worker.postMessage(`position moves ${move.uci}`);
    }
}
