import { LitElement } from 'lit';
export type DeckBadgeType = 'bad' | 'ok' | 'info' | 'warn' | 'neutral';
export declare class DeckBadge extends LitElement {
    static styles: import("lit").CSSResult;
    type?: DeckBadgeType;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-badge': DeckBadge;
    }
}
