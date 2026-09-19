import { LitElement } from 'lit';
export type DeckPunchTone = 'warn' | 'danger' | 'ok' | 'info' | 'muted' | 'accent';
export type DeckPunchSize = 'lead' | 'big' | 'mega' | 'stat' | 'display';
export declare class DeckPunch extends LitElement {
    static styles: import("lit").CSSResult;
    tone?: DeckPunchTone;
    size?: DeckPunchSize;
    weight?: string;
    align?: string;
    /** Shrink to fit the box (overrides `size`/cqw fluid scaling). */
    fit: boolean;
    /** fit floor / ceiling in rem · default 1 / 12. */
    fitMin?: number;
    fitMax?: number;
    private fitter;
    updated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-punch': DeckPunch;
    }
}
