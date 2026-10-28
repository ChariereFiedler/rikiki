import { LitElement } from 'lit';
import { type Overflow, type SceneIssue } from './scene-lint.js';
import { type Fitted, type Measure } from './scene-layout.js';
export * from './scene-layout.js';
/** A measurer for one weight and size, in the family the host renders · the
 *  token is read from the host, so a theme that changes the font changes the
 *  wrap with it. A figure is drawn in the display family, which is often much
 *  wider, so a scene measuring one passes '--rik-font-display'. */
export declare function measurerFor(host: Element, weight: number, familyToken?: string): (size: number) => Measure;
/** The fields of one item that did not fit, ready for `reportOverflow` · each
 *  keeps the name the author gave it (`label`, `note`, `tag`…), so the report
 *  says which text to shorten. `budget` is the width the field had, when it is
 *  the same for all of them. */
export declare function misfits(item: string, fields: Record<string, Fitted>, budget?: number): Overflow[];
/** The colours, strokes and motion every scene shares. Theme tokens only · a
 *  scene re-tints with the deck, and a dark brand theme needs no scene CSS. */
export declare const sceneStyles: import("lit").CSSResult;
/** What every scene does around its own drawing: read its items, play when the
 *  slide is shown, redraw when a web font arrives or an item changes, and say
 *  which item did not fit. */
export declare abstract class SceneElement extends LitElement {
    /** Set by the scene itself when its slide is shown · authors do not write it. */
    playing: boolean;
    /** The width of this scene's canvas, in drawing units · the whole 1600 when
     *  it stands alone, a share of it when a `deck-scene` composes it with others.
     *  Set by the composition, never written by an author. */
    frameWidth?: number;
    /** `frameWidth` when it is a usable number, else the whole canvas. */
    protected get width(): number;
    private observer?;
    private warnedIssues;
    private linted;
    private overflows;
    protected get items(): HTMLElement[];
    connectedCallback(): void;
    disconnectedCallback(): void;
    private readonly onFontsLoaded;
    /** On the active slide of the deck being presented · not in an overview
     *  thumbnail nor in the presenter's preview, which are deck-roots too. */
    private onShownSlide;
    /** Called by deck-root on every step change of the slide being shown. Step 0
     *  is the slide being entered · the moment to play from the start. */
    applyStep(step: number): void;
    /** Before every draw · what the author wrote that this scene would draw wrong
     *  or not at all is named, on the host for the check and once in the console. */
    protected willUpdate(): void;
    /** After the draw · the one thing the lint cannot know before it, how tall the
     *  drawing came out, is read back from its viewBox and reported with the rest. */
    protected updated(): void;
    /** What a scene says about itself beyond the lint of its items · none by default.
     *  A diagram says what its own writing and its own layout found. */
    protected extraIssues(): SceneIssue[];
    /** `data-scene-issues` carries the lint, and what did not fit, as JSON ·
     *  `rikiki check` reads it back. Absent when the scene is clean. */
    protected reportIssues(issues: SceneIssue[]): void;
    /** Name what did not fit · an item alone (a string) or the field with its
     *  measure (an `Overflow`). Reported with the lint in `data-scene-issues` as
     *  `SCENE_TEXT_TOO_LONG`. Drawn anyway: a hidden word is worse than a long one. */
    protected reportOverflow(entries: (string | Overflow)[]): void;
}
