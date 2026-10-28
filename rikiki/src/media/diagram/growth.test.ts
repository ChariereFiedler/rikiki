import { describe, expect, it } from 'vitest';
import {
  ARROW_LENGTH,
  GROWN_FILL,
  MAX_GROWTH,
  NARROWED_FILL,
  arrowWings,
  growthFor,
  inkOf,
  widthToGrow,
} from './growth.js';
import { type Meter, layoutDiagram } from './layout.js';
import { type ElementLike, parseDiagram } from './model.js';

const ROOM = { w: 1600, h: 600 };
const ink = (w: number, h: number) => ({ x0: 0, y0: 0, x1: w, y1: h });

describe('growthFor', () => {
  it('enlarges a drawing that leaves its room empty, as far as the tighter axis allows', () => {
    expect(growthFor(ink(800, 200), ROOM)).toBe(MAX_GROWTH);
    expect(growthFor(ink(1200, 200), ROOM)).toBeCloseTo((ROOM.w * GROWN_FILL) / 1200);
    expect(growthFor(ink(1600, 600), ROOM)).toBe(1);
  });
});

describe('widthToGrow', () => {
  it('lays a wide, short drawing out narrower, so its height sets how large it is drawn', () => {
    // As wide as the room and a third of its height: it cannot grow at that width.
    const wide = ink(1600, 200);
    expect(growthFor(wide, ROOM)).toBe(1);
    const width = widthToGrow(wide, ROOM)!;
    const grows = Math.min(MAX_GROWTH, (ROOM.h * NARROWED_FILL) / 200);
    expect(width).toBe(Math.floor((ROOM.w * GROWN_FILL) / grows));
    expect(growthFor(ink(width, 200), ROOM)).toBeCloseTo(grows, 2);
  });

  it('never grows a drawing laid out narrower past the height a two-line title leaves', () => {
    const width = widthToGrow(ink(1600, 400), ROOM)!;
    expect(width).not.toBeNull();
    expect(400 * growthFor(ink(width, 400), ROOM)).toBeLessThanOrEqual(ROOM.h * NARROWED_FILL + 1);
  });

  it('leaves alone a drawing its height holds back, or one that already grows', () => {
    expect(widthToGrow(ink(1600, 560), ROOM)).toBeNull();
    expect(widthToGrow(ink(700, 200), ROOM)).toBeNull();
    expect(widthToGrow(null, ROOM)).toBeNull();
  });
});

describe('arrowWings', () => {
  it('puts the two wing tips behind the end of the line, either side of it', () => {
    const [a, b] = arrowWings([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ])!;
    expect(a.x).toBeCloseTo(100 - ARROW_LENGTH * Math.cos(0.45));
    expect(b.x).toBeCloseTo(a.x);
    expect(a.y).toBeCloseTo(-b.y);
    expect(arrowWings([{ x: 0, y: 0 }])).toBeNull();
  });
});

describe('inkOf', () => {
  const meter: Meter = (size) => (text) => text.length * size * 0.55;
  const el = (localName: string, attrs: Record<string, string>, children: ElementLike[] = []) => ({
    localName,
    children,
    getAttribute: (name: string) => attrs[name] ?? null,
    hasAttribute: (name: string) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  });

  it('holds the arrow heads and the accents above the first line, not only the marks', () => {
    const drawn = layoutDiagram(
      parseDiagram(
        el('deck-diagram', { layout: 'row', link: 'arrow' }, [
          el('dg-box', { label: 'Élan' }),
          el('dg-box', { label: 'Suite' }),
        ]),
      ),
      { meter, bounds: ROOM },
    );
    const box = inkOf(drawn, meter)!;
    const top = Math.min(...drawn.items.map((i) => ('h' in i ? i.y : 0)));
    expect(box.y0).toBeLessThanOrEqual(top);
    const [link] = drawn.links;
    const wings = arrowWings(link!.points)!;
    for (const wing of wings) {
      expect(wing.x).toBeGreaterThanOrEqual(box.x0);
      expect(wing.y).toBeGreaterThanOrEqual(box.y0);
      expect(wing.y).toBeLessThanOrEqual(box.y1);
    }
  });
});
