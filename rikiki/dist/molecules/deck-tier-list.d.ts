import { LitElement } from 'lit';
export type DeckTierSeverity = 'muted' | 'warn' | 'ok' | 'hot';
export declare class DeckTierList extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckTier extends LitElement {
    static styles: import("lit").CSSResult;
    name?: string;
    speed?: string;
    severity?: DeckTierSeverity;
    hot: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckTierArrow extends LitElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-tier-list': DeckTierList;
        'deck-tier': DeckTier;
        'deck-tier-arrow': DeckTierArrow;
    }
}
//# sourceMappingURL=deck-tier-list.d.ts.map