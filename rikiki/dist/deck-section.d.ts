import { LitElement } from 'lit';
export declare class DeckSection extends LitElement {
    static styles: import("lit").CSSResult[];
    num?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-section': DeckSection;
    }
}
