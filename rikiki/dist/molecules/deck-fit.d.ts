import { LitElement } from 'lit';
export declare class DeckFit extends LitElement {
    static styles: import("lit").CSSResult;
    min?: number;
    max?: number;
    private fitter;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-fit': DeckFit;
    }
}
