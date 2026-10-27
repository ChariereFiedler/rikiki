// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the camera
//
// `<dg-camera focus="jeu" to="all" beat="spread">` draws nothing: the picture opens
// framed on a mark or a panel (`focus`) and, on its beat, the camera moves to another
// one (`to`), or back to the whole picture (`all`). A story
// opens a chapter tight on the code and pulls back to the ring around it; it shows
// the test set, then the production it is lost in. The author never writes a scale
// or an offset · the camera frames what it names with a margin, as close as the
// frame allows, never closer than `MAX_ZOOM`, and never past the edge of the picture.
//
// The picture at rest is the whole composition: print, PDF, the overview, reduced
// motion and the end of the story show it. A camera that ends on a detail goes back
// to the whole picture once the story is told (the story plans that return).
//
// `zoom-from="slide-id/mark"` on the first camera opens a chapter from the slide
// before: reached from that slide, the picture opens with the mark both draw where
// and as large as the room last saw it (`viewFrom`), then pulls back; reached any
// other way (a jump, a link, the first slide shown), it opens framed on its own mark.
//
// A view is `p ↦ s·p + (x, y)`, in the units of the drawing's viewBox. Each move is
// drawn as a group of its own that eases from where it starts to no transform, the
// groups nested in the order of the moves · so the view before the first move is
// the opening frame, and the view after the last is the whole picture. Pure.
// ════════════════════════════════════════════════════════════════

import { CAMERA_ALL, type DgIssue, type DgNode, readZoomFrom } from './model.js';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** `p ↦ s·p + (x, y)`. */
export interface View {
  s: number;
  x: number;
  y: number;
}

export const IDENTITY: View = Object.freeze({ s: 1, x: 0, y: 0 });

/** Room kept around what a camera frames, in drawing units · its edge is never on
 *  the edge of the slide. */
export const CAMERA_MARGIN = 40;
/** A camera frames a mark this close at most · past it a box fills the slide and its
 *  context, which the move is about, is gone. */
export const MAX_ZOOM = 2.6;
/** The smallest text the picture may show in any frame, in drawing units · 18 px on a
 *  1920-wide screen, the floor `rikiki check` reads (SVG_TEXT_TOO_SMALL). */
export const LEGIBLE_TEXT = 15;
/** How long a camera move takes, written, when it does not say. */
export const CAMERA_SECONDS = 1.2;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** The view that frames `target` in `frame` · centred, its margin kept, as large as the
 *  frame and `MAX_ZOOM` allow (never smaller than the picture), and moved back inside
 *  the picture where centring would show what lies past its edge. */
export function viewOn(target: Rect, frame: Rect): View {
  const fits = Math.min(
    frame.w / (target.w + 2 * CAMERA_MARGIN),
    frame.h / (target.h + 2 * CAMERA_MARGIN),
  );
  const s = clamp(fits, 1, MAX_ZOOM);
  const x = frame.x + frame.w / 2 - s * (target.x + target.w / 2);
  const y = frame.y + frame.h / 2 - s * (target.y + target.h / 2);
  return {
    s,
    x: clamp(x, (frame.x + frame.w) * (1 - s), frame.x * (1 - s)),
    y: clamp(y, (frame.y + frame.h) * (1 - s), frame.y * (1 - s)),
  };
}

/** A chapter opened from the slide before keeps this close at most · past it the
 *  mark taken over fills the slide, and its words are larger than any it holds. */
export const ZOOM_FROM_MAX = 4;

/** The view that shows `here` where `before` stood on the slide before · both in the
 *  units of their viewBox, which are one width and stand under the same title, so a
 *  mark taken over stays where the room last saw it, at the size it had, even where
 *  that shows past the edge of this picture (nothing is drawn there). Never smaller
 *  than the picture: a mark drawn larger here is centred on where it stood. */
export function viewFrom(before: Rect, here: Rect): View {
  const s = clamp(before.w / here.w, 1, ZOOM_FROM_MAX);
  return {
    s,
    x: before.x + before.w / 2 - s * (here.x + here.w / 2),
    y: before.y + before.h / 2 - s * (here.y + here.h / 2),
  };
}

const unionRect = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** What a view shows of the picture, in the picture's units. */
const shownBy = (view: View, frame: Rect): Rect => ({
  x: (frame.x - view.x) / view.s,
  y: (frame.y - view.y) / view.s,
  w: frame.w / view.s,
  h: frame.h / view.s,
});

const meets = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

/** At most this many widenings · each takes in the words the frame cut, and a frame
 *  that keeps cutting soon holds the whole picture. */
const WIDENINGS = 4;

/** The view that frames `target`, widened until it cuts none of `texts` in half · the
 *  name of the scope it shows, sliced by the edge of the slide, reads as a mistake, so
 *  what the frame would cut is taken into it, and the frame is computed again. */
export function viewAround(
  target: Rect,
  frame: Rect,
  texts: readonly Rect[],
  avoid: readonly Rect[] = [],
): View {
  let framed = target;
  let view = viewOn(framed, frame);
  for (let round = 0; round < WIDENINGS; round += 1) {
    const shown = shownBy(view, frame);
    const cut = texts.filter((t) => meets(shown, t) && !inside(shown, t));
    if (!cut.length) break;
    framed = cut.reduce(unionRect, framed);
    view = viewOn(framed, frame);
  }
  for (const text of avoid) view = slideOff(view, frame, framed, text);
  return view;
}

/** The view moved just enough that `text`, cut by its edge, is out of it · when what
 *  it frames stays whole and the frame stays inside the picture. A name taken in would
 *  undo the zoom, one sliced reads as a mistake: it is left out. */
function slideOff(view: View, frame: Rect, framed: Rect, text: Rect): View {
  const shown = shownBy(view, frame);
  if (!meets(shown, text) || inside(shown, text)) return view;
  const moves = [
    { dx: 0, dy: text.y + text.h - shown.y },
    { dx: 0, dy: text.y - (shown.y + shown.h) },
    { dx: text.x + text.w - shown.x, dy: 0 },
    { dx: text.x - (shown.x + shown.w), dy: 0 },
  ].sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)));
  for (const { dx, dy } of moves) {
    const moved = { ...shown, x: shown.x + dx, y: shown.y + dy };
    if (inside(moved, framed) && inside(frame, moved))
      return { s: view.s, x: view.x - dx * view.s, y: view.y - dy * view.s };
  }
  return view;
}

/** `a` after `b` · the view of `b`, then `a`. */
const then = (a: View, b: View): View => ({ s: a.s * b.s, x: a.s * b.x + a.x, y: a.s * b.y + a.y });
const inverse = (v: View): View => ({ s: 1 / v.s, x: -v.x / v.s, y: -v.y / v.s });
const same = (a: View, b: View) =>
  Math.abs(a.s - b.s) < 1e-3 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;

/** One move of the camera · its group starts at `from` and eases to no transform. */
export interface CameraMove {
  /** The story id that times it. */
  id: string;
  from: View;
}

export interface CameraPlan {
  /** The views the picture is seen through, from the opening frame to the whole picture. */
  views: View[];
  /** One per move, outermost first. */
  moves: CameraMove[];
  issues: DgIssue[];
}

/** A camera as the story plays it · its node, and the id its time is set under. */
export interface CameraShot {
  node: DgNode;
  id: string;
}

export interface CameraInput {
  /** The cameras in the order the story moves them. */
  shots: CameraShot[];
  /** The id of the move back to the whole picture, when the last camera ends on a detail. */
  backId: string;
  /** Where a mark or a panel stands, in the units of the viewBox · undefined for a
   *  name with no place (a link, a note). */
  place: (name: string) => Rect | undefined;
  /** The viewBox · the whole picture. */
  frame: Rect;
  /** The smallest text of the picture, in the units of the viewBox. */
  smallestText: number;
  /** The names of the scopes around a framed mark, in the units of the viewBox ·
   *  `keep` the frame takes in whole (a panel's own caption, or for a mark the caption
   *  of the panel it is in), `avoid` it slides off rather than cut (the caption of the
   *  panel around a framed panel). */
  captions?: (name: string) => { keep: readonly Rect[]; avoid: readonly Rect[] };
  /** The frame the picture opens on when it takes over the slide before's (`zoom-from`
   *  reached from that slide, `viewFrom`) · else the first camera frames its mark here. */
  opening?: View;
}

const nameOf = (node: DgNode) => node.attrs.name ?? 'dg-camera';

/** The mark the first camera opens on · its `focus`, else the mark it takes over
 *  from the slide before, framed here when the slide is reached another way. */
const openingName = (node: DgNode | undefined): string | undefined =>
  node?.attrs.focus ?? readZoomFrom(node?.attrs['zoom-from'])?.mark;

/** The views a story's cameras show, and the moves that go from one to the next. */
export function planCamera(input: CameraInput): CameraPlan {
  const issues: DgIssue[] = [];
  const unplaced: string[] = [];
  const viewOf = (name: string | undefined): View => {
    if (!name || name === CAMERA_ALL) return IDENTITY;
    const target = input.place(name);
    if (target) {
      const near = input.captions?.(name) ?? { keep: [], avoid: [] };
      return viewAround(target, input.frame, near.keep, near.avoid);
    }
    unplaced.push(name);
    return IDENTITY;
  };
  const [first, ...rest] = input.shots;
  const late = rest
    .filter(
      (shot) => shot.node.attrs.focus !== undefined || shot.node.attrs['zoom-from'] !== undefined,
    )
    .map((s) => nameOf(s.node));
  const local = viewOf(openingName(first?.node));
  const views: View[] = [input.opening ?? local];
  const ids: string[] = [];
  for (const shot of input.shots) {
    views.push(viewOf(shot.node.attrs.to));
    ids.push(shot.id);
  }
  if (!same(views.at(-1)!, IDENTITY)) {
    views.push(IDENTITY);
    ids.push(input.backId);
  }
  // Each move's group starts where the views before it and after it differ.
  const moves = ids.map((id, k) => ({ id, from: then(views[k]!, inverse(views[k + 1]!)) }));
  if (unplaced.length)
    issues.push({
      code: 'DG_CAMERA_TARGET',
      severity: 'error',
      items: unplaced,
      message: `a camera frames a mark or a panel by its name · ${unplaced.map((n) => `"${n}"`).join(', ')} stands nowhere on the picture (a link, a note), so the whole picture is shown instead`,
      fix: {
        action: 'set-attribute',
        attributes: ['focus', 'to'],
        use: 'a mark, a group or a panel, or all',
      },
    });
  if (late.length)
    issues.push({
      code: 'DG_CAMERA_TARGET',
      severity: 'warning',
      items: late,
      message: `focus and zoom-from are the frame the picture opens on, read on the first camera only · ${late.join(', ')} starts where the camera before it ended`,
      fix: { action: 'remove-attributes', attributes: ['focus', 'zoom-from'], on: late },
    });
  const smallest = input.smallestText * Math.min(...views.map((v) => v.s));
  if (smallest < LEGIBLE_TEXT)
    issues.push({
      code: 'DG_CAMERA_ILLEGIBLE',
      severity: 'error',
      items: input.shots.map((s) => nameOf(s.node)),
      message: `seen through the camera, the smallest text of the picture is ${smallest.toFixed(1)} units, under the ${LEGIBLE_TEXT} the back of the room reads · a frame that shows it so small says nothing`,
      measurement: { smallestText: Math.round(smallest * 10) / 10 },
      expected: { atLeast: LEGIBLE_TEXT },
      fix: { action: 'fewer-marks', use: 'fewer marks in the composition, or split the slide' },
    });
  return { views, moves, issues };
}
