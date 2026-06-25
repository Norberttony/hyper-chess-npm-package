import { BoardGraphics } from "../board-graphics.js";
import { BoardWidget, WidgetLocation } from "./board-widget.js";

// handles setting glyphs

export class GlyphWidget extends BoardWidget {
    private nagContainers: Record<number, HTMLDivElement> = {};

    // container of this widget
    private container: HTMLDivElement;

    constructor(
        boardgfx: BoardGraphics,
        location: WidgetLocation = WidgetLocation.Bottom
    ){
        super(boardgfx);

        const container = document.createElement("div");
        container.classList.add("board-graphics__glyph");
        
        // get all NAGs from boardgfx and display them as options for the user
        for (const { id, icon, desc } of Object.values(boardgfx.getNagTable())){
            const nagContainer = document.createElement("div");
            nagContainer.className = `glyph__option`;

            // add icon of the NAG
            const nagIcon = document.createElement("img");
            nagIcon.classList.add("glyph__option-icon");
            if (icon)
                nagIcon.src = icon;
            nagContainer.appendChild(nagIcon);

            // add desc of the NAG
            const nagDesc = document.createElement("div");
            nagDesc.innerText = desc;
            nagContainer.appendChild(nagDesc);

            // clicking NAG toggles it for the move
            nagContainer.addEventListener("click", () => {
                this.toggleGlyph(id);
            });

            container.appendChild(nagContainer);
            this.nagContainers[id] = nagContainer;
        }
        this.container = container;

        boardgfx.getWidgetContainer(location).appendChild(container);

        // if boardgfx scrolls, the currently active NAGs might change
        boardgfx.skeleton.addEventListener("single-scroll", () => {
            this.updateSelectedGlyphs();
        });
        boardgfx.skeleton.addEventListener("variation-change", () => {
            this.updateSelectedGlyphs();
        });
    }

    private updateSelectedGlyphs(): void {
        const cv = this.boardgfx.getCurrentVariation();
        if (cv.type === "root")
            return;

        // deselect all
        const currSelected = this.container.getElementsByClassName("glyph__option--selected");
        while (currSelected[0])
            currSelected[0].classList.remove("glyph__option--selected");

        // select active NAGs
        for (const id of cv.pgnMove.nags)
            this.nagContainers[id]?.classList.add("glyph__option--selected");
    }

    private toggleGlyph(id: number): void {
        const cv = this.boardgfx.getCurrentVariation();
        if (cv.type === "root")
            return console.warn("Cannot toggle glyph before any moves");

        // toggle (add/remove) nag
        const idx = cv.pgnMove.nags.indexOf(id);
        if (idx == -1)
            cv.pgnMove.nags.push(id);
        else
            cv.pgnMove.nags.splice(idx, 1);

        this.boardgfx.applyChanges(false);
    }
}
