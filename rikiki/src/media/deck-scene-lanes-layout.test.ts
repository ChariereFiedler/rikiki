import { describe, expect, it } from 'vitest';
import {
  CLOSE_DURATION,
  DEFAULT_BLOCKED,
  DEFAULT_PASSED,
  GATE_OVERHANG,
  GATE_WIDTH,
  HEADER_GAP,
  HEADER_HEIGHT,
  LANE_PITCH,
  LANE_PITCH_WITH_NOTE,
  MAX_TOKENS,
  TOKEN_RADIUS,
  blockedPlaces,
  gateCloses,
  laneTokens,
  lanesFrame,
  passedPlaces,
  readCount,
  triggerSpan,
} from './deck-scene-lanes-layout.js';
import { SCENE_WIDTH } from './scene-layout.js';

const frameOf = (over: Partial<Parameters<typeof lanesFrame>[0]> = {}) =>
  lanesFrame({ lanes: 3, hasHeader: true, hasNotes: false, labelWidth: 200, tagWidth: 0, ...over });

describe('readCount', () => {
  it('takes the default when nothing is written', () => {
    expect(readCount(null, 3)).toEqual({ value: 3, valid: true });
    expect(readCount('', 3)).toEqual({ value: 3, valid: true });
    expect(readCount('  ', 3)).toEqual({ value: 3, valid: true });
  });

  it('reads a whole number of tokens, none included', () => {
    expect(readCount('0', 3)).toEqual({ value: 0, valid: true });
    expect(readCount('8', 3)).toEqual({ value: 8, valid: true });
  });

  it.each([
    '-1',
    '9',
    '2.5',
    'three',
    '1e3',
  ])('refuses %j and falls back to the default', (text) => {
    expect(readCount(text, 3)).toEqual({ value: 3, valid: false });
  });
});

describe('triggerSpan', () => {
  it('leaves a gap each side of the connector, from the track to the gate label', () => {
    const frame = frameOf();
    const label = 120;
    const { room, tip } = triggerSpan(frame, label);
    expect(tip).toBe(frame.gate.centre - label / 2 - HEADER_GAP);
    // A trigger that fills its room ends two gaps before the gate's label.
    expect(frame.trackLeft + room + 2 * HEADER_GAP).toBe(frame.gate.centre - label / 2);
  });

  it('stops at the gate itself when there is no label', () => {
    const frame = frameOf();
    expect(triggerSpan(frame, 0).tip).toBe(frame.gate.centre - GATE_OVERHANG - HEADER_GAP);
  });

  it('has no floor · a gate close to the track start leaves no room, so the trigger is reported, not set under the label', () => {
    // Seed 2, case 38: lanes 1000 wide, wide labels and a tag the width of its
    // cap · the gate's centre stands about 58 units after the track's start, and
    // a label 120 wide reaches back past it. A floor gave the trigger 120 there.
    const frame = frameOf({ width: 1000, labelWidth: 2000, tagWidth: 2000 });
    expect(frame.gate.centre - frame.trackLeft).toBeCloseTo(57.6);
    expect(triggerSpan(frame, 120).room).toBeLessThan(0);
  });
});

describe('lanesFrame', () => {
  it('puts every lane one pitch below the last, centred in its band', () => {
    const frame = frameOf({ lanes: 4 });
    expect(frame.laneYs).toEqual(
      [0, 1, 2, 3].map((i) => HEADER_HEIGHT + LANE_PITCH / 2 + i * LANE_PITCH),
    );
  });

  it('takes a taller pitch when a lane has a note, and no header when there is nothing to put in it', () => {
    expect(frameOf({ hasNotes: true }).laneYs[1]! - frameOf({ hasNotes: true }).laneYs[0]!).toBe(
      LANE_PITCH_WITH_NOTE,
    );
    // No header · the first lane starts as low as the gate's overhang needs.
    expect(frameOf({ hasHeader: false }).laneYs[0]).toBe(GATE_OVERHANG + LANE_PITCH / 2);
    expect(frameOf({ hasHeader: false }).headerY).toBeDefined();
  });

  it.each([[true], [false]])('keeps the gate inside the drawing (header: %s)', (hasHeader) => {
    const { gate, height } = frameOf({ hasHeader });
    expect(gate.y).toBeGreaterThanOrEqual(0);
    expect(gate.y + gate.height).toBeLessThanOrEqual(height);
  });

  it('is tall enough for its lanes, and no taller than they need', () => {
    const frame = frameOf({ lanes: 2, hasHeader: false });
    expect(frame.height).toBeGreaterThan(2 * LANE_PITCH);
    expect(frame.height).toBeLessThan(2 * LANE_PITCH + 60);
  });

  it('starts the track after the widest label, within bounds', () => {
    expect(frameOf({ labelWidth: 0 }).trackLeft).toBe(220);
    expect(frameOf({ labelWidth: 300 }).trackLeft).toBe(340);
    expect(frameOf({ labelWidth: 2000 }).trackLeft).toBe(520);
  });

  it('keeps room on the right for a tag, and none when there is none', () => {
    expect(frameOf({ tagWidth: 0 }).trackRight).toBe(SCENE_WIDTH);
    expect(frameOf({ tagWidth: 0 }).tagX).toBeNull();
    const tagged = frameOf({ tagWidth: 200 });
    expect(tagged.trackRight).toBe(SCENE_WIDTH - 224);
    expect(tagged.tagX).toBe(tagged.trackRight + 24);
    expect(frameOf({ tagWidth: 5000 }).tagWidth).toBe(360);
  });

  it('stands the gate past the middle of the track, across every lane and a little beyond', () => {
    const frame = frameOf({ lanes: 3 });
    const middle = (frame.trackLeft + frame.trackRight) / 2;
    expect(frame.gate.centre).toBeGreaterThan(middle);
    expect(frame.gate.width).toBe(GATE_WIDTH);
    expect(frame.gate.y).toBeLessThan(frame.laneYs[0]! - LANE_PITCH / 2 + 1);
    expect(frame.gate.y + frame.gate.height).toBeGreaterThan(frame.laneYs[2]! + LANE_PITCH / 2 - 1);
  });
});

describe('where the tokens rest', () => {
  it('lines the blocked ones up against the gate, the first to arrive touching it', () => {
    const frame = frameOf();
    const places = blockedPlaces(4, frame);
    expect(places[0]! + TOKEN_RADIUS).toBeLessThan(frame.gate.x);
    expect(frame.gate.x - (places[0]! + TOKEN_RADIUS)).toBeLessThanOrEqual(8);
    for (let i = 1; i < places.length; i++) expect(places[i]!).toBeLessThan(places[i - 1]!);
  });

  it('spreads the passed ones past the gate, inside the track, in order', () => {
    const frame = frameOf({ tagWidth: 200 });
    const places = passedPlaces(MAX_TOKENS, frame);
    expect(places[0]! - TOKEN_RADIUS).toBeGreaterThan(frame.gate.x + frame.gate.width);
    expect(places.at(-1)! + TOKEN_RADIUS).toBeLessThanOrEqual(frame.trackRight);
    for (let i = 1; i < places.length; i++) {
      expect(places[i]! - places[i - 1]!).toBeGreaterThanOrEqual(2 * TOKEN_RADIUS);
    }
  });

  it('never lets two tokens of one side overlap, at any count, with or without a tag', () => {
    for (const tagWidth of [0, 360]) {
      const frame = frameOf({ tagWidth, labelWidth: 520 });
      for (let n = 0; n <= MAX_TOKENS; n++) {
        for (const places of [passedPlaces(n, frame), blockedPlaces(n, frame)]) {
          for (let i = 1; i < places.length; i++) {
            expect(Math.abs(places[i]! - places[i - 1]!), `${n} tokens`).toBeGreaterThanOrEqual(
              2 * TOKEN_RADIUS,
            );
          }
        }
      }
    }
  });

  it('keeps every blocked token on the track side of the gate', () => {
    const frame = frameOf({ labelWidth: 520 });
    const places = blockedPlaces(MAX_TOKENS, frame);
    expect(Math.min(...places) - TOKEN_RADIUS).toBeGreaterThanOrEqual(frame.trackLeft);
  });
});

describe('laneTokens', () => {
  const frame = frameOf();

  it('sends the tokens that pass first, then the ones that stop', () => {
    const tokens = laneTokens(3, 2, frame, 0);
    expect(tokens.map((t) => t.kind)).toEqual(['passed', 'passed', 'passed', 'blocked', 'blocked']);
    for (let i = 1; i < tokens.length; i++)
      expect(tokens[i]!.delay).toBeGreaterThan(tokens[i - 1]!.delay);
  });

  it('starts every token at the start of the track, whatever its resting place', () => {
    for (const token of laneTokens(3, 3, frame, 0))
      expect(token.x + token.back).toBeCloseTo(frame.trackLeft);
  });

  it('draws nothing for an empty lane', () => {
    expect(laneTokens(0, 0, frame, 0)).toEqual([]);
  });

  it('staggers the lanes a little, so they do not move as one block', () => {
    const [first] = laneTokens(2, 1, frame, 0);
    const [second] = laneTokens(2, 1, frame, 1);
    expect(second!.delay).toBeGreaterThan(first!.delay);
    expect(second!.delay - first!.delay).toBeLessThan(0.2);
  });

  it('ends within three seconds at every count, so the slide is never waiting on it', () => {
    for (let passed = 0; passed <= MAX_TOKENS; passed++) {
      for (let blocked = 0; blocked <= MAX_TOKENS; blocked++) {
        const end = Math.max(
          0,
          ...[0, 4].flatMap((lane) =>
            laneTokens(passed, blocked, frame, lane, 5).map((t) => t.delay + t.duration),
          ),
        );
        expect(end, `${passed} + ${blocked}`).toBeLessThan(3);
      }
    }
  });
});

describe('gateCloses', () => {
  it('comes down after the last token that passes and before the first that stops', () => {
    for (const labelWidth of [0, 300, 520]) {
      for (const tagWidth of [0, 360]) {
        const frame = frameOf({ labelWidth, tagWidth });
        for (let passed = 1; passed <= MAX_TOKENS; passed++) {
          for (let blocked = 1; blocked <= MAX_TOKENS; blocked++) {
            const lanes = [0, 1, 2, 3, 4].map((lane) =>
              laneTokens(passed, blocked, frame, lane, 5),
            );
            const at = gateCloses(lanes);
            const flat = lanes.flat();
            const crossed = Math.max(
              ...flat.filter((t) => t.kind === 'passed').map((t) => t.crosses),
            );
            const arrived = Math.min(
              ...flat.filter((t) => t.kind === 'blocked').map((t) => t.crosses),
            );
            const where = `${passed} passed, ${blocked} blocked, label ${labelWidth}, tag ${tagWidth}`;
            expect(at, where).toBeGreaterThan(crossed);
            expect(at + CLOSE_DURATION, where).toBeLessThan(arrived + 0.5);
            expect(at, where).toBeLessThan(arrived);
          }
        }
      }
    }
  });

  it('is irrelevant, and finite, when nothing is blocked', () => {
    const lanes = [laneTokens(DEFAULT_PASSED, 0, frameOf(), 0)];
    expect(Number.isFinite(gateCloses(lanes))).toBe(true);
  });

  it('defaults to a story with both sides', () => {
    expect(DEFAULT_PASSED).toBeGreaterThan(0);
    expect(DEFAULT_BLOCKED).toBeGreaterThan(0);
  });
});
