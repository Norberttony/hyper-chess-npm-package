
type Elem<K extends keyof HTMLElementTagNameMap> = HTMLElementTagNameMap[K];

// to-do: I could maybe do something interesting with AbortController and actually
// have the element be cleaned.

export class ElementPool<K extends keyof HTMLElementTagNameMap> {
    private pool: Elem<K>[] = [];
    private isPooled: Map<Elem<K>, boolean> = new Map();

    constructor(
        private tagName: K,
        private root: HTMLElement,
    ){}

    public isPoolElement(elem: Element): elem is Elem<K> {
        return elem.tagName === this.tagName;
    }

    protected cleanElement(elem: Elem<K>): void {
        elem.style = "";
        elem.innerHTML = "";
        elem.id = "";
        elem.classList = "";
    }

    public getElement(): Elem<K> {
        const poolElem = this.pool.pop();
        if (!poolElem)
            return this.createElement();
        this.isPooled.set(poolElem, false);
        poolElem.style.display = "";
        return poolElem;
    }

    public setBackToPool(elem: Elem<K>): void {
        if (this.isPooled.get(elem))
            return;
        this.cleanElement(elem);
        elem.style.display = "none";
        this.isPooled.set(elem, true);
        this.pool.push(elem);
    }

    public setClassToPool(classSelector: string): void {
        const elems = this.root.getElementsByClassName(classSelector);
        for (let i = 0; i < elems.length; i++){
            const elem = elems[i]!;
            if (this.isPoolElement(elem)){
                this.setBackToPool(elem);
                i--;
            }
        }
    }

    private createElement(): Elem<K> {
        const elem = document.createElement(this.tagName);
        this.root.appendChild(elem);
        return elem;
    }
}
