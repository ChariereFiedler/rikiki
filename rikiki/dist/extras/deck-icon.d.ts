import { LitElement } from 'lit';
export type DeckIconSize = 'sm' | 'md' | 'lg' | 'xl';
export type DeckIconTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'muted';
export declare class DeckIcon extends LitElement {
    static styles: import("lit").CSSResult;
    /** One of the glyphs in the set · an unknown name falls back to the slot. */
    name?: string;
    size: DeckIconSize;
    tone: DeckIconTone;
    /** What a screen reader should say · absent means decorative, and the icon
     *  is hidden from the accessibility tree rather than announced as "image". */
    label?: string;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-icon': DeckIcon;
    }
}
