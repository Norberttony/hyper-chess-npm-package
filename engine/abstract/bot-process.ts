export abstract class BotProcess {
    // log is all of the input/output to/from the engine so far
    // input is indexed by a " > " before the line.
    private log: string = "";
    private readListeners: Function[] = [];
    #isRunning: boolean = false;

    // for prompt
    private promptPrefix?: string;
    private onPromptSuccess?: Function;
    private promptTimeout?: number;

    constructor(){}

    public get isRunning(){
        return this.#isRunning;
    }

    #onReadLine(line: string){
        for (const l of this.readListeners)
            l(line);
    }

    addReadLineListener(listener: Function){
        this.readListeners.push(listener);
    }

    // This must be implemented in all derived classes
    start(){
        this.#isRunning = true;
    }

    // This must be implemented in all derived classes
    stop(){
        this.#isRunning = false;
    }

    // This must be implemented in all derived classes
    write(cmd: string){
        this.log += `> ${cmd}\n`;
    }

    // have you tried turning it off and on again?
    restart(){
        this.stop();
        this.start();
    }

    readLine(line: string){
        this.log += `${line}\n`;
        this.#onReadLine(line);
        if (this.promptPrefix && line.startsWith(this.promptPrefix)){
            if (this.onPromptSuccess)
                this.onPromptSuccess(line);
            clearTimeout(this.promptTimeout);
            delete this.promptPrefix;
        }
    }

    prompt(cmd: string, prefix: string, timeoutMs = undefined){
        if (this.promptPrefix)
            throw new Error("AbstractBotProcess: cannot prompt; currently responding to an earlier prompt");
        return new Promise((res, rej) => {
            this.promptPrefix = prefix;
            this.onPromptSuccess = (line: string) => res(line);

            if (timeoutMs !== undefined){
                this.promptTimeout = setTimeout(() => {
                    console.error(`Prompt ${cmd} failed to achieve prefix ${prefix} after ${timeoutMs}ms`);
                    delete this.promptPrefix;
                    rej();
                }, timeoutMs);
            }

            this.write(cmd);
        });
    }
}
