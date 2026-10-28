import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneBars extends SceneElement {
    static styles: import("lit").CSSResult[];
    unit: string;
    max?: string;
    height?: number;
    render(): import("lit-html").TemplateResult<1>;
    private bar;
    /** The fields of a bar that did not fit, each with what it needed · the
     *  figure and the label are different problems with different fixes. */
    private overflowsOf;
    /** A group caption may use the width of its group, labels' overhang included. */
    private captions;
    /** Every label row takes the height of the fullest label, so the captions
     *  of every group sit on one line. */
    private bands;
    private drawBar;
    private lines;
    /** What a screen reader hears: each group's caption, then its bars. */
    private description;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-bars': DeckSceneBars;
    }
}
