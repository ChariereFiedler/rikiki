import { LitElement } from 'lit';
export declare class DeckStepList extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckStep extends LitElement {
    static styles: import("lit").CSSResult;
    n?: string;
    note?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-step-list': DeckStepList;
        'deck-step': DeckStep;
    }
}
