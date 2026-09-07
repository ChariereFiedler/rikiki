import { LitElement } from 'lit';
export type DeckPullSide = 'left' | 'right' | 'full';
export declare class DeckPull extends LitElement {
    static styles: import("lit").CSSResult;
    /** `full` (default), or floated to one side so the text wraps around it. */
    side: DeckPullSide;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-pull': DeckPull;
    }
}
