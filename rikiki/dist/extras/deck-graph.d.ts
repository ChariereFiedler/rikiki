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
    private _nodeBoxes;
    private _ro?;
    private _mo?;
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
    /**
     * The polyline every edge actually paints, in graph-relative CSS pixels.
     *
     * One source for the SVG and for the `data-path` published in `updated()` ·
     * `rikiki check` used to re-derive a centre-to-centre segment of its own and
     * report on a line nobody painted.
     */
    private _polylines;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckNode extends LitElement {
    static styles: import("lit").CSSResult[];
    /** `x,y` in percent of the drawing area · ignored under a canned layout. */
    at?: string;
    label?: string;
    /** A mono micro-label under the name · a protocol, a count, a latency. */
    note?: string;
    /** Explicit CSS width (`18ch`, `240px`, …) for labels that must wrap before
     * they collide with a neighbouring node. */
    width?: string;
    /** Draw the node as a filled block rather than type under a rule. */
    boxed: boolean;
    /** Fill colour of a boxed node. */
    tone?: 'accent' | 'ok' | 'warn' | 'danger';
    /** A glyph above the label · needs dist/deck-icon.js loaded too. */
    icon?: string;
    protected updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckGroup extends LitElement {
    static styles: import("lit").CSSResult[];
    /** `x,y,width,height` in percent of the drawing area. */
    at?: string;
    label?: string;
    /** A solid outline instead of the dashed default. */
    solid: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckLane extends LitElement {
    static styles: import("lit").CSSResult[];
    /** `top,height` in percent of the drawing area. */
    at?: string;
    label?: string;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckEdge extends LitElement {
    static styles: import("lit").CSSResult;
    from?: string;
    to?: string;
    label?: string;
    dashed: boolean;
    /** `straight` by default; `ortho` draws right-angle segments. */
    route: 'straight' | 'ortho';
    /** `x,y` pixel offset for the edge label, e.g. `label-offset="0,-16"`. */
    labelOffset?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-graph': DeckGraph;
        'deck-node': DeckNode;
        'deck-edge': DeckEdge;
        'deck-group': DeckGroup;
        'deck-lane': DeckLane;
    }
}
