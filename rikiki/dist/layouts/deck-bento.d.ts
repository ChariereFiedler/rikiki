import { LitElement } from 'lit';
export type DeckBentoAlign = 'start' | 'center' | 'end' | 'stretch';
export declare class DeckBento extends LitElement {
    static styles: import("lit").CSSResult[];
    eyebrow?: string;
    cols?: string;
    rows?: string;
    gap?: string;
    align?: DeckBentoAlign;
    justify?: DeckBentoAlign;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-bento': DeckBento;
    }
}
