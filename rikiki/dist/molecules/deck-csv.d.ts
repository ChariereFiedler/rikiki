import { LitElement } from 'lit';
export declare class DeckCsv extends LitElement {
    static styles: import("lit").CSSResult;
    delimiter: string;
    noHeader: boolean;
    fit: boolean;
    fitMin?: number;
    fitMax?: number;
    /** 1-based body rows to emphasise · `2` or `2 5`. A table with no hierarchy
     *  is unreadable at projection distance. */
    highlightRows?: string;
    /** 1-based columns to emphasise · same grammar. */
    highlightCols?: string;
    /** Reveal body rows one per step instead of showing the whole table. */
    reveal: boolean;
    /** Current step, set by deck-root on every step change. */
    private step;
    private rows;
    private fitter;
    connectedCallback(): void;
    /** One step per body row when revealing · published on the host slide, which
     *  is where the engine reads the count from. Never lowers an author's own. */
    private _publishSteps;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    /** 1-based indices from a space-separated attribute. */
    private _marked;
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
