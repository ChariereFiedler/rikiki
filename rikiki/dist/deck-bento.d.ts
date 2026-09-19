import { LitElement } from 'lit';
export type DeckBentoAlign = 'start' | 'center' | 'end' | 'stretch';
export declare class DeckBento extends LitElement {
    static styles: import("lit").CSSResult[];
    eyebrow?: string;
    cols?: string;
    rows?: string;
    gap?: string;
    align?: DeckBentoAlign;
    justify?: DeckBentoAlign;
    /**
     * Line a row of points up band by band.
     *
     * A row of items is a row of independent flows, so a title that wraps to a
     * second line pushes its own body text below its neighbours' and nothing in
     * the row shares a baseline. Giving the grid one band per child position and
     * letting each point borrow those bands makes every first child share a row,
     * every second child the next, and so on.
     *
     * Only a row of deck-point, and only one the author did not shape. A
     * deck-cell is a size container, which reports no height for a band to be
     * sized from and makes subgrid compute to none, so a row holding one is left
     * alone rather than half-aligned. So is a row whose items claim their own
     * span, or whose bento declares its own rows, because bands would fight that.
     * Uneven items are left alone too · sharing bands there would mean inventing
     * empty ones, and an invented band is a gap nobody asked for.
     *
     * Returns the band count, or 0 when this bento is not such a row.
     */
    private _bandCount;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-bento': DeckBento;
    }
}
