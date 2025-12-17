import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { BotProcess } from "../abstract/bot-process.js";

export class ExeBotProcess extends BotProcess {
    private broken: string = "";
    private proc?: ChildProcessWithoutNullStreams;

    constructor(public path: string){
        super();
        this.start();
    }
    
    // internal function that separates out stdout into complete lines.
    #getLines(stdoutData: string): void {
        // stdout data might have multiple lines, and the last line might be cut off.
        const lines = (this.broken + stdoutData).split("\r\n");
        if (!stdoutData.endsWith("\r\n") || lines[lines.length - 1] == "")
            this.broken = lines.pop()!;

        for (const l of lines)
            this.readLine(l);
    }

    public override start(): void {
        super.start();
        this.proc = spawn(this.path);

        // broken keeps track of "broken" lines (see #getLines)
        this.broken = "";

        this.proc.stdout.on("data", (data) => {
            this.#getLines(data.toString());
        });

        this.proc.on("error", (err: Error) => {
            throw err;
        });
    }

    // kills the process. Must be run when done interacting with the ExeBotProcess instance.
    public override stop(): void {
        if (this.proc){
            super.stop();
            this.proc.kill();
            delete this.proc;
        }
    }

    // returns nothing, can error.
    // feeds the command cmd as the engine's input
    // errors if the process is not currently running
    public override write(cmd: string): void {
        super.write(cmd);
        if (this.proc)
            this.proc.stdin.write(`${cmd}\n`);
        else
            throw new Error("ExeBotProcess: cannot .write(cmd) when the engine process is not running");
    }
}
