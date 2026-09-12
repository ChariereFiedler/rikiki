import { LitElement } from 'lit';
export declare class DeckAnnotate extends LitElement {
    static styles: import("lit").CSSResult;
    /** The image to annotate. */
    src?: string;
    /** Alternative text · required for anything a reader must understand. */
    alt: string;
    /** `x,y,label` triples separated by `|`, coordinates in percent. */
    marks?: string;
    /** Show every mark at once instead of revealing them one per step. */
    allAtOnce: boolean;
    /** Drop the legend list under the image. */
    noLegend: boolean;
    /** Draw a line from the precise target coordinate to the displaced badge. */
    leader: boolean;
    /** Default badge displacement as `x,y` CSS pixels, for example `28,-24`. */
    offset: string;
    /** Per-mark displacements separated by `|`; missing entries use `offset`. */
    offsets?: string;
    /** Concise explanation displayed under the legend, in a real figcaption. */
    caption?: string;
    /** Source or credit displayed beside the caption. */
    source?: string;
    /** Optional URL for the source or credit. */
    sourceHref?: string;
    private get _hasCaption();
    private get _hasSource();
    /** Current step, mirrored from the slide by deck-root's step machinery. */
    private _step;
    /** Rendered badge diameter, measured from `.mark` · 0 until `_measure()`
     *  has run once, so a keyword offset sits on the target for one frame
     *  rather than guessing a size. */
    private _markSize;
    /** Rendered `--deck-annotate-anchor-gap`, measured the same way. */
    private _anchorGap;
    private get _marks();
    /** Turn a parsed offset into a pixel displacement · a keyword resolves to
     *  the badge radius plus the gap, in the named direction, and always
     *  forces the leader on since a badge moved on the author's say-so, not a
     *  measured pixel value, needs the line back to what it annotates. */
    private _displacementFor;
    private _offsetFor;
    /** The engine reads the step count off the SLIDE (`steps` / `data-steps`), so
     *  the component publishes what it needs onto its own slide · one step per
     *  mark. It only ever raises the count, never lowers one the author set. */
    private _publishSteps;
    connectedCallback(): void;
    /** Called by deck-root on every step change · it walks the active slide and
     *  invokes this on each descendant that has it. No listener to clean up. */
    applyStep(step: number): void;
    private _ro?;
    /** Pending settle frame, so the loop is never started twice over. */
    private _frame;
    /** Geometry the last SUCCESSFUL measurement was taken from · empty while
     *  nothing could be measured yet, which keeps the settle loop retrying. */
    private _measuredFrom;
    firstUpdated(): void;
    updated(): void;
    disconnectedCallback(): void;
    /** Watch everything whose size decides the painted rectangle.
     *
     *  The frame is what the picture is measured against, but its height is
     *  decided by its siblings inside the figure : the legend and the caption.
     *  Observing the host and the image as well means a reflow whose frame
     *  notification never arrives is still caught by another one. */
    private _observe;
    /** Observe the image and hear its decode · both are no-ops when already
     *  registered, so this is safe to call on every render. The image element
     *  itself is recreated whenever `src` goes from unset to set. */
    private _watchImage;
    private _onLoad;
    /** Re-measure once per animation frame until the geometry has stopped
     *  moving, then stop.
     *
     *  A ResizeObserver notification is the normal trigger, and on a loaded page
     *  this loop ends after three frames. It exists because a notification is
     *  not a guarantee : a slow engine can deliver the frame's growth while the
     *  image still has no natural size (the measurement then bails and nothing
     *  re-triggers it), and a dropped or coalesced notification leaves the last
     *  published rectangle stale forever, which puts every marker in the wrong
     *  place with no way back. */
    private _settle;
    private _scheduleSettle;
    /** Publish the letterboxed picture rectangle as percentages of the frame,
     *  and the measured badge size and anchor gap a keyword offset needs. */
    private _measure;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-annotate': DeckAnnotate;
    }
}
