import { LitElement } from 'lit';
export declare class DeckCode extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        lang: {
            type: StringConstructor;
        };
        hero: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        nested: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        'step-groups': {
            attribute: string;
            type: StringConstructor;
        };
        _html: {
            state: boolean;
        };
    };
    connectedCallback(): void;
    _highlight(): void;
    applyStep(n: any): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-code.d.ts.map