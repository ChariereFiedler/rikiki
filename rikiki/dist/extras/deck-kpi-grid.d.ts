import { LitElement } from 'lit';
export type DeckKpiTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'muted';
export declare class DeckKpiGrid extends LitElement {
    static styles: import("lit").CSSResult;
    cols?: string;
    /** Draw a hairline between the figures. */
    ruled: boolean;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckKpi extends LitElement {
    static styles: import("lit").CSSResult[];
    value?: string;
    label?: string;
    /** A line of context under the label · what the figure is measured against. */
    note?: string;
    tone: DeckKpiTone;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-kpi-grid': DeckKpiGrid;
        'deck-kpi': DeckKpi;
    }
}
