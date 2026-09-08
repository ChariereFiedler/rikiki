import { LitElement } from 'lit';
export type DeckPointAlign = 'start' | 'center' | 'end' | 'stretch';
export declare class DeckPoint extends LitElement {
    static styles: import("lit").CSSResult;
    span?: string;
    col?: string;
    row?: string;
    align?: DeckPointAlign;
    tone?: string;
    /** How many bands this point borrows from its bento · written by deck-bento,
     *  never by an author. Declared rather than read off the attribute so Lit
     *  re-runs updated() when the parent sets it; an undeclared attribute would
     *  change the CSS and leave the point spanning one band instead of all. */
    banded?: string;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-point': DeckPoint;
    }
}
