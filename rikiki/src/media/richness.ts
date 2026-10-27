// ════════════════════════════════════════════════════════════════
// RIKIKI · richness, is there something to see in this drawing?
//
// The illustration rules say whether a drawing is clean; the diversity says whether
// it differs from its neighbours. Neither says whether it is worth looking at: a
// chain of three pale boxes named "Service A", "Service B", "Service C" passes both.
// This module measures that, out of 100, on five criteria of equal weight (each
// 0, 10 or 20, with what was measured and how to earn the rest):
//
//   - CONTENT · precise facts (a date, an hour, a count, an identifier) rather than
//     generic labels, and a source named on the slide;
//   - DEMONSTRATION · the relation is drawn, by two devices or more that articulate
//     (a link and a flow, a scale and a threshold, a gate and a state that turns);
//   - STORY · in a story played on entry, the phases are there: the system running,
//     the event, the proof after it;
//   - PAINT · roles that differ (context, focal, state, control) are painted apart;
//   - RESULT · the consequence or the proof reads in the picture at rest.
//
// A criterion that does not apply is left out and the total renormalised: a still
// picture is not marked down for not being a story, nor a drawing with one role for
// having one paint. Nothing is counted as such: no point for more marks, colours or
// seconds. Calibrated on the story decks against the galleries written before them
// (decks/tests/deck-diagram-{story,…}.html against examples/diagrams-*).
//
// A measure, reported, never a verdict: `rikiki check` writes it per illustration,
// and its findings (ILL_GENERIC, ILL_FLAT_PAINT, ILL_MODEL_REPEAT) only when asked
// (`--richness`). Pure: an ink model and a signature in, numbers out.
// ════════════════════════════════════════════════════════════════

import type { DiagramSignature } from './diversity.js';
import { ILL_LIMITS, type InkModel, type InkShape } from './ill-rules.js';

/** A colour and its opacity, as a surface paints it. */
type Paint = NonNullable<InkShape['paint']>;

/** Every code the richness says · `rikiki check` lists, selects and configures them
 *  by this table (bin/lib/check-registry.mjs). */
export const RICHNESS_CODES = ['ILL_GENERIC', 'ILL_FLAT_PAINT', 'ILL_MODEL_REPEAT'] as const;
export type RichnessCode = (typeof RICHNESS_CODES)[number];

export const RICHNESS_CRITERIA = ['content', 'demonstration', 'story', 'paint', 'result'] as const;
export type RichnessCriterion = (typeof RICHNESS_CRITERIA)[number];

/** Every threshold, with where it comes from. */
export const RICHNESS_LIMITS = Object.freeze({
  /** What a criterion is worth when met, and half met · five of them make 100. */
  full: 20,
  half: 10,
  /** Two precise facts at least · a brief of `rikiki recipe` needs as many · and of
   *  two kinds (when, which, how much): rates alone fit any case. */
  facts: 2,
  factKinds: 2,
  /** Two devices of relation at least, articulated · one is a list of boxes. */
  devices: 2,
  /** Two fills this close on every channel (0 to 255) are one paint · the role
   *  surfaces of a theme are pale tints a dozen apart, so only a rounding is one. */
  sameColour: 4,
  sameOpacity: 0.05,
  /** A filled shape over this share of the frame is a surface, not a dot. */
  surfaceShare: 0.01,
  /** The paints a drawing needs at most to tell its roles apart. */
  treatments: 3,
  /** The same graphic model a third time in five illustrated slides is a repeat. */
  repeatUses: 3,
  repeatWindow: 5,
});

/** A value that says something precise · a figure (a date, an hour, a count) or an
 *  identifier (`is_active()`, `v2.4`, `pg-01`, `0042_tva`, `#42`). */
export const PRECISE_VALUE = /\d|[A-Za-z_]\w*\(\)|\b\w+[._]\w+\b|#\w+/;

/** Words an author leaves when nothing precise was written · they say nothing. */
export const GENERIC_WORDS =
  /^(?:a|b|c|x|y|z|foo|bar|baz|todo|tbd|tba|xxx|lorem.*|\.\.\.|…|-|service(?: [a-z0-9])?|système(?: [a-z0-9])?|system(?: [a-z0-9])?|étape \d+|step \d+|client|user|utilisateur|exemple|example|label|texte|text)$/i;

/** A word and a single figure (`appli 1`, `T4`, `semaine 3`) counts things, it does not
 *  say which · an enumeration, not a fact. */
const ENUMERATOR = /^\p{L}[\p{L}.]*\s?\d$/u;

/** The kinds of a fact · WHEN (an hour, a date, a day, a month, a year), WHICH (an
 *  identifier: `is_active()`, `client_id`, `v1.8.2`, `pg-01`, `#42`), HOW MUCH (any
 *  other figure). A case is pinned by two kinds; a picture of rates alone is any case. */
const FACT_KINDS = Object.freeze({
  when: /\b\d{1,2}[:h]\d{2}\b|\b\d{1,2} ?h\b|\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b|\b(?:19|20)\d{2}\b|\bJ[+-]?\d+\b|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\b(?:lun|mar|mer|jeu|ven|sam|dim|mon|tue|wed|thu|fri|sat|sun)\.|janvier|février|mars|avril|\bmai\b|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|june|july|august|september|october|november|december|\b(?:janv|févr|avr|juil|sept|oct|nov|déc|jan|feb|apr|jun|jul|aug|sep|dec)\./i,
  which: /[A-Za-z_]\w*\(\)|\b[A-Za-z]\w*(?:[._]\w+)+|#\w+|\b[A-Za-z]+-\d+\b/,
  'how-much': /\d/,
});
type FactKind = keyof typeof FACT_KINDS;

/** The kinds of fact a text holds · none for a generic label or an enumeration. An
 *  identifier is read first, then a time in what is left, then a figure: the digits
 *  of `v1.8.2` are no date, those of `14:02` no quantity. */
function factKinds(text: string): FactKind[] {
  if (GENERIC_WORDS.test(text) || ENUMERATOR.test(text)) return [];
  const kinds: FactKind[] = [];
  let rest = text;
  for (const kind of ['which', 'when', 'how-much'] as const) {
    const re = FACT_KINDS[kind];
    if (!re.test(rest)) continue;
    kinds.push(kind);
    rest = rest.replace(new RegExp(re.source, `${re.flags}g`), ' ');
  }
  return kinds.sort();
}

export interface CriterionScore {
  /** 0, 10 or 20 · null when the criterion does not apply to this drawing. */
  points: number | null;
  measurement: Record<string, number | string | boolean | string[]>;
  /** How to earn the rest, by name · absent when the criterion is met. */
  fix?: { action: string; [detail: string]: unknown };
}

export interface Richness {
  /** 0 to 100 over the criteria that apply. */
  score: number;
  /** The graphic model the drawing is made on · what ILL_MODEL_REPEAT compares. */
  model: string;
  criteria: Record<RichnessCriterion, CriterionScore>;
}

export interface RichnessInput {
  model: InkModel;
  /** What a diagram says it is made of · null for a drawing that says nothing. */
  signature?: DiagramSignature | null;
  /** The slide names a source (`deck-source`) · its fidelity is for a reviewer. */
  sourced?: boolean;
  /** The element that drew it, for a drawing that says nothing of itself. */
  tag?: string;
}

const { full, half } = RICHNESS_LIMITS;

const normal = (text: string) => text.trim().replace(/\s+/g, ' ');
const isFact = (text: string) => factKinds(text).length > 0;

// ── content ───────────────────────────────────────────────────────────────

function content({ model, sourced = false }: RichnessInput): CriterionScore {
  const texts = model.texts.map((t) => normal(t.text)).filter(Boolean);
  const facts = [...new Set(texts.filter(isFact).map((t) => t.toLowerCase()))];
  const kinds = [...new Set(facts.flatMap(factKinds))].sort();
  const generic = texts.filter((t) => GENERIC_WORDS.test(t) || ENUMERATOR.test(t)).length;
  const pinned = facts.length >= RICHNESS_LIMITS.facts && kinds.length >= RICHNESS_LIMITS.factKinds;
  const points = pinned && sourced ? full : facts.length ? half : 0;
  const measurement = { facts: facts.length, kinds, examples: facts.slice(0, 3), generic, sourced };
  if (points === full) return { points, measurement };
  return { points, measurement, fix: contentFix(pinned, facts.length, kinds) };
}

function contentFix(pinned: boolean, facts: number, kinds: string[]): CriterionScore['fix'] {
  if (pinned)
    return {
      action: 'name-the-source',
      use: 'a deck-source on the slide, saying where the figures come from',
    };
  const missing = (Object.keys(FACT_KINDS) as string[]).filter((kind) => !kinds.includes(kind));
  return {
    action: 'add-precise-facts',
    need: Math.max(0, RICHNESS_LIMITS.facts - facts),
    kinds: missing,
    use: 'the facts of the case, of two kinds: when (an hour, a date), which (an identifier, a version), how much (a count, a duration), in a label, a note or a tag',
  };
}

// ── demonstration ─────────────────────────────────────────────────────────

/** Marks that draw a quantity to scale · a comparison of magnitudes. */
const SCALE_MARKS = [
  'bar',
  'meter',
  'curve',
  'queue',
  'band',
  'timer',
  'counter',
  'dot',
  'pie',
  'columns',
];
/** Marks whose state turns · a switch, a status, a table whose rows change. */
const STATE_MARKS = ['switch', 'status'];
/** What moves to say that something changed · not an entrance. */
const CHANGE_MOTIFS = ['turn', 'fill', 'gate', 'morph'];
const CHANGE_BEATS = ['swap', 'change', 'lever'];

/** The devices a diagram demonstrates its relation with · each kind once. */
function devicesOf(signature: DiagramSignature, model: InkModel): string[] {
  const { structure, time } = signature;
  const has = (kinds: string[]) => kinds.some((kind) => (structure.marks[kind] ?? 0) > 0);
  const devices = new Set<string>();
  if (structure.links > 0) devices.add('link');
  if (structure.tokens) devices.add('flow');
  if (structure.gates) devices.add('gate');
  if (has(SCALE_MARKS)) devices.add('scale');
  // A reference value on a scale, and a callout pinned on a mark (the peak called
  // out by a line in the talk's charts) · each says where to look and why.
  if (has(['cursor'])) devices.add('marker');
  if (has(['text'])) devices.add('callout');
  if (has(STATE_MARKS)) devices.add('state');
  if (
    structure.morph ||
    time.motifs.some((m) => CHANGE_MOTIFS.includes(m)) ||
    (model.story?.beats ?? []).some((b) => CHANGE_BEATS.includes(b.kind))
  )
    devices.add('change');
  if ((structure.marks.panel ?? 0) >= 2) devices.add('panels');
  return [...devices].sort();
}

function demonstration({ model, signature }: RichnessInput): CriterionScore {
  if (!signature) return { points: null, measurement: { declared: false } };
  const devices = devicesOf(signature, model);
  const points = devices.length >= RICHNESS_LIMITS.devices ? full : devices.length ? half : 0;
  const measurement = { devices };
  if (points === full) return { points, measurement };
  return {
    points,
    measurement,
    fix: {
      action: 'articulate-the-relation',
      use: 'a second device the sentence calls for: a flow on a link, a state that turns, a scale or a threshold, a gate',
      not: 'marks added for their own sake',
    },
  };
}

// ── story ─────────────────────────────────────────────────────────────────

/** The phases a story needs · the system running, the break, the proof after it. */
function storyPhases(model: InkModel): { present: string[]; missing: string[] } {
  const story = model.story!;
  const beats = story.beats;
  const events = beats.filter((b) => b.phase === 'event');
  const lastEvent = events.length ? Math.max(...events.map((b) => b.atMs)) : 0;
  const found = {
    steady: story.steadyMs >= ILL_LIMITS.steadyMinMs || beats.some((b) => b.phase === 'steady'),
    event: events.length > 0,
    proof: beats.some((b) => b.phase === 'proof' && b.lasting && b.atMs >= lastEvent),
  };
  const phases = Object.keys(found) as (keyof typeof found)[];
  return {
    present: phases.filter((p) => found[p]),
    missing: phases.filter((p) => !found[p]),
  };
}

/** A story with no break · a camera that pulls back, a scope that widens: its phases
 *  are its own beats in order, and it is whole when it ends on something that lasts
 *  (a proof, the picture the camera returns to). */
function isReveal(model: InkModel): boolean {
  const beats = model.story!.beats;
  if (beats.some((b) => b.phase === 'event')) return false;
  const ends = beats.some((b) => b.lasting && (b.phase === 'proof' || b.kind === 'camera'));
  return new Set(beats.map((b) => b.phase)).size >= 2 && ends;
}

/** Intents whose sentence says something happens · a cause that unfolds, a barrier
 *  that drops, a spread, a threshold crossed, a stock that grows, a drift, a before
 *  and after. The others (a share, a comparison, a structure) are said by a still. */
const EVENT_INTENTS = new Set([
  'cause',
  'barrier',
  'propagate',
  'threshold',
  'accumulate',
  'drift',
  'transform',
]);

/** Whether a drawing that is no story shows an event · its intent says one, or what
 *  it draws turns: a gate, a state that changes. */
function showsAnEvent(signature: DiagramSignature | null | undefined): boolean {
  if (!signature) return false;
  const { structure, time } = signature;
  const intents = structure.intent?.split('+') ?? [];
  return (
    intents.some((intent) => EVENT_INTENTS.has(intent)) ||
    structure.gates ||
    time.motifs.some((m) => CHANGE_MOTIFS.includes(m))
  );
}

function story({ model, signature }: RichnessInput): CriterionScore {
  if (!model.story) {
    if (!showsAnEvent(signature)) return { points: null, measurement: { story: false } };
    // An event told as stills · click by click the states are seen, not what
    // happens between them; in one still, only the state it broke into.
    const clicks = signature!.time.clicks;
    return {
      points: clicks > 0 ? half : 0,
      measurement: { story: false, event: true, clicks },
      fix: {
        action: 'tell-it-as-a-story',
        use: 'play="enter" and beats · the system running (steady), the break (event), the proof in the target',
      },
    };
  }
  const reveal = isReveal(model);
  const { present, missing } = reveal
    ? { present: [...new Set(model.story.beats.map((b) => b.phase))], missing: [] }
    : storyPhases(model);
  const points = !missing.length ? full : present.length >= 2 ? half : 0;
  const spread = model.story.beats.some((b) => b.phase === 'spread' || b.phase === 'effect');
  const measurement = { phases: present, missing, consequence: spread, reveal };
  if (points === full) return { points, measurement };
  return {
    points,
    measurement,
    fix: {
      action: 'complete-the-story',
      missing,
      use: 'beat="steady" (or steady="3s") on what runs normally, beat="event" on the break, proof="…" with beat="proof" on the target',
    },
  };
}

// ── paint ─────────────────────────────────────────────────────────────────

const areaOf = (s: InkShape) =>
  Math.max(0, s.box.right - s.box.left) * Math.max(0, s.box.bottom - s.box.top);

/** A shape that lays a surface · a card, a disc, or a path that paints one (a column
 *  drawn as a path, the band of a ring's part). */
const isArea = (s: InkShape) =>
  s.role !== 'overlay' &&
  (s.kind === 'rect' || s.kind === 'circle' || (s.kind === 'path' && !!s.paint));

/** The roles a drawing holds · what its paint must tell apart: the context, the
 *  thing put forward, a state (a tone, a status, something that turns), a control
 *  (a gate, a switch), a result (what an arrow, a story or an intent leads to). */
function rolesOf(model: InkModel, signature: DiagramSignature | null | undefined): string[] {
  const tones = signature?.visual.tones ?? [];
  const marks = signature?.structure.marks ?? {};
  const motifs = signature?.time.motifs ?? [];
  const roles = new Set<string>();
  if (model.shapes.some((s) => !s.accent)) roles.add('context');
  if (tones.includes('accent') || model.shapes.some((s) => s.accent && s.fill)) roles.add('focal');
  if (
    tones.some((t) => t === 'ok' || t === 'warn' || t === 'danger') ||
    model.shapes.some((s) => s.role === 'state') ||
    motifs.some((m) => CHANGE_MOTIFS.includes(m))
  )
    roles.add('state');
  if ((marks.gate ?? 0) + (marks.switch ?? 0) > 0) roles.add('control');
  const story = model.story?.beats ?? [];
  if (
    (signature?.structure.links ?? 0) > 0 ||
    signature?.structure.intent ||
    story.some((b) => b.phase === 'proof' || b.phase === 'effect')
  )
    roles.add('result');
  return [...roles].sort();
}

/** The flat fills a drawing lays its surfaces in · a colour counts once its shapes
 *  cover a share of the frame together (a card, a panel, a crowd of dots), so an
 *  icon's disc or a caret is no paint of its own, and an outline is none. */
function aplatsOf(model: InkModel): string[] {
  const frame =
    (model.frame.right - model.frame.left) * (model.frame.bottom - model.frame.top) || 1;
  const covered: { paint: Paint; share: number }[] = [];
  // Colours a rounding apart, at an opacity a rounding apart, are one paint.
  const same = (a: Paint, b: Paint) =>
    a.slice(0, 3).every((c, i) => Math.abs(c - b[i]!) <= RICHNESS_LIMITS.sameColour) &&
    Math.abs(a[3] - b[3]) <= RICHNESS_LIMITS.sameOpacity;
  for (const shape of [...model.shapes, ...(model.tints ?? [])].filter(isArea)) {
    const paint = shape.paint ?? (shape.fill ? ([...shape.fill, 1] as Paint) : null);
    if (!paint) continue;
    const seen = covered.find((c) => same(c.paint, paint));
    if (seen) seen.share += areaOf(shape) / frame;
    else covered.push({ paint, share: areaOf(shape) / frame });
  }
  return covered
    .filter((c) => c.share >= RICHNESS_LIMITS.surfaceShare)
    .map((c) => c.paint.join(','))
    .sort();
}

function paint({ model, signature }: RichnessInput): CriterionScore {
  const roles = rolesOf(model, signature);
  if (roles.length < 2) return { points: null, measurement: { roles } };
  const aplats = aplatsOf(model).length;
  const needed = Math.min(roles.length, RICHNESS_LIMITS.treatments);
  const points = aplats >= needed ? full : aplats >= 2 ? half : 0;
  const measurement = { roles, aplats, needed };
  if (points === full) return { points, measurement };
  return {
    points,
    measurement,
    fix: {
      action: 'paint-by-role',
      use: 'paint="pale" on the context, "gold" on the control, "ink" on the target, "bad" on the incident, "ok" on what is sound',
    },
  };
}

// ── result ────────────────────────────────────────────────────────────────

const inside = (outer: InkShape['box'], x: number, y: number) =>
  x >= outer.left && x <= outer.right && y >= outer.top && y <= outer.bottom;

/** The texts of the thing put forward · written in it, or by the mark that drew it. */
function focalTexts(model: InkModel): string[] {
  const focal = model.shapes.filter((s) => s.accent && s.fill && s.role !== 'state');
  const marks = new Set(focal.map((s) => s.mark).filter(Boolean));
  return model.texts
    .filter((t) => {
      if (t.mark && marks.has(t.mark)) return true;
      const x = (t.box.left + t.box.right) / 2;
      const y = (t.box.top + t.box.bottom) / 2;
      return focal.some((s) => inside(s.box, x, y));
    })
    .map((t) => normal(t.text));
}

function result({ model }: RichnessInput): CriterionScore {
  const inked = new Set(
    [...model.texts, ...model.shapes].map((p) => p.mark).filter((m): m is string => !!m),
  );
  if (model.story) {
    const kept = (phases: string[]) =>
      model.story!.beats.filter((b) => phases.includes(b.phase) && b.lasting && inked.has(b.mark));
    const proofs = kept(['proof']);
    const breaks = kept(['event', 'spread', 'effect']);
    const points = proofs.length ? full : breaks.length ? half : 0;
    const measurement = {
      proof: proofs.map((b) => b.mark),
      consequence: breaks.map((b) => b.mark),
    };
    if (points === full) return { points, measurement };
    return {
      points,
      measurement,
      fix: { action: 'prove-in-the-target', use: 'proof="…" on the target, with beat="proof"' },
    };
  }
  const texts = focalTexts(model);
  const focal = model.shapes.some((s) => s.accent && s.fill && s.role !== 'state');
  const proven = texts.filter(isFact);
  const points = proven.length ? full : focal ? half : 0;
  const measurement = { focal, value: proven.slice(0, 2) };
  if (points === full) return { points, measurement };
  return {
    points,
    measurement,
    fix: focal
      ? {
          action: 'value-the-focal',
          use: 'the figure the slide argues for, written in the mark put forward',
        }
      : {
          action: 'put-the-result-forward',
          use: 'emphasis on the mark that concludes, with its value',
        },
  };
}

// ── the graphic model ─────────────────────────────────────────────────────

/** Marks and layouts every picture of boxes and arrows is made of · a chain, a fan,
 *  a tree, a convergence are one model, whatever their intent. */
const PLAIN_MARKS = new Set(['box', 'text', 'group', 'link', 'state', 'camera', 'panel', 'status']);
const PLAIN_LAYOUTS = new Set(['row', 'column', 'layers', 'grid']);

/** The graphic model a drawing is made on · its distinctive layouts and marks, or the
 *  element that drew it when it says nothing of itself. */
export function modelOf(signature: DiagramSignature | null | undefined, tag = 'svg'): string {
  if (!signature) return tag;
  const { structure } = signature;
  const parts = [
    ...structure.layouts.filter((l) => !PLAIN_LAYOUTS.has(l)),
    ...Object.keys(structure.marks).filter((kind) => !PLAIN_MARKS.has(kind)),
  ];
  return `${structure.kind}:${[...new Set(parts)].sort().join('+') || 'boxes'}`;
}

// ── the measure ───────────────────────────────────────────────────────────

/** How rich a drawing is, criterion by criterion. */
export function measureRichness(input: RichnessInput): Richness {
  const criteria: Record<RichnessCriterion, CriterionScore> = {
    content: content(input),
    demonstration: demonstration(input),
    story: story(input),
    paint: paint(input),
    result: result(input),
  };
  const applied = RICHNESS_CRITERIA.map((c) => criteria[c].points).filter(
    (p): p is number => p !== null,
  );
  const earned = applied.reduce((sum, p) => sum + p, 0);
  const score = applied.length ? Math.round((earned / (applied.length * full)) * 100) : 0;
  return { score, model: modelOf(input.signature, input.tag), criteria };
}

export interface RichnessIssue {
  code: RichnessCode;
  severity: 'warning';
  message: string;
  measurement: Record<string, unknown>;
  fix: { action: string; [detail: string]: unknown };
}

/** What a drawing's richness says, when asked · nothing precise, roles painted alike. */
export function richnessIssues(richness: Richness): RichnessIssue[] {
  const issues: RichnessIssue[] = [];
  const { content: c, paint: p } = richness.criteria;
  if (c.points === 0)
    issues.push({
      code: 'ILL_GENERIC',
      severity: 'warning',
      message: `no precise fact on the drawing (${c.measurement.generic} generic label${c.measurement.generic === 1 ? '' : 's'}) · a date, an hour, a count or an identifier is what makes it this case and not any`,
      measurement: c.measurement,
      fix: c.fix!,
    });
  if (p.points === 0)
    issues.push({
      code: 'ILL_FLAT_PAINT',
      severity: 'warning',
      message: `${(p.measurement.roles as string[]).join(', ')} are painted alike (${p.measurement.aplats} flat fill${p.measurement.aplats === 1 ? '' : 's'}) · the room cannot tell the roles apart`,
      measurement: p.measurement,
      fix: p.fix!,
    });
  return issues;
}

// ── a deck ────────────────────────────────────────────────────────────────

export interface ModelUse {
  slide: number;
  slideId?: string | null;
  model: string;
  /** The words of each named mark · a motif that progresses keeps its marks and
   *  changes their words. */
  words: Record<string, string>;
}

/** The words of a drawing, by the mark that wrote them. */
export function wordsByMark(model: InkModel): Record<string, string> {
  const words: Record<string, string> = {};
  for (const text of model.texts) {
    if (!text.mark) continue;
    words[text.mark] = normal(`${words[text.mark] ?? ''} ${text.text}`);
  }
  return words;
}

/** A repeat that progresses · the same marks as the use before it, their words
 *  changed: a step, a scope, a figure or a state that moves on. */
function progresses(use: ModelUse, before: ModelUse): boolean {
  const shared = Object.keys(use.words).filter((mark) => mark in before.words);
  const smaller = Math.min(Object.keys(use.words).length, Object.keys(before.words).length);
  if (!smaller || shared.length * 2 < smaller) return false;
  return shared.some((mark) => use.words[mark] !== before.words[mark]);
}

/** The third use (or more) of one graphic model within five illustrated slides,
 *  unless it is a motif that progresses · one warning per use, on its slide. */
export function modelRepeatIssues(uses: readonly ModelUse[]): RichnessIssue[] {
  const ordered = [...uses].sort((a, b) => a.slide - b.slide);
  const slides = [...new Set(ordered.map((u) => u.slide))];
  const { repeatUses, repeatWindow } = RICHNESS_LIMITS;
  const issues: RichnessIssue[] = [];
  ordered.forEach((use, i) => {
    const here = slides.indexOf(use.slide);
    const window = ordered
      .slice(0, i)
      .filter((u) => u.model === use.model && here - slides.indexOf(u.slide) < repeatWindow);
    if (window.length + 1 < repeatUses) return;
    if (progresses(use, window.at(-1)!)) return;
    const earlier = window.map((u) => u.slide);
    issues.push({
      code: 'ILL_MODEL_REPEAT',
      severity: 'warning',
      message: `slide ${use.slide}${use.slideId ? ` (#${use.slideId})` : ''} draws "${use.model}" a ${window.length + 1}${window.length + 1 === 3 ? 'rd' : 'th'} time in ${repeatWindow} illustrated slides (after slide${earlier.length === 1 ? '' : 's'} ${earlier.join(', ')}) · the room sees one model again, and it does not progress`,
      measurement: {
        slide: use.slide,
        slideId: use.slideId ?? null,
        model: use.model,
        uses: window.length + 1,
        slides: [...earlier, use.slide],
        limit: repeatUses,
        window: repeatWindow,
      },
      fix: {
        action: 'vary-the-model',
        options: [
          'another graphic model if the sentence says another relation (a band, lanes and a gate, a scale, a ring)',
          'a motif that progresses: the same named marks, their step, scope, figures or state moving on',
          'merge the slides that say the same thing',
        ],
      },
    });
  });
  return issues;
}
