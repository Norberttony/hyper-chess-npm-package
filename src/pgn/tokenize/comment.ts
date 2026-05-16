import { AbstractReader } from "../read/abstract-reader.js";
import { PgnCommentToken, LEFT_BRACE, RIGHT_BRACE, LEFT_SQ_BRACKET, RIGHT_SQ_BRACKET } from "./types.js";

export function handleComment(reader: AbstractReader): PgnCommentToken {
    if (!reader.match(LEFT_BRACE))
        throw new Error(
            `handleComment got ${reader.get()} but expected ${LEFT_BRACE}`);

    reader.copyStart();

    while (!reader.isAtEnd() && reader.get() != RIGHT_BRACE){
        switch (reader.get()){
            // ignore anything surrounded by square brackets in comments
            case LEFT_SQ_BRACKET:
                while (!reader.isAtEnd() && reader.get() != RIGHT_SQ_BRACKET)
                    reader.advance();
                reader.advance();
                break;
            default:
                reader.advance();
        }
    }

    const content: string = reader.copyEnd();

    // skip right brace
    reader.advance();

    return {
        type: "comment",
        content
    };
}
