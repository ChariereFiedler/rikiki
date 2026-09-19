import { LitElement } from 'lit';
export declare class DeckChecklist extends LitElement {
    static styles: import("lit").CSSResult;
    /** Columns · 1 (default) reads as a list, 2 as a contrast. */
    cols?: string;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckCheck extends LitElement {
    static styles: import("lit").CSSResult;
    /** This one does NOT work · flips the marker and its colour. */
    no: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-checklist': DeckChecklist;
        'deck-check': DeckCheck;
    }
}
