import { LitElement } from 'lit';
export type DeckCellAlign = 'start' | 'center' | 'end' | 'stretch';
export type DeckCellJustify = 'start' | 'center' | 'end' | 'between';
export declare class DeckCell extends LitElement {
    static styles: import("lit").CSSResult;
    span?: string;
    col?: string;
    row?: string;
    align?: DeckCellAlign;
    justify?: DeckCellJustify;
    tone?: string;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-cell': DeckCell;
    }
}
