import { SceneElement } from './scene-kit.js';
export declare class DeckSceneBand extends SceneElement {
    static styles: import("lit").CSSResult[];
    label?: string;
    note?: string;
    icon?: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-band': DeckSceneBand;
    }
}
