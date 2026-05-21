import { LitElement } from 'lit';
export declare class DeckNotes extends LitElement {
    static styles: import("lit").CSSResult;
    /** Read by the presenter plugin · pre-formatted text content. */
    get notes(): string;
    render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-notes': DeckNotes;
    }
}
//# sourceMappingURL=deck-notes.d.ts.map