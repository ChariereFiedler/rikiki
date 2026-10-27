import { describe, expect, it } from 'vitest';
import {
  CAMERA_MARGIN,
  IDENTITY,
  LEGIBLE_TEXT,
  MAX_ZOOM,
  type Rect,
  type View,
  planCamera,
  viewAround,
  viewOn,
} from './camera.js';
import { choreograph } from './choreography.js';
import { compileIntent } from './intent.js';
import { type Meter, layoutDiagram } from './layout.js';
import { type DgNode, type ElementLike, parseDiagram } from './model.js';
import { planStory, storyIds } from './story.js';

// ════════════════════════════════════════════════════════════════
// The camera · what is promised: it frames what it names with a margin, as close as
// the frame allows and never past MAX_ZOOM nor past the edge of the picture; it cuts
// the name of the scope it shows neither in half nor in; its moves, nested, go from
// the opening frame to the whole picture, which the story returns to when the last
// camera ends on a detail; a name with no place, or a frame that shows text under the
// scale, is refused.
// ════════════════════════════════════════════════════════════════

const FRAME: Rect = { x: 0, y: 0, w: 1600, h: 600 };

const apply = (v: View, p: { x: number; y: number }) => ({
  x: v.s * p.x + v.x,
  y: v.s * p.y + v.y,
});

/** The view the nested moves show when the first `done` of them have played. */
function seen(moves: { from: View }[], done: number): View {
  return moves.reduce<View>((total, move, k) => {
    const v = k < done ? IDENTITY : move.from;
    return { s: total.s * v.s, x: total.s * v.x + total.x, y: total.s * v.y + total.y };
  }, IDENTITY);
}

const node = (attrs: Record<string, string>): DgNode => ({
  kind: 'camera',
  attrs,
  children: [],
  index: 0,
});

describe('a frame on a mark', () => {
  it('centres it with its margin, as close as the frame allows', () => {
    const target = { x: 700, y: 250, w: 200, h: 100 };
    const v = viewOn(target, FRAME);
    expect(v.s).toBeCloseTo(Math.min(MAX_ZOOM, 600 / (100 + 2 * CAMERA_MARGIN)), 5);
    const centre = apply(v, { x: 800, y: 300 });
    expect(centre.x).toBeCloseTo(800, 5);
    expect(centre.y).toBeCloseTo(300, 5);
  });

  it('never closes in past MAX_ZOOM, nor frames smaller than the picture', () => {
    expect(viewOn({ x: 790, y: 290, w: 20, h: 20 }, FRAME).s).toBe(MAX_ZOOM);
    expect(viewOn({ x: 0, y: 0, w: 1600, h: 600 }, FRAME).s).toBe(1);
  });

  it('stays inside the picture where centring would show past its edge', () => {
    const v = viewOn({ x: 0, y: 0, w: 200, h: 100 }, FRAME);
    const corner = apply(v, { x: 0, y: 0 });
    expect(corner.x).toBeCloseTo(0, 5);
    expect(corner.y).toBeCloseTo(0, 5);
  });

  it('takes in the name of its scope rather than cut it, and leaves the one around out', () => {
    const target = { x: 700, y: 300, w: 200, h: 100 };
    const caption = { x: 700, y: 240, w: 300, h: 30 };
    const v = viewAround(target, FRAME, [caption]);
    const top = apply(v, { x: caption.x, y: caption.y });
    expect(top.y).toBeGreaterThanOrEqual(-0.01);
    const around = { x: 600, y: 160, w: 300, h: 30 };
    const off = viewAround(target, FRAME, [], [around]);
    const shown = (FRAME.y - off.y) / off.s;
    expect(shown).toBeGreaterThanOrEqual(around.y + around.h - 0.01);
  });
});

describe('the moves of the cameras', () => {
  const place = (name: string): Rect | undefined =>
    ({ code: { x: 700, y: 260, w: 200, h: 80 }, env: { x: 500, y: 150, w: 600, h: 300 } })[name];

  it('open on the first focus and end on the whole picture', () => {
    const plan = planCamera({
      shots: [
        { node: node({ focus: 'code', to: 'env' }), id: 'c0' },
        { node: node({ to: 'all' }), id: 'c1' },
      ],
      backId: 'back',
      place,
      frame: FRAME,
      smallestText: 23,
    });
    expect(plan.issues).toEqual([]);
    expect(plan.moves.map((m) => m.id)).toEqual(['c0', 'c1']);
    expect(seen(plan.moves, 0).s).toBeCloseTo(plan.views[0]!.s, 5);
    expect(seen(plan.moves, 1).s).toBeCloseTo(plan.views[1]!.s, 5);
    expect(seen(plan.moves, 2)).toEqual(IDENTITY);
  });

  it('go back to the whole picture when the last one ends on a detail', () => {
    const plan = planCamera({
      shots: [{ node: node({ to: 'code' }), id: 'c0' }],
      backId: 'back',
      place,
      frame: FRAME,
      smallestText: 23,
    });
    expect(plan.moves.map((m) => m.id)).toEqual(['c0', 'back']);
    expect(plan.views.at(-1)).toEqual(IDENTITY);
  });

  it('refuse a name with no place, and say a focus read too late', () => {
    const plan = planCamera({
      shots: [
        { node: node({ to: 'lien' }), id: 'c0' },
        { node: node({ name: 'tard', focus: 'code', to: 'all' }), id: 'c1' },
      ],
      backId: 'back',
      place,
      frame: FRAME,
      smallestText: 23,
    });
    const target = plan.issues.filter((i) => i.code === 'DG_CAMERA_TARGET');
    expect(target.map((i) => i.severity).sort()).toEqual(['error', 'warning']);
  });

  it('refuse a frame that shows text under the scale the room reads', () => {
    const plan = planCamera({
      shots: [{ node: node({ focus: 'code', to: 'all' }), id: 'c0' }],
      backId: 'back',
      place,
      frame: FRAME,
      smallestText: LEGIBLE_TEXT - 3,
    });
    expect(plan.issues.find((i) => i.code === 'DG_CAMERA_ILLEGIBLE')?.severity).toBe('error');
  });
});

const meter: Meter = (size) => (text) => text.length * size * 0.55;

function el(
  localName: string,
  attrs: Record<string, string> = {},
  children: ElementLike[] = [],
): ElementLike {
  return {
    localName,
    children,
    getAttribute: (name) => (name in attrs ? attrs[name]! : null),
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

describe('a camera in a story', () => {
  const story = (camera: Record<string, string>) => {
    const parsed = parseDiagram(
      el('deck-diagram', { play: 'enter', compose: 'inset' }, [
        el('dg-panel', { name: 'prod', layout: 'row' }, [
          el('dg-panel', { name: 'jeu' }, [
            el('dg-box', { name: 'cas', label: 'CEO', beat: 'steady' }),
          ]),
          el('dg-box', { name: 'reel', label: 'CEO de lemlist', beat: 'proof' }),
        ]),
        el('dg-camera', { name: 'recul', ...camera }),
      ]),
      compileIntent,
    );
    const drawn = layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } });
    return { parsed, plan: planStory(drawn, choreograph(drawn, drawn.tree)) };
  };

  it('is a beat of the script, timed like a mark', () => {
    const { parsed, plan } = story({ focus: 'jeu', to: 'all', beat: 'event' });
    expect(parsed.issues.filter((i) => i.severity === 'error')).toEqual([]);
    const beat = plan.script.beats.find((b) => b.mark === 'recul')!;
    expect(beat).toMatchObject({ phase: 'event', kind: 'camera', declared: true, lasting: true });
    expect(plan.timing.get(storyIds.camera(0))?.duration).toBeGreaterThan(0);
    expect(plan.timing.has(storyIds.cameraBack)).toBe(false);
  });

  it('that ends on a detail is followed by the way back, inside the written story', () => {
    const { plan } = story({ to: 'jeu', beat: 'effect' });
    const back = plan.timing.get(storyIds.cameraBack)!;
    const move = plan.timing.get(storyIds.camera(0))!;
    expect(back.start).toBeGreaterThanOrEqual(move.start + move.duration);
    expect((back.start + back.duration) * 1000).toBeLessThanOrEqual(plan.script.playedMs + 1);
  });

  it('is dropped, and said, in a diagram that plays on clicks', () => {
    const parsed = parseDiagram(
      el('deck-diagram', { layout: 'row' }, [
        el('dg-box', { name: 'a', label: 'a' }),
        el('dg-camera', { focus: 'a', to: 'all' }),
      ]),
    );
    expect(parsed.issues.map((i) => i.code)).toContain('DG_CAMERA_STORY');
  });
});
