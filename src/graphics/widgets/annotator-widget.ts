import type { BoardGraphics } from "../board-graphics.js";
import { BoardWidget } from "./board-widget.js";

type AnnotationColor = "green" | "blue" | "yellow" | "red"

interface Annotation {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: AnnotationColor;
}

interface Coord {
    x: number;
    y: number;
}

export class AnnotatorWidget extends BoardWidget {
    private annotations: Annotation[] = [];
    private ctx: CanvasRenderingContext2D;

    private start?: Coord;

    // cache data for drawing in-progress annotations
    private animFrameId: number | undefined;
    private prevAnnot: Annotation | undefined;

    constructor(boardgfx: BoardGraphics){
        super(boardgfx);

        // initialize by adding canvas
        const canvas = document.createElement("canvas");
        canvas.classList.add("board-graphics__annotations");
        boardgfx.boardDiv.appendChild(canvas);

        canvas.width = 1000;
        canvas.height = 1000;

        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = "rgba(0, 120, 0)";
        this.ctx.fillStyle = "rgba(0, 120, 0)";
        this.ctx.lineCap = "round";

        // attach event listeners
        boardgfx.boardDiv.addEventListener("mousedown",        (event) => this.mousedown(event));
        boardgfx.boardDiv.addEventListener("mousemove",        (event) => this.mousemove(event));
        boardgfx.boardDiv.addEventListener("mouseup",          (event) => this.mouseup(event));
        boardgfx.boardDiv.addEventListener("contextmenu",      (event) => event.preventDefault());
        boardgfx.skeleton.addEventListener("variation-change", ()      => this.clearAll());
    }

    private redrawAll(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (const a of this.annotations)
            this.drawAnnotation(a);
    }

    private clearAll(): void {
        this.annotations = [];
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    private drawAnnotation(annotation: Annotation): void {
        const { startX, startY, endX, endY, color } = annotation;

        // general variables useful for drawing annotations
        const squareSize = this.ctx.canvas.width / 8;
        const halfSquare = this.ctx.canvas.width / 16;

        // start and end coordinates in pixel coordinates
        const sx = startX * squareSize + halfSquare;
        const sy = startY * squareSize + halfSquare;
        const ex = endX   * squareSize + halfSquare;
        const ey = endY   * squareSize + halfSquare;

        // representing as a vector
        const x = endX - startX;
        const y = endY - startY;
        const mag = Math.sqrt(x**2 + y**2);
        const nx = x / mag;
        const ny = y / mag;

        // rotated by 90 degrees
        const rx = -ny;
        const ry = nx;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        if (sx === ex && sy === ey){
            // draw just a highlight on the square
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, halfSquare - this.ctx.lineWidth / 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        }else{
            const midOffsetX = -50 * nx;
            const midOffsetY = -50 * ny;
            const arrowOffsetX = -80 * nx;
            const arrowOffsetY = -80 * ny;

            // otherwise let's draw an arrow from start to end
            this.ctx.lineWidth = 25;
            this.ctx.beginPath();
            this.ctx.moveTo(sx, sy);
            this.ctx.lineTo(ex + midOffsetX, ey + midOffsetY);
            this.ctx.stroke();

            this.ctx.lineWidth = 0;
            this.ctx.beginPath();
            this.ctx.moveTo(ex, ey);

            this.ctx.lineTo(ex + 50 * rx + arrowOffsetX, ey + 50 * ry + arrowOffsetY);
            this.ctx.lineTo(ex - 50 * rx + arrowOffsetX, ey - 50 * ry + arrowOffsetY);

            this.ctx.lineTo(ex, ey);
            this.ctx.fill();
        }
    }

    private getMouseTileCoords(event: MouseEvent): Coord {
        const rect = this.ctx.canvas.getBoundingClientRect();
        let x = Math.floor((event.clientX - rect.x) / this.ctx.canvas.clientWidth * 8);
        let y = Math.floor((event.clientY - rect.y) / this.ctx.canvas.clientHeight * 8);

        if (this.boardgfx.isFlipped){
            x = 7 - x;
            y = 7 - y;
        }

        return { x, y };
    }

    private mousedown(event: MouseEvent): void {
        if (event.button !== 2)
            return;

        this.start = this.getMouseTileCoords(event);
    }

    private mousemove(event: MouseEvent): void {
        if (!this.start)
            return;

        const end = this.getMouseTileCoords(event);
        const color = this.getAnnotationColor(event);
        const inProgressAnnot = buildAnnot(this.start, end, color);
        if (!this.prevAnnot || !areAnnotationsEqual(this.prevAnnot, inProgressAnnot)){
            // cancel previous draw
            if (this.animFrameId)
                window.cancelAnimationFrame(this.animFrameId);

            // start redraw with the in-progress annotation
            this.animFrameId = window.requestAnimationFrame(() => {
                if (!this.start)
                    return;

                this.prevAnnot = inProgressAnnot;
                this.redrawAll();
                this.drawAnnotation(inProgressAnnot);
                this.animFrameId = undefined;
            });
        }
    }

    private mouseup(event: MouseEvent): void {
        if (event.button !== 2){
            window.requestAnimationFrame(() => this.clearAll());
            return;
        }
        if (!this.start)
            return;

        const end = this.getMouseTileCoords(event);
        const color = this.getAnnotationColor(event);
    
        const annotation = this.getAnnotation(this.start.x, this.start.y, end.x, end.y);
        if (annotation){
            const index = this.annotations.indexOf(annotation);
            this.annotations.splice(index, 1);
        }
        if (!annotation || annotation.color != color){
            const a = {
                startX: this.start.x,
                startY: this.start.y,
                endX: end.x,
                endY: end.y,
                color,
            };
            this.annotations.push(a);
        }

        window.requestAnimationFrame(() => this.redrawAll());
        event.preventDefault();
        delete this.start;
    }

    private getAnnotation(startX: number, startY: number, endX: number, endY: number): Annotation | undefined {
        const a2 = { startX, startY, endX, endY, color: "green" as AnnotationColor };
        for (const a of this.annotations){
            if (areAnnotationsEqual(a, a2))
                return a;
        }
        return undefined;
    }

    private getAnnotationColor(event: MouseEvent): AnnotationColor {
        if (event.ctrlKey && event.altKey)
            return "yellow";
        else if (event.ctrlKey)
            return "red";
        else if (event.altKey)
            return "blue";
        else
            return "green";
    }
}

function areAnnotationsEqual(a1: Annotation, a2: Annotation): boolean {
    return a1.startX == a2.startX
        && a1.startY == a2.startY
        && a1.endX == a2.endX
        && a1.endY == a2.endY;
}

function buildAnnot(start: Coord, end: Coord, color: AnnotationColor): Annotation {
    return {
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        color,
    };
}
