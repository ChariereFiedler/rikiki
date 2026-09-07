// ════════════════════════════════════════════════════════════════
// A theme carries values · never structure
//
// The two shipped themes were meant to differ only in what their tokens are
// worth. In practice each carried its own copy of ~200 light-DOM rules, and the
// copies drifted: the slide title was weight 800 against 700, tracking -0.025em
// against -0.018em, its rule 4px against 2px, and the secondary voice on a dark
// surface resolved to --muted in one file and --faint in the other. That last
// one is the telling case · it is a choice of ROLE, so the token had stopped
// arbitrating anything and the name meant two different things depending on
// which file was loaded.
//
// None of it was deliberate and none of it was visible: the two files are long,
// and a diff of them is unreadable by hand. This is the check that makes the
// next divergence loud instead.
//
// The rule it enforces: every theme declares the SAME selectors, and for each
// selector the SAME properties. Only the values are free · that is what a theme
// is. A rule that belongs to one theme alone belongs in a component instead.
// ════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { declaredShape, themeFiles } from './css-source.mjs';

const THEMES = themeFiles();

describe('every theme declares the same structure', () => {
  it('ships more than one theme, or this check proves nothing', () => {
    expect(THEMES.length, 'a single theme cannot be compared against anything').toBeGreaterThan(1);
  });

  const shapes = THEMES.map(({ file, name }) => ({
    name,
    file,
    shape: declaredShape(readFileSync(file, 'utf8')),
  }));
  const reference = shapes[0];
  const others = shapes.slice(1);

  it.each(
    others.map((t) => ({ name: t.name, theme: t })),
  )(`$name declares the same selectors as ${shapes[0].name}`, ({ theme }) => {
    const missing = [...reference.shape.keys()].filter((k) => !theme.shape.has(k));
    const extra = [...theme.shape.keys()].filter((k) => !reference.shape.has(k));
    expect(
      missing,
      `${theme.name} is missing rules that ${reference.name} declares · a theme that styles ` +
        'fewer things than another is carrying structure, not values',
    ).toEqual([]);
    expect(
      extra,
      `${theme.name} declares rules ${reference.name} does not · move the rule into the ` +
        'component that owns it, or give both themes the same rule and different tokens',
    ).toEqual([]);
  });

  it.each(
    others.map((t) => ({ name: t.name, theme: t })),
  )(`$name sets the same properties as ${shapes[0].name}, on every shared rule`, ({ theme }) => {
    const differences = [];
    for (const [selector, properties] of reference.shape) {
      const mine = theme.shape.get(selector);
      if (!mine) continue; // reported by the selector check above
      for (const property of properties) {
        if (!mine.has(property))
          differences.push(`${selector} · ${reference.name} sets ${property}`);
      }
      for (const property of mine) {
        if (!properties.has(property))
          differences.push(`${selector} · ${theme.name} sets ${property}`);
      }
    }
    expect(
      differences,
      'a property one theme sets and the other does not is a structural difference · ' +
        'declare it in both and let a token carry the difference',
    ).toEqual([]);
  });
});
