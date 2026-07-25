// Evaluation for a position
export interface Score {
    value: number;
    isMate: boolean;
}

// The engine's thinking data
export interface ThinkStats {
    depth?: number | undefined;
    bestmove?: string | undefined;
    nodes?: number | undefined;
    time?: number | undefined;
    pv?: string | undefined;
    score?: Score | undefined;
}

export interface GameTime {
    wtime: number;
    winc: number;
    btime: number;
    binc: number;
}

// Represents settable options
export type EngineOption =
    | NumericOption
    | BooleanOption
    | ChoiceOption
    | TextOption
    | ActionOption

export interface EngineOptionBase {
    name: string;
}

export interface NumericOption extends EngineOptionBase {
    type: "number";
    value: number | null;
    min?: number;
    max?: number;
}

export interface BooleanOption extends EngineOptionBase {
    type: "boolean";
    value: boolean | null;
}

export interface ChoiceOption extends EngineOptionBase {
    type: "choice";
    value: string | null;
    choices: readonly string[];
}

export interface TextOption extends EngineOptionBase {
    type: "text";
    value: string | null;
}

export interface ActionOption extends EngineOptionBase {
    type: "action";
}

interface SetOptionStatusOk {
	status: "ok";
}

interface SetOptionStatusError {
	status: "error";
    msg: string;
}

export type SetOptionStatus =
	| SetOptionStatusOk
	| SetOptionStatusError
