import { LitElement } from 'lit';
export type DeckCalloutType = 'info' | 'warn' | 'danger' | 'ok';
export declare class DeckCallout extends LitElement {
    static styles: import("lit").CSSResult;
    type?: DeckCalloutType;
    /** Use inverse text and a dark raised surface inside dark slide layouts. */
    onDark: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-callout': DeckCallout;
    }
}
