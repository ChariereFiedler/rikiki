import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneLanes extends SceneElement {
    static styles: import("lit").CSSResult[];
    gate?: string;
    trigger?: string;
    passed?: string;
    blocked?: string;
    render(): import("lit-html").TemplateResult<1>;
    private lane;
    /** The trigger sits on the left of the header, as wide as the gate's label
     *  leaves it, with a dashed connector running on to the gate. */
    private triggerText;
    private laneRow;
    private describe;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-lanes': DeckSceneLanes;
    }
}
