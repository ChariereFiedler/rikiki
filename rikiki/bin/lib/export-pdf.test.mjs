import { describe, expect, it } from 'vitest';
import { rootDepthFor } from './export-pdf.mjs';

describe('rootDepthFor', () => {
  it('is 0 for a deck that only references its own folder', () => {
    expect(rootDepthFor('<script src="./app.js"></script>')).toBe(0);
    expect(rootDepthFor('<link rel="stylesheet" href="theme.css">')).toBe(0);
  });

  it('counts the deepest climb, not the first one', () => {
    // decks/tests/*.html reach the framework with ../../dist/index.js · serving
    // only the deck folder would 404 every module and the deck never upgrades.
    const html = '<link href="../theme.css"><script src="../../dist/index.js"></script>';
    expect(rootDepthFor(html)).toBe(2);
  });

  it('ignores a relative path that does not climb', () => {
    expect(rootDepthFor('<img src="assets/../pic.png">')).toBe(0);
  });

  it('ignores an absolute URL', () => {
    expect(rootDepthFor('<script src="https://example.com/../x.js"></script>')).toBe(0);
  });

  it('handles single quotes and extra spacing', () => {
    expect(rootDepthFor("<script src = '../../../a.js'></script>")).toBe(3);
  });
});
