import { LitElement } from 'lit';
export type DeckBarTone = 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'muted';
export declare class DeckBar extends LitElement {
    static styles: import("lit").CSSResult;
    /** The measured part, for a single-value bar. */
    value?: number;
    /** The whole it is measured against · defaults to the sum of the segments. */
    total?: number;
    /** Text above the bar. */
    label?: string;
    /** Colour of a single-value bar. */
    tone: DeckBarTone;
    /** A stacked bar · `label:value:tone` triples separated by `|`. */
    segments?: string;
    /** Hide the figure at the right of the label. */
    noValue: boolean;
    /** Hide the legend under a stacked bar. */
    noLegend: boolean;
    private get _stacked();
    private _sized;
    private _color;
    /** The figure beside the label · the honest numbers, not the rounded share. */
    private _figure;
    render(): import("lit-html").TemplateResult<1>;
    /** A bar is an image to assistive technology · without a name it is silence. */
    private _ariaLabel;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-bar': DeckBar;
    }
}
