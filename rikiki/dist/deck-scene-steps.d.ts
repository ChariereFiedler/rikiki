import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneSteps extends SceneElement {
    static styles: import("lit").CSSResult[];
    conclusion?: string;
    conclusionNote?: string;
    conclusionIcon?: string;
    render(): import("lit-html").TemplateResult<1>;
    /** The band is drawn when the scene says something to close on · either
     *  attribute is enough, an icon alone is not. */
    private band;
    private row;
    /** From the disc of the row above to the disc of this one · drawn over the
     *  rows, so the sequence reads as one line and not as separate boxes. */
    private connector;
    private drawBand;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-steps': DeckSceneSteps;
    }
}
