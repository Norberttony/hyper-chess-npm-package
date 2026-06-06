import { AbstractReader } from "../read/abstract-reader.js";
import { handleCommentTag } from "./comment-tag.js";
import type { PgnCommentToken, CommentTag } from "./types.js";
import * as T from "./tokens.js";

export function handleComment(reader: AbstractReader): PgnCommentToken {
    const isLeftBrace = reader.match(T.LEFT_BRACE);
    const isLeftBraceOrSemicolon = isLeftBrace || reader.match(T.SEMICOLON);

    if (!isLeftBraceOrSemicolon)
        throw new Error(
            `handleComment got ${reader.get()} but expected ${T.LEFT_BRACE} or ${T.SEMICOLON}`);

    const tags: CommentTag[] = [];
    reader.copyStart();
    while (!reader.isAtEnd()){
        const byte = reader.get();

        if (
            isLeftBrace && byte === T.RIGHT_BRACE ||
            !isLeftBrace && byte === T.NEWLINE
        )
            break;

        switch (byte){
            // extract comment tags
            case T.LEFT_SQ_BRACKET:
                if (reader.peek() == T.PERCENT){
                    reader.copyPause();
                    const tag: CommentTag | undefined = handleCommentTag(reader);
                    if (tag)
                        tags.push(tag);
                    reader.copyContinue();
                }else{
                    reader.advance();
                }
                break;
            default:
                reader.advance();
        }
    }

    const content: string = reader.copyEnd();

    // skip right brace OR the newline
    reader.advance();

    return {
        type: "comment",
        content,
        tags,
    };
}
