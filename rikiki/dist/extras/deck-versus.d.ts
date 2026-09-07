import { LitElement } from 'lit';
export declare class DeckVersus extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Symbol or word between the two sides · omit for a plain two-up. */
    pivot?: string;
    /** Which side carries the accent. */
    winner?: 'left' | 'right';
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-versus': DeckVersus;
    }
}
