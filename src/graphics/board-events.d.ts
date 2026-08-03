import type { VariationMove, VariationNode } from "../game/variation.js";

export type PlayerNamesEvent        = CustomEvent<{ whiteName: string | undefined, blackName: string | undefined }>;
export type LoadFenEvent            = CustomEvent<{ fen: string }>;
export type SingleScrollEvent       = CustomEvent<{ prevVariation: VariationNode, variation: VariationNode, userInput: boolean }>;
export type VariationChangeEvent    = CustomEvent<{ variation: VariationNode }>;
export type ResultEvent             = CustomEvent<{ turn: Side, termination: string, winner: Side }>;
export type DeleteVariationEvent    = CustomEvent<{ variation: VariationMove }>;
export type NewVariationEvent       = CustomEvent<{ variation: VariationMove }>;
export type FlipEvent               = CustomEvent<undefined>;
export type AnnotationChangeEvent   = CustomEvent<{ variation: VariationMove }>;

export type EventDetail<T> = T extends CustomEvent<infer D> ? D : never;

declare global {
    interface GlobalEventHandlersEventMap {
        "player-names":     PlayerNamesEvent,
        "loadFen":          LoadFenEvent,
        "single-scroll":    SingleScrollEvent,
        "variation-change": VariationChangeEvent,
        "result":           ResultEvent,
        "delete-variation": DeleteVariationEvent,
        "new-variation":    NewVariationEvent,
        "flip":             FlipEvent,
        "annotation":       AnnotationChangeEvent,
    }
};

export {}
