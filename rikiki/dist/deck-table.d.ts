import { LitElement } from 'lit';
export declare class DeckTable extends LitElement {
    static styles: import("lit").CSSResult;
    /** 1-based body rows to emphasise · `2` or `2 5`. */
    highlightRows?: string;
    /** 1-based columns to emphasise. */
    highlightCols?: string;
    /** Reveal body rows one per step. */
    reveal: boolean;
    private _indices;
    private get _bodyRows();
    connectedCallback(): void;
    updated(): void;
    /** Write the emphasis onto the author's own markup · a light-DOM table cannot
     *  be styled from this shadow root, so the marks travel as attributes and the
     *  rules live in the theme (table[data-rik-table] in themes/*.css). */
    private _paint;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-table': DeckTable;
    }
}
