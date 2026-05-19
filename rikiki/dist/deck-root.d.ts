import { LitElement } from 'lit';
export declare class DeckRoot extends LitElement {
    static styles: import("lit").CSSResult;
    current: number;
    step: number;
    overview: boolean;
    static properties: {
        current: {
            type: NumberConstructor;
            state: boolean;
        };
        step: {
            type: NumberConstructor;
            state: boolean;
        };
        overview: {
            type: BooleanConstructor;
            reflect: boolean;
        };
    };
    private slides;
    private chapters;
    constructor();
    firstUpdated(): void;
    disconnectedCallback(): void;
    /** Group slides into chapters bounded by <deck-section> markers. */
    private _buildChapters;
    /** Whether 2D nav is enabled (i.e. at least one chapter has multiple slides). */
    private _has2DNav;
    /** Convert flat index → {chapter, intra-chapter index}. */
    private _coords;
    private _flatFromCoords;
    private _onHash;
    private _readHash;
    private _writeHash;
    private _onKey;
    private _toggleHelp;
    private _closeHelp;
    private _maxSteps;
    private _advance;
    private _back;
    private _goTo;
    private _goToCoords;
    private _applyActive;
    private _applyStep;
    private _updateUI;
    updated(): void;
    /** Inject tokens.css into our shadow root so cloned slides get the
     *  light-DOM-only styling (deck-cover > h1, .lead, .sub, etc.). */
    private _ensureOverviewTokens;
    private _renderOverviewIfActive;
    render(): unknown;
}
//# sourceMappingURL=deck-root.d.ts.map