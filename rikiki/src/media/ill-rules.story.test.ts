import { describe, expect, it } from 'vitest';
import {
  type Box,
  type IllCode,
  ILL_LIMITS,
  type InkBeat,
  type InkModel,
  type InkShape,
  type InkStory,
  type InkText,
  lintIllustration,
} from './ill-rules.js';

// ════════════════════════════════════════════════════════════════
// The rules of a story (`<deck-diagram play="enter">`) · the system runs before it
// breaks, one beat at a time, a proof in the target last, and the picture at rest
// keeps the story. Each rule with a story that passes and the counter-example it
// catches, on ink models written by hand.
// ════════════════════════════════════════════════════════════════

const FRAME: Box = { left: 0, top: 0, right: 1000, bottom: 600 };
const box = (left: number, top: number, w: number, h: number): Box => ({
  left,
  top,
  right: left + w,
  bottom: top + h,
});
const shape = (b: Box, mark: string, over: Partial<InkShape> = {}): InkShape => ({
  kind: 'rect',
  box: b,
  fill: [240, 236, 232],
  accent: false,
  stroke: 0,
  mark,
  ...over,
});
const text = (b: Box, words: string, mark: string): InkText => ({
  text: words,
  box: b,
  size: 31,
  weight: 650,
  mark,
});

const beat = (phase: string, mark: string, atMs: number, over: Partial<InkBeat> = {}): InkBeat => ({
  phase,
  mark,
  kind: 'change',
  atMs,
  lasting: true,
  declared: true,
  ...over,
});

/** The kill switch, as told: 2.3 s of flow, the switch, the gate, the proof. */
const KILL_SWITCH: InkBeat[] = [
  beat('steady', 'api', 900, { kind: 'flow', lasting: false, declared: false }),
  beat('event', 'ecrit', 3160, { kind: 'ride', lasting: false }),
  beat('event', 'drapeau', 3710),
  beat('spread', 'lu', 4260, { kind: 'ride', lasting: false }),
  beat('spread', 'stop', 4810),
  beat('effect', 'coupe', 6340, { kind: 'enter' }),
  beat('proof', 'acme', 6890, { kind: 'proof' }),
];

function told(over: Partial<InkStory> = {}, model: Partial<InkModel> = {}): InkModel {
  return {
    frame: FRAME,
    allocated: FRAME,
    shapes: [
      shape(box(100, 150, 200, 300), 'drapeau'),
      shape(box(400, 150, 200, 300), 'stop', {
        accent: true,
        fill: [240, 112, 32],
        role: 'barrier',
      }),
      shape(box(700, 150, 200, 300), 'acme'),
    ],
    texts: [
      text(box(120, 170, 160, 30), 'DB 2 · STOP', 'drapeau'),
      text(box(420, 470, 160, 30), '14:02:03', 'coupe'),
      text(box(720, 170, 160, 30), '0 devis créé', 'acme'),
    ],
    motion: { endMs: 7200, endless: false },
    story: { playedMs: 7200, budgetMs: 10_000, steadyMs: 2270, beats: KILL_SWITCH, ...over },
    ...model,
  };
}

const codes = (model: InkModel): IllCode[] => lintIllustration(model).issues.map((i) => i.code);
const issue = (model: InkModel, code: IllCode) =>
  lintIllustration(model).issues.find((i) => i.code === code);

describe('a story · the motion it may take', () => {
  it('plays for seven seconds and ships · the 3 s of an entrance is not its limit', () => {
    const verdict = lintIllustration(told());
    expect(verdict.issues).toEqual([]);
    expect(verdict.verdict).toBe('ship');
  });

  it('is long past its own budget, and an error past 12 s', () => {
    const past = issue(told({ budgetMs: 6000 }), 'ILL_MOTION_LONG');
    expect(past?.severity).toBe('warning');
    expect(past?.measurement).toMatchObject({ warnMs: 6000, errorMs: ILL_LIMITS.storyMaxMs });
    const far = issue(told({}, { motion: { endMs: 12_600, endless: false } }), 'ILL_MOTION_LONG');
    expect(far?.severity).toBe('error');
  });

  it('allows a loop of ambience that starts once the story has played', () => {
    const after = told({}, { motion: { endMs: 7200, endless: true, endlessFromMs: 7200 } });
    expect(codes(after)).not.toContain('ILL_MOTION_ENDLESS');
  });

  it('refuses a loop that starts before the story ends · counter-example', () => {
    const during = told({}, { motion: { endMs: 7200, endless: true, endlessFromMs: 1200 } });
    const found = issue(during, 'ILL_MOTION_ENDLESS');
    expect(found?.severity).toBe('error');
    expect(found?.fix).toMatchObject({ action: 'start-after-story', fromMs: 7200 });
  });

  it('still refuses any endless animation in a drawing that tells no story', () => {
    const model = told({}, { motion: { endMs: 900, endless: true, endlessFromMs: 9000 } });
    const { story: _, ...plain } = model;
    expect(codes(plain)).toContain('ILL_MOTION_ENDLESS');
  });
});

describe('ILL_NO_STEADY_STATE · the system runs before it breaks', () => {
  it('passes 2.3 s of established flow before the event', () => {
    expect(codes(told())).not.toContain('ILL_NO_STEADY_STATE');
  });

  it('says an event that comes with no flow before it · counter-example', () => {
    const found = issue(told({ steadyMs: 400 }), 'ILL_NO_STEADY_STATE');
    expect(found?.severity).toBe('warning');
    expect(found?.measurement).toEqual({
      steadyMs: 400,
      minMs: ILL_LIMITS.steadyMinMs,
      event: 'ecrit',
    });
    expect(found?.fix).toMatchObject({ action: 'add-steady' });
  });

  it('says nothing of a story without an event · there is nothing to break', () => {
    const calm = told({ steadyMs: 0, beats: KILL_SWITCH.filter((b) => b.phase !== 'event') });
    expect(codes(calm)).not.toContain('ILL_NO_STEADY_STATE');
  });
});

describe('ILL_STORY_NO_PROOF · a break proven in the target, last', () => {
  it('says a break with an effect and no proof · counter-example', () => {
    const found = issue(
      told({ beats: KILL_SWITCH.filter((b) => b.phase !== 'proof') }),
      'ILL_STORY_NO_PROOF',
    );
    expect(found?.severity).toBe('warning');
    expect(found?.measurement).toMatchObject({ events: 2, effects: 1, proofs: 0 });
    expect(found?.message).toMatch(/effect/);
  });

  it('says a proof that comes before the break · counter-example', () => {
    const early = KILL_SWITCH.map((b) => (b.phase === 'proof' ? { ...b, atMs: 1000 } : b));
    const found = issue(told({ beats: early }), 'ILL_STORY_NO_PROOF');
    expect(found?.measurement).toMatchObject({ proofsBeforeEvent: 1 });
  });
});

describe('ILL_FINAL_INCOMPLETE · the picture at rest keeps the story', () => {
  it('passes when each break, effect and proof keeps a mark at rest', () => {
    expect(codes(told())).not.toContain('ILL_FINAL_INCOMPLETE');
  });

  it('fails a break told by tokens alone, gone once they arrive · counter-example', () => {
    const rides = KILL_SWITCH.filter((b) => b.phase !== 'event' || b.kind === 'ride');
    const found = issue(told({ beats: rides }), 'ILL_FINAL_INCOMPLETE');
    expect(found?.severity).toBe('error');
    expect(found?.measurement).toEqual({ phases: ['event'], marks: ['ecrit'] });
    expect(lintIllustration(told({ beats: rides })).verdict).toBe('fail');
  });

  it('fails a proof whose mark has no ink at rest · counter-example', () => {
    const model = told(
      {},
      {
        texts: told().texts.filter((t) => t.mark !== 'acme'),
        shapes: told().shapes.filter((s) => s.mark !== 'acme'),
      },
    );
    expect(issue(model, 'ILL_FINAL_INCOMPLETE')?.measurement).toMatchObject({ phases: ['proof'] });
  });

  it('keeps a camera that pulls back to the whole picture, which is the picture at rest', () => {
    const pulled = KILL_SWITCH.map((b) =>
      b.phase === 'event' ? { ...b, mark: 'recul', kind: 'camera', lasting: true } : b,
    );
    expect(codes(told({ beats: pulled }))).not.toContain('ILL_FINAL_INCOMPLETE');
    const closer = pulled.map((b) => (b.mark === 'recul' ? { ...b, lasting: false } : b));
    expect(codes(told({ beats: closer }))).toContain('ILL_FINAL_INCOMPLETE');
  });
});

describe('ILL_BEAT_OVERLAP · one thing at a time', () => {
  it('passes beats half a second apart or more', () => {
    expect(codes(told())).not.toContain('ILL_BEAT_OVERLAP');
  });

  it('says two beats within half a second · counter-example', () => {
    const crowded = KILL_SWITCH.map((b) => (b.mark === 'drapeau' ? { ...b, atMs: 3300 } : b));
    const found = issue(told({ beats: crowded }), 'ILL_BEAT_OVERLAP');
    expect(found?.severity).toBe('warning');
    expect(found?.measurement).toMatchObject({
      pairs: 1,
      minGapMs: 140,
      limitMs: 500,
      marks: ['ecrit', 'drapeau'],
    });
    expect(found?.fix).toMatchObject({ action: 'one-beat-at-a-time' });
  });

  it('lets two beats meant as one start together (with)', () => {
    const together = KILL_SWITCH.map((b) =>
      b.mark === 'drapeau' ? { ...b, atMs: 3160, with: 'ecrit' } : b,
    );
    expect(codes(told({ beats: together }))).not.toContain('ILL_BEAT_OVERLAP');
  });

  it('does not count the established flow, nor what the drawing adds after a beat', () => {
    const added = [...KILL_SWITCH, beat('effect', 'stop', 4900, { kind: 'dim', declared: false })];
    expect(codes(told({ beats: added }))).not.toContain('ILL_BEAT_OVERLAP');
  });
});

describe('a disc that says a state is not a second focal', () => {
  it('counts a gold disc as a colour of state, not a thing put forward', () => {
    const disc = shape(box(120, 160, 40, 40), 'drapeau', {
      kind: 'circle',
      accent: true,
      fill: [240, 112, 32],
      role: 'state',
    });
    const model = told({}, { shapes: [...told().shapes, disc] });
    expect(codes(model)).not.toContain('ILL_FOCAL_MANY');
  });
});
