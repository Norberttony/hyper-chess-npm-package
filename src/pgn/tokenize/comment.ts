import { AbstractReader } from "../read/abstract-reader.js";
import { handleCommentTag, HandleCommentTagState } from "./comment-tag.js";
import type { PgnCommentToken, CommentTag } from "./types.js";
import * as T from "./tokens.js";

export interface HandleCommentState {
    state: number;
    isLeftBrace: boolean;
    isCopyingTag: boolean;
    content: string | undefined;
    tagState: HandleCommentTagState;
    tags: CommentTag[];
}

export function defaultCommentState(): HandleCommentState {
    return {
        state: 0,
        isLeftBrace: false,
        isCopyingTag: false,
        content: undefined,
        tagState: { state: 0, isValid: false, name: undefined, value: undefined },
        tags: []
    };
}

export function handleComment(
    state: HandleCommentState,
    reader: AbstractReader
): PgnCommentToken {
    if (state.state === 0){
        state.isLeftBrace = reader.match(T.LEFT_BRACE);
        if (!state.isLeftBrace)
            reader.match(T.SEMICOLON);
        reader.copyStart();
        state.state++;
    }

    while (state.state === 1){
        if (!state.isCopyingTag){
            while (!reader.isAtEnd()){
                const byte = reader.get();

                if (
                    state.isLeftBrace && byte === T.RIGHT_BRACE ||
                    !state.isLeftBrace && byte === T.NEWLINE
                )
                    break;

                switch (byte){
                    // extract comment tags
                    case T.LEFT_SQ_BRACKET:
                        if (reader.peek() == T.PERCENT){
                            reader.copyPause();
                            state.tagState.state = 0;
                            state.tagState.isValid = false;
                            state.tagState.name = undefined;
                            state.tagState.value = undefined;
                            state.isCopyingTag = true;
                        }else{
                            reader.advance();
                        }
                        break;
                    default:
                        reader.advance();
                }
                if (state.isCopyingTag)
                    break;
            }
        }

        if (state.isCopyingTag){
            const tag: CommentTag | undefined = handleCommentTag(state.tagState, reader);
            if (tag)
                state.tags.push(tag);
            reader.copyContinue();
            state.isCopyingTag = false;
            // reset tag state to default
            state.tagState.state = 0;
            state.tagState.isValid = false;
            state.tagState.name = undefined;
            state.tagState.value = undefined;
        }else{
            state.state++;
            break;
        }
    }

    if (state.state === 2){
        state.content = reader.copyEnd();
        state.state++;
    }

    if (state.state === 3){
        reader.advance();
        return {
            type: "comment",
            content: state.content!,
            tags: state.tags!,
        };
    }
    throw new Error(`handleComment entered an illegal state ${state.state}`);
}
