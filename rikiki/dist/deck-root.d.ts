import { LitElement } from 'lit';
export declare class DeckRoot extends LitElement {
    static styles: import("lit").CSSResult;
    current: number;
    step: number;
    overview: boolean;
    private slides;
    private chapters;
    private _overviewTeardown;
    firstUpdated(): void;
    disconnectedCallback(): void;
    /** Group slides into chapters bounded by <deck-section> markers. */
    private _buildChapters;
    /** True when at least one chapter has multiple slides and there are 2+ chapters. */
    private _has2DNav;
    /** Flat index → {chapter, intra-chapter index}. */
    private _coords;
    private _flatFromCoords;
    private _onHash;
    private _readHash;
    private _writeHash;
    private _onKey;
    /** Lazy-import the help module the first time the user opens it. */
    private _toggleHelp;
    private _closeHelp;
    /** Lazy-import the overview module the first time the user opens it. */
    private _renderOverviewIfActive;
    private _maxSteps;
    private _advance;
    private _back;
    private _goTo;
    private _goToCoords;
    private _applyActive;
    private _applyStep;
    private _updateUI;
    updated(): void;
    render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-root': DeckRoot;
    }
}
//# sourceMappingURL=deck-root.d.ts.map