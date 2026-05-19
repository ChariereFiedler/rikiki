import { LitElement } from 'lit';
export declare class DeckTierList extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckTier extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        name: {
            type: StringConstructor;
        };
        speed: {
            type: StringConstructor;
        };
        severity: {
            type: StringConstructor;
        };
        hot: {
            type: BooleanConstructor;
            reflect: boolean;
        };
    };
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckTierArrow extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-tier-list.d.ts.map