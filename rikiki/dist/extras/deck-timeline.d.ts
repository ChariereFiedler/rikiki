import { LitElement } from 'lit';
export type DeckMilestoneTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger';
export declare class DeckTimeline extends LitElement {
    static styles: import("lit").CSSResult;
    /** `row` (default) or `column`. */
    direction: 'row' | 'column';
    /** Walk the trajectory one milestone per step.
     *
     *  Emphasis, not concealment · at step 0 the whole span is visible, because
     *  the distance between the first and the last date is half the message. */
    reveal: boolean;
    connectedCallback(): void;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckMilestone extends LitElement {
    static styles: import("lit").CSSResult;
    date?: string;
    label?: string;
    note?: string;
    tone: DeckMilestoneTone;
    willUpdate(): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-timeline': DeckTimeline;
        'deck-milestone': DeckMilestone;
    }
}
