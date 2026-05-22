import { Side } from "./piece.js";
import { Move } from "./move.js";
import { PgnMove } from "../pgn/parse/types.js";
import { GameResult } from "./board.js";

// the variation object operates as a linked list with a single previous node and a list of next
// nodes.

type NodeType = "root" | "move";
export type VariationNode = VariationRoot | VariationMove;

export class VariationBase<TType extends NodeType> {
    public prev?: VariationNode;
    public next: VariationMove[] = [];

    public level: number = 0;
    public result: GameResult | undefined;

    constructor(public readonly type: TType, public moveList: PgnMove[]){}

    public attach(pgnMove: PgnMove, move: Move): VariationMove {
        const moveList = this.next.length == 0 ? this.moveList : [ ];
        moveList.push(pgnMove);
        const vm: VariationMove = new VariationMove(pgnMove, moveList, move);
        vm.prev = this as VariationNode;
        vm.level = this.level + 1;
        this.next.push(vm);

        if (vm.location == 0){
            vm.moveList = this.moveList;
        }else{
            vm.moveList = moveList;
        }
        
        return vm;
    }

    public get location(): number | undefined {
        return 0;
    }

    // returns the full move number (a "full move" being a move from white AND a move from black)
    public get fullMoveNum(): number {
        return Math.floor((this.level + 1) / 2);
    }

    // returns whose turn it is at this variation
    public get turn(): Side {
        // to-do: unfortunately level does not decide turn because Black might have
        // started the game.
        return this.level % 2 == 1 ? Side.White : Side.Black;
    }
}

export class VariationRoot extends VariationBase<"root"> {
    constructor(moveList: PgnMove[]){
        super("root", moveList);
    }
}

export class VariationMove extends VariationBase<"move"> {
    public move: Move;

    constructor(public pgnMove: PgnMove, moveList: PgnMove[], move: Move){
        super("move", moveList);
        // allows (un)doing the move whenever user scrolls through pgn
        this.move = move.clone();
    }

    public override get location(): number | undefined {
        if (this.prev)
            return this.prev.next.indexOf(this);
        return;
    }

    // detaches this variation from its previous variation
    public detach(): void {
        if (this.prev)
            this.prev.next.splice(this.prev.next.indexOf(this), 1);
    }

    public override attach(pgnMove: PgnMove, move: Move): VariationMove {
        const vm: VariationMove = super.attach(pgnMove, move);
        if (vm.location != 0)
            this.next[0]!.pgnMove.variations.push(vm.moveList);
        return vm;
    }

    public isMain(): boolean {
        // keep traveling backwards until location is not 0 (which means it branches off).
        // ignores the root
        let iter: VariationNode | undefined = this;
        while (iter && iter.prev){
            if (iter.location != 0)
                return false;
            iter = iter.prev;
        }

        return true;
    }

    // finds a common ancestor with another variation node
    public findCommonAncestor(other: VariationNode): VariationNode {
        let n1: VariationNode | undefined;
        let n2: VariationNode | undefined;

        // n1 will be the node with the greatest level
        if (this.level > other.level){
            n1 = this;
            n2 = other;
        }else{
            n1 = other;
            n2 = this;
        }

        // search back until the nodes match levels
        while (n1.level > n2.level){
            n1 = n1.prev;
            if (!n1)
                throw new Error("Cannot find a common ancestor of two disconnected nodes");
        }

        // keep searching up levels until a common ancestor is found
        while (n1 != n2){
            n1 = n1.prev;
            n2 = n2.prev;

            if (!n1 || !n2)
                throw new Error("Cannot find a common ancestor of two disconnected nodes");
        }

        // return the common ancestor
        return n1;
    }
}
