import { LitElement } from 'lit';
export declare class DeckMetricList extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckMetric extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        value: {
            type: StringConstructor;
        };
        severity: {
            type: StringConstructor;
        };
        mono: {
            type: BooleanConstructor;
        };
    };
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-metric.d.ts.map