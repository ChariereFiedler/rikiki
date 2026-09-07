import { LitElement } from 'lit';
export declare class DeckAgenda extends LitElement {
    static styles: import("lit").CSSResult;
    /** Hide the entry numbers. */
    noNumbers: boolean;
    /** Do not let a click jump to the chapter · for a printed running order. */
    noJump: boolean;
    private _entries;
    private _current;
    private get _deck();
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onSlideChange;
    /** Chapter titles and the current position, from the deck itself. */
    private _read;
    private _titleOf;
    private _state;
    private _go;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-agenda': DeckAgenda;
    }
}
