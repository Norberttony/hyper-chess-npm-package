export type onReadLineListener = (line: string) => any;

// start, stop, and write should be overridden in the derived classes.

export abstract class BotProcess {
    // log is all of the input/output to/from the engine so far
    // input is indexed by a " > " before the line.
    private log: string = "";
    private readListeners: onReadLineListener[] = [];

    // for prompt
    private promptPrefix?: string;
    private onPromptSuccess?: onReadLineListener;
    private promptTimeout?: NodeJS.Timeout;

    constructor(){}

    public abstract get isRunning(): boolean;
    public abstract start(): void;
    public abstract stop(): void;

    #onReadLine(line: string): void {
        for (const l of this.readListeners)
            l(line);
    }

    public addReadLineListener(listener: onReadLineListener): void {
        this.readListeners.push(listener);
    }

    public write(cmd: string): void {
        this.log += `> ${cmd}\n`;
    }

    // have you tried turning it off and on again?
    public restart(): void {
        this.stop();
        this.start();
    }

    protected readLine(line: string): void {
        this.log += `${line}\n`;
        this.#onReadLine(line);
        if (this.promptPrefix && line.startsWith(this.promptPrefix)){
            if (this.onPromptSuccess)
                this.onPromptSuccess(line);
            clearTimeout(this.promptTimeout);
            delete this.promptPrefix;
        }
    }

    public prompt(cmd: string, prefix: string, timeoutMs: number | undefined = undefined): Promise<string> {
        if (this.promptPrefix)
            throw new Error("AbstractBotProcess: cannot prompt; currently responding to an earlier prompt");
        return new Promise((res, rej) => {
            this.promptPrefix = prefix;
            this.onPromptSuccess = (line: string) => res(line);

            if (timeoutMs !== undefined){
                this.promptTimeout = setTimeout(() => {
                    console.error(`Prompt ${cmd} failed to achieve prefix ${prefix} after ${timeoutMs}ms`);
                    console.error(this.log);
                    delete this.promptPrefix;
                    rej();
                }, timeoutMs);
            }

            this.write(cmd);
        });
    }
}
