import { describe, expect, it } from 'vitest';
import { findIconData, iconNamesIn, pruneIcons } from './prune-icons.mjs';

const SET = '{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","user":"M20 21v-2a4 4 0 0 0-4-4Z"}';
const bundle = (set = SET) => `const A=1;const ICON_DATA='${set}';export{A};`;

describe('iconNamesIn', () => {
  it('finds every name a deck writes', () => {
    const html = '<deck-icon name="check"></deck-icon><p><deck-icon name="user"></deck-icon></p>';
    expect([...iconNamesIn(html)].sort()).toEqual(['check', 'user']);
  });

  it('reads an unquoted attribute', () => {
    expect([...iconNamesIn('<deck-icon name=check>')]).toEqual(['check']);
  });

  it('normalises case and spacing', () => {
    expect([...iconNamesIn('<deck-icon  name = " Check " >')]).toEqual(['check']);
  });

  it('ignores an icon with no name · that one uses a slotted svg', () => {
    expect([...iconNamesIn('<deck-icon><svg/></deck-icon>')]).toEqual([]);
  });

  it('is empty for a deck with no icons at all', () => {
    expect([...iconNamesIn('<p>nothing here</p>')]).toEqual([]);
  });
});

describe('findIconData', () => {
  it('locates the set inside a bundle', () => {
    const found = findIconData(bundle());
    expect(found).not.toBeNull();
    expect(Object.keys(found.set)).toEqual(['check', 'cross', 'user']);
  });

  it('returns null when the bundle carries no set', () => {
    expect(findIconData('const A=1;')).toBeNull();
  });
});

describe('pruneIcons', () => {
  it('keeps only what the deck writes', () => {
    const result = pruneIcons(bundle(), '<deck-icon name="check"></deck-icon>');
    expect(result.pruned).toBe(true);
    expect(result.kept).toEqual(['check']);
    expect(result.dropped).toBe(2);
    expect(findIconData(result.js).set).toEqual({ check: 'M20 6 9 17l-5-5' });
  });

  it('empties the set for a deck that writes no name', () => {
    // A deck using only slotted SVGs needs none of the built-in glyphs.
    const result = pruneIcons(bundle(), '<deck-icon><svg/></deck-icon>');
    expect(result.pruned).toBe(true);
    expect(result.kept).toEqual([]);
  });

  it('leaves the set alone when a name is unknown', () => {
    // Something else is going on · dropping glyphs would make it worse.
    const result = pruneIcons(bundle(), '<deck-icon name="unicorn"></deck-icon>');
    expect(result.pruned).toBe(false);
    expect(result.reason).toContain('unicorn');
    expect(result.js).toBe(bundle());
  });

  it('leaves a bundle with no set alone', () => {
    const result = pruneIcons('const A=1;', '<deck-icon name="check">');
    expect(result.pruned).toBe(false);
    expect(result.js).toBe('const A=1;');
  });

  it('does nothing when every glyph is used', () => {
    const html = '<deck-icon name="check"><deck-icon name="cross"><deck-icon name="user">';
    const result = pruneIcons(bundle(), html);
    expect(result.pruned).toBe(false);
    expect(result.reason).toBe('nothing to drop');
  });

  it('produces a bundle that still parses', () => {
    const result = pruneIcons(bundle(), '<deck-icon name="check">');
    expect(() => new Function(result.js.replace('export{A};', ''))).not.toThrow();
  });
});
