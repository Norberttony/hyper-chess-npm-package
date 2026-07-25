import { expect, it, describe } from "vitest";
import { buildEngineOption } from "../../../src/engine/protocols/uci-protocol";
import { EngineOption } from "../../../src/engine/utils";

describe("UCI bot protocol", () => {
    describe("handles engine options", () => {
        it("interprets type spin", () => {
            expect(buildEngineOption("option name Hash type spin default 32 min 0 max 64")).toEqual({
                status: "ok",
                option: {
                    type: "number",
                    name: "Hash",
                    value: 32,
                    min: 0,
                    max: 64,
                } as EngineOption,
            });
        });

        it("interprets type check", () => {
            expect(buildEngineOption("option name Nullmove type check default true")).toEqual({
                status: "ok",
                option: {
                    type: "boolean",
                    name: "Nullmove",
                    value: true,
                } as EngineOption,
            });
        });

        it("interprets type combo", () => {
            expect(buildEngineOption("option name Style type combo default Normal var Solid var Normal var Risky")).toEqual({
                status: "ok",
                option: {
                    type: "choice",
                    name: "Style",
                    value: "Normal",
                    choices: [ "Solid", "Normal", "Risky" ],
                } as EngineOption,
            });
        });

        it("interprets type string", () => {
            expect(buildEngineOption("option name NalimovPath type string default c:\\")).toEqual({
                status: "ok",
                option: {
                    type: "text",
                    name: "NalimovPath",
                    value: "c:\\",
                } as EngineOption,
            });
        });

        it("interprets type button", () => {
            expect(buildEngineOption("option name Clear Hash type button")).toEqual({
                status: "ok",
                option: {
                    type: "action",
                    name: "Clear Hash",
                } as EngineOption,
            });
        });
    });
});
