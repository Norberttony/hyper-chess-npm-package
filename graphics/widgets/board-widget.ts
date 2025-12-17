import type { BoardGraphics } from "../board-graphics.js";

export const WIDGET_LOCATIONS = [ "None", "Left", "Top_Bar", "Board", "Bottom_Bar", "Right_Black", "Right", "Right_White", "Bottom" ] as const;
export type WidgetLocation = typeof WIDGET_LOCATIONS[number];

export class BoardWidget {
    constructor(public boardgfx: BoardGraphics){
        boardgfx.attachWidget(this);
    }

    enable(){}
    disable(){}
}

export function getFirstElemOfClass(container: Element, className: string): Element | undefined {
    return container.getElementsByClassName(className)[0];
}

export function getWidgetLocName(loc: WidgetLocation): string {
    return loc.replaceAll("_", "-").toLowerCase();
}
