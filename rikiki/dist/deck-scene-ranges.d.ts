import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneRanges extends SceneElement {
    static styles: import("lit").CSSResult;
    scale?: string;
    unit?: string;
    caption?: string;
    openLabel?: string;
    render(): import("lit-html").TemplateResult<1>;
    /** The note starts after the widest label, so every note lines up. */
    private noteX;
    /** The scale starts after the words on the left, as close as they allow and
     *  never past MAX_LEFT_SHARE · a longer note wraps instead. */
    private scaleArea;
    /** The declared maximum, or the largest value of the rows when the author
     *  left it out · a chart drawn to its own data rather than not drawn at all. */
    private scaleMaximum;
    private formatScale;
    private header;
    /** The bar's centre, from the top of its row · the tag sits above the bar. */
    private barCentre;
    /** The label shares a baseline with the first note line, both centred on the
     *  bar · the name reads on the line it names. */
    private labelBaseline;
    private rowHeight;
    private row;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-ranges': DeckSceneRanges;
    }
}
