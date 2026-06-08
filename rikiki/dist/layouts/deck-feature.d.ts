import { LitElement } from 'lit';
export declare class DeckFeature extends LitElement {
    static styles: import("lit").CSSResult[];
    eyebrow?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-feature': DeckFeature;
    }
}
