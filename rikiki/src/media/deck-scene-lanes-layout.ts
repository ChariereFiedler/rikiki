// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-lanes layout, the pure part of the lanes scene
//
// Where the lanes, the gate and the tokens go, and when each token leaves · kept
// apart from the element so the geometry and the timing are tested without a
// browser. The story is told in time: tokens run down every lane, the gate
// closes, and the ones still on their way stop against it.
// ════════════════════════════════════════════════════════════════

import { SCENE_WIDTH } from './scene-layout.js';

/** More than eight tokens a side is a queue nobody counts, and no longer a story. */
export const MAX_TOKENS = 8;
export const DEFAULT_PASSED = 3;
export const DEFAULT_BLOCKED = 3;

export const TOKEN_RADIUS = 10;
const TOKEN_GAP = 6;
const TOKEN_PITCH = 2 * TOKEN_RADIUS + TOKEN_GAP;

export const GATE_WIDTH = 56;
/** The gate sits this share of the way along the track · past the middle, so the
 *  tokens that made it have room to be seen on the far side. */
const GATE_SHARE = 0.6;
/** The gate stands this far beyond the first and the last lane. */
export const GATE_OVERHANG = 14;

const LABEL_GAP = 40;
const MIN_TRACK_LEFT = 220;
const MAX_TRACK_LEFT = 520;
const TAG_GAP = 24;
const MAX_TAG_WIDTH = 360;
export const HEADER_HEIGHT = 72;
const FOOT = 24;
/** A lane is its label, and a note under it when any lane has one. */
export const LANE_PITCH = 88;
export const LANE_PITCH_WITH_NOTE = 116;

export interface Count {
  value: number;
  /** False when the author wrote something that is not a whole number of
   *  tokens, from 0 to the most a side holds · the value then is the default. */
  valid: boolean;
}

/** A token count as an author writes it · absent is the default, and a word, a
 *  fraction or a number past the maximum is reported by the lint, not drawn. */
export function readCount(attribute: string | null | undefined, fallback: number): Count {
  if (attribute === null || attribute === undefined || attribute.trim() === '') {
    return { value: fallback, valid: true };
  }
  const value = Number(attribute);
  const valid = Number.isInteger(value) && value >= 0 && value <= MAX_TOKENS;
  return { value: valid ? value : fallback, valid };
}

export interface FrameInput {
  lanes: number;
  /** A gate label or a trigger sits above the lanes. */
  hasHeader: boolean;
  hasNotes: boolean;
  /** The widest lane label, icon and note included, as measured. */
  labelWidth: number;
  /** The widest end-of-lane tag, as measured · 0 when no lane has one. */
  tagWidth: number;
  /** The canvas width in drawing units · the scene's, 1600 unless composed. */
  width?: number;
}

export interface Frame {
  height: number;
  /** The vertical centre of each lane. */
  laneYs: number[];
  headerY: number;
  trackLeft: number;
  trackRight: number;
  /** Where an end-of-lane tag starts · null when there is none. */
  tagX: number | null;
  tagWidth: number;
  gate: { x: number; y: number; width: number; height: number; centre: number };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function lanesFrame(input: FrameInput): Frame {
  const pitch = input.hasNotes ? LANE_PITCH_WITH_NOTE : LANE_PITCH;
  const trackLeft = clamp(input.labelWidth + LABEL_GAP, MIN_TRACK_LEFT, MAX_TRACK_LEFT);
  const tagWidth = Math.min(input.tagWidth, MAX_TAG_WIDTH);
  const trackRight = (input.width ?? SCENE_WIDTH) - (tagWidth > 0 ? tagWidth + TAG_GAP : 0);
  const centre = trackLeft + (trackRight - trackLeft) * GATE_SHARE;
  // The gate stands GATE_OVERHANG above the first lane · without a header that is
  // above the drawing, so the lanes start low enough for the gate to be inside it.
  const top = input.hasHeader ? HEADER_HEIGHT : GATE_OVERHANG;
  const lanesHeight = input.lanes * pitch;
  return {
    height: top + lanesHeight + FOOT,
    laneYs: Array.from({ length: input.lanes }, (_, i) => top + pitch / 2 + i * pitch),
    headerY: HEADER_HEIGHT / 2,
    trackLeft,
    trackRight,
    tagX: tagWidth > 0 ? trackRight + TAG_GAP : null,
    tagWidth,
    gate: {
      x: centre - GATE_WIDTH / 2,
      y: top - GATE_OVERHANG,
      width: GATE_WIDTH,
      height: lanesHeight + 2 * GATE_OVERHANG,
      centre,
    },
  };
}

/** Between the trigger, the connector and the gate's label. */
export const HEADER_GAP = 28;

export interface TriggerSpan {
  /** The width the trigger may take, from the start of the track · zero or less
   *  when the gate's label reaches back that far. */
  room: number;
  /** Where the connector's arrow ends, a gap before the gate's label. */
  tip: number;
}

/** The trigger's place in the header · from the start of the track to the gate's
 *  label, less a gap each side of the connector that leads to it. No floor: a
 *  room the header does not have would set the trigger under the gate's label,
 *  so a gate standing close to the track's start leaves none, and a trigger
 *  then does not fit and is reported. `gateLabelWidth` is 0 without a label. */
export function triggerSpan(frame: Frame, gateLabelWidth: number): TriggerSpan {
  const labelHalf = gateLabelWidth > 0 ? gateLabelWidth / 2 : GATE_OVERHANG;
  const tip = frame.gate.centre - labelHalf - HEADER_GAP;
  return { room: tip - HEADER_GAP - frame.trackLeft, tip };
}

export type TokenKind = 'passed' | 'blocked';

export interface Token {
  kind: TokenKind;
  /** Where it rests, and so where it is drawn · the final state is the picture. */
  x: number;
  /** How far left of its resting place it starts, as a translate. */
  back: number;
  delay: number;
  duration: number;
  /** When it crosses the gate's centre, or reaches its queue · for the gate to wait for. */
  crosses: number;
}

/** Units a token covers in a second. */
export const SPEED = 560;
const FIRST_DEPARTURE = 0.15;
const LANE_STAGGER = 0.07;
const MAX_DEPARTURE_SPAN = 1.4;
const MAX_STEP = 0.2;
const MIN_DURATION = 0.5;
const MAX_DURATION = 1.0;

/** Resting places on the far side of the gate, nearest the gate first · packed
 *  as tight as the tokens allow when they would not all fit. */
export function passedPlaces(count: number, frame: Frame): number[] {
  const from = frame.gate.x + frame.gate.width + TOKEN_GAP + TOKEN_RADIUS;
  const room = frame.trackRight - TOKEN_RADIUS - from;
  const pitch = count > 1 ? Math.min(TOKEN_PITCH * 1.6, room / (count - 1)) : 0;
  return Array.from({ length: count }, (_, i) => from + i * pitch);
}

/** Resting places on the near side, a queue against the gate · the first token
 *  to arrive is the one touching it. */
export function blockedPlaces(count: number, frame: Frame): number[] {
  const from = frame.gate.x - TOKEN_GAP - TOKEN_RADIUS;
  return Array.from({ length: count }, (_, i) => from - i * TOKEN_PITCH);
}

/** One lane's tokens as if it were the first lane, in the order they leave · what
 *  passes first, then what is stopped. Departures are spread so the whole run
 *  ends in about two seconds, however many tokens there are. */
function referenceTokens(passed: number, blocked: number, frame: Frame): Token[] {
  const total = passed + blocked;
  if (total === 0) return [];
  const step = Math.min(MAX_STEP, MAX_DEPARTURE_SPAN / total);
  const places: [TokenKind, number][] = [
    ...passedPlaces(passed, frame).map((x): [TokenKind, number] => ['passed', x]),
    ...blockedPlaces(blocked, frame).map((x): [TokenKind, number] => ['blocked', x]),
  ];
  return places.map(([kind, x], order) => {
    const distance = x - frame.trackLeft;
    const duration = clamp(distance / SPEED, MIN_DURATION, MAX_DURATION);
    const delay = FIRST_DEPARTURE + order * step;
    // A token that passes is at the gate's centre a share of its trip in · one
    // that stops is there only when it arrives.
    const share =
      kind === 'passed' ? Math.min(1, (frame.gate.centre - frame.trackLeft) / distance) : 1;
    return {
      kind,
      x,
      back: frame.trackLeft - x,
      delay,
      duration,
      crosses: delay + duration * share,
    };
  });
}

/** How much later the tokens that stop must leave · the gate is one bar across
 *  every lane, so the first of them may only arrive once the last token that
 *  passes has crossed it on the lane that started last. */
function blockedLag(reference: Token[], lanes: number): number {
  const passed = reference.filter((t) => t.kind === 'passed');
  const stopped = reference.filter((t) => t.kind === 'blocked');
  if (!passed.length || !stopped.length) return 0;
  const lastCrossing = Math.max(...passed.map((t) => t.crosses)) + (lanes - 1) * LANE_STAGGER;
  const firstArrival = Math.min(...stopped.map((t) => t.crosses));
  return Math.max(0, lastCrossing + 2 * CLOSE_MARGIN - firstArrival);
}

/** The tokens of lane `lane`, out of `lanes` · the same story in every lane, each
 *  one a beat after the one above it so they do not move as a block. */
export function laneTokens(
  passed: number,
  blocked: number,
  frame: Frame,
  lane: number,
  lanes = lane + 1,
): Token[] {
  const reference = referenceTokens(passed, blocked, frame);
  const lag = blockedLag(reference, lanes);
  return reference.map((token) => {
    const shift = lane * LANE_STAGGER + (token.kind === 'blocked' ? lag : 0);
    return { ...token, delay: token.delay + shift, crosses: token.crosses + shift };
  });
}

/** When the gate comes down · after the last token that passes has crossed it,
 *  and before the first one that stops has reached it. */
export function gateCloses(lanes: Token[][]): number {
  const all = lanes.flat();
  const crossed = Math.max(0, ...all.filter((t) => t.kind === 'passed').map((t) => t.crosses));
  const arrivals = all.filter((t) => t.kind === 'blocked').map((t) => t.crosses);
  const earliest = arrivals.length ? Math.min(...arrivals) : Number.POSITIVE_INFINITY;
  return Math.min(crossed + CLOSE_MARGIN, earliest - CLOSE_MARGIN);
}

const CLOSE_MARGIN = 0.08;
/** The gate drops in this long. */
export const CLOSE_DURATION = 0.3;
