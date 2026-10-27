import { describe, expect, it } from 'vitest';
import { choreograph, cueIds } from './choreography.js';
import { type LItem, type LText, type Meter, layoutDiagram } from './layout.js';
import {
  type LPiece,
  type TextEnv,
  MONO_ADVANCE,
  MONO_SIZE,
  actSeconds,
  moved,
  rollingFigures,
  staggered,
  tablePhases,
  typingPlan,
} from './marks.js';
import { TERMINAL_MAX_CHARS, linesOf } from './marks-words.js';
import { type DgCode, type ElementLike, parseDiagram } from './model.js';
import { planStory, readSeconds, storyIds } from './story.js';

// ════════════════════════════════════════════════════════════════
// The marks that tell a story in their own words · a terminal, a table, a switch,
// a status, a timer, a band, people, a screen, a counter. What is promised: each is
// placed with no coordinate, says what was written and nothing else, acts on its
// beat in a story (typed, carried, turned, filled, cut, counted) and stands at rest
// as the end of that act · and what is missing or too long is named, with its fix.
// ════════════════════════════════════════════════════════════════

/** A font that is the same width for every letter · a test needs numbers, not glyphs. */
const meter: Meter = (size) => (text) => text.length * size * 0.55;

function el(
  localName: string,
  attrs: Record<string, string | true> = {},
  children: ElementLike[] = [],
): ElementLike {
  return {
    localName,
    children,
    getAttribute: (name) =>
      name in attrs ? String(attrs[name] === true ? '' : attrs[name]) : null,
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

const parse = (children: ElementLike[], attrs: Record<string, string> = {}) =>
  parseDiagram(el('deck-diagram', attrs, children));

const lay = (children: ElementLike[], attrs: Record<string, string> = {}) => {
  const parsed = parse(children, attrs);
  return { parsed, drawn: layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } }) };
};

function story(children: ElementLike[], attrs: Record<string, string> = {}) {
  const { parsed, drawn } = lay(children, { play: 'enter', ...attrs });
  const plan = planStory(drawn, choreograph(drawn, drawn.tree), {
    budget: readSeconds(parsed.attrs.budget) || undefined,
  });
  return { parsed, drawn, plan };
}

const piece = <K extends LPiece['kind']>(items: LItem[], kind: K) =>
  items.find((i): i is Extract<LPiece, { kind: K }> => i.kind === kind)!;

const codes = (children: ElementLike[], attrs: Record<string, string> = {}): DgCode[] =>
  parse(children, attrs).issues.map((i) => i.code as DgCode);

/** A text env with the fake font · what layout.ts gives the marks. */
const env: TextEnv = {
  set: (role, text, width, x, y): LText => ({
    lines: [text],
    size: 25,
    weight: 400,
    line: 34,
    role,
    fits: text.length * 25 * 0.55 <= width,
    x,
    y,
  }),
  width: (_role, text) => text.length * 25 * 0.55,
  figure: (written) => written.replace(/^(\d+)\.(\d+)$/, '$1,$2'),
};

const TERMINAL_LINES = `
  $ npm run deploy
  ✓ tests : 312 passent
  ✗ lint : 2 erreurs
  Terminé. Autre chose ?`;

describe('a list written one item per line', () => {
  it('drops blank lines and the indentation of the source', () => {
    expect(linesOf('\n   a b\n\n  c  \n')).toEqual(['a b', 'c']);
    expect(linesOf(undefined)).toEqual([]);
  });
});

describe('a terminal', () => {
  const { drawn, parsed } = lay([
    el('dg-terminal', { name: 't', label: 'claude', lines: TERMINAL_LINES }),
  ]);
  const terminal = piece(drawn.items, 'terminal');

  it('reads clean and draws a line per line, under its bar, in a monospace at the size of a note', () => {
    expect(parsed.issues).toEqual([]);
    expect(terminal.lines.map((l) => l.text.lines[0])).toEqual(linesOf(TERMINAL_LINES));
    expect(terminal.lines[0]!.text.y).toBeGreaterThan(terminal.bar.y + terminal.bar.h - 1);
    for (const [n, line] of terminal.lines.entries()) {
      expect(line.text.size).toBe(MONO_SIZE);
      expect(line.width).toBeCloseTo([...line.text.lines[0]!].length * MONO_SIZE * MONO_ADVANCE);
      if (n) expect(line.text.y).toBeGreaterThan(terminal.lines[n - 1]!.text.y);
    }
  });

  it('is as wide as its widest line and its caret, never narrower', () => {
    const widest = Math.max(...terminal.lines.map((l) => l.width));
    expect(terminal.w).toBeGreaterThanOrEqual(widest + 2 * 24);
    expect(terminal.cursor.x + terminal.cursor.w).toBeLessThanOrEqual(terminal.x + terminal.w);
  });

  it('types the command a prompt starts, and says the state a result starts with', () => {
    const [command, ok, fail, last] = terminal.lines;
    expect(command).toMatchObject({ typed: true, prompt: 2 });
    expect(ok).toMatchObject({ typed: false, result: 'ok' });
    expect(fail).toMatchObject({ typed: false, result: 'fail' });
    expect(last!.result).toBeUndefined();
  });

  it('types a command a character at a time, bounded, and a result comes in whole, after a breath', () => {
    const plan = typingPlan([
      { typed: true, chars: 16 },
      { typed: false, chars: 20 },
      { typed: true, chars: 300 },
      { typed: true, chars: 1 },
    ]);
    const [command, result, long, short] = plan.lines;
    expect(command!.duration).toBeCloseTo(0.48);
    expect(result!.duration).toBeCloseTo(0.25);
    expect(result!.start - (command!.start + command!.duration)).toBeCloseTo(0.3);
    expect(long!.duration).toBeCloseTo(1.2);
    expect(short!.duration).toBeCloseTo(0.3);
    expect(plan.total).toBeCloseTo(short!.start + short!.duration);
    expect(actSeconds(terminal)).toBeCloseTo(typingPlan(terminal.lines).total);
  });
});

describe('a table of rows', () => {
  const rows = 'Marie Dubois\n王伟 · 销售总监\nm.dubois@acme.fr\n(vide)';
  const { drawn } = lay(
    [
      el('dg-table', { name: 'prod', label: 'production', icon: 'database', paint: 'ink', rows }),
      el('dg-table', {
        name: 'anon',
        label: 'anonymiser',
        from: 'prod',
        rows,
        swap: 'Claire Martin\n李娜 · 销售总监\nm.dubois@acme.fr\n(vide)',
        strike: '3',
      }),
      el('dg-table', { name: 'copie', from: 'anon', rows: 'a\nb\nc' }),
      // A swap is what a table says after its beat · read in a story only.
    ],
    { play: 'enter' },
  );
  const [prod, anon, copy] = drawn.items.filter(
    (i): i is Extract<LPiece, { kind: 'table' }> => i.kind === 'table',
  );

  it('sets each row in its own band, inside its panel, under its header', () => {
    for (const table of [prod!, anon!]) {
      expect(table.rows).toHaveLength(4);
      for (const row of table.rows) {
        expect(row.rect.x).toBeGreaterThanOrEqual(table.x);
        expect(row.rect.x + row.rect.w).toBeLessThanOrEqual(table.x + table.w);
        expect(row.rect.y + row.rect.h).toBeLessThanOrEqual(table.y + table.h);
        expect(row.rect.y).toBeGreaterThan(table.label!.y);
      }
    }
  });

  it('says what changes only where it changes, and strikes the row named', () => {
    expect(anon!.rows.map((r) => r.after?.lines[0])).toEqual([
      'Claire Martin',
      '李娜 · 销售总监',
      undefined,
      undefined,
    ]);
    expect(anon!.rows.map((r) => r.struck)).toEqual([false, false, true, false]);
    expect(anon!.texts.map((t) => t.lines[0])).toContain('Claire Martin');
    expect(anon!.texts.map((t) => t.lines[0])).not.toContain('Marie Dubois');
  });

  it('carries its rows from the rows of its source, a struck row left behind', () => {
    expect(prod!.travel).toBeUndefined();
    anon!.rows.forEach((row, n) => {
      const from = prod!.rows[n]!.rect;
      expect(row.rect.x + anon!.travel![n]!.dx).toBeCloseTo(from.x);
      expect(row.rect.y + anon!.travel![n]!.dy).toBeCloseTo(from.y);
    });
    // The struck third row of anon is not carried · the third row of the copy comes from its fourth.
    expect(copy!.rows[2]!.rect.y + copy!.travel![2]!.dy).toBeCloseTo(anon!.rows[3]!.rect.y);
  });

  it('acts as long as its rows take to be carried, one after the other, then to change, then to be struck', () => {
    const phases = tablePhases(4, true, 2, true);
    expect(phases.carry![1]).toBeLessThan(phases.change![0]);
    expect(phases.change![1]).toBeLessThanOrEqual(phases.strike![0]);
    expect(actSeconds(anon!)).toBeCloseTo(phases.total);
    expect(actSeconds(prod!)).toBe(0);
    const slots = staggered(3, 1, 0.5);
    expect(slots.map((s) => s.from)).toEqual([0, 0.25, 0.5]);
    expect(slots.at(-1)!.from + slots.at(-1)!.share).toBeCloseTo(1);
  });
});

describe('a switch', () => {
  const { drawn, parsed } = lay([
    el('dg-switch', { name: 's', label: 'DB 2', state: 'on off', on: 'MARCHE', off: 'STOP' }),
  ]);
  const sw = piece(drawn.items, 'switch');

  it('reads one word per click, and its words are its own', () => {
    expect(parsed.stages).toBe(1);
    expect(sw.states).toEqual(['on', 'off']);
    expect(sw.words.on.lines).toEqual(['MARCHE']);
    expect(sw.texts.map((t) => t.lines[0])).toEqual(['DB 2', 'STOP']);
  });

  it('sets its knob inside its track, at the end of its state', () => {
    for (const knob of [sw.knob.on, sw.knob.off]) {
      expect(knob.x - sw.knob.r).toBeGreaterThanOrEqual(sw.track.x);
      expect(knob.x + sw.knob.r).toBeLessThanOrEqual(sw.track.x + sw.track.w);
    }
    expect(sw.knob.on.x).toBeGreaterThan(sw.knob.off.x);
  });

  it('turns on the click its state changes, like a gate', () => {
    const cues = choreograph(drawn, drawn.tree).cues.map((c) => c.id);
    expect(cues).toContain(cueIds.switch(drawn.items.indexOf(sw), 1));
  });
});

describe('a figure that rolls', () => {
  it('counts whole steps when there are few, and ends on the figure as written, with its unit', () => {
    const figures = rollingFigures(env, '5', 0, 'min', false);
    expect(figures.map((f) => f.text)).toEqual([
      '0 min',
      '1 min',
      '2 min',
      '3 min',
      '4 min',
      '5 min',
    ]);
    expect(figures.map((f) => f.at)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('counts a large figure in twelve values at most, slowing into the last, its grouping kept', () => {
    const figures = rollingFigures(env, '15 000', 0, undefined, true);
    expect(figures.length).toBeLessThanOrEqual(13);
    expect(figures.at(-1)!.text).toBe('15 000');
    expect(figures[1]!.text).toMatch(/^\d{1,2} \d{3}$/);
    const values = figures.map((f) => Number(f.text.replace(/\s/g, '')));
    for (let n = 1; n < values.length; n += 1) expect(values[n]!).toBeGreaterThan(values[n - 1]!);
    // Eased · the first step is the largest.
    expect(values[1]! - values[0]!).toBeGreaterThan(values.at(-1)! - values.at(-2)!);
  });

  it('counts down as well, and keeps the decimal sign of the deck', () => {
    expect(rollingFigures(env, '0', 3, undefined, false).map((f) => f.text)).toEqual([
      '3',
      '2',
      '1',
      '0',
    ]);
    expect(rollingFigures(env, '2.5', 0, '%', false).at(-1)!.text).toBe('2,5 %');
  });

  it('a timer rings its delay and a counter states its figure, the last value at rest', () => {
    const { drawn } = lay([
      el('dg-timer', { name: 't', label: 'sans réponse', value: '5', unit: 'min' }),
      el('dg-counter', { name: 'c', label: 'leads perdus', value: '64', unit: 'leads' }),
    ]);
    const timer = piece(drawn.items, 'timer');
    const counter = piece(drawn.items, 'counter');
    expect(timer.texts.map((t) => t.lines[0])).toEqual(['sans réponse', '5 min']);
    expect(counter.texts.map((t) => t.lines[0])).toEqual(['leads perdus', '64 leads']);
    expect(timer.ring.r).toBeGreaterThan(0);
    expect(actSeconds(timer)).toBeGreaterThan(0);
    expect(actSeconds(counter)).toBeGreaterThan(0);
  });
});

describe('a band of time, cut once', () => {
  const { drawn, parsed } = lay([
    el('dg-band', {
      name: 'leads',
      label: 'leads',
      note: 'un toutes les 20 min',
      from: '6',
      to: '34',
      cut: '12.63',
      until: '31.63',
      tag: 'mer. 12:38',
      brace: '19 h sans lead',
    }),
  ]);
  const band = piece(drawn.items, 'band');

  it('draws the normal time, then a void as long as it lasted, then the time after', () => {
    expect(parsed.issues).toEqual([]);
    const perHour = band.track.w / 28;
    expect(band.normal.w).toBeCloseTo(6.63 * perHour, 0);
    expect(band.gap.w).toBeCloseTo(19 * perHour, 0);
    expect(band.after!.w).toBeCloseTo(2.37 * perHour, 0);
    expect(band.gap.x).toBeCloseTo(band.normal.x + band.normal.w);
  });

  it('figures the regular events in the normal time only, and braces the void with its length', () => {
    expect(band.ticks.length).toBeGreaterThan(2);
    for (const tick of band.ticks) expect(tick.x).toBeLessThan(band.gap.x);
    expect(band.brace!.x).toBeCloseTo(band.gap.x);
    expect(band.brace!.w).toBeCloseTo(band.gap.w);
    expect(band.brace!.y).toBeGreaterThan(band.gap.y + band.gap.h);
    expect(band.braceLabel!.lines).toEqual(['19 h sans lead']);
    expect(band.tag!.y + band.tag!.line).toBeLessThanOrEqual(band.track.y);
  });
});

describe('people', () => {
  it('draws one disc per person, the last ones hollow for those missing', () => {
    const { drawn } = lay([
      el('dg-person', { name: 'p', label: 'clients', count: '4', absent: '0 3' }),
    ]);
    const people = piece(drawn.items, 'person');
    expect(people.people).toHaveLength(4);
    expect(people.absent).toEqual({ before: 0, after: 3 });
    for (let n = 1; n < 4; n += 1)
      expect(people.people[n]!.x).toBeGreaterThan(
        people.people[n - 1]!.x + people.people[n - 1]!.size,
      );
    expect(actSeconds(people)).toBeGreaterThan(0);
  });
});

describe('a screen', () => {
  it('frames its page under a bar with its address, and figures its text in lines of fixed widths', () => {
    const { drawn } = lay([
      el('dg-screen', { name: 's', label: 'app.rodz.io', note: 'Signaux', count: '3' }),
    ]);
    const screen = piece(drawn.items, 'screen');
    expect(screen.texture).toHaveLength(3);
    expect(screen.addressText!.lines).toEqual(['app.rodz.io']);
    for (const line of screen.texture) {
      expect(line.x + line.w).toBeLessThanOrEqual(screen.x + screen.w);
      expect(line.y).toBeGreaterThan(screen.heading!.y);
    }
    expect(
      lay([el('dg-screen', { name: 's', label: 'app.rodz.io', note: 'Signaux', count: '3' })]).drawn
        .items,
    ).toEqual(drawn.items);
  });
});

describe('a status', () => {
  const { drawn } = lay([
    el('dg-box', { name: 'page', label: 'app' }),
    el('dg-status', {
      for: 'page',
      state: 'ok fail',
      label: '14:02',
      note: 'erreur 500',
      side: 'bottom',
    }),
  ]);
  const box = drawn.items.find((i) => i.key === 'page')!;
  const [note] = drawn.notes;

  it('stands against the mark it is for, its disc before its words, with no line to it', () => {
    expect(note!.status).toMatchObject({ before: 'ok', after: 'fail' });
    expect(note!.leader).toBeUndefined();
    expect(note!.y).toBeGreaterThanOrEqual(('h' in box ? box.y + box.h : 0) - 0.5);
    for (const text of note!.texts)
      expect(text.x).toBeGreaterThanOrEqual(note!.status!.disc.x + note!.status!.disc.size);
  });

  it('is not placed among the marks · it takes no place in its group', () => {
    expect(drawn.items.map((i) => i.key)).toEqual(['page']);
  });
});

describe('the marks moved to their place', () => {
  it('moves every x and y, and nothing else', () => {
    const parts = {
      kind: 'band',
      a: { x: 1, y: 2, w: 3 },
      list: [{ x: 0, y: 0, dx: 5 }],
      words: ['x'],
    };
    expect(moved(parts, 10, 20)).toEqual({
      kind: 'band',
      a: { x: 11, y: 22, w: 3 },
      list: [{ x: 10, y: 20, dx: 5 }],
      words: ['x'],
    });
  });
});

describe('the lint of the marks that tell a story · each counter-example named', () => {
  it('a terminal with no line, or a line too long to type', () => {
    expect(codes([el('dg-terminal', { name: 't' })])).toContain('DG_MARK_EMPTY');
    const wide = codes([
      el('dg-terminal', { name: 't', lines: `$ ${'x'.repeat(TERMINAL_MAX_CHARS)}` }),
    ]);
    expect(wide).toContain('DG_TYPED_WIDE');
    expect(
      codes([el('dg-terminal', { name: 't', lines: `$ ${'x'.repeat(TERMINAL_MAX_CHARS - 2)}` })]),
    ).toEqual([]);
  });

  it('a table with no row, a swap that does not match its rows, a strike past them', () => {
    expect(codes([el('dg-table', { name: 't' })])).toContain('DG_MARK_EMPTY');
    const story = { play: 'enter' };
    expect(
      codes([el('dg-table', { name: 't', rows: 'a\nb', swap: 'c', beat: 'event' })], story),
    ).toContain('DG_ROWS_MISMATCH');
    expect(codes([el('dg-table', { name: 't', rows: 'a\nb', strike: '3' })])).toContain(
      'DG_ROWS_MISMATCH',
    );
    expect(
      codes(
        [el('dg-table', { name: 't', rows: 'a\nb', swap: 'c\nd', strike: '2', beat: 'event' })],
        story,
      ),
    ).toEqual([]);
  });

  it('a table carried from a mark that does not exist', () => {
    expect(codes([el('dg-table', { name: 't', rows: 'a', from: 'nowhere' })])).toContain(
      'DG_REF_UNKNOWN',
    );
  });

  it('a status for no mark, or for a mark that does not exist, or in a state it does not know', () => {
    expect(codes([el('dg-box', { name: 'a' }), el('dg-status', { state: 'ok' })])).toContain(
      'DG_STATUS_NO_TARGET',
    );
    expect(codes([el('dg-box', { name: 'a' }), el('dg-status', { for: 'b' })])).toContain(
      'DG_REF_UNKNOWN',
    );
    expect(
      codes([el('dg-box', { name: 'a' }), el('dg-status', { for: 'a', state: 'green' })]),
    ).toContain('DG_VALUE_INVALID');
    expect(
      codes([el('dg-box', { name: 'a' }), el('dg-status', { for: 'a', state: 'wait fail' })]),
    ).toEqual([]);
  });

  it('a band without a cut, or cut outside its time', () => {
    expect(codes([el('dg-band', { name: 'b', from: '0', to: '24' })])).toContain('DG_BAND_NO_CUT');
    expect(codes([el('dg-band', { name: 'b', from: '0', to: '24', cut: '30' })])).toContain(
      'DG_BAND_NO_CUT',
    );
    expect(
      codes([el('dg-band', { name: 'b', from: '0', to: '24', cut: '10', until: '8' })]),
    ).toContain('DG_BAND_NO_CUT');
    expect(codes([el('dg-band', { name: 'b', from: '0', to: '24', cut: '10' })])).toEqual([]);
  });

  it('a timer with no delay, and a counter with no figure', () => {
    expect(codes([el('dg-timer', { name: 't', label: 'attente' })])).toContain('DG_TIMER_NO_VALUE');
    expect(codes([el('dg-timer', { name: 't', value: '0' })])).toContain('DG_TIMER_NO_VALUE');
    expect(codes([el('dg-counter', { name: 'c' })])).toContain('DG_MARK_EMPTY');
    expect(codes([el('dg-counter', { name: 'c', value: '12 k€' })])).toContain('DG_VALUE_INVALID');
  });

  it('people past twelve, or more missing than there are, and a switch in a state it does not know', () => {
    expect(codes([el('dg-person', { name: 'p', count: '40' })])).toContain('DG_VALUE_RANGE');
    expect(codes([el('dg-person', { name: 'p', count: '3', absent: '4' })])).toContain(
      'DG_VALUE_RANGE',
    );
    expect(codes([el('dg-switch', { name: 's', state: 'open' })])).toContain('DG_VALUE_INVALID');
  });

  it('every fix says what to do', () => {
    const issues = parse([
      el('dg-terminal', { name: 't' }),
      el('dg-status', {}),
      el('dg-band', { name: 'b' }),
    ]).issues;
    for (const issue of issues) expect(issue.fix?.action).toBeTruthy();
  });
});

describe('the marks in a story', () => {
  it('a terminal of the steady beat types while the system runs, and the event waits for its last line', () => {
    const { plan, drawn } = story([
      el('dg-terminal', { name: 'claude', beat: 'steady', lines: TERMINAL_LINES }),
      el('dg-box', { name: 'page', label: 'page', tone: 'normal danger', beat: 'event' }),
    ]);
    const i = drawn.items.findIndex((item) => item.kind === 'terminal');
    const typing = plan.timing.get(storyIds.act(i))!;
    const event = plan.script.beats.find((b) => b.phase === 'event')!;
    expect(plan.script.beats.find((b) => b.mark === 'claude')).toMatchObject({
      kind: 'act',
      phase: 'steady',
    });
    expect(event.atMs / 1000).toBeGreaterThanOrEqual(typing.start + typing.duration - 1e-6);
    expect(plan.script.steadyMs).toBeGreaterThanOrEqual(1500);
  });

  it('a table carried and changed acts on its beat, and its frame stands from the start', () => {
    const { plan, drawn } = story([
      el('dg-box', { name: 'source', label: 'prod', beat: 'steady' }),
      el('dg-table', { name: 'anon', from: 'source', rows: 'a\nb', swap: 'c\nd', beat: 'event' }),
      el('dg-box', { name: 'fin', label: 'fin', proof: 'ok', beat: 'proof' }),
    ]);
    const i = drawn.items.findIndex((item) => item.kind === 'table');
    expect(plan.timing.get(storyIds.act(i))!.start).toBeGreaterThan(
      plan.timing.get(cueIds.item(i))!.start,
    );
    expect(plan.script.beats.find((b) => b.mark === 'anon')).toMatchObject({
      kind: 'act',
      lasting: true,
    });
  });

  it('a switch turns on its beat, a status turns on its own, its words with it', () => {
    const { plan } = story([
      el('dg-box', { name: 'traefik', label: 'Traefik', beat: 'steady' }),
      el('dg-switch', { name: 'flag', label: 'green', state: 'off on', beat: 'event' }),
      el('dg-status', { for: 'traefik', state: 'wait ok', label: 'GET /health', beat: 'spread' }),
    ]);
    const beats = plan.script.beats.filter((b) => b.declared);
    expect(beats.find((b) => b.mark === 'flag')).toMatchObject({ kind: 'change', phase: 'event' });
    expect(beats.find((b) => b.mark === 'GET /health')).toMatchObject({
      kind: 'swap',
      phase: 'spread',
    });
    expect(plan.timing.has(storyIds.noteSwap(0))).toBe(true);
  });

  it('a band runs its normal time for as long as the established flow, then is cut on its beat', () => {
    const { plan, drawn } = story([
      el('dg-band', { name: 'leads', from: '0', to: '24', cut: '8', steady: '3s', beat: 'event' }),
    ]);
    const i = drawn.items.findIndex((item) => item.kind === 'band');
    const steady = plan.timing.get(storyIds.steady(i))!;
    const cut = plan.timing.get(storyIds.act(i))!;
    expect(steady.duration).toBeGreaterThan(0);
    expect(cut.start).toBeGreaterThanOrEqual(steady.start + steady.duration);
    expect(plan.script.steadyMs).toBeGreaterThanOrEqual(1500);
  });

  it('a mark that tells a story with no beat does nothing and stands as at rest', () => {
    const { plan, drawn } = story([
      el('dg-timer', { name: 't', value: '5', unit: 'min' }),
      el('dg-box', { name: 'b', label: 'b', beat: 'event' }),
    ]);
    const i = drawn.items.findIndex((item) => item.kind === 'timer');
    expect(plan.timing.has(storyIds.act(i))).toBe(false);
  });

  it('on clicks, a table does not read a swap · it is said, and dropped', () => {
    expect(codes([el('dg-table', { name: 't', rows: 'a', swap: 'b' })])).toContain('DG_STORY_ATTR');
  });
});
