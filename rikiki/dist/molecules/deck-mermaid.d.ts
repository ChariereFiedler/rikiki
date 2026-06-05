import { LitElement } from 'lit';
interface MermaidLib {
    initialize(opts: Record<string, unknown>): void;
    render(id: string, source: string): Promise<{
        svg: string;
    }>;
}
declare global {
    interface Window {
        mermaid?: MermaidLib;
    }
}
export declare class DeckMermaid extends LitElement {
    static styles: import("lit").CSSResult;
    rendered: boolean;
    private _svg;
    private _source;
    private _renderPromise;
    /** Rendered SVG markup · '' until the async render completes. Lets the
     *  overview build static thumbnails without reaching into this shadow root. */
    get renderedSvg(): string;
    /** Resolves when the current render attempt settles (success or error). */
    get whenRendered(): Promise<void>;
    connectedCallback(): void;
    private _render;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-mermaid': DeckMermaid;
    }
}
export {};
//# sourceMappingURL=deck-mermaid.d.ts.map