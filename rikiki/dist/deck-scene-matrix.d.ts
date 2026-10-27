import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneMatrix extends SceneElement {
    static styles: import("lit").CSSResult[];
    columns?: string;
    groups?: string;
    statuses?: string;
    render(): import("lit-html").TemplateResult<1>;
    /** The label column is as wide as the widest label needs, within bounds;
     *  the columns share what is left equally. No PAD after the label · the first
     *  dot already stands half a column away from it, and ten columns need the room. */
    private grid;
    private columnCentre;
    /** The dot and the words under it, as one block. */
    private dotBlock;
    private contentHeight;
    private rowHeight;
    private group;
    /** Headers are centred on their column, and a one-line header sits in the
     *  middle of the two-line band, level with its neighbours' centre. */
    private header;
    /** Bands alternate card and plain fill; the row with `emphasis` takes a tone
     *  of its own · the row the title is about, as in every other scene. */
    private bandClass;
    private row;
    private dot;
    /** One entry per status present, flowing left to right under the grid. */
    private legend;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-matrix': DeckSceneMatrix;
    }
}
