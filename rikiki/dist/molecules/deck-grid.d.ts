import { LitElement } from 'lit';
export type DeckGridAlign = 'start' | 'center' | 'end' | 'stretch';
export declare class DeckGrid extends LitElement {
    static styles: import("lit").CSSResult;
    cols?: string;
    rows?: string;
    gap?: string;
    align?: DeckGridAlign;
    justify?: DeckGridAlign;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-grid': DeckGrid;
    }
}
