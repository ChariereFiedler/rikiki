import { LitElement } from 'lit';
export declare class DeckSource extends LitElement {
    static styles: import("lit").CSSResult;
    /** Optional URL for the source or credit. */
    href?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-source': DeckSource;
    }
}
