import { LitElement } from 'lit';
export type DeckCardColor = 'yellow' | 'orange' | 'green' | 'red';
export declare class DeckCard extends LitElement {
    static styles: import("lit").CSSResult;
    color?: DeckCardColor;
    center: boolean;
    compact: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-card': DeckCard;
    }
}
//# sourceMappingURL=deck-card.d.ts.map