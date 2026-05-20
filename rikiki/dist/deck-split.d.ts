import { LitElement } from 'lit';
export declare class DeckSplit extends LitElement {
    static styles: import("lit").CSSResult[];
    static properties: {
        eyebrow: {
            type: StringConstructor;
        };
        cols: {
            type: StringConstructor;
        };
        gap: {
            type: StringConstructor;
        };
        colGap: {
            type: StringConstructor;
            attribute: string;
        };
    };
    /** Map '1'..'6' to var(--sp-N); fall through to raw values otherwise. */
    _resolveSp(v: any): any;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-split.d.ts.map