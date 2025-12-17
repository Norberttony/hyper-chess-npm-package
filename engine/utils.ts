// Evaluation for a position
export interface Score {
    value: number,
    isMate: boolean
};

// The engine's thinking data
export interface ThinkStats {
    depth?: number,
    bestmove?: string,
    nodes?: number,
    time?: number,
    pv?: string,
    score?: Score
};

export interface GameTime {
    wtime: number,
    winc: number,
    btime: number,
    binc: number
};
