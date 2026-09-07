import { LitElement } from 'lit';
export declare class DeckStepList extends LitElement {
    static styles: import("lit").CSSResult;
    /** `column` (default) or `row` · a chain that wants the slide width. */
    direction: 'column' | 'row';
    /** Drop the connectors between steps in row direction. */
    noConnectors: boolean;
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
