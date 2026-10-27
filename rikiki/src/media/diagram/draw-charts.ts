// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, drawing the charts · a pie, columns, a waterfall
//
// Laid out by charts.ts. On its act (its beat in a story, else its entrance) a
// pie's ring is swept part after part over a faint whole, its legend coming in
// with each part, and the figure of the whole last · columns grow one after the
// other from the baseline, each figure coming in as its column reaches it · the
// steps of a waterfall are taken in turn, up from their foot or down from the
// level reached. At rest every part is drawn whole.
//
// One part, one column brought forward (`focus`) wears the accent · the others
// step back in shades of the ink, so the eye goes to it first.
// ════════════════════════════════════════════════════════════════

import { css, nothing, svg } from 'lit';
import {
  COLUMN_FIGURE_SECONDS,
  COLUMN_GROW_SECONDS,
  COLUMN_STAGGER_SECONDS,
  type Centred,
  PIE_SWEEP_SECONDS,
  type PlotFrame,
  STEP_SECONDS,
  STEP_STAGGER_SECONDS,
  columnsSeconds,
  pieSeconds,
  waterfallSeconds,
} from './charts.js';
import { at, part, words } from './draw-kit.js';
import { type LPiece, staggered } from './marks.js';
import type { Timing } from './motion.js';

type Piece<K extends LPiece['kind']> = Extract<LPiece, { kind: K }>;
type Spot = { x: number; y: number };

/** The parts of a pie not brought forward, darkest first · stepped back further
 *  when one is, so the accent leads. */
const SHADES = [1, 0.66, 0.44, 0.3, 0.2, 0.14];
const SHADES_BEHIND_FOCUS = [0.55, 0.4, 0.28, 0.2, 0.14];
/** A legend row comes in over this share of the sweep, from its part's start. */
const LEGEND_SHARE = 0.15;
/** The rounded ends of a column, on its top. */
const BAR_RADIUS = 4;

// ── a pie ─────────────────────────────────────────────────────────────────

const TURN = 2 * Math.PI;

const onRing = (c: Spot, r: number, turn: number): Spot => ({
  x: c.x + r * Math.sin(TURN * turn),
  y: c.y - r * Math.cos(TURN * turn),
});

/** An arc of the ring from `from` to `to`, in turns from the top, clockwise. */
function arc(c: Spot, r: number, from: number, to: number): string {
  const a = onRing(c, r, from);
  const b = onRing(c, r, to);
  const large = to - from > 0.5 ? 1 : 0;
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}A${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function drawPie(item: Piece<'pie'>, act: Timing | undefined) {
  const { centre, r, ring, gap } = item;
  const total = pieSeconds(item);
  const sweep = part(act, 0, PIE_SWEEP_SECONDS / total);
  const hasFocus = item.slices.some((s) => s.focus);
  const shades = hasFocus ? SHADES_BEHIND_FOCUS : SHADES;
  const look = (slice: Piece<'pie'>['slices'][number]) =>
    slice.focus
      ? { cls: 'pie-focus', opacity: 1 }
      : { cls: 'pie-ink', opacity: shades[Math.min(slice.shade, shades.length - 1)]! };
  const parts = item.slices.map((slice) => {
    const from = slice.from + gap / 2;
    const to = slice.to - gap / 2;
    if (to <= from) return nothing;
    const t = part(sweep, slice.from, slice.to);
    const { cls, opacity } = look(slice);
    return svg`<path class="pie-slice ${cls} ${t ? 'draw' : ''}" pathLength="1" style=${at(t)} stroke-opacity=${opacity} stroke-width=${ring} d=${arc(centre, r, from, to)}></path>`;
  });
  const legend = item.legend.map((row, n) => {
    const slice = item.slices[n]!;
    const { cls, opacity } = look(slice);
    const t = part(sweep, slice.from, Math.min(1, slice.from + LEGEND_SHARE));
    const { swatch } = row;
    return svg`<g class=${t ? 'fade' : ''} style=${at(t)}>
      <circle class=${cls} fill-opacity=${opacity} cx=${swatch.x + swatch.w / 2} cy=${swatch.y + swatch.h / 2} r=${swatch.w / 2}></circle>
      ${words(row.label, 'note')}
      ${words(row.figure, slice.focus ? 'label fig-accent' : 'label')}
    </g>`;
  });
  const last = part(act, PIE_SWEEP_SECONDS / total, 1);
  const hole =
    item.value || item.note
      ? svg`<g class=${last ? 'fade' : ''} style=${at(last)}>
          ${item.value ? words(item.value.text, 'value', 'middle', item.value.x) : nothing}
          ${item.note ? words(item.note.text, 'tag', 'middle', item.note.x) : nothing}
        </g>`
      : nothing;
  return svg`${item.title ? words(item.title, 'label') : nothing}
    <circle class="pie-track" cx=${centre.x} cy=${centre.y} r=${r} stroke-width=${ring}></circle>
    ${parts}${legend}${hole}`;
}

// ── columns ───────────────────────────────────────────────────────────────

/** A column, its top corners round (square when `radius` is 0) · its foot square on
 *  the baseline. */
function column(x: number, y: number, w: number, h: number, radius = BAR_RADIUS): string {
  const r = Math.min(radius, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

/** When each of `count` columns grows, one after the other, within `run`. */
function growthOf(run: Timing | undefined, count: number, length: number, stagger: number) {
  return staggered(count, length, stagger).map((slot) =>
    part(run, slot.from, slot.from + slot.share),
  );
}

/** A figure that comes in as its column reaches it · on a halo, so a threshold or a
 *  link under it never cuts it. */
function figureAfter(
  figure: Centred | undefined,
  grown: Timing | undefined,
  length: number,
  focus: boolean,
) {
  if (!figure) return nothing;
  const shown = grown
    ? { start: grown.start + grown.duration, duration: length, stage: 0 }
    : undefined;
  const cls = focus ? 'tag col-text col-figure fig-accent' : 'tag col-text col-figure';
  return svg`<g class=${shown ? 'fade' : ''} style=${at(shown)}>${words(figure.text, cls, 'middle', figure.x)}</g>`;
}

/** The scale, the baseline, the threshold and the words under the slots of a plot. */
function frameBehind(frame: PlotFrame) {
  const { plot } = frame;
  return svg`${frame.title ? words(frame.title, 'label') : nothing}
    ${frame.grid.map(
      (g) =>
        svg`<line class="col-grid" x1=${plot.x} x2=${plot.x + plot.w} y1=${g.y} y2=${g.y}></line>${words(g.text, 'tag col-scale')}`,
    )}`;
}

function frameAhead(frame: PlotFrame, focus: number) {
  const { plot } = frame;
  const baseline = plot.y + plot.h;
  return svg`<line class="col-base" x1=${plot.x} x2=${plot.x + plot.w} y1=${baseline} y2=${baseline}></line>
    ${
      frame.threshold
        ? svg`<path class="line dash" data-role="overlay" d="M${plot.x} ${frame.threshold.y}H${plot.x + plot.w}"></path>${words(frame.threshold.text, 'tag col-scale')}`
        : nothing
    }
    ${frame.labels.map((l, k) => words(l.text, k === focus ? 'tag col-text col-label-focus' : 'tag col-text', 'middle', l.x))}`;
}

/** The shades of the ink a series wears, by how many there are · the last series,
 *  the one the slide speaks of, the darkest. The accent is never a series: it is
 *  what is brought forward. */
const SERIES_SHADES: Readonly<Record<number, readonly number[]>> = {
  1: [1],
  2: [0.4, 1],
  3: [0.22, 0.5, 1],
};
/** A single series steps back to this shade when one column is brought forward. */
const BEHIND_FOCUS = 0.32;

type Bar = Piece<'columns'>['bars'][number];

const seriesShade = (item: Piece<'columns'>, series: number) =>
  SERIES_SHADES[item.series]?.[series] ?? 1;

/** The bar brought forward · the column's own in one series, the whole stack of a
 *  stacked column, its last series in several side by side. */
const isFocus = (item: Piece<'columns'>, bar: Bar) =>
  bar.column === item.focus && (item.stacked || bar.series === item.series - 1);

/** The paint of a bar · the accent when it is brought forward (a stack in shades of
 *  it), else its series' shade of the ink, stepped back when a single series has one
 *  brought forward. */
function barLook(item: Piece<'columns'>, bar: Bar): { cls: string; opacity: number } {
  if (isFocus(item, bar))
    return { cls: 'col-focus', opacity: item.stacked ? seriesShade(item, bar.series) : 1 };
  if (item.series === 1 && item.focus >= 0) return { cls: 'col-ink', opacity: BEHIND_FOCUS };
  return { cls: 'col-ink', opacity: seriesShade(item, bar.series) };
}

export function drawColumns(item: Piece<'columns'>, act: Timing | undefined) {
  const columns = item.labels.length;
  const total = columnsSeconds(columns);
  const growing = part(act, 0, (total - COLUMN_FIGURE_SECONDS) / total);
  const growth = growthOf(growing, columns, COLUMN_GROW_SECONDS, COLUMN_STAGGER_SECONDS);
  const figureLength = act ? COLUMN_FIGURE_SECONDS * (act.duration / total) : 0;
  // A column grows as one, its bars side by side or stacked, from the baseline.
  const shapes = item.labels.map((_, k) => {
    const t = growth[k];
    const bars = item.bars.filter((bar) => bar.column === k && bar.rect.h > 0);
    return svg`<g class=${t ? 'col-grow' : ''} style=${at(t)}>${bars.map((bar) => {
      const { rect } = bar;
      const { cls, opacity } = barLook(item, bar);
      const rounded = !item.stacked || bar.series === item.series - 1;
      return svg`<path class="col-bar ${cls}" fill-opacity=${opacity} d=${column(rect.x, rect.y, rect.w, rect.h, rounded ? BAR_RADIUS : 0)}></path>`;
    })}</g>`;
  });
  const figures = item.bars.map((bar) =>
    figureAfter(bar.figure, growth[bar.column], figureLength, isFocus(item, bar)),
  );
  return svg`${frameBehind(item)}
    ${item.legend.map(
      (l) =>
        svg`<rect class="col-bar col-ink" fill-opacity=${seriesShade(item, l.series)} x=${l.swatch.x} y=${l.swatch.y} width=${l.swatch.w} height=${l.swatch.h} rx=${BAR_RADIUS}></rect>${words(l.text, 'tag col-text')}`,
    )}
    ${shapes}
    ${frameAhead(item, item.focus)}
    ${figures}`;
}

// ── a waterfall ───────────────────────────────────────────────────────────

/** The paint of a step · a total in the ink, a step up sound, a step down the
 *  incident, the one brought forward in the accent. */
const STEP_LOOK: Readonly<Record<string, string>> = {
  total: 'col-ink',
  up: 'wf-up',
  down: 'wf-down',
};

export function drawWaterfall(item: Piece<'waterfall'>, act: Timing | undefined) {
  const steps = item.bars.length;
  const total = waterfallSeconds(steps);
  const walking = part(act, 0, (total - COLUMN_FIGURE_SECONDS) / total);
  const growth = growthOf(walking, steps, STEP_SECONDS, STEP_STAGGER_SECONDS);
  const figureLength = act ? COLUMN_FIGURE_SECONDS * (act.duration / total) : 0;
  const shapes = item.bars.map((bar, k) => {
    const t = growth[k];
    const { rect } = bar;
    const cls = k === item.focus ? 'col-focus' : STEP_LOOK[bar.kind];
    // A step down falls from where the walk was · the others rise from their foot.
    const motion = t ? (bar.kind === 'down' ? 'col-drop' : 'col-grow') : '';
    const shape =
      bar.kind === 'total'
        ? svg`<path class="col-bar ${cls}" d=${column(rect.x, rect.y, rect.w, rect.h)}></path>`
        : svg`<rect class="col-bar ${cls}" x=${rect.x} y=${rect.y} width=${rect.w} height=${rect.h} rx=${Math.min(BAR_RADIUS, rect.h / 2)}></rect>`;
    return rect.h > 0 ? svg`<g class=${motion} style=${at(t)}>${shape}</g>` : nothing;
  });
  // The level reached carries over to the next step, which it comes with.
  const links = item.links.map((link, k) => {
    const t = growth[k + 1];
    return svg`<line class="wf-link ${t ? 'fade' : ''}" style=${at(t)} x1=${link.x} x2=${link.x + link.w} y1=${link.y} y2=${link.y}></line>`;
  });
  const figures = item.bars.map((bar, k) =>
    figureAfter(bar.figure, growth[k], figureLength, k === item.focus),
  );
  return svg`${frameBehind(item)}${links}${shapes}${frameAhead(item, item.focus)}${figures}`;
}

/** What only the charts paint, and how they move. */
export const chartsStyles = css`
  .pie-track {
    fill: none;
    stroke: var(--deck-scene-card-bg, var(--rik-surface-raised));
  }
  .pie-slice {
    fill: none;
    stroke-linecap: butt;
  }
  .pie-slice.pie-ink {
    stroke: var(--deck-scene-line, var(--rik-text-default));
  }
  .pie-slice.pie-focus {
    stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  circle.pie-ink {
    fill: var(--deck-scene-line, var(--rik-text-default));
  }
  circle.pie-focus {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .col-bar.col-ink {
    fill: var(--deck-scene-line, var(--rik-text-default));
  }
  .col-bar.col-focus {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .col-bar.wf-up {
    fill: var(--rik-status-success, var(--rik-text-default));
  }
  .col-bar.wf-down {
    fill: var(--rik-status-danger, var(--rik-text-default));
  }
  .wf-link {
    stroke: var(--deck-scene-muted, var(--rik-text-default--muted));
    stroke-width: 2;
    stroke-dasharray: 4 5;
  }
  .col-base {
    stroke: var(--deck-scene-line, var(--rik-text-default));
    stroke-width: 2;
  }
  .col-grid {
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: 1.5;
  }
  .col-scale {
    fill: var(--deck-scene-muted, var(--rik-text-default--muted));
  }
  /* Words and figures wear the ink of text, the accent only on what is brought forward. */
  .col-text {
    fill: var(--rik-text-default);
  }
  .col-text.fig-accent,
  .col-label-focus {
    fill: var(--deck-scene-tag, var(--rik-accent--strong, var(--rik-text-default)));
  }
  .col-figure,
  .col-label-focus {
    font-weight: 700;
  }
  /* A figure crossing the threshold stays legible · the page around its letters. */
  .col-figure {
    paint-order: stroke;
    stroke: var(--rik-surface-page, #fff);
    stroke-width: 8px;
    stroke-linejoin: round;
  }
  .col-grow,
  .col-drop {
    transform-box: fill-box;
    transform-origin: bottom;
  }
  .col-drop {
    transform-origin: top;
  }
  :host([playing]) :is(.col-grow, .col-drop) {
    animation: dg-col-grow var(--du, 0.55s) cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  /* The ring is swept at one pace, part after part, as one gesture. */
  :host([playing]) .pie-slice.draw {
    animation-timing-function: linear;
  }
  @keyframes dg-col-grow {
    from { transform: scaleY(0); }
    to { transform: none; }
  }
  @media (prefers-reduced-motion: reduce), print {
    :host([playing]) :is(.col-grow, .col-drop) {
      animation: none;
    }
  }
`;
