import { LitElement } from 'lit';
export type DeckSplitCols = '1-1' | '1-2' | '2-1' | '3';
export declare class DeckSplit extends LitElement {
    static styles: import("lit").CSSResult[];
    eyebrow?: string;
    cols?: DeckSplitCols;
    gap?: string;
    colGap?: string;
    /** Map '1'..'6' to var(--sp-N); fall through to raw values otherwise. */
    private _resolveSp;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-split': DeckSplit;
    }
}
