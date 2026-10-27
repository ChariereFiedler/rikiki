import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneUnits extends SceneElement {
    static styles: import("lit").CSSResult[];
    total?: string;
    columns?: string;
    render(): import("lit-html").TemplateResult<1>;
    private panel;
    private drawPanel;
    private describe;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-units': DeckSceneUnits;
    }
}
