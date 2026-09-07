import { LitElement } from 'lit';
export declare class DeckGraph extends LitElement {
    static styles: import("lit").CSSResult[];
    /** `free` (default, author places every node), `row` or `column` · the two
     *  arrangements that would otherwise be typed out by hand every time. */
    layout: 'free' | 'row' | 'column';
    /** Walk the graph one node per step · emphasis, not concealment. */
    reveal: boolean;
    private _tick;
    /** The element's pixel box · the SVG coordinate space. */
    private _box;
    private _ro?;
    private get _nodes();
    private get _edges();
    firstUpdated(): void;
    disconnectedCallback(): void;
    private _measure;
    connectedCallback(): void;
    /** Give every node a position · either the one the author wrote, or the one
     *  the canned arrangement computes. */
    private _place;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckNode extends LitElement {
    static styles: import("lit").CSSResult[];
    /** `x,y` in percent of the drawing area · ignored under a canned layout. */
    at?: string;
    label?: string;
    /** A mono micro-label under the name · a protocol, a count, a latency. */
    note?: string;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckEdge extends LitElement {
    static styles: import("lit").CSSResult;
    from?: string;
    to?: string;
    label?: string;
    dashed: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-graph': DeckGraph;
        'deck-node': DeckNode;
        'deck-edge': DeckEdge;
    }
}
