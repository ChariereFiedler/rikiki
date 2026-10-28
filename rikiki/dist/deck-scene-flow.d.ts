import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneFlow extends SceneElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    /** Measure and wrap each item's words to the room its column leaves them. */
    private boxes;
    private place;
    /** The merge bracket · a line from each source to a shared bus, then one
     *  arrow into the hub. One source needs no bus: its line runs straight in. */
    private merge;
    /** One straight arrow out of the hub at the height of each outcome · the hub
     *  was made tall enough for all of them to leave from its side. */
    private split;
    private box;
    private describe;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-flow': DeckSceneFlow;
    }
}
