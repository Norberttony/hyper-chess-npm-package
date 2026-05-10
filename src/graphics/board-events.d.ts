export type PlayerNamesEvent        = CustomEvent<{ whiteName: string, blackName: string }>;
export type LoadFENEvent            = CustomEvent<{ fen: string }>;
export type SingleScrollEvent       = CustomEvent<{ prevVariation: VariationMove, variation: VariationMove, userInput: boolean }>;
export type VariationChangeEvent    = CustomEvent<{ variation: VariationMove }>;
export type ResultEvent             = CustomEvent<{ turn: Side, termination: string, winner: Side }>;
export type DeleteVariationEvent    = CustomEvent<{ variation: VariationMove }>;
export type NewVariationEvent       = CustomEvent<{ variation: VariationMove }>;
export type FlipEvent               = CustomEvent<undefined>;

declare global {

    interface GlobalEventHandlersEventMap {
        "player-names":     PlayerNamesEvent,
        "loadFEN":          LoadFENEvent,
        "single-scroll":    SingleScrollEvent,
        "variation-change": VariationChangeEvent,
        "result":           ResultEvent,
        "delete-variation": DeleteVariationEvent,
        "new-variation":    NewVariationEvent,
        "flip":             FlipEvent
    }
};

export {}
