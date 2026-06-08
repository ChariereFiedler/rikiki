import { LitElement } from 'lit';
export type DeckMetricSeverity = 'bad' | 'warn' | 'ok' | 'info';
export declare class DeckMetricList extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckMetric extends LitElement {
    static styles: import("lit").CSSResult;
    value?: string;
    severity?: DeckMetricSeverity;
    mono: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-metric-list': DeckMetricList;
        'deck-metric': DeckMetric;
    }
}
