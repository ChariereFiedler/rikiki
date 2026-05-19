import { LitElement } from 'lit';
export declare class DeckPunch extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        tone: {
            type: StringConstructor;
        };
        size: {
            type: StringConstructor;
        };
        weight: {
            type: StringConstructor;
            reflect: boolean;
        };
        align: {
            type: StringConstructor;
            reflect: boolean;
        };
    };
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-punch.d.ts.map