// ════════════════════════════════════════════════════════════════
// RIKIKI · the scene kit
//
// What every deck-scene-* shares: the drawing width, the text measurer, the
// wrapping that keeps a word whole, the type scale in drawing units, the theme
// classes, and the `playing` switch the engine flips when the slide is shown.
//
// Not an element · a helper with several consumers in one family lives in that
// family (ADR-004), and every consumer bundles its own copy, as every opt-in
// module does.
//
// WHY MEASURE · a hand-drawn scene guesses a string's width from a per-character
// average, and the guess is wrong for every word that is not average. The canvas
// measures the string in the font the slide actually renders, so a note wraps
// where it really runs out of room, and a note that cannot fit is known, not
// discovered on a projector.
// ════════════════════════════════════════════════════════════════

import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';

import {
  type ItemRecord,
  type Overflow,
  type SceneIssue,
  heightIssue,
  lintScene,
  overflowIssue,
  sceneKindOf,
} from './scene-lint.js';
import { EDGE, type Fitted, type Measure, SCENE_WIDTH } from './scene-layout.js';

/** Narrower than this a scene has no room to say anything · a composition that
 *  gives less is wrong, and the scene draws the whole canvas rather than a sliver. */
const MIN_FRAME = 200;

export * from './scene-layout.js';

let canvas: HTMLCanvasElement | null = null;

function context(): CanvasRenderingContext2D | null {
  canvas ??= document.createElement('canvas');
  return canvas.getContext('2d');
}

/** A measurer for one weight and size, in the family the host renders · the
 *  token is read from the host, so a theme that changes the font changes the
 *  wrap with it. A figure is drawn in the display family, which is often much
 *  wider, so a scene measuring one passes '--rik-font-display'. */
export function measurerFor(host: Element, weight: number, familyToken = '--rik-font-sans') {
  const style = getComputedStyle(host);
  const family =
    style.getPropertyValue(familyToken).trim() ||
    style.getPropertyValue('--rik-font-sans').trim() ||
    'sans-serif';
  return (size: number): Measure => {
    const ctx = context();
    if (!ctx) return (text) => text.length * size * 0.5;
    const font = `${weight} ${size}px ${family}`;
    requestFace(font);
    // The canvas is shared by every scene and every measurer · the font is set
    // on each measure, so a call made in between cannot change this one's.
    return (text) => {
      ctx.font = font;
      return ctx.measureText(text).width;
    };
  };
}

const requestedFaces = new Set<string>();

/** A web font loads when something first uses it, and a canvas measure alone
 *  does not always count · ask for the face once, so that the measure is made in
 *  the font the slide will draw in (`loadingdone` redraws the scene). */
function requestFace(font: string): void {
  if (requestedFaces.has(font) || !document.fonts?.load) return;
  requestedFaces.add(font);
  document.fonts.load(font).catch((error: unknown) => {
    console.warn(`rikiki · scene font did not load (${font}): ${String(error)}`);
  });
}

/** The fields of one item that did not fit, ready for `reportOverflow` · each
 *  keeps the name the author gave it (`label`, `note`, `tag`…), so the report
 *  says which text to shorten. `budget` is the width the field had, when it is
 *  the same for all of them. */
export function misfits(item: string, fields: Record<string, Fitted>, budget?: number): Overflow[] {
  return Object.entries(fields)
    .filter(([, fitted]) => !fitted.fits)
    .map(([field, fitted]) => ({
      item,
      field,
      text: fitted.lines.join(' '),
      budget,
      size: fitted.size,
    }));
}

/** The colours, strokes and motion every scene shares. Theme tokens only · a
 *  scene re-tints with the deck, and a dark brand theme needs no scene CSS. */
export const sceneStyles = css`
  :host {
    display: block;
    inline-size: 100%;
  }
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    overflow: visible;
  }
  text {
    font-family: var(--rik-font-sans);
    fill: var(--rik-text-default);
  }
  .note {
    fill: var(--deck-scene-muted, var(--rik-text-default--muted));
  }
  .tag {
    /* The strong accent, not the text accent · a tag sits on a card (paper-100),
       and the text accent measures 2.8:1 there, under the 3:1 large text needs.
       \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
    fill: var(
      --deck-scene-tag,
      var(--rik-accent--strong, var(--rik-accent__text, var(--rik-accent)))
    );
  }
  .value {
    font-family: var(--rik-font-display, var(--rik-font-sans));
  }
  .card {
    fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: 1.5;
  }
  .emphasis {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
    stroke: none;
  }
  .on-emphasis {
    fill: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
  }
  .line {
    fill: none;
    stroke: var(--deck-scene-line, var(--rik-text-default));
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .line.muted {
    stroke: var(--deck-scene-muted, var(--rik-text-default--faint));
  }
  .dash {
    stroke-dasharray: 10 10;
  }
  .icon {
    fill: none;
    stroke: var(--deck-scene-icon, var(--rik-accent__text, var(--rik-accent)));
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .icon.on-emphasis {
    stroke: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
    fill: none;
  }
  .token {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
    opacity: 0;
  }

  /* Motion lives inside the drawing and only while the slide is shown · without
     [playing] (overview, presenter preview, render, print) the scene is at its
     final state, which is the state a reader of the PDF needs. */
  .pop,
  .grow,
  .grow-x {
    transform-box: fill-box;
  }
  .pop {
    transform-origin: center;
  }
  .grow {
    transform-origin: bottom;
  }
  .grow-x {
    transform-origin: left;
  }
  :host([playing]) .pop {
    animation: scene-pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .fade {
    animation: scene-fade 0.5s ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .grow {
    animation: scene-grow 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .grow-x {
    animation: scene-grow-x 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .token {
    animation: scene-token var(--du, 0.9s) cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  @keyframes scene-pop {
    from { opacity: 0; transform: scale(0.6); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes scene-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scene-grow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  @keyframes scene-grow-x {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes scene-token {
    0% { opacity: 0; transform: translate(0, 0); }
    12% { opacity: 1; transform: translate(0, 0); }
    88% { opacity: 1; transform: translate(var(--dx, 0), var(--dy, 0)); }
    100% { opacity: 0; transform: translate(var(--dx, 0), var(--dy, 0)); }
  }
  @media (prefers-reduced-motion: reduce) {
    :host([playing]) :is(.pop, .fade, .grow, .grow-x, .token) {
      animation: none;
    }
  }
  @media print {
    :host([playing]) :is(.pop, .fade, .grow, .grow-x, .token) {
      animation: none;
    }
  }
`;

/** An item as the author wrote it · raw attributes, for the lint. */
function itemRecord(item: HTMLElement): ItemRecord {
  const read = (name: string) => item.getAttribute(name);
  return {
    label: read('label'),
    note: read('note'),
    icon: read('icon'),
    tag: read('tag'),
    value: read('value'),
    level: read('level'),
    from: read('from'),
    to: read('to'),
    emphasis: item.hasAttribute('emphasis'),
  };
}

/** What every scene does around its own drawing: read its items, play when the
 *  slide is shown, redraw when a web font arrives or an item changes, and say
 *  which item did not fit. */
export abstract class SceneElement extends LitElement {
  /** Set by the scene itself when its slide is shown · authors do not write it. */
  @property({ type: Boolean, reflect: true }) playing = false;

  /** The width of this scene's canvas, in drawing units · the whole 1600 when
   *  it stands alone, a share of it when a `deck-scene` composes it with others.
   *  Set by the composition, never written by an author. */
  @property({ type: Number, attribute: 'frame-width' }) frameWidth?: number;

  /** `frameWidth` when it is a usable number, else the whole canvas. */
  protected get width(): number {
    const width = this.frameWidth;
    return width !== undefined && Number.isFinite(width) && width >= MIN_FRAME
      ? width
      : SCENE_WIDTH;
  }

  private observer?: MutationObserver;
  private warnedIssues = '';
  private linted: SceneIssue[] = [];
  private overflows: Overflow[] = [];

  protected get items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(':scope > deck-scene-item')];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // An opt-in module loads after the engine has entered the first slide, so
    // that applyStep(0) reached an element not yet upgraded · a scene on the
    // shown slide of a live deck starts itself. Anything else rests, including
    // a copy that arrives with the attribute set (the overview clones slides).
    if (this.onShownSlide()) this.applyStep(0);
    else this.playing = false;
    // A web font that lands after the first paint changes every measure.
    document.fonts?.ready.then(() => this.requestUpdate());
    document.fonts?.addEventListener('loadingdone', this.onFontsLoaded);
    // Redraw when an item changes · but not on the host's own attributes, which
    // the scene writes itself (playing, data-scene-issues) and would loop on.
    this.observer = new MutationObserver((records) => {
      if (records.some((record) => record.type === 'childList' || record.target !== this))
        this.requestUpdate();
    });
    this.observer.observe(this, { attributes: true, childList: true, subtree: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
    document.fonts?.removeEventListener('loadingdone', this.onFontsLoaded);
  }

  private readonly onFontsLoaded = (): void => {
    this.requestUpdate();
  };

  /** On the active slide of the deck being presented · not in an overview
   *  thumbnail nor in the presenter's preview, which are deck-roots too. */
  private onShownSlide(): boolean {
    const root = this.closest('deck-root');
    if (!root || root.hasAttribute('data-overview-snapshot') || root.hasAttribute('preview'))
      return false;
    return !!this.closest('deck-root > [active]');
  }

  /** Called by deck-root on every step change of the slide being shown. Step 0
   *  is the slide being entered · the moment to play from the start. */
  applyStep(step: number): void {
    if (step !== 0) return;
    this.playing = false;
    requestAnimationFrame(() => {
      this.playing = true;
    });
  }

  /** Before every draw · what the author wrote that this scene would draw wrong
   *  or not at all is named, on the host for the check and once in the console. */
  protected override willUpdate(): void {
    const kind = sceneKindOf(this.localName);
    this.linted = kind
      ? lintScene(kind, this.items.map(itemRecord), {
          columns: this.getAttribute('columns'),
          passed: this.getAttribute('passed'),
          blocked: this.getAttribute('blocked'),
          total: this.getAttribute('total'),
          max: this.getAttribute('max'),
          height: this.getAttribute('height'),
          scale: this.getAttribute('scale'),
          width: this.width,
        })
      : [];
  }

  /** After the draw · the one thing the lint cannot know before it, how tall the
   *  drawing came out, is read back from its viewBox and reported with the rest. */
  protected override updated(): void {
    const kind = sceneKindOf(this.localName);
    const viewBox = this.renderRoot.querySelector('svg')?.getAttribute('viewBox');
    const drawn = Number(viewBox?.split(' ')[3]) - 2 * EDGE;
    // In a composition the height budget is the composition's, not this scene's.
    const tall =
      kind && drawn > 0 && this.frameWidth === undefined
        ? heightIssue(kind, drawn, this.items.length)
        : null;
    const long = overflowIssue(kind ?? this.localName.replace(/^deck-scene-/, ''), this.overflows, {
      width: this.width,
      count: this.items.length,
    });
    this.reportIssues([
      ...this.linted,
      ...this.extraIssues(),
      ...(long ? [long] : []),
      ...(tall ? [tall] : []),
    ]);
  }

  /** What a scene says about itself beyond the lint of its items · none by default.
   *  A diagram says what its own writing and its own layout found. */
  protected extraIssues(): SceneIssue[] {
    return [];
  }

  /** `data-scene-issues` carries the lint, and what did not fit, as JSON ·
   *  `rikiki check` reads it back. Absent when the scene is clean. */
  protected reportIssues(issues: SceneIssue[]): void {
    const value = issues.length ? JSON.stringify(issues) : '';
    if (value !== (this.getAttribute('data-scene-issues') ?? '')) {
      if (value) this.setAttribute('data-scene-issues', value);
      else this.removeAttribute('data-scene-issues');
    }
    if (value && value !== this.warnedIssues) {
      for (const issue of issues) {
        console.warn(`<${this.localName}> · ${issue.message}: ${issue.items.join(', ')}`);
      }
    }
    this.warnedIssues = value;
  }

  /** Name what did not fit · an item alone (a string) or the field with its
   *  measure (an `Overflow`). Reported with the lint in `data-scene-issues` as
   *  `SCENE_TEXT_TOO_LONG`. Drawn anyway: a hidden word is worse than a long one. */
  protected reportOverflow(entries: (string | Overflow)[]): void {
    this.overflows = entries.map((entry) =>
      typeof entry === 'string' ? { item: entry, field: 'text' } : entry,
    );
  }
}
