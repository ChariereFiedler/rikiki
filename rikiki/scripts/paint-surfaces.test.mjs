import { describe, expect, it } from 'vitest';
import {
  citeSite,
  declarations,
  isStateSurface,
  isThin,
  paintedSurfaces,
  riksIn,
} from './paint-surfaces.mjs';

// The derivation is what makes the state-surface guard non-vacuous, so it is
// tested on synthetic input rather than only exercised through the real
// stylesheets · a scanner that quietly finds nothing turns its guard green.

const chunk = (css) => [{ file: 'synthetic.css', css, src: css, offset: 0 }];

describe('reading declarations out of a stylesheet', () => {
  it('carries the selector each declaration sits under', () => {
    const found = [...declarations(':host([tone="ok"]) { background: red; color: blue; }')];
    expect(found.map((d) => d.property)).toEqual(['background', 'color']);
    expect(found[0].selector).toBe(':host([tone="ok"])');
  });

  it('pops the selector back off at the closing brace', () => {
    const css = '.a { background: red; } .b { background: blue; }';
    expect([...declarations(css)].map((d) => d.selector)).toEqual(['.a', '.b']);
  });

  it('finds every token in a value, fallbacks included', () => {
    expect(riksIn('var(--deck-x, var(--rik-status-info__bg, var(--rik-surface-tint)))')).toEqual([
      '--rik-status-info__bg',
      '--rik-surface-tint',
    ]);
  });
});

describe('painted surfaces', () => {
  it('reports the token, the file and the line it is painted at', () => {
    const css =
      '.x {\n  color: red;\n}\n:host([boxed]) {\n  background: var(--rik-surface-inverse);\n}';
    const found = paintedSurfaces(chunk(css));
    const sites = found.get('--rik-surface-inverse');
    expect(sites).toHaveLength(1);
    expect(sites[0].line).toBe(5);
    expect(citeSite(sites[0])).toBe('synthetic.css:5 (:host([boxed]))');
  });

  it('ignores a declaration that paints nothing', () => {
    expect(paintedSurfaces(chunk('.x { background: transparent; }')).size).toBe(0);
    expect(paintedSurfaces(chunk('.x { color: var(--rik-accent); }')).size).toBe(0);
  });

  // This is the exact declaration deck-table shipped before the fix. The guard
  // exists to catch it, so the detector must see it.
  it('sees the historical deck-table emphasis as a state surface', () => {
    const css =
      'deck-root table[data-rik-table] tr[data-mark] > td {\n' +
      '  background: var(--deck-table-mark-bg, var(--rik-status-info__bg, var(--rik-surface-tint)));\n' +
      '}';
    const found = paintedSurfaces(chunk(css));
    expect([...found.keys()]).toEqual(['--rik-status-info__bg', '--rik-surface-tint']);
    expect(found.get('--rik-surface-tint').every(isStateSurface)).toBe(true);
  });

  it('does not mistake a resting surface for a state', () => {
    const found = paintedSurfaces(chunk(':host { background: var(--rik-surface-raised); }'));
    expect(found.get('--rik-surface-raised').some(isStateSurface)).toBe(false);
  });

  it('honours the thin marker, and only where it is written', () => {
    const css =
      ':host([active]) .rule { background: var(--rik-accent) /* thin */; }\n' +
      ':host([active]) .box { background: var(--rik-accent); }';
    const sites = paintedSurfaces(chunk(css)).get('--rik-accent');
    expect(sites.map(isThin)).toEqual([true, false]);
  });
});
