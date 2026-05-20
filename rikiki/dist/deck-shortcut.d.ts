import { LitElement } from 'lit';
export declare class DeckKbd extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckShortcut extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        keys: {
            type: StringConstructor;
        };
        label: {
            type: StringConstructor;
        };
        note: {
            type: StringConstructor;
        };
        tone: {
            type: StringConstructor;
        };
    };
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckShortcutList extends LitElement {
    static styles: import("lit").CSSResult;
    static properties: {
        cols: {
            type: StringConstructor;
        };
        colGap: {
            type: StringConstructor;
            attribute: string;
        };
    };
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=deck-shortcut.d.ts.map