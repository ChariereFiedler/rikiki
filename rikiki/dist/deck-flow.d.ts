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
    /** Kept for decks that set it · the chain is now plain by default, so this
     *  only stops the active stage from taking the block. */
    plain: boolean;
    /** Last in the chain · written by deck-flow. Nothing to point at. */
    last: boolean;
    /** Draw the connector to the next stage · written by deck-flow from its own
     *  no-connectors attribute, which declared the option and drew nothing. */
    linked: boolean;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-flow': DeckFlow;
        'deck-flow-step': DeckFlowStep;
    }
}
