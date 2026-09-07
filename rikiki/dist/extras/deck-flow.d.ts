import { LitElement } from 'lit';
export declare class DeckFlow extends LitElement {
    static styles: import("lit").CSSResult;
    cols?: string;
    noConnectors: boolean;
    /** Walk the chain one stage per step.
     *
     *  This EMPHASISES, it does not hide: at step 0 the whole chain is visible
     *  and neutral, because the room needs to see the shape of the process
     *  before being walked through it. Hiding four stages behind four clicks
     *  tells the audience nothing while they wait. */
    reveal: boolean;
    private _step;
    willUpdate(): void;
    connectedCallback(): void;
    /** Called by deck-root on every step change. */
    applyStep(step: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class DeckFlowStep extends LitElement {
    static styles: import("lit").CSSResult[];
    label?: string;
    note?: string;
    /** Position in the chain, written by deck-flow · the reader counts stages,
     *  and a number does that better than four identical icons. */
    index?: string;
    /** Drop the block and set the stage as type under a rule. */
    plain: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-flow': DeckFlow;
        'deck-flow-step': DeckFlowStep;
    }
}
