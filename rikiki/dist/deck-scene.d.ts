import { SceneElement } from './scene-kit.js';
export declare class DeckScene extends SceneElement {
    static styles: import("lit").CSSResult[];
    layout?: string;
    split?: string;
    link?: string;
    align?: string;
    stagger?: number;
    /** The children, each with the part it plays · scenes are regions, a band
     *  closes, anything else is a stray the lint names and the grid hides. */
    private get parts();
    private get regions();
    private get layoutKind();
    /** Content width of each region · what a row shares out, or the whole canvas. */
    private frameWidths;
    protected willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
    /** Where each child sits and when it enters · by position, so an author never
     *  writes a grid line, and set from the shadow tree so the scenes' own DOM is
     *  left alone. */
    private placement;
    /** One mark in each gutter · an arrow or a word, centred on the row of scenes. */
    private links;
    private mark;
    /** After the draw, and after every child has drawn: the composition's own
     *  findings · what was written, then how tall the whole came out. */
    protected updated(): void;
    private drawnHeight;
    private tallness;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene': DeckScene;
    }
}
