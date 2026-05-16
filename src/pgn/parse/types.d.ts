export interface PgnHeaders {
    [k: string]: string;
}

export interface Pgn {
    headers: PgnHeaders;
    moves: string[];
    result: string;
}
