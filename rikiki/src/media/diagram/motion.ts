// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the motion schedule
//
// When each thing of a diagram moves, decided from words and never from a
// number of seconds an author wrote. A mark says how it comes in (`enter`),
// what it waits for (`after="name"`) and on which click it appears (`step`);
// tokens run once the lane or the link that carries them is there, and once the
// gates on their way have moved. Everything else follows the eye: frames first,
// then the marks top to bottom and left to right, then the links and the notes.
//
// Each click is a stage with its own clock, starting at 0 when the click
// lands. A stage that would run past the budget is played faster, as a whole, so
// it fits · and says so (`DG_MOTION_BUDGET`), because the cure is a second click,
// not a faster picture. Pure: cues in, times out, no DOM.
// ════════════════════════════════════════════════════════════════

export const ENTERS = ['fade', 'rise', 'pop', 'draw'] as const;
export type Enter = (typeof ENTERS)[number];

/** How long each entrance takes, in seconds · the stylesheet reads the same table. */
export const ENTER_SECONDS: Readonly<Record<Enter, number>> = Object.freeze({
  fade: 0.5,
  rise: 0.5,
  pop: 0.45,
  draw: 0.7,
});

/** A gate that changes state drops (or lifts) in this long. */
export const SWITCH_SECONDS = 0.35;
/** A meter fills, a queue takes or frees its places, in this long. */
export const FILL_SECONDS = 0.8;
/** On a click that changes the picture · what leaves fades in this long, then what
 *  stays moves to its new place in this long, then what is new comes in. */
export const EXIT_SECONDS = 0.3;
export const MORPH_SECONDS = 0.8;

/** A stage moves for this long at most · under the 3 s past which `rikiki check`
 *  says the room is waiting on the drawing (ILL_MOTION_LONG). */
export const MOTION_BUDGET = 2.8;
/** The entrances of a stage finish inside this · four hundred cells are not slower. */
const ENTRANCE_BUDGET = 1.6;
const STAGGER = 0.12;
const FIRST = 0.15;
const FRAME_FIRST = 0.05;
const FRAME_STEP = 0.05;
const LINK_PAUSE = 0.1;
/** Between the end of what a cue waits for and its own start. */
const AFTER_GAP = 0.08;
/** The most clicks a diagram takes. */
export const MAX_STEP = 9;

export type CueRole = 'frame' | 'mark' | 'link' | 'note' | 'run' | 'switch' | 'exit' | 'morph';

/** One thing that moves once · an entrance, a run of tokens, a gate changing state. */
export interface Cue {
  id: string;
  role: CueRole;
  /** The `name` an `after` may point at · cues of one name end together. */
  owner?: string;
  /** The click it belongs to, as written (0 when the slide is entered). */
  stage: number;
  duration: number;
  /** Reading order among the marks of a stage · smaller comes first. */
  order: number;
  /** Names it waits for, as the author wrote them (`after`). */
  after?: string[];
  /** Cues it waits for, by id · `start` to go with it, `end` to follow it. */
  waits?: { id: string; edge: 'start' | 'end' }[];
  /** Not when its name appears · a lane's later runs, a gate's later drops, the
   *  line under tokens that wait on their own. */
  secondary?: boolean;
}

export interface Timing {
  start: number;
  duration: number;
  stage: number;
}

export interface MotionIssue {
  code: 'DG_MOTION_BUDGET';
  severity: 'warning';
  /** The click it is about · 0 for the entrance. */
  stage: number;
  items: string[];
  message: string;
  fix: { action: string; [detail: string]: unknown };
}

export interface Schedule {
  timing: Map<string, Timing>;
  /** When each stage stops moving, after any speeding up. */
  ends: number[];
  issues: MotionIssue[];
}

/** The stage of every cue · a cue that waits for a name appears no earlier than
 *  that name does. A loop of `after` is the model's to report; here it settles. */
function resolveStages(cues: Cue[]): Map<string, number> {
  const stage = new Map(cues.map((cue) => [cue.id, cue.stage]));
  const appears = (owner: string) => {
    const own = cues.filter((c) => c.owner === owner);
    const primary = own.filter((c) => !c.secondary);
    const pool = primary.length ? primary : own;
    return pool.length ? Math.min(...pool.map((c) => stage.get(c.id)!)) : 0;
  };
  for (let pass = 0; pass < cues.length; pass += 1) {
    let changed = false;
    for (const cue of cues) {
      const wanted = Math.max(
        stage.get(cue.id)!,
        ...(cue.after ?? []).map(appears),
        ...(cue.waits ?? []).map((w) => stage.get(w.id) ?? 0),
      );
      if (wanted !== stage.get(cue.id)) {
        stage.set(cue.id, wanted);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return stage;
}

const waitsOn = (cue: Cue) => (cue.after?.length ?? 0) + (cue.waits?.length ?? 0) > 0;

/** The cues that follow the eye · placed before anything waits on them. */
function placeByReading(cues: Cue[], timing: Map<string, Timing>, stage: number): void {
  const free = cues.filter((cue) => !waitsOn(cue));
  const place = (cue: Cue, start: number) =>
    timing.set(cue.id, { start, duration: cue.duration, stage });
  for (const [i, cue] of free.filter((c) => c.role === 'frame').entries())
    place(cue, FRAME_FIRST + i * FRAME_STEP);
  const marks = free.filter((cue) => cue.role === 'mark').sort((a, b) => a.order - b.order);
  const step = Math.min(STAGGER, ENTRANCE_BUDGET / Math.max(1, marks.length));
  for (const [i, cue] of marks.entries()) place(cue, FIRST + i * step);
  const linkStart = FIRST + marks.length * step + LINK_PAUSE;
  for (const [i, cue] of free.filter((c) => c.role === 'link').entries())
    place(cue, linkStart + i * STAGGER);
  // A change of picture starts at once · what leaves, or, when nothing does, what moves.
  for (const cue of free.filter(
    (c) =>
      c.role === 'note' ||
      c.role === 'run' ||
      c.role === 'switch' ||
      c.role === 'exit' ||
      c.role === 'morph',
  ))
    timing.set(cue.id, {
      start: cue.role === 'note' ? linkStart : FIRST,
      duration: cue.duration,
      stage,
    });
}

/** The cues that wait · each starts once what it waits for, in its own stage, is
 *  placed. One pass per link of the longest chain; a loop is placed at the start. */
function placeWaiting(cues: Cue[], all: Cue[], timing: Map<string, Timing>, stage: number): void {
  const pending = cues.filter((cue) => !timing.has(cue.id));
  const sameStage = (id: string) => timing.get(id)?.stage === stage;
  const endOf = (id: string) => {
    const t = timing.get(id)!;
    return t.start + t.duration;
  };
  for (let pass = 0; pass <= pending.length && pending.some((c) => !timing.has(c.id)); pass += 1) {
    for (const cue of pending) {
      if (timing.has(cue.id)) continue;
      const named = (cue.after ?? []).flatMap((owner) =>
        all.filter((c) => c.owner === owner && c.id !== cue.id && stageOf(c, timing, stage)),
      );
      const ids = [...named.map((c) => ({ id: c.id, edge: 'end' as const })), ...(cue.waits ?? [])];
      const inStage = ids.filter((w) =>
        all.some((c) => c.id === w.id && stageOf(c, timing, stage)),
      );
      if (inStage.some((w) => !timing.has(w.id))) continue;
      const starts = inStage
        .filter((w) => sameStage(w.id))
        .map((w) => (w.edge === 'start' ? timing.get(w.id)!.start : endOf(w.id) + AFTER_GAP));
      timing.set(cue.id, {
        start: starts.length ? Math.max(...starts) : FIRST,
        duration: cue.duration,
        stage,
      });
    }
  }
  for (const cue of pending)
    if (!timing.has(cue.id)) timing.set(cue.id, { start: FIRST, duration: cue.duration, stage });
}

/** Whether a cue moves in `stage` · read off its timing once placed, else off the
 *  stage it was resolved to (kept on the cue by `schedule`). */
function stageOf(cue: Cue, timing: Map<string, Timing>, stage: number): boolean {
  return (timing.get(cue.id)?.stage ?? cue.stage) === stage;
}

/** When everything moves, stage by stage, inside the budget. */
export function schedule(input: Cue[], budget = MOTION_BUDGET): Schedule {
  const stages = resolveStages(input);
  const cues = input.map((cue) => ({ ...cue, stage: stages.get(cue.id)! }));
  const timing = new Map<string, Timing>();
  const last = Math.max(0, ...cues.map((c) => c.stage));
  const ends: number[] = [];
  const issues: MotionIssue[] = [];
  for (let stage = 0; stage <= last; stage += 1) {
    const here = cues.filter((c) => c.stage === stage);
    placeByReading(here, timing, stage);
    placeWaiting(here, cues, timing, stage);
    const end = Math.max(
      0,
      ...here.map((c) => timing.get(c.id)!.start + timing.get(c.id)!.duration),
    );
    if (end > budget) {
      const factor = budget / end;
      for (const cue of here) {
        const t = timing.get(cue.id)!;
        timing.set(cue.id, { start: t.start * factor, duration: t.duration * factor, stage });
      }
      issues.push({
        code: 'DG_MOTION_BUDGET',
        severity: 'warning',
        stage,
        items: [stage === 0 ? 'the entrance' : `step ${stage}`],
        message: `${stage === 0 ? 'the entrance' : `step ${stage}`} moves for ${end.toFixed(1)}s, over ${budget}s · played ${Math.round((1 - factor) * 100)}% faster to fit, which the room may not follow`,
        fix: {
          action: 'split-motion',
          use: 'step="N" on what can wait for a click',
          seconds: Number(end.toFixed(2)),
          budget,
        },
      });
      ends.push(budget);
    } else ends.push(end);
  }
  return { timing, ends, issues };
}
