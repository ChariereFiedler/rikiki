// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, drawing the marks that tell a story
//
// How a terminal, a table, a switch, a timer, a band, people, a screen, a counter
// and a status are painted (the charts in draw-charts.ts), and how they move: what they do on their beat in a
// story (their act) is laid out by marks.ts as shares of its length, and drawn
// here at the time the story gave it. At rest (the overview, print, PDF, a render,
// reduced motion) every one shows its end: the lines typed, the rows carried and
// changed, the switch turned, the timer run, the band cut.
//
// Kept apart from deck-diagram.ts, which calls it with a pen: when each part
// moves, and the click shown.
// ════════════════════════════════════════════════════════════════

import { css, nothing, svg } from 'lit';
import { iconPath } from '../../shared/icon-set.js';
import { cueIds, lastChange } from './choreography.js';
import { chartsStyles, drawColumns, drawPie, drawWaterfall } from './draw-charts.js';
import { BASELINE, at, part, words } from './draw-kit.js';
import { type LNote, type LText, atClick } from './layout.js';
import {
  ABSENT_SECONDS,
  ABSENT_STAGGER,
  CARRY_SECONDS,
  CARRY_STAGGER_SECONDS,
  CHANGE_SECONDS,
  CHANGE_STAGGER_SECONDS,
  type LPiece,
  actSeconds,
  bandPhases,
  staggered,
  tablePhases,
  typingPlan,
} from './marks.js';
import { roleOf } from './model.js';
import type { Timing } from './motion.js';
import { storyIds } from './story.js';

/** The icon in a disc takes this share of it. */
const DISC_ICON = 0.56;
/** A panel's corners · the radius of the surfaces that say their part. */
const PANEL_RADIUS = 10;
const TERMINAL_RADIUS = 14;
const ROW_RADIUS = 8;
const BAND_RADIUS = 8;

/** What the drawing tells a mark about time and clicks. */
export interface Pen {
  /** When a part moves · undefined when it does not, and it stands as at rest. */
  t(id: string): Timing | undefined;
  /** The click shown, and the click a part appears on. */
  shown: number;
  appears(id: string): number;
}

type Piece<K extends LPiece['kind']> = Extract<LPiece, { kind: K }>;

/** The role class of a text · its size and its colour come with it. */
const roleClass = (t: LText) => (t.role === 'value' ? 'value' : t.role);

/** A line whose head says a result (`✓ tests : 312`) · the mark in its state's colour. */
const RESULT = /^([✓✔✗✘×])(\s.*)$/;

function marked(t: LText, cls: string, prompt = 0) {
  const line = t.lines[0] ?? '';
  const y = t.y + t.size * BASELINE;
  const result = RESULT.exec(line);
  const head = prompt ? line.slice(0, prompt) : result ? result[1]! : '';
  const rest = prompt ? line.slice(prompt) : result ? result[2]! : line;
  const headCls = prompt
    ? 'prompt'
    : result
      ? '✓✔'.includes(result[1]!)
        ? 'mark-ok'
        : 'mark-fail'
      : '';
  return svg`<text class=${cls} x=${t.x} y=${y} font-size=${t.size} font-weight=${t.weight}>${head ? svg`<tspan class=${headCls}>${head}</tspan>` : nothing}${rest}</text>`;
}

/** An icon of the set, in a disc of a role or alone. */
function icon(name: string, x: number, y: number, size: number, disc?: string) {
  const d = iconPath(name);
  if (!d) return nothing;
  const inner = disc ? size * DISC_ICON : size;
  const inset = (size - inner) / 2;
  return svg`${disc ? svg`<circle class="state-disc d-${disc}" data-role="state" cx=${x + size / 2} cy=${y + size / 2} r=${size / 2}></circle>` : nothing}
    <g transform="translate(${x + inset} ${y + inset}) scale(${inner / 24})"><path class="icon ${disc ? `on-disc d-${disc}` : ''}" d=${d}></path></g>`;
}

/** A bar across the top of a panel, its top corners round. */
function topBar(x: number, y: number, w: number, h: number, r: number) {
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

// ── a terminal ────────────────────────────────────────────────────────────

function terminal(item: Piece<'terminal'>, i: number, pen: Pen) {
  const act = pen.t(storyIds.act(i));
  const plan = typingPlan(item.lines);
  const scale = act && plan.total > 0 ? act.duration / plan.total : 0;
  const last = item.lines.length - 1;
  const tone = item.emphasis ? 'accent' : item.tone;
  const lines = item.lines.map((line, n) => {
    const slot = plan.lines[n]!;
    const t = act
      ? { start: act.start + slot.start * scale, duration: slot.duration * scale, stage: 0 }
      : undefined;
    const cls = `mono ${n === last ? `last tone-${tone}` : ''}`;
    const text = marked(line.text, cls, line.prompt);
    if (!t) return text;
    if (!line.typed) return svg`<g class="fade" style=${at(t)}>${text}</g>`;
    // The caret runs with the letters, and is gone once the line is typed.
    const caret = item.cursor;
    return svg`<g class="typed" style="${at(t)};--n:${Math.max(1, line.chars)}">${text}</g>
      <g class="gone-after" style=${at({ start: t.start + t.duration, duration: 0.01, stage: 0 })}>
        <rect class="caret caret-typing" data-role="state" style="${at(t)};--n:${Math.max(1, line.chars)};--bx:${(-line.width).toFixed(1)}px" x=${line.text.x + line.width + 6} y=${line.text.y + (caret.y - (item.lines[last]?.text.y ?? caret.y))} width=${caret.w} height=${caret.h}></rect>
      </g>`;
  });
  const rest = item.cursor;
  return svg`<rect class="term" x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${TERMINAL_RADIUS}></rect>
    <path class="term-bar" d=${topBar(item.bar.x, item.bar.y, item.bar.w, item.bar.h, TERMINAL_RADIUS)}></path>
    ${item.title ? words(item.title, 'tag term-title') : nothing}
    ${lines}
    <rect class="caret ${act ? 'fade' : ''}" data-role="state" style=${act ? at({ start: act.start + act.duration, duration: 0.2, stage: 0 }) : ''} x=${rest.x} y=${rest.y} width=${rest.w} height=${rest.h}></rect>`;
}

// ── a table ───────────────────────────────────────────────────────────────

function table(item: Piece<'table'>, i: number, pen: Pen) {
  // A table is a panel · on a surface that does not say its part, the context's.
  const role = roleOf(item.paint, item.tone) ?? 'pale';
  const ink = role === 'ink';
  const act = pen.t(storyIds.act(i));
  const changing = item.rows.filter((r) => r.after);
  const phases = tablePhases(
    item.rows.length,
    !!item.travel,
    changing.length,
    item.rows.some((r) => r.struck),
  );
  const share = (span: [number, number] | undefined) =>
    span && act ? part(act, span[0] / phases.total, span[1] / phases.total) : undefined;
  const carry = share(phases.carry);
  const change = share(phases.change);
  const strike = share(phases.strike);
  // Rows are carried one after the other, and change one after the other.
  const carried = staggered(item.rows.length, CARRY_SECONDS, CARRY_STAGGER_SECONDS);
  const changed = staggered(changing.length, CHANGE_SECONDS, CHANGE_STAGGER_SECONDS);
  const textCls = ink ? 'note on-inverse row-text' : 'note row-text';
  const rows = item.rows.map((row, n) => {
    const travel = item.travel?.[n];
    const slot = carried[n]!;
    const rowCarry = travel ? part(carry, slot.from, slot.from + slot.share) : undefined;
    const turn = changed[changing.indexOf(row)];
    const rowChange = turn ? part(change, turn.from, turn.from + turn.share) : undefined;
    const before = marked(row.before, textCls);
    const text = row.after
      ? rowChange
        ? svg`<g class="swap-out" style=${at(rowChange)}>${before}</g><g class="swap-in" style=${at(rowChange)}>${marked(row.after, textCls)}</g>`
        : marked(row.after, textCls)
      : before;
    const shown = row.after ?? row.before;
    const line = row.struck
      ? svg`<path class="strike ${strike ? 'draw' : ''}" pathLength="1" style=${at(strike)} d="M${shown.x - 4} ${row.rect.y + row.rect.h / 2}H${shown.x + row.textW + 4}"></path>`
      : nothing;
    const content = svg`<rect class=${ink ? 'row row-ink' : 'row'} x=${row.rect.x} y=${row.rect.y} width=${row.rect.w} height=${row.rect.h} rx=${ROW_RADIUS}></rect>${text}${line}`;
    return rowCarry && travel
      ? svg`<g class="travel" style="${at(rowCarry)};--bx:${travel.dx.toFixed(1)}px;--by:${travel.dy.toFixed(1)}px">${content}</g>`
      : content;
  });
  return svg`<rect class="p-${role}" x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${PANEL_RADIUS + 2}></rect>
    ${item.icon ? icon(item.icon.name, item.icon.x, item.icon.y, item.icon.size, role) : nothing}
    ${item.label ? words(item.label, ink ? 'label on-inverse' : 'label') : nothing}
    ${rows}`;
}

// ── a switch ──────────────────────────────────────────────────────────────

function switchMark(item: Piece<'switch'>, i: number, pen: Pen) {
  const appears = pen.appears(cueIds.item(i));
  const since = lastChange(item, appears, pen.shown);
  const state = atClick(item.states, pen.shown) ?? 'on';
  const before = atClick(item.states, Math.max(appears, since - 1)) ?? state;
  const t = since > appears ? pen.t(cueIds.switch(i, since)) : undefined;
  const turns = !!t && before !== state;
  const { track, knob } = item;
  const trackOf = (s: string) =>
    svg`<rect class="sw-track sw-${s}" x=${track.x} y=${track.y} width=${track.w} height=${track.h} rx=${track.h / 2}></rect>`;
  const knobAt = knob[state as 'on' | 'off'] ?? knob.on;
  const from = knob[before as 'on' | 'off'] ?? knobAt;
  const knobDisc = svg`<circle class="sw-knob" cx=${knobAt.x} cy=${knobAt.y} r=${knob.r}></circle>`;
  const word = (s: string) =>
    words(s === 'off' ? item.words.off : item.words.on, `tag sw-word sw-word-${s}`);
  return svg`<rect class="p-pale" x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${PANEL_RADIUS}></rect>
    ${item.label ? words(item.label, 'label') : nothing}
    ${
      // The new track fades in over the old one as it fades out · the switch is never blank.
      turns
        ? svg`<g class="swap-out" style=${at(t)}>${trackOf(before)}</g><g class="fade" style=${at(t)}>${trackOf(state)}</g>`
        : trackOf(state)
    }
    ${turns ? svg`<g class="move" style="${at(t)};--mx:${(from.x - knobAt.x).toFixed(1)}px;--my:0px">${knobDisc}</g>` : knobDisc}
    ${turns ? svg`<g class="swap-out" style=${at(t)}>${word(before)}</g><g class="swap-in" style=${at(t)}>${word(state)}</g>` : word(state)}`;
}

// ── a figure that rolls ───────────────────────────────────────────────────

/** The figures of a timer or a counter · each seen for its share of the act, the
 *  first from the start of the story, the last from its share on. At rest the last. */
function rolling(figures: { text: LText; at: number }[], cls: string, act: Timing | undefined) {
  const lastIndex = figures.length - 1;
  return figures.map((figure, n) => {
    const text = words(figure.text, cls);
    if (n === lastIndex) {
      if (!act || lastIndex === 0) return text;
      return svg`<g class="fade" style=${at({ start: act.start + act.duration * figure.at, duration: 0.05, stage: 0 })}>${text}</g>`;
    }
    if (!act) return nothing;
    const end = act.start + act.duration * figures[n + 1]!.at;
    const start = n === 0 ? 0 : act.start + act.duration * figure.at;
    return svg`<g class="roll" style=${at({ start, duration: end - start, stage: 0 })}>${text}</g>`;
  });
}

function timer(item: Piece<'timer'>, i: number, pen: Pen) {
  const act = pen.t(storyIds.act(i));
  const { ring } = item;
  const tone = item.emphasis ? 'accent' : item.tone;
  return svg`<circle class="ring-track" cx=${ring.x} cy=${ring.y} r=${ring.r} stroke-width=${ring.stroke}></circle>
    <circle class="ring-fill ring-${tone} ${act ? 'draw' : ''}" pathLength="1" style=${at(act)} transform="rotate(-90 ${ring.x} ${ring.y})" cx=${ring.x} cy=${ring.y} r=${ring.r} stroke-width=${ring.stroke}></circle>
    ${icon(item.icon.name, item.icon.x, item.icon.y, item.icon.size)}
    ${rolling(item.figures, `value fig-${tone}`, act)}
    ${item.label ? words(item.label, 'note') : nothing}`;
}

function counter(item: Piece<'counter'>, i: number, pen: Pen) {
  const act = pen.t(storyIds.act(i));
  const tone = item.emphasis ? 'accent' : item.tone;
  return svg`${rolling(item.figures, `value fig-${tone}`, act)}
    ${item.label ? words(item.label, 'note') : nothing}`;
}

// ── a band of time ────────────────────────────────────────────────────────

/** A brace under a stretch, its point in the middle, below. */
function bracePath(b: { x: number; y: number; w: number; h: number }) {
  const r = Math.min(12, b.w / 4);
  const mid = b.x + b.w / 2;
  const half = b.y + b.h / 2;
  return `M${b.x} ${b.y}Q${b.x} ${half} ${b.x + r} ${half}H${mid - r}Q${mid} ${half} ${mid} ${b.y + b.h}Q${mid} ${half} ${mid + r} ${half}H${b.x + b.w - r}Q${b.x + b.w} ${half} ${b.x + b.w} ${b.y}`;
}

function band(item: Piece<'band'>, i: number, pen: Pen) {
  const entrance = pen.t(cueIds.item(i));
  const steady = pen.t(storyIds.steady(i));
  const act = pen.t(storyIds.act(i));
  const phases = bandPhases();
  const share = (span: [number, number]) =>
    part(act, span[0] / phases.total, span[1] / phases.total);
  const [cut, gap, brace] = [share(phases.cut), share(phases.void), share(phases.brace)];
  const tone = item.tone === 'normal' ? 'ok' : item.tone;
  const grows = steady ?? entrance;
  const { normal, track } = item;
  return svg`${item.label ? words(item.label, 'label') : nothing}
    ${item.note ? words(item.note, 'note') : nothing}
    <rect class="band-track" x=${track.x} y=${track.y} width=${track.w} height=${track.h} rx=${BAND_RADIUS}></rect>
    <g class=${grows ? 'grow-x' : ''} style=${at(grows)}>
      <rect class="full fill-${tone}" x=${normal.x} y=${normal.y} width=${Math.max(0, normal.w)} height=${normal.h} rx=${BAND_RADIUS}></rect>
      ${item.ticks.map((tick) => svg`<line class="band-tick" x1=${tick.x} x2=${tick.x} y1=${tick.y} y2=${tick.y + tick.h}></line>`)}
    </g>
    <g class=${gap ? 'grow-x' : ''} style=${at(gap)}><rect class="void" x=${item.gap.x} y=${item.gap.y} width=${Math.max(0, item.gap.w)} height=${item.gap.h} rx=${BAND_RADIUS}></rect></g>
    ${item.after ? svg`<g class=${brace ? 'fade' : ''} style=${at(brace)}><rect class="full fill-${tone} band-after" x=${item.after.x} y=${item.after.y} width=${item.after.w} height=${item.after.h} rx=${BAND_RADIUS}></rect></g>` : nothing}
    <g class=${cut ? 'pop' : ''} style=${at(cut)}><line class="band-cut" x1=${item.cut.x} x2=${item.cut.x} y1=${item.cut.y} y2=${item.cut.y + item.cut.h}></line>
      ${item.tag ? words(item.tag, 'tag band-tag') : nothing}</g>
    ${item.brace ? svg`<path class="band-brace ${brace ? 'draw' : ''}" pathLength="1" style=${at(brace)} d=${bracePath(item.brace)}></path>` : nothing}
    ${item.braceLabel ? svg`<g class=${brace ? 'fade' : ''} style=${at(brace)}>${words(item.braceLabel, 'label band-brace-label')}</g>` : nothing}`;
}

// ── people ────────────────────────────────────────────────────────────────

function person(item: Piece<'person'>, i: number, pen: Pen) {
  const act = pen.t(storyIds.act(i));
  const count = item.people.length;
  const { before, after } = item.absent;
  const missingAt = (n: number, absent: number) => n >= count - absent;
  const disc = item.tone === 'accent' || item.emphasis ? 'ink' : 'pale';
  const changing = item.people
    .map((_, n) => n)
    .filter((n) => missingAt(n, before) !== missingAt(n, after));
  const turns = staggered(changing.length, ABSENT_SECONDS, ABSENT_STAGGER);
  const present = (p: { x: number; y: number; size: number }) =>
    icon('user', p.x, p.y, p.size, disc);
  const missing = (p: { x: number; y: number; size: number }) =>
    svg`<circle class="person-absent" cx=${p.x + p.size / 2} cy=${p.y + p.size / 2} r=${p.size / 2 - 1.5}></circle>`;
  return svg`${item.caption ? words(item.caption, 'tag') : nothing}
    ${item.people.map((p, n) => {
      const turn = turns[changing.indexOf(n)];
      const t = turn ? part(act, turn.from, turn.from + turn.share) : undefined;
      const now = missingAt(n, after) ? missing(p) : present(p);
      if (!t) return now;
      const was = missingAt(n, before) ? missing(p) : present(p);
      return svg`<g class="swap-out" style=${at(t)}>${was}</g><g class="swap-in" style=${at(t)}>${now}</g>`;
    })}`;
}

// ── a screen ──────────────────────────────────────────────────────────────

function screen(item: Piece<'screen'>, i: number, pen: Pen) {
  const entrance = pen.t(cueIds.item(i));
  const count = item.texture.length;
  return svg`<rect class="screen" x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${PANEL_RADIUS + 2}></rect>
    <path class="screen-bar" d=${topBar(item.bar.x, item.bar.y, item.bar.w, item.bar.h, PANEL_RADIUS + 2)}></path>
    ${item.dots.map((d) => svg`<circle class="screen-dot" cx=${d.x} cy=${d.y} r="5"></circle>`)}
    <rect class="screen-address" x=${item.address.x} y=${item.address.y} width=${item.address.w} height=${item.address.h} rx=${item.address.h / 2}></rect>
    ${item.addressText ? words(item.addressText, 'tag screen-url') : nothing}
    ${item.heading ? words(item.heading, 'label') : nothing}
    ${item.texture.map((line, n) => {
      const t = entrance
        ? {
            start: entrance.start + entrance.duration * (0.4 + (0.6 * n) / Math.max(1, count)),
            duration: 0.35,
            stage: 0,
          }
        : undefined;
      return svg`<rect class="texture ${t ? 'grow-x' : ''}" style=${at(t)} x=${line.x} y=${line.y} width=${line.w} height=${line.h} rx=${line.h / 2}></rect>`;
    })}`;
}

/** When a chart is swept or grown · on its beat in a story, else from its entrance at
 *  its own pace (an entrance is too short to see columns rise one after the other). */
function chartAct(item: LPiece, i: number, pen: Pen): Timing | undefined {
  const act = pen.t(storyIds.act(i));
  if (act) return act;
  const entrance = pen.t(cueIds.item(i));
  return entrance && { ...entrance, duration: actSeconds(item) };
}

/** A mark that tells a story, as the click shown and the story have it. */
export function drawPiece(item: LPiece, i: number, pen: Pen) {
  switch (item.kind) {
    case 'terminal':
      return terminal(item, i, pen);
    case 'table':
      return table(item, i, pen);
    case 'switch':
      return switchMark(item, i, pen);
    case 'timer':
      return timer(item, i, pen);
    case 'counter':
      return counter(item, i, pen);
    case 'band':
      return band(item, i, pen);
    case 'person':
      return person(item, i, pen);
    case 'pie':
      return drawPie(item, chartAct(item, i, pen));
    case 'columns':
      return drawColumns(item, chartAct(item, i, pen));
    case 'waterfall':
      return drawWaterfall(item, chartAct(item, i, pen));
    default:
      return screen(item, i, pen);
  }
}

// ── a status ──────────────────────────────────────────────────────────────

const STATUS_LOOK: Readonly<Record<string, { disc: string; icon: string }>> = {
  ok: { disc: 'ok', icon: 'check' },
  fail: { disc: 'bad', icon: 'cross' },
  wait: { disc: 'gold', icon: 'clock' },
};

/** A status · a disc of its state and its words beside the mark it is for. On its
 *  beat in a story, the disc of the state before gives way to the one after. */
export function drawStatus(note: LNote, k: number, pen: Pen) {
  const status = note.status;
  if (!status) return nothing;
  const { x, y, size } = status.disc;
  const disc = (state: string) => {
    const look = STATUS_LOOK[state] ?? STATUS_LOOK.ok!;
    return icon(look.icon, x, y, size, look.disc);
  };
  const t = pen.t(storyIds.noteSwap(k));
  const turns = !!t && status.before !== status.after;
  const label = note.texts.map((text) =>
    words(
      text,
      `${roleClass(text)} ${status.after === 'fail' && text.role === 'tag' ? 'status-fail' : ''}`,
    ),
  );
  // Its words say the state it turns to · they come with it.
  return turns
    ? svg`<g class="swap-out" style=${at(t)}>${disc(status.before)}</g><g class="swap-in" style=${at(t)}>${disc(status.after)}</g>
      <g class="fade" style=${at(t)}>${label}</g>`
    : svg`${disc(status.after)}${label}`;
}

/** What only these marks paint · the surfaces, the strokes, the type of a terminal,
 *  and the animations of their acts. */
export const piecesStyles = css`
  ${chartsStyles}
  /* A tag in a diagram may sit on a pale surface · the strong accent pulled toward
     the ink of the text, as the words in a colour below (siliceum's gold: 2.6:1). */
  .tag {
    fill: var(--deck-scene-tag, color-mix(in srgb, var(--rik-accent--strong, var(--rik-accent)) 70%, var(--rik-text-default)));
  }
  .term {
    fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
  }
  .term-bar {
    fill: var(--rik-surface-inverse--soft-2, rgba(255, 255, 255, 0.1));
  }
  .term-title {
    fill: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
  }
  text.mono {
    font-family: var(--rik-font-mono, ui-monospace, monospace);
    fill: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
  }
  text.mono.last {
    fill: var(--deck-scene-band-text, var(--rik-text-inverse));
  }
  text.mono.last.tone-ok,
  .mark-ok {
    fill: var(--rik-status-success, var(--rik-accent));
  }
  text.mono.last.tone-danger,
  .mark-fail {
    fill: var(--rik-status-danger, var(--rik-accent));
  }
  text.mono.last.tone-warn,
  text.mono.last.tone-accent,
  .prompt {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .caret {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .caret-typing {
    visibility: hidden;
  }
  .row {
    fill: var(--rik-surface-raised--strong, var(--rik-surface-page));
  }
  .row-ink {
    fill: var(--rik-surface-inverse--soft-2, rgba(255, 255, 255, 0.1));
  }
  .row-text {
    fill: var(--rik-text-default);
  }
  .row-text.on-inverse {
    fill: var(--deck-scene-band-text, var(--rik-text-inverse));
  }
  .strike,
  .band-cut,
  .band-brace {
    fill: none;
    stroke: var(--rik-status-danger, var(--rik-accent));
    stroke-width: 3;
    stroke-linecap: round;
  }
  .band-cut {
    stroke-width: 4;
  }
  /* Words in a colour wear its text grade, pulled 30 % toward the ink of the text ·
     the plain tone is a fill (the green of rikiki is 2:1 on its page), and the text
     grade clears 3:1 on the page with no room left for the pale surface it may sit on.
     Toward the ink keeps the hue and holds on any ground: on a dark page, or a dark
     panel (.on-ink), the ink is light and the colour is pulled up. Measured by
     scripts/diagram-paint.test.mjs. */
  .band-tag,
  .band-brace-label,
  .status-fail {
    fill: color-mix(in srgb, var(--rik-status-danger__text, var(--rik-status-danger)) 70%, var(--rik-text-default));
  }
  .sw-track.sw-on {
    fill: var(--rik-status-success, var(--rik-accent));
  }
  .sw-track.sw-off {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .sw-knob {
    fill: var(--rik-surface-raised--strong, var(--rik-surface-page));
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: 1.5;
  }
  .sw-word {
    fill: var(--rik-text-default);
  }
  .ring-track,
  .ring-fill {
    fill: none;
  }
  .ring-track {
    stroke: var(--deck-scene-card-bg, var(--rik-surface-raised));
  }
  .ring-fill {
    stroke: var(--rik-text-default);
    stroke-linecap: round;
  }
  .ring-fill.ring-ok {
    stroke: var(--rik-status-success, var(--rik-accent));
  }
  .ring-fill.ring-warn,
  .ring-fill.ring-accent {
    stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
  }
  .ring-fill.ring-danger {
    stroke: var(--rik-status-danger, var(--rik-accent));
  }
  .fig-ok {
    fill: color-mix(in srgb, var(--rik-status-success__text, var(--rik-status-success)) 70%, var(--rik-text-default));
  }
  .fig-danger {
    fill: color-mix(in srgb, var(--rik-status-danger__text, var(--rik-status-danger)) 70%, var(--rik-text-default));
  }
  .fig-accent,
  .fig-warn {
    fill: var(--deck-scene-tag, color-mix(in srgb, var(--rik-accent--strong, var(--rik-accent)) 70%, var(--rik-text-default)));
  }
  .band-track {
    fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
  }
  /* The time after the void · the normal one again, stepped back. */
  .band-after {
    opacity: 0.5;
  }
  .band-tick {
    stroke: var(--rik-surface-raised--strong, #fff);
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0.7;
  }
  .void {
    fill: var(--deck-scene-bad-bg, var(--rik-status-danger__bg, var(--rik-surface-raised)));
    stroke: var(--rik-status-danger, var(--rik-accent));
    stroke-width: 2;
    stroke-dasharray: 8 6;
  }
  .person-absent {
    fill: none;
    stroke: var(--rik-status-danger, var(--rik-accent));
    stroke-width: 2.5;
    stroke-dasharray: 6 5;
  }
  .screen {
    fill: var(--rik-surface-raised--strong, var(--rik-surface-page));
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: 1.5;
  }
  .screen-bar {
    fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
  }
  .screen-dot {
    fill: var(--deck-scene-card-stroke, var(--rik-border-default));
  }
  .screen-address {
    fill: var(--rik-surface-raised--strong, var(--rik-surface-page));
  }
  .screen-url {
    fill: var(--deck-scene-muted, var(--rik-text-default--muted));
  }
  .texture {
    fill: var(--deck-scene-card-stroke, var(--rik-border-default));
  }

  /* A line typed one character after the other, and its caret running with it. */
  :host([playing]) .typed {
    animation: dg-type var(--du, 0.6s) steps(var(--n, 12), end) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .caret-typing {
    animation: dg-caret var(--du, 0.6s) steps(var(--n, 12), end) calc(var(--t0, 0s) + var(--scene-delay, 0s)) forwards;
  }
  :host([playing]) .gone-after {
    animation: dg-gone var(--du, 0.01s) linear calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  /* A figure seen for its slice of a count, and only then. */
  .roll {
    opacity: 0;
    visibility: hidden;
  }
  :host([playing]) .roll {
    animation: dg-show var(--du, 0.1s) linear calc(var(--t0, 0s) + var(--scene-delay, 0s));
  }
  :host([playing]) .ring-fill.draw {
    animation-timing-function: linear;
  }
  @keyframes dg-type {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes dg-caret {
    from { visibility: visible; transform: translateX(var(--bx, 0)); }
    to { visibility: visible; transform: none; }
  }
  @keyframes dg-gone {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes dg-show {
    from, to { opacity: 1; visibility: visible; }
  }
  @media (prefers-reduced-motion: reduce), print {
    :host([playing]) :is(.typed, .caret-typing, .gone-after, .roll) {
      animation: none;
    }
  }
`;
