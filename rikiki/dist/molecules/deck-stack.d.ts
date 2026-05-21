import { LitElement } from 'lit';
export type DeckStackDirection = 'row' | 'column';
export type DeckStackAlign = 'start' | 'center' | 'end' | 'stretch';
export type DeckStackJustify = 'start' | 'center' | 'end' | 'between' | 'around';
export declare class DeckStack extends LitElement {
    static styles: import("lit").CSSResult;
    gap?: string;
    direction?: DeckStackDirection;
    align?: DeckStackAlign;
    justify?: DeckStackJustify;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-stack': DeckStack;
    }
}
//# sourceMappingURL=deck-stack.d.ts.map