import { BotProcess } from "../abstract/bot-process.js";

// Handles writing to or reading from a WASM instance of the engine.

export class WebBotProcess extends BotProcess {
    private worker?: Worker;

    constructor(public workerPath: string){
        super();
        this.start();
    }

    public override get isRunning(): boolean {
        return this.worker !== undefined;
    }

    public override start(): void {
        if (this.worker)
            this.stop();

        this.worker = new Worker(this.workerPath);
        this.worker.onerror = (err) => {
            this.stop();
            throw new Error(`Could not start hyper chess bot web worker: ${err.message}`);
        }
        this.worker.onmessageerror = (err) => {
            throw err;
        }
        this.worker.onmessage = (event) => {
            this.readLine(event.data);
        }
    }

    public override stop(): void {
        if (!this.worker)
            return;
        this.worker.terminate();
        delete this.worker;
    }

    public override write(cmd: string): void {
        if (!this.isRunning)
            return;
        super.write(cmd);
        this.worker!.postMessage(cmd);
    }
}
