// ════════════════════════════════════════════════════════════════
// RIKIKI · deck motifs, the drawings of a deck that answer each other
//
// A talk ties its illustrations together: a strip says where the act stands
// (`acts` and `act` on a diagram), an incident is followed by its remedy drawn
// with the same marks (`pair` on the incident, naming the remedy's slide), a
// chapter opens by pulling back from the mark the slide before ended on
// (`zoom-from` on a camera). A motif may come back, and that is no repeat when it
// moves on: the same named marks at another step of the act, over a wider scope,
// with other figures or in another state.
//
// This module says what a deck declares wrong (ILL_PAIR_*, ILL_ZOOM_FROM_TARGET,
// ILL_ACT_DRIFT) and whether a drawing progresses on the one before it, which the
// diversity (ILL_REPEATED_LOOK) and the richness (ILL_MODEL_REPEAT) ask before they
// call two drawings a repeat. Pure: what each diagram wrote on its svg in, findings out.
// ════════════════════════════════════════════════════════════════

/** What a drawing says of its place in the deck · `data-motif` on a diagram's svg,
 *  and the words of its named marks, which `rikiki check` reads off the ink. */
export interface Motif {
  /** The words of each mark, by the mark that wrote them. */
  words: Record<string, string>;
  /** The marks it names · the words' marks when it says nothing. */
  names?: string[];
  /** The steps of its act and the one it stands at, from 0. */
  act?: { steps: string[]; at: number } | null;
  /** The id of the slide that answers it · on an incident, its remedy. */
  pair?: string | null;
  /** The slide its camera opens from, and the mark it frames there. */
  zoomFrom?: { slide: string; mark: string } | null;
}

/** How a drawing moves on from the one before · a step of the act, a wider scope
 *  (more marks around the same ones), other figures, another state. */
export type Progress = 'step' | 'scope' | 'data' | 'state';

export const DECK_MOTIF_CODES = [
  'ILL_PAIR_TARGET',
  'ILL_PAIR_MARKS',
  'ILL_ZOOM_FROM_TARGET',
  'ILL_ACT_DRIFT',
] as const;
export type DeckMotifCode = (typeof DECK_MOTIF_CODES)[number];

export const MOTIF_LIMITS = Object.freeze({
  /** Two drawings are one motif when they share this share of the marks of the
   *  smaller · a remedy keeps as much of its incident. */
  shared: 0.5,
});

const namesOf = (motif: Motif): Set<string> =>
  new Set(motif.names?.length ? motif.names : Object.keys(motif.words));

/** The figures a text holds, in order · `DB 2 · STOP` changes state, not data. */
const figuresOf = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).join(' ');

/** The marks two drawings share, when they are one motif · null when they are not. */
function sharedMarks(before: Motif, after: Motif): string[] | null {
  const a = namesOf(before);
  const b = namesOf(after);
  const shared = [...b].filter((name) => a.has(name));
  const smaller = Math.min(a.size, b.size);
  if (!smaller || shared.length < smaller * MOTIF_LIMITS.shared) return null;
  return shared;
}

const sameSteps = (a: string[], b: string[]) =>
  a.length === b.length && a.every((step, i) => step.toLowerCase() === b[i]!.toLowerCase());

/** How `after` moves on from `before` · empty when it is not the same motif, or is
 *  the same picture again. */
export function progressOf(
  before: Motif | null | undefined,
  after: Motif | null | undefined,
): Progress[] {
  if (!before || !after) return [];
  const shared = sharedMarks(before, after);
  if (!shared) return [];
  const found = new Set<Progress>();
  if (before.act && after.act && sameSteps(before.act.steps, after.act.steps))
    if (after.act.at > before.act.at) found.add('step');
  // Off a step of the act, a motif keeps something as it was · the same marks with
  // every word changed are another case drawn the same way (a clone), not the same
  // one moving on. A step moves the act on: its picture may be all new words.
  // A mark with no words (a group) anchors nothing · two absent texts are not one kept.
  const anchored = shared.some(
    (mark) => before.words[mark] !== undefined && before.words[mark] === after.words[mark],
  );
  if (!anchored) return [...found];
  const kept = namesOf(before);
  if ([...namesOf(after)].some((name) => !kept.has(name))) found.add('scope');
  for (const mark of shared) {
    const was = before.words[mark];
    const is = after.words[mark];
    if (was === undefined || is === undefined || was === is) continue;
    found.add(figuresOf(was) !== figuresOf(is) ? 'data' : 'state');
  }
  return [...found].sort();
}

// ── what a deck declares ──────────────────────────────────────────────────

export interface MotifEntry {
  slide: number;
  slideId?: string | null;
  element?: string;
  motif?: Motif | null;
}

export interface MotifIssue {
  code: DeckMotifCode;
  severity: 'error' | 'warning';
  slide: number;
  slideId: string | null;
  element?: string;
  message: string;
  measurement: Record<string, unknown>;
  fix: { action: string; [detail: string]: unknown };
}

const where = (e: MotifEntry) => `slide ${e.slide}${e.slideId ? ` (#${e.slideId})` : ''}`;

function issue(
  entry: MotifEntry,
  code: DeckMotifCode,
  severity: MotifIssue['severity'],
  message: string,
  measurement: Record<string, unknown>,
  fix: MotifIssue['fix'],
): MotifIssue {
  return {
    code,
    severity,
    slide: entry.slide,
    slideId: entry.slideId ?? null,
    ...(entry.element ? { element: entry.element } : {}),
    message,
    measurement,
    fix,
  };
}

/** The slide a declaration names, every diagram it holds read as one · the marks
 *  any of them names, and the diagram that shares the most of `marks` (where a
 *  finding about it stands). Null when the slide draws none. */
function target(
  entries: readonly MotifEntry[],
  id: string,
  marks: ReadonlySet<string> = new Set(),
) {
  const drawn = entries.filter((e) => e.slideId === id && e.motif);
  if (!drawn.length) return null;
  const overlap = (e: MotifEntry) => [...namesOf(e.motif!)].filter((n) => marks.has(n)).length;
  const entry = drawn.reduce((best, e) => (overlap(e) > overlap(best) ? e : best));
  return { entry, names: new Set(drawn.flatMap((e) => [...namesOf(e.motif!)])) };
}

/** An incident and its remedy · the remedy exists, comes after, and draws with the
 *  incident's marks (at least half of them), so the room sees the same system mended. */
function pairIssues(entry: MotifEntry, entries: readonly MotifEntry[], partial: boolean) {
  const id = entry.motif!.pair!;
  const incident = namesOf(entry.motif!);
  const found = target(entries, id, incident);
  const known = entries.filter((e) => e.slideId && e.slideId !== entry.slideId && e.motif);
  const fix = {
    action: 'set-attribute',
    attribute: 'pair',
    on: 'deck-diagram',
    use: 'the id of the remedy slide, after this one',
    known: known.filter((e) => e.slide > entry.slide).map((e) => e.slideId),
  };
  if (!found) {
    if (partial) return [];
    return [
      issue(
        entry,
        'ILL_PAIR_TARGET',
        'error',
        `${where(entry)} pairs with "${id}", which is no illustrated slide of the deck · the incident has no remedy to answer it`,
        { pair: id },
        fix,
      ),
    ];
  }
  const remedy = found.entry;
  if (remedy.slide <= entry.slide)
    return [
      issue(
        entry,
        'ILL_PAIR_TARGET',
        'warning',
        `${where(entry)} pairs with ${where(remedy)}, which comes ${remedy.slide === entry.slide ? 'on the same slide' : 'before it'} · the remedy answers the incident, after it`,
        { pair: id, remedySlide: remedy.slide },
        fix,
      ),
    ];
  const missing = [...incident].filter((name) => !found.names.has(name));
  if (!incident.size || incident.size - missing.length >= incident.size * MOTIF_LIMITS.shared)
    return [];
  return [
    issue(
      remedy,
      'ILL_PAIR_MARKS',
      'warning',
      `${where(remedy)} answers the incident of ${where(entry)} with ${incident.size - missing.length} of its ${incident.size} named marks · the room does not see the same system mended`,
      {
        incident: entry.slide,
        kept: incident.size - missing.length,
        marks: incident.size,
        missing,
        limit: MOTIF_LIMITS.shared,
      },
      {
        action: 'keep-the-marks',
        on: remedy.slideId ?? `slide ${remedy.slide}`,
        names: missing,
        use: 'the same name on the mark that stands for the same thing, its words and its state moved on',
      },
    ),
  ];
}

/** A camera that opens on the frame of the slide before · that slide is the one
 *  before, and draws the mark. */
function zoomIssues(entry: MotifEntry, entries: readonly MotifEntry[], partial: boolean) {
  const { slide: id, mark } = entry.motif!.zoomFrom!;
  const drawn = target(entries, id, new Set([mark]));
  const before = drawn?.entry;
  const fix = (use: string) => ({
    action: 'set-attribute',
    attribute: 'zoom-from',
    on: 'dg-camera',
    use,
  });
  if (!drawn || !before)
    return partial
      ? []
      : [
          issue(
            entry,
            'ILL_ZOOM_FROM_TARGET',
            'error',
            `${where(entry)} opens from "${id}", which is no illustrated slide · the camera frames its own "${mark}" instead`,
            { zoomFrom: `${id}/${mark}` },
            fix('slide-id/mark · the id of the slide before, and a mark both draw'),
          ),
        ];
  const found: MotifIssue[] = [];
  if (!drawn.names.has(mark))
    found.push(
      issue(
        entry,
        'ILL_ZOOM_FROM_TARGET',
        'error',
        `${where(entry)} opens from "${mark}" of ${where(before)}, which draws no mark of that name · the frame cannot be taken over`,
        { zoomFrom: `${id}/${mark}`, known: [...drawn.names].slice(0, 12) },
        fix('a mark both slides name the same, qualified by its panel (panel.mark)'),
      ),
    );
  if (before.slide !== entry.slide - 1)
    found.push(
      issue(
        entry,
        'ILL_ZOOM_FROM_TARGET',
        'warning',
        `${where(entry)} opens from ${where(before)}, which is not the slide before it · walking the deck, the room never arrives from there, and sees the local frame`,
        { zoomFrom: `${id}/${mark}`, from: before.slide, slide: entry.slide },
        fix('the id of the slide just before this one'),
      ),
    );
  return found;
}

/** Strips of one act written two ways · the room reads two acts. */
function actIssues(entries: readonly MotifEntry[]): MotifIssue[] {
  const found: MotifIssue[] = [];
  let last: MotifEntry | undefined;
  for (const entry of entries) {
    const act = entry.motif?.act;
    if (!act) continue;
    const previous = last;
    const before = previous?.motif?.act;
    last = entry;
    if (!previous || !before || sameSteps(before.steps, act.steps)) continue;
    const lower = (steps: string[]) => steps.map((s) => s.toLowerCase());
    const shared = lower(act.steps).filter((s) => lower(before.steps).includes(s)).length;
    if (shared < Math.min(act.steps.length, before.steps.length) * MOTIF_LIMITS.shared) continue;
    found.push(
      issue(
        entry,
        'ILL_ACT_DRIFT',
        'warning',
        `${where(entry)} writes its act as "${act.steps.join(' · ')}", ${where(previous)} as "${before.steps.join(' · ')}" · one act, two strips`,
        { steps: act.steps, before: before.steps, beforeSlide: previous.slide },
        {
          action: 'set-attribute',
          attribute: 'acts',
          on: 'deck-diagram',
          value: before.steps.join(' · '),
        },
      ),
    );
  }
  return found;
}

/** What the motifs of a deck declare wrong · `partial` when only some slides were
 *  walked, so a slide that was not is not called missing. */
export function deckMotifIssues(
  entries: readonly MotifEntry[],
  { partial = false }: { partial?: boolean } = {},
): MotifIssue[] {
  const ordered = [...entries].sort((a, b) => a.slide - b.slide);
  return [
    ...ordered.flatMap((e) => (e.motif?.pair ? pairIssues(e, ordered, partial) : [])),
    ...ordered.flatMap((e) => (e.motif?.zoomFrom ? zoomIssues(e, ordered, partial) : [])),
    ...actIssues(ordered),
  ];
}
