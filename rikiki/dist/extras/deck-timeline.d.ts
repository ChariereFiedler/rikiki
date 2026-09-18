import { LitElement } from 'lit';
export type DeckMilestoneTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger';
export declare class DeckTimeline extends LitElement {
    static styles: import("lit").CSSResult;
    /** `row` (default) or `column`. */
    direction: 'row' | 'column';
    /** Row only · milestones alternate above and below the axis, each twice as wide. */
    alternate: boolean;
    /** Walk the trajectory one milestone per step.
     *
     *  Emphasis, not concealment · at step 0 the whole span is visible, because
     *  the distance between the first and the last date is half the message. */
    reveal: boolean;
    connectedCallback(): void;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    updated(): void;
    /** Tell each milestone its side and column · a grid cannot count its items,
     *  so the index is written where the slotted rule can read it. */
    private _arrange;
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
