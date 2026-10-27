import './deck-scene-item.js';
import { SceneElement } from './scene-kit.js';
export declare class DeckSceneCards extends SceneElement {
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    private card;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-cards': DeckSceneCards;
    }
}
