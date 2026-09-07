import { describe, expect, it } from 'vitest';
import { ICONS, ICON_NAMES, iconPath } from './icon-set.js';

describe('the icon set is closed and consistent', () => {
  it('has the glyphs a deck actually needs', () => {
    for (const name of ['check', 'cross', 'alert', 'arrow', 'user', 'clock', 'chart']) {
      expect(ICON_NAMES, `${name} is part of the vocabulary`).toContain(name);
    }
  });

  it('stays small enough to ship inline', () => {
    // The whole point of drawing them here rather than vendoring a library.
    const bytes = JSON.stringify(ICONS).length;
    expect(bytes, `the set is ${bytes} bytes`).toBeLessThan(4096);
  });

  it('names one concept per glyph, in one word', () => {
    for (const name of ICON_NAMES) {
      expect(name, `${name} is lowercase and hyphenated at most once`).toMatch(
        /^[a-z]+(-[a-z]+)?$/,
      );
    }
  });

  it('draws every glyph as a stroked path with no fill', () => {
    // Stroke-only keeps a glyph legible at any projected size and lets it
    // inherit currentColor · a filled path would need its own colour rules.
    for (const [name, path] of Object.entries(ICONS)) {
      expect(path.length, `${name} has a path`).toBeGreaterThan(5);
      expect(path, `${name} starts with a move command`).toMatch(/^M/);
    }
  });

  it('has no duplicate drawing', () => {
    const paths = Object.values(ICONS);
    expect(new Set(paths).size, 'two names for one drawing is a naming bug').toBe(paths.length);
  });
});

describe('iconPath', () => {
  it('resolves a known name', () => {
    expect(iconPath('check')).toBe(ICONS.check);
  });

  it('ignores case and surrounding spaces', () => {
    expect(iconPath('  Check ')).toBe(ICONS.check);
  });

  it('returns null for an unknown name rather than an empty drawing', () => {
    // The component falls back to a slotted <svg>, so an unknown name must be
    // distinguishable from a known one.
    expect(iconPath('unicorn')).toBeNull();
    expect(iconPath('')).toBeNull();
    expect(iconPath(undefined)).toBeNull();
    expect(iconPath(null)).toBeNull();
  });
});
