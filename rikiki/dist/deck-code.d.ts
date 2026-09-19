import { LitElement } from 'lit';
export type DeckCodeLang = 'js' | 'ts' | 'json' | 'html' | 'xml' | 'svg' | 'css' | 'scss' | 'less';
/** A custom highlighter for every <deck-code> · returns the block's inner HTML,
 *  or null to fall back to the built-in regex highlighter. */
export type DeckCodeHighlighter = (code: string, lang: string) => string | null;
export declare class DeckCode extends LitElement {
    /** Shared highlighter override · the opt-in Shiki plugin sets this on the
     *  registered class (via customElements.get) so plugin and component share the
     *  one class, not separate flat-dist bundles with their own module state. Null
     *  keeps the built-in regex highlighter. */
    static highlighter: DeckCodeHighlighter | null;
    /** Re-highlight every <deck-code> on the page · called after the shared
     *  highlighter changes so a deck already on screen picks it up. */
    static rehighlightAll(): void;
    static styles: import("lit").CSSResult;
    lang: string;
    hero: boolean;
    nested: boolean;
    stepGroups?: string;
    private _html;
    private _groups;
    connectedCallback(): void;
    /** Re-run highlighting and request a render · used after the shared
     *  highlighter changes (see setDeckCodeHighlighter). */
    rehighlight(): void;
    private _highlight;
    /** Public API · called by deck-root when stepping through code groups. */
    applyStep(n: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-code': DeckCode;
    }
}
