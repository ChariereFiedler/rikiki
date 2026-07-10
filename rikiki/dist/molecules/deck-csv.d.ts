import { LitElement } from 'lit';
export declare class DeckCsv extends LitElement {
    static styles: import("lit").CSSResult;
    delimiter: string;
    noHeader: boolean;
    fit: boolean;
    fitMin?: number;
    fitMax?: number;
    private rows;
    private fitter;
    connectedCallback(): void;
    updated(): void;
    /** Re-read the light-DOM CSV and re-render · used by the live editor. */
    reparse(): void;
    private parse;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-csv': DeckCsv;
    }
}
