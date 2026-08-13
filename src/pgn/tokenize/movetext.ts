import { AbstractReader } from "../read/abstract-reader.js";
import type { PgnMovetextToken } from "./types.js";
import { isNumber, isWhitespace } from "../read/utils.js";
import { handleNumber, HandleNumberState } from "./number.js";
import { defaultCommentState, handleComment, HandleCommentState } from "./comment.js";
import { handleSanGlyph, HandleSanGlyphState } from "./san-glyph.js";
import { handleNag, HandleNagState } from "./nag.js";
import * as T from "./tokens.js";

export interface HandleMovetextState {
    state: number;
    isVariation: boolean;
    variationProc: number;
    variationState:
        | HandleCommentState
        | HandleMovetextState
        | HandleSanGlyphState
        | HandleNagState
        | undefined
    movetextTokens: PgnMovetextToken[];

    isNumber: boolean;
    numState: HandleNumberState | undefined;
    firstNum: number;
    hasWhitespace: boolean;
    dotsAmt: number;

    rest: number[] | undefined;

    isResult: boolean;
}

export function defaultMovetextState(): HandleMovetextState {
    return {
        state: 0,
        isVariation: false,
        variationProc: 0,
        variationState: undefined,
        movetextTokens: [],
        isNumber: false,
        numState: undefined,
        firstNum: 0,
        hasWhitespace: false,
        dotsAmt: 0,
        rest: undefined,
        isResult: false,
    };
}

export function handleMovetext(
    state: HandleMovetextState,
    reader: AbstractReader
): PgnMovetextToken {
    if (state.state === 0){
        if (reader.match(T.ASTERISK)){
            return {
                type: "result",
                value: "*",
            };
        }

        // handle variations
        state.isVariation = reader.match(T.LEFT_PARENTHESIS);
        state.state++;
    }

    if (state.state === 1){
        if (state.isVariation){
            while (true){
                while (!reader.isAtEnd() && reader.get() !== T.RIGHT_PARENTHESIS && state.variationProc === 0){
                    const v: number = reader.get();
                    if (isWhitespace(v)){
                        reader.advance();
                    }else if (v === T.LEFT_BRACE){
                        state.variationState = defaultCommentState();
                        state.variationProc = 1;
                    }else if (T.SAN_GLYPHS.has(v)){
                        state.variationState = { state: 0, proc: 0 };
                        state.variationProc = 2;
                    }else if (reader.match(T.DOLLAR_SIGN)){
                        state.variationState = { numState: { num: 0 } };
                        state.variationProc = 3;
                    }else{
                        state.variationState = defaultMovetextState();
                        state.variationProc = 4;
                    }
                }

                if (state.variationProc === 1){
                    state.movetextTokens.push(handleComment(state.variationState as HandleCommentState, reader));
                }else if (state.variationProc === 2){
                    state.movetextTokens.push(handleSanGlyph(state.variationState as HandleSanGlyphState, reader));
                }else if (state.variationProc === 3){
                    state.movetextTokens.push(handleNag(state.variationState as HandleNagState, reader));
                }else if (state.variationProc === 4){
                    state.movetextTokens.push(handleMovetext(state.variationState as HandleMovetextState, reader));
                }else{
                    state.state++;
                    break;
                }
                state.variationProc = 0;
            }
        }else{
            reader.copyStart();
            state.state++;
            if (isNumber(reader.get())){
                state.isNumber = true;
                state.numState = { num: 0 };
            }
        }
    }

    if (state.state === 2){
        if (state.isVariation){
            // skip right parenthesis
            reader.advance();
            return {
                type: "variation",
                movetext: state.movetextTokens,
            };
        }

        if (state.isNumber){
            state.firstNum = handleNumber(reader, state.numState);
            state.hasWhitespace = isWhitespace(reader.get());
            state.state++;
        }else{
            // moves are separated by whitespace
            while (!reader.isAtEnd() && !T.NON_MOVE_CHARACTERS.has(reader.get()))
                reader.advance();
            const move: string = reader.copyEnd();
            return { type: "move", content: move };
        }
    }

    if (state.state === 3){
        // firstNum must exist at this point
        reader.skipWhitespace();
        if (reader.match(T.DOT)){
            reader.copyReject();
            state.dotsAmt = 1;
        }else if (reader.match(T.FORWARD_SLASH)){
            state.rest = [ T.TWO, T.DASH, T.ONE, T.FORWARD_SLASH, T.TWO ];
        }else if (reader.match(T.DASH)){
            reader.skipWhitespace();
            reader.copyReject();
            state.isResult = true;
            state.numState!.num = 0;
        }
        state.state++;
    }

    if (state.state === 4){
        if (state.dotsAmt > 0){
            while (reader.match(T.DOT))
                state.dotsAmt++;
            return {
                type: "move num",
                num: state.firstNum!,
                threeDots: state.dotsAmt >= 3,
            };
        }else if (state.rest){
            while (state.rest.length){
                reader.skipWhitespace();
                if (!reader.match(state.rest[0]!)){
                    const res = reader.copyEnd();
                    return {
                        type: "error",
                        partial: { type: "result", value: res },
                        errors: [{
                            msg: `Expected 1/2-1/2 but got ${res}`,
                            context: reader.getContext(),
                        }],
                    }
                }else{
                    state.rest.shift();
                }
            }
            reader.copyReject();
            return {
                type: "result",
                value: "1/2-1/2",
            };
        }else if (state.isResult){
            const secondNum = handleNumber(reader, state.numState);
            return {
                type: "result",
                value: `${state.firstNum}-${secondNum}`,
            };
        }else if (state.hasWhitespace){
            // indicates that this is likely a move number
            reader.copyReject();
            return {
                type: "error",
                partial: {
                    type: "move num",
                    num: state.firstNum,
                },
                errors: [{
                    msg: `Move number with no dot`,
                    context: reader.getContext(),
                }],
            };
        }
    }
    throw new Error(`handleMovetext entered illegal state ${state.state}`);
}
