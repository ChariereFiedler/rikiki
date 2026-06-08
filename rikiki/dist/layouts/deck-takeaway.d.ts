import { LitElement } from 'lit';
export declare class DeckTakeaway extends LitElement {
    static styles: import("lit").CSSResult[];
    kicker?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-takeaway': DeckTakeaway;
    }
}
