// Evaluation for a position
export interface Score {
    value: number,
    isMate: boolean
};

// The engine's thinking data
export interface ThinkStats {
    depth?: number | undefined,
    bestmove?: string | undefined,
    nodes?: number | undefined,
    time?: number | undefined,
    pv?: string | undefined,
    score?: Score | undefined
};

export interface GameTime {
    wtime: number,
    winc: number,
    btime: number,
    binc: number
};
