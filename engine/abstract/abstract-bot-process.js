
export class AbstractBotProcess {
    constructor(onReadLine = () => 0){
        // log is all of the input/output to/from the engine so far
        // input is indexed by a " > " before the line.
        this.log = "";

        this.onReadLine = onReadLine;

        this.running = false;

        // for prompt
        this.promptPrefix;
        this.onPromptSuccess;
        this.promptTimeout;
    }

    // This must be implemented in all derived classes
    start(){
        this.running = true;
    }

    // This must be implemented in all derived classes
    stop(){
        this.running = false;
    }

    // This must be implemented in all derived classes
    write(cmd){
        this.log += `> ${cmd}\n`;
    }

    // have you tried turning it off and on again?
    restart(){
        this.stop();
        this.start();
    }

    readLine(line){
        this.log += `${line}\n`;
        this.onReadLine(line);
        if (this.promptPrefix && l.startsWith(this.promptPrefix)){
            this.onPromptSuccess(l);
            clearTimeout(this.promptTimeout);
            delete this.promptPrefix;
        }
    }

    prompt(cmd, prefix, timeoutMs = undefined){
        if (this.promptPrefix)
            throw new Error("AbstractBotProcess: cannot prompt; currently responding to an earlier prompt");
        return new Promise((res, rej) => {
            this.promptPrefix = prefix;
            this.onPromptSuccess = (line) => res(line);

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
