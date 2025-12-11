
import { spawn } from "node:child_process";
import { AbstractBotProcess } from "../abstract/abstract-bot-process.js";


export class ExeBotProcess extends AbstractBotProcess {
    constructor(path, onReadLine = () => 0){
        super(onReadLine);
        this.path = path;
        this.start();
    }
    
    // internal function that separates out stdout into complete lines.
    #getLines(stdoutData){
        // stdout data might have multiple lines, and the last line might be cut off.
        const lines = (this.broken + stdoutData).split("\r\n");
        if (!stdoutData.endsWith("\r\n") || lines[lines.length - 1] == "")
            this.broken = lines.pop();

        for (const l of lines)
            this.readLine(l);
    }

    start(){
        super.start();
        this.proc = spawn(this.path);

        // broken keeps track of "broken" lines (see #getLines)
        this.broken = "";

        this.proc.stdout.on("data", (data) => {
            this.#getLines(data.toString());
        });

        this.proc.on("error", (err) => {
            throw new Error(err);
        });
    }

    // kills the process. Must be run when done interacting with the ExeBotProcess instance.
    stop(){
        if (this.proc){
            super.stop();
            this.proc.kill();
            delete this.proc;
            delete this.promptPrefix;
            clearTimeout(this.promptTimeout);
        }
    }

    // returns nothing, can error.
    // feeds the command cmd as the engine's input
    // errors if the process is not currently running
    write(cmd){
        super.write(cmd);
        if (this.proc)
            this.proc.stdin.write(`${cmd}\n`);
        else
            throw new Error("ExeBotProcess: cannot .write(cmd) when the engine process is not running");
    }
}
