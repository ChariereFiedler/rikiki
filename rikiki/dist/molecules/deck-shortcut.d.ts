import { LitElement } from 'lit';
export type DeckKbdTone = 'accent' | 'ok';
export declare class DeckKbd extends LitElement {
    static styles: import("lit").CSSResult;
    tone?: DeckKbdTone;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckShortcut extends LitElement {
    static styles: import("lit").CSSResult;
    keys?: string;
    label?: string;
    note?: string;
    tone?: DeckKbdTone;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckShortcutList extends LitElement {
    static styles: import("lit").CSSResult;
    cols?: string;
    colGap?: string;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-kbd': DeckKbd;
        'deck-shortcut': DeckShortcut;
        'deck-shortcut-list': DeckShortcutList;
    }
}
//# sourceMappingURL=deck-shortcut.d.ts.map