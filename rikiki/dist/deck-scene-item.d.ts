import { LitElement } from 'lit';
export declare class DeckSceneItem extends LitElement {
    static styles: import("lit").CSSResult;
    label?: string;
    note?: string;
    icon?: string;
    tag?: string;
    value?: string;
    level?: string;
    from?: string;
    to?: string;
    emphasis: boolean;
    render(): null;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-scene-item': DeckSceneItem;
    }
}
