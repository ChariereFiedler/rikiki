import { LitElement } from 'lit';
export declare class DeckFigure extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Image URL. */
    src?: string;
    /** Text alternative. Required unless `decorative` is present. */
    alt?: string;
    /** Declare that the image conveys no information. Produces alt="". */
    decorative: boolean;
    /** Concise explanation displayed below the image. */
    caption?: string;
    /** Source or credit displayed beside the caption. */
    source?: string;
    /** Optional URL for the source or credit. */
    sourceHref?: string;
    private get _hasCaption();
    private get _hasSource();
    private get _imageAlt();
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-figure': DeckFigure;
    }
}
