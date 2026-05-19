import { LitElement } from 'lit';
export declare class DeckMermaid extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        _svg: {
            state: boolean;
        };
        rendered: {
            type: BooleanConstructor;
            reflect: boolean;
        };
    };
    connectedCallback(): void;
    _render(): Promise<void>;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-mermaid.d.ts.map