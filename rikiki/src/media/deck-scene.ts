// ════════════════════════════════════════════════════════════════
// <deck-scene layout="row" split="1:1" link="arrow">
//   <deck-scene-units total="50" columns="10">…</deck-scene-units>
//   <deck-scene-units total="50" columns="10">…</deck-scene-units>
//   <deck-scene-band label="Twice as many stay"></deck-scene-band>
// </deck-scene>
//
// Several scenes on one slide, as one illustration · two or three side by side
// with a link between them (before and after, this against that), or two one
// above the other, with an optional closing band under either. It composes the
// scenes that exist: nothing is redrawn, each keeps its own drawing and its own
// checks.
//
// ONE SCALE · a unit is the same length in every region. A scene drawn in half
// the row is told it has half the canvas to lay out in (`frame-width`), so it
// wraps and fits for that width instead of being shrunk, and its text is the
// size of a scene drawn alone. A region too narrow to say its piece is reported,
// never drawn small.
//
// OPT-IN · <script type="module" src="dist/deck-scene.js"></script>
//
// Attributes:
//   layout · row (default, up to 3 scenes) or stack (2)
//   split  · "2:1" the shares of a row, one positive number per scene (default equal)
//   link   · arrow, vs, equals or plus, drawn between the scenes of a row
//   align  · start, center (default), end or stretch: where a shorter scene sits
//   stagger · seconds between one scene's entrance and the next's (default 0.45)
//
// Children: scenes (deck-scene-*) and at most one deck-scene-band, last.
//
// Tokens: --deck-scene-line colours the link; the scenes keep their own.
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import {
  type ComposeLayout,
  LINKS,
  LINK_WORDS,
  type LinkKind,
  REGION_GAP,
  STACK_GAP,
  composedHeight,
  layoutOf,
  lintCompose,
  parseSplit,
  rowFrame,
} from './deck-scene-compose-layout.js';
import { EDGE, SCENE_WIDTH, SceneElement, TYPE, sceneStyles } from './scene-kit.js';
import { type SceneIssue, heightIssue } from './scene-lint.js';

const BAND_TAG = 'deck-scene-band';
const LINK_HEIGHT = 64;
const LINK_ICON = 48;
const DEFAULT_STAGGER = 0.45;
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;
/** The whole host width, in units · a scene alone is this wide (canvas + margins). */
const HOST_UNITS = SCENE_WIDTH + 2 * EDGE;

interface Child {
  element: HTMLElement;
  role: 'region' | 'band' | 'stray';
}

const isScene = (el: Element) =>
  el.localName.startsWith('deck-scene-') && el.localName !== 'deck-scene-item';

/** A length of `units` drawing units, as a share of the host's width. */
const cq = (units: number) => `${((units / HOST_UNITS) * 100).toFixed(5)}cqw`;

@customElement('deck-scene')
export class DeckScene extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      :host {
        display: block;
      }
      .stage {
        container-type: inline-size;
        inline-size: 100%;
      }
      .grid {
        display: grid;
        position: relative;
        align-items: center;
      }
      .links {
        grid-row: 1;
        grid-column: 1 / -1;
        position: relative;
        pointer-events: none;
      }
      .link {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
      }
      .link svg {
        inline-size: 100%;
      }
      .link .icon {
        stroke: var(--deck-scene-line, var(--rik-text-default--muted));
      }
      .link text {
        fill: var(--deck-scene-line, var(--rik-text-default--muted));
      }
    `,
  ];

  @property({ type: String }) layout?: string;
  @property({ type: String }) split?: string;
  @property({ type: String }) link?: string;
  @property({ type: String }) align?: string;
  @property({ type: Number }) stagger?: number;

  /** The children, each with the part it plays · scenes are regions, the first
   *  band closes, anything else (a second band included) is a stray the lint
   *  names and the grid hides · two bands would share one row, one over the other. */
  private get parts(): Child[] {
    const firstBand = [...this.children].find((element) => element.localName === BAND_TAG);
    return [...this.children].map((element) => ({
      element: element as HTMLElement,
      role:
        element === firstBand
          ? 'band'
          : element.localName !== BAND_TAG && isScene(element)
            ? 'region'
            : 'stray',
    }));
  }

  private get regions(): HTMLElement[] {
    return this.parts.filter((p) => p.role === 'region').map((p) => p.element);
  }

  private get layoutKind(): ComposeLayout {
    return layoutOf(this.layout ?? null);
  }

  /** Content width of each region · what a row shares out, or the whole canvas. */
  private frameWidths(): number[] {
    const count = this.regions.length;
    if (this.layoutKind === 'stack') return this.regions.map(() => SCENE_WIDTH);
    return rowFrame(parseSplit(this.split ?? null, count).shares).widths;
  }

  protected override willUpdate(): void {
    // Each region draws for its share of the canvas · set before it renders.
    const widths = this.frameWidths();
    this.regions.forEach((region, i) => {
      (region as HTMLElement & { frameWidth?: number }).frameWidth = widths[i];
    });
    const band = this.parts.find((p) => p.role === 'band')?.element as
      | (HTMLElement & { frameWidth?: number })
      | undefined;
    if (band) band.frameWidth = SCENE_WIDTH;
  }

  override render() {
    const layout = this.layoutKind;
    const parts = this.parts;
    const count = this.regions.length;
    const shares = parseSplit(this.split ?? null, count).shares;
    const frame = rowFrame(shares);
    const stagger =
      this.stagger !== undefined && this.stagger >= 0 ? this.stagger : DEFAULT_STAGGER;
    const link = (LINKS as readonly string[]).includes(this.link ?? '')
      ? (this.link as LinkKind)
      : null;
    const align = (ALIGNS as readonly string[]).includes(this.align ?? '') ? this.align : 'center';

    const columns =
      layout === 'row' && count >= 2 ? frame.tracks.map((t) => cq(t)).join(' ') : cq(HOST_UNITS);
    const placement = this.placement(parts, layout, stagger, count);

    return html`<div class="stage">
      <div
        class="grid"
        style="grid-template-columns:${columns};column-gap:${cq(frame.gap)};row-gap:${cq(STACK_GAP)};align-items:${align}"
      >
        <style>${placement}</style>
        ${layout === 'row' && link && count >= 2 ? this.links(frame, link, count) : ''}
        <slot></slot>
      </div>
    </div>`;
  }

  /** Where each child sits and when it enters · by position, so an author never
   *  writes a grid line, and set from the shadow tree so the scenes' own DOM is
   *  left alone. */
  private placement(parts: Child[], layout: ComposeLayout, stagger: number, count: number): string {
    const rules: string[] = [];
    let region = 0;
    parts.forEach((part, index) => {
      const slot = index + 1;
      const target = `::slotted(:nth-child(${slot}))`;
      if (part.role === 'stray') {
        rules.push(`${target}{display:none}`);
      } else if (part.role === 'band') {
        const row = layout === 'row' ? 2 : count + 1;
        rules.push(
          `${target}{grid-column:1/-1;grid-row:${row};--scene-delay:${(count * stagger).toFixed(2)}s}`,
        );
      } else {
        const column = layout === 'row' ? region + 1 : 1;
        const row = layout === 'row' ? 1 : region + 1;
        rules.push(
          `${target}{grid-column:${column};grid-row:${row};--scene-delay:${(region * stagger).toFixed(2)}s}`,
        );
        region += 1;
      }
    });
    return rules.join('');
  }

  /** One mark in each gutter · an arrow or a word, centred on the row of scenes. */
  private links(frame: ReturnType<typeof rowFrame>, kind: LinkKind, count: number) {
    return html`<div class="links" aria-hidden="true">
      ${frame.gutterCentres.slice(0, count - 1).map((centre) => {
        const width = REGION_GAP - 2 * EDGE;
        const left = centre - width / 2;
        return html`<div class="link" style="left:${cq(left)};width:${cq(width)}">
          <svg viewBox="0 0 ${width} ${LINK_HEIGHT}" part="link">${this.mark(kind, width)}</svg>
        </div>`;
      })}
    </div>`;
  }

  private mark(kind: LinkKind, width: number) {
    if (kind === 'arrow') {
      const path = iconPath('arrow');
      const scale = LINK_ICON / 24;
      return svg`<g transform="translate(${(width - LINK_ICON) / 2} ${(LINK_HEIGHT - LINK_ICON) / 2}) scale(${scale})">
        <path class="icon" d=${path ?? ''}></path>
      </g>`;
    }
    return svg`<text x=${width / 2} y=${LINK_HEIGHT / 2 + TYPE.label.size * 0.36}
      text-anchor="middle" font-size=${TYPE.label.size} font-weight=${TYPE.label.weight}>${LINK_WORDS[kind]}</text>`;
  }

  /** After the draw, and after every child has drawn: the composition's own
   *  findings · what was written, then how tall the whole came out. */
  protected override updated(): void {
    const parts = this.parts;
    const regions = this.regions;
    const children = parts.map(
      (p) => p.element as HTMLElement & { updateComplete?: Promise<unknown> },
    );
    void Promise.all(children.map((c) => c.updateComplete)).then(() => {
      const issues: SceneIssue[] = lintCompose(
        {
          layout: this.getAttribute('layout'),
          link: this.getAttribute('link'),
          split: this.getAttribute('split'),
          regions: regions.map((r) => r.localName),
          strays: parts.filter((p) => p.role === 'stray').map((p) => p.element.localName),
          band: parts.some((p) => p.role === 'band'),
        },
        regions
          .filter((r) => r.querySelector(':scope > deck-scene-item[emphasis]'))
          .map((r) => r.localName),
      );
      const tall = this.tallness(regions, parts);
      this.reportIssues(tall ? [...issues, tall] : issues);
    });
  }

  private drawnHeight(element: Element): number {
    const viewBox = element.shadowRoot?.querySelector('svg')?.getAttribute('viewBox');
    const height = Number(viewBox?.split(' ')[3]) - 2 * EDGE;
    return Number.isFinite(height) && height > 0 ? height : 0;
  }

  private tallness(regions: HTMLElement[], parts: Child[]): SceneIssue | null {
    const band = parts.find((p) => p.role === 'band')?.element;
    const total = composedHeight(
      this.layoutKind,
      regions.map((r) => this.drawnHeight(r)),
      band ? this.drawnHeight(band) : 0,
    );
    return total > 0 ? heightIssue('composition', total, regions.length) : null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene': DeckScene;
  }
}
