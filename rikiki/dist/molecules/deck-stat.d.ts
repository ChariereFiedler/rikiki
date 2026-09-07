import { LitElement } from 'lit';
export type DeckStatTone = 'yellow' | 'orange' | 'green' | 'red' | 'purple' | 'lime' | 'cyan';
export declare class DeckStat extends LitElement {
    static styles: import("lit").CSSResult;
    num?: string;
    tone?: DeckStatTone;
    updated(): void;
    /** Smaller scale, for a row of stats rather than a single hero figure. */
    compact: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-stat': DeckStat;
    }
}
