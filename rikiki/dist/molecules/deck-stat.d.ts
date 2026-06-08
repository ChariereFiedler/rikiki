import { LitElement } from 'lit';
export type DeckStatTone = 'yellow' | 'orange' | 'green' | 'red' | 'purple' | 'lime' | 'cyan';
export declare class DeckStat extends LitElement {
    static styles: import("lit").CSSResult;
    num?: string;
    tone?: DeckStatTone;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-stat': DeckStat;
    }
}
