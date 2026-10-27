// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the story · one scene played on entry
//
// `<deck-diagram play="enter">` tells what happens BETWEEN two states, the way a
// talk does it: the system runs (an established flow), an event lands, it spreads,
// its effect shows, and the proof comes last, in the target. No click: the slide
// is entered and the scene plays, six to ten seconds written, played at the pace
// the room follows (a longer story is played faster, up to twice).
//
// A mark says WHEN with `beat` (steady, event, spread, effect, proof) and, inside
// its beat, `after` and `with`; WHAT it does is its own attributes · a gate's
// `state`, a box's `tone`, `swap`, `proof`, `dim`, a link's `flow`, `lever`. A mark
// with a beat and nothing that changes comes in on its beat. Two marks of one beat
// play one after the other, never together (`with` says when they are meant to).
// Tokens of an established flow (`steady="3s"`) pass for that long before the
// first event, and stop where the event cuts them.
//
// The resting picture is the end of the story · the overview, print, PDF, a render
// and reduced motion show it, and it must tell the story on its own.
//
// Pure: a laid-out drawing and its cues in, the time of everything out.
// ════════════════════════════════════════════════════════════════

import { type Choreography, RIDE_SPACING, cueIds, rideSeconds } from './choreography.js';
import type { DiagramLayout, LGate, LLane, LLink } from './layout.js';
import { ARROW_ROOM, SPEEDS, TOKEN_RADIUS } from './lanes.js';
import { CAMERA_SECONDS } from './camera.js';
import { type LPiece, actSeconds, isPiece } from './marks.js';
import type { DgIssue, DgNode } from './model.js';
import { type Cue, type Timing, schedule } from './motion.js';
import { BEATS, type Beat, STORY_BUDGET, STORY_MAX_BUDGET, storySeconds } from './story-words.js';

export {
  BEATS,
  type Beat,
  PLAYS,
  STORY_ATTRIBUTES,
  STORY_BUDGET,
  STORY_MAX_BUDGET,
  readSeconds,
} from './story-words.js';

/** The pace of the room, in seconds · a story written longer is played faster to
 *  last this long, up to `STORY_MAX_RATE` times (the normalisation of the pace:
 *  clamp(written / 6.5 s, 1, 2)). */
export const STORY_PACE = 6.5;
export const STORY_MAX_RATE = 2;
/** An established flow lasts this long when a steady beat says no length. */
export const DEFAULT_STEADY = 3;
/** A token of an established flow leaves this often · the talk sends one every 0.7 s. */
export const STEADY_INTERVAL = 0.75;
/** Two beats of a story start this far apart at least, written · played up to
 *  1.5 times faster, they stay over the half second the eye needs for each. */
export const BEAT_GAP = 0.8;
/** Between two phases, and after the entrance. */
const PHASE_GAP = 0.3;
/** The drawing comes in within this, written · the talk shows its whole structure in
 *  under a second, and the story is what happens next. */
const SETUP_SECONDS = 1;
/** Played, two beats stay this far apart at least · the pace is never raised past it. */
const PLAYED_BEAT_GAP = 0.55;
/** What follows an action that waits for another one. */
const FOLLOW_GAP = 0.1;
/** The marks a group brings in on its beat come in this far apart · one picture
 *  assembling, not a beat each. */
const FOLLOW_STAGGER = 0.08;
/** The dots of a crowd come in one after the other over this, written, whatever their
 *  count · one wave the room sees, as the talk's crowds of 200 and 400 do. */
const CROWD_WAVE_SECONDS = 0.6;
/** A queue against a gate has mostly formed this far into its run. */
const SETTLED_SHARE = 0.6;
/** Marks of a steady beat (the points of a normal day) are this far apart at least. */
const STEADY_STEP = 0.45;
/** Lanes of one flow leave a little apart, so they read as traffic, not as a drill. */
const LANE_OFFSET = 0.23;
/** A swap, a proof, a dim and a lever take this long. */
export const SWAP_SECONDS = 0.5;
export const PROOF_SECONDS = 0.45;
export const DIM_SECONDS = 0.6;
export const LEVER_SECONDS = 0.6;
/** What is cut pales to this. */
export const DIM_OPACITY = 0.32;
/** A token of an established flow crosses its track in this long at least, and at most. */
const MIN_STEADY_TRIP = 0.9;
const MAX_STEADY_TRIP = 2.4;
/** The tokens a story carries · per lane, and in all · past them the eye stops counting. */
export const MAX_STORY_TOKENS_LANE = 12;
export const MAX_STORY_TOKENS = 40;

/** What a story action does · `lasting` when it leaves a trace in the resting picture.
 *  `act` is what a mark that tells a story does in its own words (marks.ts): a
 *  terminal types, a table carries its rows, a timer runs, a band is cut. */
export type ActionKind =
  | 'enter'
  | 'change'
  | 'swap'
  | 'proof'
  | 'dim'
  | 'ride'
  | 'lever'
  | 'flow'
  | 'act'
  | 'camera';

/** One beat of the script, as played · what `check` reads (`data-story`). */
export interface StoryBeat {
  phase: Beat;
  mark: string;
  kind: ActionKind;
  atMs: number;
  /** Whether the resting picture keeps a trace of it. */
  lasting: boolean;
  /** Declared by the author with `beat` · the beats the diagram adds (a queue that
   *  forms against a gate, what a cut leaves pale) follow them and are not counted. */
  declared: boolean;
  /** The mark it is played with (`with`), when it says so. */
  with?: string;
}

/** The script of a story, as `check` reads it · played times, in ms. */
export interface StoryScript {
  writtenMs: number;
  playedMs: number;
  rate: number;
  budgetMs: number;
  /** How long the established flow runs before the first event, played. */
  steadyMs: number;
  beats: StoryBeat[];
}

export interface StoryPlan {
  /** When everything moves, played · the ids of the choreography and the story's own. */
  timing: Map<string, Timing>;
  /** The departures of the tokens of an established flow, by id, played. */
  departures: Map<string, number[]>;
  /** How long one of those tokens travels, by id, played. */
  trips: Map<string, number>;
  /** Where a lever points before its beat, in degrees from where it rests, by link id. */
  levers: Map<string, number>;
  script: StoryScript;
  issues: DgIssue[];
}

export const storyIds = {
  swap: (i: number) => `i${i}:swap`,
  proof: (i: number) => `i${i}:proof`,
  dim: (i: number) => `i${i}:dim`,
  downstream: (i: number) => `i${i}:downstream`,
  steady: (i: number) => `i${i}:steady`,
  act: (i: number) => `i${i}:act`,
  noteSwap: (k: number) => `n${k}:swap`,
  linkDim: (j: number) => `l${j}:dim`,
  linkSteady: (j: number) => `l${j}:steady`,
  lever: (j: number) => `l${j}:lever`,
  camera: (c: number) => `c${c}:camera`,
  /** The camera's way back to the whole picture, when the last one ends on a detail. */
  cameraBack: 'camera:back',
};

/** What a camera that names no `to` moves to · the whole picture. */
const CAMERA_TO_ALL = 'all';

const words = (value: string | undefined) => (value ?? '').split(/\s+/).filter(Boolean);
const isBeat = (value: string | undefined): value is Beat =>
  (BEATS as readonly string[]).includes(value ?? '');

/** A thing of the drawing that plays a beat · a mark, a link or a note. */
interface Actor {
  name: string;
  node: DgNode;
  phase: Beat;
  /** The cues it times on its beat, and the story ids. */
  ids: string[];
  kind: ActionKind;
  lasting: boolean;
  duration: number;
  declared: boolean;
  /** Source order · what orders two actors of one beat. */
  order: number;
  /** For a mark that takes its beat from its group or panel · the actor that brings the
   *  group in, which it comes in with, and its rank among those that follow it. */
  follows?: string;
  rank?: number;
  /** The group or panel whose beat it takes · how the actors of one group find their lead. */
  leader?: DgNode;
  /** For a crowd · the seconds its items come in over, one after the other. */
  wave?: number;
}

interface Placed {
  start: number;
  end: number;
}

/** The parent group of every node, by identity. */
function parents(tree: DgNode[]): Map<DgNode, DgNode> {
  const map = new Map<DgNode, DgNode>();
  const walk = (nodes: DgNode[], parent?: DgNode) => {
    for (const node of nodes) {
      if (parent) map.set(node, parent);
      walk(node.children, node);
    }
  };
  walk(tree);
  return map;
}

/** The beat of a node, or of the nearest group above it that has one · and that group,
 *  which the node comes in with. */
function beatOf(
  node: DgNode,
  up: Map<DgNode, DgNode>,
): { beat?: Beat; own: boolean; from?: DgNode } {
  if (isBeat(node.attrs.beat)) return { beat: node.attrs.beat, own: true };
  for (let at = up.get(node); at; at = up.get(at))
    if (isBeat(at.attrs.beat)) return { beat: at.attrs.beat, own: false, from: at };
  return { own: false };
}

/** What follows a group, a mark that came in with it · the leader its own `after` or
 *  `with` does not override. */
const leaderOf = (node: DgNode, from: DgNode | undefined) =>
  from && !node.attrs.after && !node.attrs.with ? { leader: from } : {};

/** The nearest group or panel above a node that has a beat · what brings it in. */
function groupBeat(node: DgNode, up: Map<DgNode, DgNode>): { beat: Beat; from: DgNode } | null {
  for (let at = up.get(node); at; at = up.get(at))
    if (isBeat(at.attrs.beat)) return { beat: at.attrs.beat, from: at };
  return null;
}

/** A mark that acts on a beat of its own inside a group that comes in on its beat ·
 *  it comes in with its group, and acts on its own beat after. */
function entranceWithGroup(
  node: DgNode,
  id: string,
  duration: number,
  up: Map<DgNode, DgNode>,
): Actor[] {
  const group = groupBeat(node, up);
  if (!group) return [];
  return [
    {
      name: `${nameOfNode(node)} · entrance`,
      node,
      phase: group.beat,
      ids: [id],
      kind: 'enter',
      lasting: true,
      duration,
      declared: false,
      order: node.index,
      leader: group.from,
    },
  ];
}

/** A mark by the name its drawing carries (`data-mark`) · `check` finds it by it. */
const nameOfNode = (node: DgNode) =>
  node.attrs.name || node.attrs.label || `${node.kind} ${node.index + 1}`;
const linkNameOf = (link: LLink) => link.node?.attrs.name || `${link.from} → ${link.to}`;

/** The duration an author gave, else the one the kind takes. */
function durationFor(node: DgNode, fallback: number): number {
  const said = storySeconds(node.attrs.duration, fallback);
  return Number.isFinite(said) ? said : fallback;
}

/** How long an established flow runs, written · the diagram's own when the `steady`
 *  written is no duration of a story, NaN when the mark says none. */
const steadyOf = (node: DgNode | undefined): number =>
  storySeconds(node?.attrs.steady, DEFAULT_STEADY);

/** What each item does on its beat. */
function itemActors(
  drawn: DiagramLayout,
  cues: Map<string, Cue>,
  up: Map<DgNode, DgNode>,
): Actor[] {
  const actors: Actor[] = [];
  // The items one mark draws · a `dg-dot count="100"` is a hundred items of one node,
  // and one actor: they were a hundred beats one after the other, a story of a minute.
  const crowds = new Map<DgNode, number[]>();
  drawn.items.forEach((item, i) => {
    crowds.set(item.node, [...(crowds.get(item.node) ?? []), i]);
  });
  drawn.items.forEach((item, i) => {
    const node = item.node;
    const crowd = crowds.get(node)!;
    // The others of a crowd play with its first.
    if (crowd[0] !== i) return;
    const { beat, own, from } = beatOf(node, up);
    // A mark that tells a story acts on its beat · it stands from the start as it
    // is before (an empty terminal, a full band), and does what it says then.
    const act = isPiece(item.kind) ? actSeconds(item as LPiece) : 0;
    const entrance = cues.get(cueIds.item(i));
    const comesWithGroup = () =>
      own ? entranceWithGroup(node, cueIds.item(i), entrance?.duration ?? 0.5, up) : [];
    if (beat && act > 0) {
      actors.push(...comesWithGroup());
      actors.push({
        name: nameOfNode(node),
        node,
        phase: beat,
        ids: [storyIds.act(i)],
        kind: 'act',
        lasting: true,
        duration: durationFor(node, act),
        declared: own,
        order: node.index,
      });
      return;
    }
    const switches = [...cues.keys()].filter((id) => id.startsWith(`${cueIds.item(i)}:switch`));
    const changes: string[] = [...switches];
    const box = item.kind === 'box';
    if (box && (node.attrs.swap || node.attrs['swap-icon'])) changes.push(storyIds.swap(i));
    if (box && node.attrs.proof) changes.push(storyIds.proof(i));
    if (says(node, 'dim')) changes.push(...crowd.map((k) => storyIds.dim(k)));
    if (changes.length) {
      const phase = own && beat ? beat : node.attrs.proof && !node.attrs.swap ? 'proof' : 'event';
      const longest = Math.max(
        ...switches.map((id) => cues.get(id)!.duration),
        node.attrs.swap || node.attrs['swap-icon'] ? SWAP_SECONDS : 0,
        node.attrs.proof ? PROOF_SECONDS : 0,
        changes.includes(storyIds.dim(i)) ? DIM_SECONDS : 0,
      );
      actors.push(...comesWithGroup());
      actors.push({
        name: nameOfNode(node),
        node,
        phase,
        ids: changes,
        kind: node.attrs.proof
          ? 'proof'
          : switches.length
            ? 'change'
            : node.attrs.swap
              ? 'swap'
              : 'dim',
        lasting: true,
        duration: durationFor(node, longest),
        declared: own,
        order: node.index,
      });
      return;
    }
    if (!beat) return;
    // A crowd comes in as one wave, as long whatever its count.
    const wave = crowd.length > 1 ? CROWD_WAVE_SECONDS : 0;
    actors.push({
      name: nameOfNode(node),
      node,
      phase: beat,
      ids: crowd.map((k) => cueIds.item(k)),
      kind: 'enter',
      lasting: true,
      duration: durationFor(node, (entrance?.duration ?? 0.5) + wave),
      declared: own,
      order: node.index,
      ...(wave ? { wave } : {}),
      ...leaderOf(node, from),
    });
  });
  return actors;
}

/** What each link and each note does on its beat · a ride, a cut, a lever, an entrance. */
function linkAndNoteActors(
  drawn: DiagramLayout,
  cues: Map<string, Cue>,
  up: Map<DgNode, DgNode>,
): Actor[] {
  const actors: Actor[] = [];
  drawn.links.forEach((link, j) => {
    const node = link.node;
    if (!node) return;
    const { beat, own, from } = beatOf(node, up);
    if (!beat || beat === 'steady') return;
    const ids: string[] = [];
    let kind: ActionKind = 'enter';
    let duration = cues.get(cueIds.link(j))?.duration ?? 0.5;
    const dims = says(node, 'dim');
    const steady = Number.isFinite(steadyOf(node));
    if (dims) {
      ids.push(storyIds.linkDim(j));
      kind = 'dim';
      duration = DIM_SECONDS;
    } else if (link.flow > 0 || steady) {
      if (link.flow > 0) ids.push(cueIds.ride(j));
      if (node.attrs.enter === 'draw') ids.push(cueIds.link(j));
      kind = 'ride';
      // A flow that starts on the beat runs for its `steady` before the story goes
      // on · the traffic is seen following the switch.
      duration =
        link.flow > 0 ? rideSeconds(link) + (link.flow - 1) * RIDE_SPACING : steadyOf(node);
    } else ids.push(cueIds.link(j));
    if (says(node, 'lever')) {
      ids.push(storyIds.lever(j));
      kind = kind === 'ride' ? 'ride' : 'lever';
      duration = Math.max(duration, LEVER_SECONDS);
    }
    if (own && !ids.includes(cueIds.link(j)))
      actors.push(
        ...entranceWithGroup(node, cueIds.link(j), cues.get(cueIds.link(j))?.duration ?? 0.5, up),
      );
    actors.push({
      name: linkNameOf(link),
      node,
      phase: beat,
      ids,
      kind,
      // A ride is gone once it arrives · a line traced, a cut, a lever stay.
      lasting: kind !== 'ride' || node.attrs.enter === 'draw' || ids.includes(storyIds.lever(j)),
      duration: durationFor(node, duration),
      declared: own,
      order: node.index,
      ...(kind === 'enter' ? leaderOf(node, from) : {}),
    });
  });
  drawn.notes.forEach((note, k) => {
    const { beat, own, from } = beatOf(note.node, up);
    if (!beat) return;
    // A status that turns (`state="wait fail"`) stands from the start, and turns on its beat.
    const turns = !!note.status && note.status.before !== note.status.after;
    if (turns && own)
      actors.push(
        ...entranceWithGroup(
          note.node,
          cueIds.note(k),
          cues.get(cueIds.note(k))?.duration ?? 0.5,
          up,
        ),
      );
    actors.push({
      name: nameOfNode(note.node),
      node: note.node,
      phase: beat,
      ids: [turns ? storyIds.noteSwap(k) : cueIds.note(k)],
      kind: turns ? 'swap' : 'enter',
      lasting: true,
      duration: durationFor(
        note.node,
        turns ? SWAP_SECONDS : (cues.get(cueIds.note(k))?.duration ?? 0.5),
      ),
      declared: own,
      order: note.node.index,
      ...(turns ? {} : leaderOf(note.node, from)),
    });
  });
  return actors;
}

/** What each camera does on its beat · it moves the frame, and is gone from the
 *  picture at rest unless it ends on the whole picture, which the picture at rest is. */
export function camerasOf(tree: DgNode[]): DgNode[] {
  const found: DgNode[] = [];
  const walk = (nodes: DgNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'camera') found.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return found;
}

function cameraActors(tree: DgNode[]): Actor[] {
  return camerasOf(tree).map((node, c) => {
    const own = isBeat(node.attrs.beat);
    return {
      name: nameOfNode(node),
      node,
      phase: own ? (node.attrs.beat as Beat) : 'steady',
      ids: [storyIds.camera(c)],
      kind: 'camera' as const,
      lasting: (node.attrs.to ?? CAMERA_TO_ALL) === CAMERA_TO_ALL,
      duration: durationFor(node, CAMERA_SECONDS),
      declared: own,
      order: node.index,
    };
  });
}

/** The marks that take their beat from a group follow the actor that brings the group
 *  in · the frame of a panel, else the first of them. Their rank staggers them. */
function followLeaders(actors: Actor[]): void {
  const leads = new Map<DgNode, string>();
  for (const actor of actors) if (!actor.leader) leads.set(actor.node, actor.name);
  const ranks = new Map<DgNode, number>();
  for (const actor of [...actors].sort((a, b) => a.order - b.order)) {
    if (!actor.leader) continue;
    const lead = leads.get(actor.leader);
    if (!lead) {
      // It leads a group with no surface of its own · it plays the beat the author
      // wrote on that group.
      leads.set(actor.leader, actor.name);
      actor.declared = true;
      continue;
    }
    const rank = (ranks.get(actor.leader) ?? 0) + 1;
    ranks.set(actor.leader, rank);
    actor.follows = lead;
    actor.rank = rank;
  }
}

/** The cues of what comes in with the drawing, before any beat · everything a beat
 *  does not time, what does not follow a mark that waits for its beat, and none of
 *  the runs a gate or an established flow times. */
function setupCues(choreography: Choreography, skipped: Set<string>): Cue[] {
  return choreography.cues
    .filter((cue) => !skipped.has(cue.id))
    .filter((cue) => !/:switch\d+$|:run[1-9]\d*$/.test(cue.id))
    .map((cue) => ({ ...cue, stage: 0 }));
}

/** A boolean attribute · present, whatever its value. */
const says = (node: DgNode, attribute: string) => node.attrs[attribute] !== undefined;

/** Links and notes that join a mark coming in on its beat come in with it. */
function followersOfLate(drawn: DiagramLayout, entering: Map<string, string>): Map<string, string> {
  const follow = new Map<string, string>();
  drawn.links.forEach((link, j) => {
    const lead = entering.get(link.from) ?? entering.get(link.to);
    if (lead) follow.set(cueIds.link(j), lead);
  });
  drawn.notes.forEach((note, k) => {
    const lead = entering.get(note.target);
    if (lead) follow.set(cueIds.note(k), lead);
  });
  return follow;
}

/** The lanes a gate stands across, and the gates of a lane. */
const gatesOn = (drawn: DiagramLayout, lane: LLane): { gate: LGate; k: number }[] =>
  drawn.items
    .map((item, k) => ({ item, k }))
    .filter((g): g is { item: LGate; k: number } => g.item.kind === 'gate')
    .filter((g) => g.item.lanes.includes(lane.key))
    .map(({ item, k }) => ({ gate: item, k }));

/** How a token of an established flow crosses a lane · from the start of the track
 *  to its end, and how long it takes to reach `x`. */
function laneTrip(lane: LLane): { from: number; to: number; seconds: number } {
  const from = lane.track.x0 + TOKEN_RADIUS;
  const to = lane.track.x1 - ARROW_ROOM - TOKEN_RADIUS;
  const speed = SPEEDS[lane.speed] ?? SPEEDS.normal;
  const seconds = Math.min(MAX_STEADY_TRIP, Math.max(MIN_STEADY_TRIP, (to - from) / speed));
  return { from, to, seconds };
}

const everyInterval = (from: number, until: number, offset = 0): number[] => {
  const out: number[] = [];
  for (let t = from + offset; t <= until + 1e-9; t += STEADY_INTERVAL) out.push(t);
  return out;
};

/** The written length of the steady beat · the longest `steady` said, or the room
 *  its marks need. */
function steadyLength(drawn: DiagramLayout, steadyActors: Actor[]): number {
  const said = [
    ...drawn.items.map((item) => steadyOf(item.node)),
    ...drawn.links.map((link) => steadyOf(link.node)),
  ].filter((s) => Number.isFinite(s) && s > 0);
  const room = steadyActors.length * STEADY_STEP;
  if (said.length) return Math.max(...said, room);
  return steadyActors.length ? Math.max(DEFAULT_STEADY, room) : 0;
}

/** Order the actors of one phase · `after` first, then source order. */
function placePhase(
  actors: Actor[],
  from: number,
  placed: Map<string, Placed>,
  extend: (actor: Actor, at: Placed) => number,
): number {
  let cursor = from;
  let previous: Placed | undefined;
  let end = from;
  const pending = [...actors].sort((a, b) => a.order - b.order);
  for (let pass = 0; pending.length && pass <= actors.length; pass += 1) {
    for (const actor of [...pending]) {
      // What comes in with its group waits for the group, not for what its mark waits
      // for on a beat of its own · the mark that leads a group with no surface waits
      // for what the group waits for.
      const lead = !actor.follows && actor.leader ? actor.leader.attrs : undefined;
      const waits = actor.follows ? [] : [...words(actor.node.attrs.after), ...words(lead?.after)];
      const withName = actor.follows ?? actor.node.attrs.with ?? lead?.with;
      const known = (name: string) => placed.has(name) || !actors.some((a) => a.name === name);
      if (![...waits, ...(withName ? [withName] : [])].every(known)) continue;
      let start: number;
      const partner = withName ? placed.get(withName) : undefined;
      if (partner) start = partner.start + (actor.rank ?? 0) * FOLLOW_STAGGER;
      else {
        start = previous ? Math.max(previous.start + BEAT_GAP, previous.end + FOLLOW_GAP) : cursor;
        for (const name of waits) {
          const before = placed.get(name);
          if (before) start = Math.max(start, before.end + FOLLOW_GAP);
        }
      }
      const at = { start, end: start + actor.duration };
      at.end = Math.max(at.end, extend(actor, at));
      placed.set(actor.name, at);
      // What comes in with its group holds the group's beat until it is in.
      if (partner && actor.follows) partner.end = Math.max(partner.end, at.end);
      // What goes with another one runs beside it · the next beat follows the one
      // they started with, and `after` waits for either.
      if (!partner) previous = at;
      end = Math.max(end, at.end);
      cursor = Math.max(cursor, start);
      pending.splice(pending.indexOf(actor), 1);
    }
  }
  // Marks that wait for each other (`DG_MOTION_CYCLE`, said by the model) come in
  // source order, one beat after the other.
  for (const actor of pending) {
    const start = previous ? previous.start + BEAT_GAP : cursor;
    const at = { start, end: start + actor.duration };
    at.end = Math.max(at.end, extend(actor, at));
    placed.set(actor.name, at);
    previous = at;
    end = Math.max(end, at.end);
  }
  return end;
}

export interface StoryOptions {
  /** The played length the story may take, in seconds · `budget` on the root. */
  budget?: number;
}

/** When everything of a story moves. */
export function planStory(
  drawn: DiagramLayout,
  choreography: Choreography,
  options: StoryOptions = {},
): StoryPlan {
  const cues = new Map(choreography.cues.map((cue) => [cue.id, cue]));
  const up = parents(drawn.tree);
  const actors = [
    ...itemActors(drawn, cues, up),
    ...linkAndNoteActors(drawn, cues, up),
    ...cameraActors(drawn.tree),
  ];
  followLeaders(actors);
  const timing = new Map<string, Timing>();
  const set = (id: string, start: number, duration: number) =>
    timing.set(id, { start, duration, stage: 0 });

  // What comes in on a beat brings what joins it · the rest comes in first.
  const entering = new Map<string, string>();
  for (const actor of actors)
    if (actor.kind === 'enter') {
      const key = actor.node.attrs.name;
      if (key) entering.set(key, actor.name);
    }
  const follow = followersOfLate(drawn, entering);
  // A lane that carries an established flow lets it pass before its tokens rest.
  const flowing = drawn.items.flatMap((item, i) =>
    item.kind === 'lane' && steadyOf(item.node) > 0 ? [cueIds.run(i, 0)] : [],
  );
  const skipped = new Set([...actors.flatMap((a) => a.ids), ...follow.keys(), ...flowing]);
  const setup = schedule(setupCues(choreography, skipped), SETUP_SECONDS);
  for (const [id, t] of setup.timing) timing.set(id, t);
  const setupEnd = Math.max(0, ...[...setup.timing.values()].map((t) => t.start + t.duration));

  const placed = new Map<string, Placed>();
  const steadyActors = actors.filter((a) => a.phase === 'steady');
  const steadyStart = setupEnd + PHASE_GAP;
  // A mark of the steady beat that says `with` another one of it runs beside it · the
  // tracks of a replay move together; the others share the steady time.
  const steadyNames = new Set(steadyActors.map((a) => a.name));
  const besideOf = (actor: Actor) =>
    actor.node.attrs.with && steadyNames.has(actor.node.attrs.with)
      ? actor.node.attrs.with
      : undefined;
  const steadyLeads = steadyActors.filter((a) => !a.follows && !besideOf(a));
  const steadyFor = steadyLength(drawn, steadyLeads);
  steadyLeads
    .sort((a, b) => a.order - b.order)
    .forEach((actor, n) => {
      const start = steadyStart + (n * steadyFor) / Math.max(1, steadyLeads.length);
      placed.set(actor.name, { start, end: start + actor.duration });
    });
  for (const actor of steadyActors.filter((a) => !a.follows && besideOf(a))) {
    const partner = placed.get(besideOf(actor)!) ?? { start: steadyStart };
    placed.set(actor.name, { start: partner.start, end: partner.start + actor.duration });
  }
  for (const actor of steadyActors.filter((a) => a.follows)) {
    const lead = placed.get(actor.follows!)!;
    const start = lead.start + (actor.rank ?? 0) * FOLLOW_STAGGER;
    placed.set(actor.name, { start, end: start + actor.duration });
  }

  // A gate that closes holds the tokens that come after it, then what lies past it pales.
  const followers = (actor: Actor, at: Placed): number => {
    let end = at.end;
    drawn.items.forEach((item, k) => {
      if (item.kind !== 'gate' || item.node !== actor.node) return;
      const lanes = drawn.items
        .map((lane, i) => ({ lane, i }))
        .filter((l): l is { lane: LLane; i: number } => l.lane.kind === 'lane')
        .filter((l) => item.lanes.includes(l.lane.key));
      let runsEnd = at.end;
      let settling = at.end;
      for (const { lane, i } of lanes)
        for (const run of lane.runs.filter((r) => r.stage > 0)) {
          const start = at.end + FOLLOW_GAP;
          set(cueIds.run(i, run.stage), start, run.duration);
          runsEnd = Math.max(runsEnd, start + run.duration);
          settling = Math.max(settling, start + run.duration * SETTLED_SHARE);
        }
      // What lies past pales as the last tokens come to rest against the gate.
      if (item.states.at(-1) !== 'open') {
        set(storyIds.downstream(k), settling, DIM_SECONDS);
        end = Math.max(end, runsEnd, settling + DIM_SECONDS);
      } else end = Math.max(end, runsEnd);
    });
    return end;
  };

  // A mark of the steady beat that takes longer (a terminal typing) keeps the system
  // running until it is done · the event waits for it.
  const steadyEnd = Math.max(
    steadyStart + steadyFor,
    ...steadyActors.map((actor) => placed.get(actor.name)!.end),
  );
  // A band runs its normal time for as long as the established flow.
  const bands = drawn.items.flatMap((item, i) =>
    item.kind === 'band' && steadyOf(item.node) > 0 ? [i] : [],
  );
  for (const i of bands) set(storyIds.steady(i), steadyStart, steadyEnd - steadyStart);
  let cursor = steadyFor > 0 ? steadyEnd + PHASE_GAP : steadyStart;
  const phaseStart = new Map<Beat, number>([['steady', steadyStart]]);
  for (const phase of BEATS.slice(1)) {
    const here = actors.filter((a) => a.phase === phase);
    if (!here.length) continue;
    phaseStart.set(phase, cursor);
    cursor = placePhase(here, cursor, placed, followers) + PHASE_GAP;
  }

  for (const actor of actors) {
    const at = placed.get(actor.name)!;
    // The items of a crowd come in one after the other, over its wave.
    const stagger = actor.wave ? actor.wave / Math.max(1, actor.ids.length - 1) : 0;
    actor.ids.forEach((id, n) => {
      const cue = cues.get(id);
      const share =
        actor.ids.length > 1 && cue ? Math.min(cue.duration, actor.duration) : actor.duration;
      set(id, at.start + n * stagger, cue ? share : actor.duration);
    });
  }
  // What joins a mark that comes in late comes in once it is there.
  for (const [id, lead] of follow) {
    const at = placed.get(lead);
    const cue = cues.get(id);
    if (at && cue) set(id, at.end, cue.duration);
  }
  // A ride that waits for its line comes in with it.
  for (const cue of choreography.cues)
    if (cue.role === 'run' && /:ride$/.test(cue.id) && !timing.has(cue.id)) {
      const line = timing.get(cue.id.replace(/:ride$/, ''));
      if (line) set(cue.id, line.start + line.duration, cue.duration);
    }

  const storyEnd = Math.max(cursor - PHASE_GAP, steadyEnd);
  // A camera that ends on a detail goes back to the whole picture once the story is
  // told · the picture at rest is the whole composition.
  const cameras = actors
    .filter((a) => a.kind === 'camera')
    .sort((a, b) => placed.get(a.name)!.start - placed.get(b.name)!.start);
  const lastCamera = cameras.at(-1);
  const cameraBack =
    lastCamera && (lastCamera.node.attrs.to ?? CAMERA_TO_ALL) !== CAMERA_TO_ALL
      ? Math.max(storyEnd, placed.get(lastCamera.name)!.end) + PHASE_GAP
      : undefined;
  if (cameraBack !== undefined) set(storyIds.cameraBack, cameraBack, CAMERA_SECONDS);
  const proofAt = phaseStart.get('proof') ?? storyEnd;
  const breaks = actors.filter((a) => a.phase !== 'steady').map((a) => placed.get(a.name)!.start);
  const firstEvent = breaks.length ? Math.min(...breaks) : storyEnd;
  const flows = planFlows(drawn, placed, timing, { steadyStart, firstEvent, proofAt, set });

  const writtenEnd = Math.max(
    storyEnd,
    ...[...timing.values()].map((t) => t.start + t.duration),
    ...flows.ends,
  );
  const budget = Math.min(STORY_MAX_BUDGET, options.budget ?? STORY_BUDGET);
  // Played at the room's pace, never so fast that two beats come within half a second.
  const fastest = Math.max(1, closestBeats(actors, placed) / PLAYED_BEAT_GAP);
  let rate = Math.min(STORY_MAX_RATE, fastest, Math.max(1, writtenEnd / STORY_PACE));
  const issues: DgIssue[] = [];
  if (writtenEnd / rate > budget) {
    const needed = writtenEnd / rate;
    rate = writtenEnd / budget;
    issues.push({
      code: 'DG_MOTION_BUDGET',
      severity: 'warning',
      items: ['the story'],
      message: `the story moves for ${writtenEnd.toFixed(1)}s written, ${needed.toFixed(1)}s at the room's pace, over its budget of ${budget}s · played ${rate.toFixed(1)} times faster to fit, which the room may not follow`,
      measurement: { writtenSeconds: round(writtenEnd), playedSeconds: round(needed) },
      expected: { playedSeconds: budget },
      fix: {
        action: 'shorten-story',
        use: 'fewer beats, a shorter steady, or budget="12s"',
        budget,
      },
    });
  }
  const scale = (t: number) => t / rate;
  const played = new Map<string, Timing>();
  for (const [id, t] of timing)
    played.set(id, { start: scale(t.start), duration: scale(t.duration), stage: 0 });
  const departures = new Map<string, number[]>();
  for (const [id, list] of flows.departures) departures.set(id, list.map(scale));
  const trips = new Map<string, number>();
  for (const [id, s] of flows.trips) trips.set(id, scale(s));
  issues.push(...tokenIssues(drawn, flows.departures));

  const beats: StoryBeat[] = actors
    .map((actor) => ({
      phase: actor.phase,
      mark: actor.name,
      kind: actor.kind,
      atMs: Math.round(scale(placed.get(actor.name)!.start) * 1000),
      lasting: actor.lasting,
      declared: actor.declared,
      ...(actor.node.attrs.with ? { with: actor.node.attrs.with } : {}),
    }))
    .concat(flows.beats.map((b) => ({ ...b, atMs: Math.round(scale(b.atMs / 1000) * 1000) })))
    .concat(
      cameraBack === undefined
        ? []
        : [
            {
              phase: 'proof' as const,
              mark: storyIds.cameraBack,
              kind: 'camera' as const,
              atMs: Math.round(scale(cameraBack) * 1000),
              // It proves nothing · it shows the whole picture again.
              lasting: false,
              declared: false,
            },
          ],
    )
    .sort((a, b) => a.atMs - b.atMs);
  const steadyMs =
    flows.departures.size || steadyActors.length || bands.length
      ? Math.max(0, Math.round(scale(Math.min(firstEvent, storyEnd) - steadyStart) * 1000))
      : 0;
  return {
    timing: played,
    departures,
    trips,
    levers: leverTurns(drawn),
    script: {
      writtenMs: Math.round(writtenEnd * 1000),
      playedMs: Math.round(scale(writtenEnd) * 1000),
      rate: round(rate, 3),
      budgetMs: budget * 1000,
      steadyMs,
      beats,
    },
    issues,
  };
}

const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

/** The shortest written time between two beats that are not played together · what
 *  sets how much faster the story may be played. Infinite with fewer than two. */
function closestBeats(actors: Actor[], placed: Map<string, Placed>): number {
  const starts = actors
    .filter((a) => a.declared && a.phase !== 'steady' && !a.node.attrs.with)
    .map((a) => placed.get(a.name)!.start)
    .sort((a, b) => a - b);
  const gaps = starts
    .slice(1)
    .map((s, i) => s - starts[i]!)
    .filter((g) => g > 1e-6);
  return gaps.length ? Math.min(...gaps) : Number.POSITIVE_INFINITY;
}

interface FlowContext {
  steadyStart: number;
  /** When the first beat after the established flow starts · the system ran until then. */
  firstEvent: number;
  proofAt: number;
  set: (id: string, start: number, duration: number) => void;
}

/** The tokens of every established flow · the system runs normally until the first
 *  event. A lane's tokens run on until a gate on it closes (each leaves only if it
 *  reaches the gate before); a link that is cut (`dim`) runs until its beat; a link
 *  that starts on a beat (`steady` and a `beat`, no `flow`) carries them from there
 *  to the proof, and what feeds it keeps running as long. A link fed by another one
 *  takes its tokens as they arrive. */
function planFlows(
  drawn: DiagramLayout,
  placed: Map<string, Placed>,
  timing: Map<string, Timing>,
  context: FlowContext,
): {
  departures: Map<string, number[]>;
  trips: Map<string, number>;
  ends: number[];
  beats: StoryBeat[];
} {
  const departures = new Map<string, number[]>();
  const trips = new Map<string, number>();
  const ends: number[] = [];
  const beats: StoryBeat[] = [];
  let laneRank = 0;
  drawn.items.forEach((item, i) => {
    if (item.kind !== 'lane' || !(steadyOf(item.node) > 0)) return;
    const trip = laneTrip(item);
    const speed = (trip.to - trip.from) / trip.seconds;
    const closing = gatesOn(drawn, item).some(({ k }) => timing.has(`${cueIds.item(k)}:switch1`));
    let until = closing ? context.proofAt - trip.seconds : context.firstEvent;
    for (const { gate, k } of gatesOn(drawn, item)) {
      const closes = timing.get(`${cueIds.item(k)}:switch1`);
      if (!closes || gate.states[1] === 'open') continue;
      const reach = (gate.x - TOKEN_RADIUS - trip.from) / speed;
      until = Math.min(until, closes.start - reach);
    }
    const list = everyInterval(context.steadyStart, until, laneRank * LANE_OFFSET);
    laneRank += 1;
    departures.set(storyIds.steady(i), list);
    trips.set(storyIds.steady(i), trip.seconds);
    ends.push(...list.map((t) => t + trip.seconds));
    // The tokens at rest on a lane nothing closes come once the flow has passed.
    const lastRun = item.runs.at(-1);
    if (lastRun && lastRun.stage === 0)
      context.set(cueIds.run(i, 0), until + trip.seconds, lastRun.duration);
    if (list.length) beats.push(flowBeat(nameOfNode(item.node), list[0]!));
  });
  const links = drawn.links.map((link, j) => ({ link, j }));
  const ownWindow = (link: LLink): { from: number; until: number } | null => {
    const node = link.node;
    if (!(steadyOf(node) > 0) || !node) return null;
    const own = placed.get(linkNameOf(link));
    if (says(node, 'dim'))
      return { from: context.steadyStart, until: own ? own.start : context.firstEvent };
    if (own && link.flow === 0 && node.attrs.beat && node.attrs.beat !== 'steady')
      return { from: own.start, until: context.proofAt };
    return { from: context.steadyStart, until: context.firstEvent };
  };
  // A link runs as long as what it feeds carries the flow on.
  const windowOf = (link: LLink, depth = 0): { from: number; until: number } | null => {
    const own = ownWindow(link);
    if (!own || depth > drawn.links.length) return own;
    const fed = links
      .filter(({ link: next }) => next !== link && next.from === link.to)
      .map(({ link: next }) => windowOf(next, depth + 1))
      .filter((w): w is { from: number; until: number } => !!w);
    return { from: own.from, until: Math.max(own.until, ...fed.map((w) => w.until)) };
  };
  // Fed links after their feeders · a link takes the arrivals of the steady link
  // that runs into its start.
  const feeder = (link: LLink) =>
    links.find(({ link: other }) => other !== link && other.to === link.from && windowOf(other));
  const resolve = (link: LLink, j: number, depth = 0): number[] => {
    const id = storyIds.linkSteady(j);
    const known = departures.get(id);
    if (known) return known;
    const window = windowOf(link);
    if (!window) return [];
    const seconds = rideSeconds(link);
    const before = depth < drawn.links.length ? feeder(link) : undefined;
    const source = before
      ? resolve(before.link, before.j, depth + 1).map((t) => t + rideSeconds(before.link))
      : everyInterval(window.from, window.until);
    const list = source.filter((t) => t >= window.from - 1e-9 && t <= window.until + 1e-9);
    departures.set(id, list);
    trips.set(id, seconds);
    ends.push(...list.map((t) => t + seconds));
    if (list.length) beats.push(flowBeat(linkNameOf(link), list[0]!));
    return list;
  };
  for (const { link, j } of links) resolve(link, j);
  return { departures, trips, ends, beats };
}

const flowBeat = (mark: string, at: number): StoryBeat => ({
  phase: 'steady',
  mark,
  kind: 'flow',
  atMs: at * 1000,
  lasting: false,
  declared: false,
});

type Point = { x: number; y: number };

/** A lever and the link it turns away from leave their mark from one point · on its
 *  edge, toward what the two of them reach, the way a switch has one pivot. */
export function leverPivots(drawn: DiagramLayout): Map<number, Point> {
  const pivots = new Map<number, Point>();
  drawn.links.forEach((link, j) => {
    if (!link.node || !says(link.node, 'lever')) return;
    const k = drawn.links.findIndex(
      (other) =>
        other !== link && other.from === link.from && !!other.node && says(other.node, 'dim'),
    );
    const source = drawn.items.find((item) => item.key === link.from && 'w' in item && 'h' in item);
    if (k < 0 || !source || !('w' in source) || !('h' in source)) return;
    const ends = [link.points.at(-1), drawn.links[k]!.points.at(-1)].filter((p): p is Point => !!p);
    const aim = {
      x: ends.reduce((sum, p) => sum + p.x, 0) / ends.length,
      y: ends.reduce((sum, p) => sum + p.y, 0) / ends.length,
    };
    const pivot = edgeToward(source, aim);
    pivots.set(j, pivot);
    pivots.set(k, pivot);
  });
  return pivots;
}

/** Where the line from the centre of a box to `aim` leaves the box. */
function edgeToward(box: { x: number; y: number; w: number; h: number }, aim: Point): Point {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = aim.x - cx;
  const dy = aim.y - cy;
  const scale =
    1 / Math.max(Math.abs(dx) / (box.w / 2) || 0, Math.abs(dy) / (box.h / 2) || 0, 1e-9);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/** How far a lever turns, in degrees · it stands at the start of its link, and
 *  pointed before its beat at the end of the link of the same start that carried
 *  the flow (the one that is cut). */
function leverTurns(drawn: DiagramLayout): Map<string, number> {
  const turns = new Map<string, number>();
  const toward = (from: Point, to: Point) =>
    (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const pivots = leverPivots(drawn);
  drawn.links.forEach((link, j) => {
    const start = pivots.get(j) ?? link.points[0];
    const next = link.points.at(-1);
    if (!link.node || !says(link.node, 'lever') || !start || !next) return;
    const before = drawn.links.find(
      (other) =>
        other !== link && other.from === link.from && other.node && says(other.node, 'dim'),
    );
    const end = before?.points.at(-1);
    turns.set(storyIds.lever(j), end ? toward(start, end) - toward(start, next) : 0);
  });
  return turns;
}

/** Too many tokens · per lane (its flow and its queue), and in all. */
function tokenIssues(drawn: DiagramLayout, departures: Map<string, number[]>): DgIssue[] {
  const per: { name: string; count: number }[] = [];
  drawn.items.forEach((item, i) => {
    if (item.kind !== 'lane') return;
    const count = (departures.get(storyIds.steady(i))?.length ?? 0) + item.flow;
    per.push({ name: nameOfNode(item.node), count });
  });
  drawn.links.forEach((link, j) => {
    const count = (departures.get(storyIds.linkSteady(j))?.length ?? 0) + link.flow;
    if (count) per.push({ name: linkNameOf(link), count });
  });
  const crowded = per.filter((p) => p.count > MAX_STORY_TOKENS_LANE);
  const total = per.reduce((sum, p) => sum + p.count, 0);
  if (!crowded.length && total <= MAX_STORY_TOKENS) return [];
  return [
    {
      code: 'DG_TOKENS_MANY',
      severity: 'error',
      items: crowded.length
        ? crowded.map((p) => `${p.name} · ${p.count} tokens`)
        : [`${total} tokens`],
      message: crowded.length
        ? `${crowded.map((p) => `${p.name} carries ${p.count} tokens`).join(', ')}, over ${MAX_STORY_TOKENS_LANE} a lane · a flow nobody counts`
        : `the story carries ${total} tokens, over ${MAX_STORY_TOKENS} · the eye stops following`,
      measurement: { perLane: Object.fromEntries(per.map((p) => [p.name, p.count])), total },
      expected: { perLane: MAX_STORY_TOKENS_LANE, total: MAX_STORY_TOKENS },
      fix: { action: 'fewer-tokens', use: 'a shorter steady, or a smaller flow' },
    },
  ];
}
