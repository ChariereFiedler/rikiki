import { LitElement } from 'lit';
export declare class DeckTakeaway extends LitElement {
    static styles: import("lit").CSSResult[];
    kicker?: string;
    /** Distribute the leftover vertical space of the body ·
     *  `between` / `around` / `evenly` / `center` / `end` / `start` (default). */
    spread?: string;
    /** Let the body's blocks take the leftover height instead of distributing it
     *  around them · pair with a `<deck-fit>` child to grow its text into it. */
    fill: boolean;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-takeaway': DeckTakeaway;
    }
}
