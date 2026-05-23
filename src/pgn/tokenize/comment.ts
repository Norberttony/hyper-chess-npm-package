import { AbstractReader } from "../read/abstract-reader.js";
import { handleCommentTag } from "./comment-tag.js";
import { PgnCommentToken, LEFT_BRACE, RIGHT_BRACE, LEFT_SQ_BRACKET, CommentTag } from "./types.js";

export function handleComment(reader: AbstractReader): PgnCommentToken {
    if (!reader.match(LEFT_BRACE))
        throw new Error(
            `handleComment got ${reader.get()} but expected ${LEFT_BRACE}`);

    const tags: CommentTag[] = [];
    reader.copyStart();
    while (!reader.isAtEnd() && reader.get() != RIGHT_BRACE){
        switch (reader.get()){
            // extract comment tags
            case LEFT_SQ_BRACKET:
                const tag: CommentTag | undefined = handleCommentTag(reader);
                if (tag)
                    tags.push(tag);
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
        content,
        tags,
    };
}
