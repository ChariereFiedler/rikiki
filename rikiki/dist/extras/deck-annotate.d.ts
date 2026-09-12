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
    private get _marks();
    private _parseOffset;
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
    firstUpdated(): void;
    disconnectedCallback(): void;
    /** Publish the letterboxed picture rectangle as percentages of the frame. */
    private _measure;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-annotate': DeckAnnotate;
    }
}
