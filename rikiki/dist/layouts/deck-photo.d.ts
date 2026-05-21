import { LitElement } from 'lit';
export declare class DeckPhoto extends LitElement {
    static styles: import("lit").CSSResult[];
    src?: string;
    position?: string;
    darken?: number;
    align?: 'top' | 'center' | 'bottom';
    textAlign?: 'left' | 'center' | 'right';
    updated(): void;
    render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-photo': DeckPhoto;
    }
}
//# sourceMappingURL=deck-photo.d.ts.map