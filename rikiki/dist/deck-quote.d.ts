import { LitElement } from 'lit';
export type DeckQuoteSize = 'lead' | 'big' | 'mega';
export declare class DeckQuote extends LitElement {
    static styles: import("lit").CSSResult;
    /** Attributed name · omitted, the quote stands alone. */
    author?: string;
    /** Role or affiliation, under the name.
     *
     *  NOT `role`: that attribute is ARIA's, and putting "CTO, Acme" in it would
     *  announce the figure as a landmark of that name. The property would also
     *  shadow HTMLElement.role. */
    authorRole?: string;
    /** Type size of the quoted line. */
    size: DeckQuoteSize;
    /** Drop the accent rule down the left edge. */
    plain: boolean;
    /** Use the inverse text tokens · for a quote on a dark slide. */
    onDark: boolean;
    /** Hide the decorative opening mark. */
    noMark: boolean;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-quote': DeckQuote;
    }
}
