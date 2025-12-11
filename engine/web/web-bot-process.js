
import { AbstractBotProcess } from "../abstract/abstract-bot-process.js";

// A wrapper class for communicating with a UCI-compliant Hyper Chess engine.

export class WebBotProcess extends AbstractBotProcess {
    constructor(path, onReadLine = () => 0){
        super(onReadLine);
        this.workerPath = path;
        this.start();
    }

    start(){
        if (this.worker)
            this.stop();

        super.start();

        this.worker = new Worker(this.workerPath);
        this.worker.onerror = (err) => {
            this.running = false;
            throw new Error(`Could not start hyper chess bot web worker: ${err.message}`);
        }
        this.worker.onmessageerror = (err) => {
            throw new Error(err);
        }
    }

    stop(){
        if (!this.worker)
            return;
        
        super.stop();
        this.worker.terminate();
    }

    write(cmd){
        super.write(cmd);
        this.worker.postMessage(cmd);
    }
}
