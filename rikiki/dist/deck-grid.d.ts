import { LitElement } from 'lit';
export declare class DeckGrid extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        cols: {
            type: StringConstructor;
        };
        rows: {
            type: StringConstructor;
        };
        gap: {
            type: StringConstructor;
        };
        align: {
            type: StringConstructor;
        };
        justify: {
            type: StringConstructor;
        };
    };
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-grid.d.ts.map