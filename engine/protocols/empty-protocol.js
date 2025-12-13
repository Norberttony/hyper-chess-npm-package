

import { AbstractBotProtocol } from "../abstract/abstract-protocol";

export class EmptyBotProtocol extends AbstractBotProtocol {
    constructor(botProcess){
        super(botProcess);
        this.queuedCalls = [];

        const t = this;

        // intercepts all method calls and stores them in queuedCalls
        this.proxy = new Proxy(this, {
            get(obj, prop, rec){
                const value = Reflect.get(obj, prop, rec);
                console.log("get", obj, "[", prop, "]", value);
                if (typeof value === "function"){
                    console.log(prop, ...args);

                    const call = {
                        method: value.bind(rec),
                        args,
                        res: undefined,
                        rej: undefined
                    };
                    return new Promise((res, rej) => {
                        call.res = res;
                        call.rej = rej;
                        t.queuedCalls.push(call);
                    });
                }

                return value;
            }
        });
    }

    // tries to perform a handshake and figure out what protocol this engine uses
    // for now only UCI is supported
    static async isAssignableTo(botProcess, timeoutMs = 1000){
        return true;
    }
}
