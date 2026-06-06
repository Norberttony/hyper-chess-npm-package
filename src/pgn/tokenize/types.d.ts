import { ReaderContext } from "../read/abstract-reader.ts";

export interface PgnError {
    msg: string;
    context: ReaderContext;
}

// of the form [%name value] and found in comments.
export interface CommentTag {
    name: string;
    value: string;
}

export interface PgnTagToken {
    type: "tag";
    header: string;
    value: string;
}

export interface PgnMoveNumToken {
    type: "move num";
    num: number;
    threeDots: boolean;
}

export interface PgnMoveToken {
    type: "move";
    content: string;
}

export interface PgnSanGlyphToken {
    type: "san glyph";
    content: string;
}

// Represents a Numeric Annotation Glyph (NAG) in the PGN
export interface PgnNagToken {
    type: "nag";
    id: number;
}

export interface PgnResultToken {
    type: "result";
    value: string;
}

export interface PgnCommentToken {
    type: "comment";
    content: string;
    tags: CommentTag[];
}

export interface PgnVariationToken {
    type: "variation";
    movetext: PgnMovetextToken[];
}

export interface PgnErrorToken {
    type: "error";
    partial: PartialToken;
    errors: PgnError[];
}

export type PgnMovetextToken =
    | PgnMoveNumToken
    | PgnMoveToken
    | PgnSanGlyphToken
    | PgnNagToken
    | PgnResultToken
    | PgnCommentToken
    | PgnVariationToken
    | PgnErrorToken

export type PgnToken =
    | PgnTagToken
    | PgnMovetextToken

// must apply optional fields to all parts of the discriminated union
type PartialToken =
    PgnToken extends infer T
        ? T extends { type: any }
            ? Pick<T, "type"> & Partial<Omit<T, "type">>
            : never
        : never;
