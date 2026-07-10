import { LitElement } from 'lit';
export declare class DeckMd extends LitElement {
    static styles: import("lit").CSSResult;
    private _html;
    connectedCallback(): void;
    /** Re-read the light-DOM source and re-render · used by the live editor when
     *  the markdown is edited in place. */
    reparse(): void;
    private _parse;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-md': DeckMd;
    }
}
