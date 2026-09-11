import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THRESHOLD,
  boundingBox,
  classifyFiles,
  diffFailed,
  formatDiff,
  rankSlides,
  slideEntry,
  statusForRatio,
  summarize,
} from './diff.mjs';

const measured = ({ changed = 0, total = 100, size = { width: 10, height: 10 }, baselineSize = size, corners = [] }) => ({
  baselineSize,
  size,
  changed,
  total,
  changedCorners: corners,
});

describe('the bounding box of what moved', () => {
  it('is null when nothing moved', () => {
    expect(boundingBox([])).toBe(null);
  });

  it('covers a single pixel', () => {
    expect(boundingBox([{ x: 4, y: 7 }])).toEqual({ left: 4, top: 7, width: 1, height: 1 });
  });

  it('is the smallest rect containing every pixel', () => {
    const pixels = [
      { x: 10, y: 20 },
      { x: 4, y: 30 },
      { x: 12, y: 25 },
      { x: 6, y: 18 },
    ];
    expect(boundingBox(pixels)).toEqual({ left: 4, top: 18, width: 9, height: 13 });
  });

  it('reads the two corners the browser reports exactly like the full list', () => {
    // The in-page pass keeps min/max only · both must describe the same rect.
    const full = [
      { x: 3, y: 5 },
      { x: 9, y: 11 },
      { x: 7, y: 6 },
    ];
    expect(boundingBox([{ x: 3, y: 5 }, { x: 9, y: 11 }])).toEqual(boundingBox(full));
  });
});

describe('the threshold between noise and a change', () => {
  it('defaults to half a percent of the pixels', () => {
    expect(DEFAULT_THRESHOLD).toBe(0.5);
  });

  it('calls a slide exactly at the threshold changed', () => {
    expect(statusForRatio(0.005, 0.5)).toBe('changed');
  });

  it('calls a slide just below the threshold stable', () => {
    expect(statusForRatio(0.00499, 0.5)).toBe('stable');
  });

  it('calls a slide above the threshold changed', () => {
    expect(statusForRatio(0.2, 0.5)).toBe('changed');
  });

  it('keeps an identical slide stable even at --threshold 0', () => {
    // Nothing moved is never a change, whatever the threshold says.
    expect(statusForRatio(0, 0)).toBe('stable');
  });

  it('reports a single changed pixel at --threshold 0', () => {
    expect(statusForRatio(1 / 2_073_600, 0)).toBe('changed');
  });
});

describe('what each side of the comparison has', () => {
  it('pairs the files present on both sides', () => {
    const { compared } = classifyFiles(['01-a.png', '02-b.png'], ['01-a.png', '02-b.png']);
    expect(compared).toEqual(['01-a.png', '02-b.png']);
  });

  it('calls a file only this render has added', () => {
    const { added, compared, missing } = classifyFiles(['01-a.png', '03-c.png'], ['01-a.png']);
    expect(added).toEqual(['03-c.png']);
    expect(compared).toEqual(['01-a.png']);
    expect(missing).toEqual([]);
  });

  it('calls a file only the baseline has missing', () => {
    const { added, missing } = classifyFiles(['01-a.png'], ['01-a.png', '02-b.png']);
    expect(missing).toEqual(['02-b.png']);
    expect(added).toEqual([]);
  });
});

describe('one entry per compared slide', () => {
  it('reports a different canvas as resized, with both sizes and no pixel count', () => {
    const entry = slideEntry(
      '01-a.png',
      measured({ baselineSize: { width: 1920, height: 1080 }, size: { width: 1280, height: 720 } }),
      0.5,
    );
    expect(entry.status).toBe('resized');
    expect(entry.baselineSize).toEqual({ width: 1920, height: 1080 });
    expect(entry.size).toEqual({ width: 1280, height: 720 });
    expect(entry.changedRatio).toBeUndefined();
    expect(entry.box).toBeUndefined();
  });

  it('reports a ratio, a count and a box for a changed slide', () => {
    const entry = slideEntry(
      '02-b.png',
      measured({ changed: 25, total: 100, corners: [{ x: 2, y: 3 }, { x: 6, y: 9 }] }),
      0.5,
      { slide: 2, id: 'b', title: 'Deux' },
    );
    expect(entry).toEqual({
      file: '02-b.png',
      slide: 2,
      id: 'b',
      title: 'Deux',
      status: 'changed',
      changedRatio: 0.25,
      changedPixels: 25,
      totalPixels: 100,
      box: { left: 2, top: 3, width: 5, height: 7 },
    });
  });

  it('reports a stable slide with no box', () => {
    const entry = slideEntry('03-c.png', measured({ changed: 0, total: 100 }), 0.5);
    expect(entry.status).toBe('stable');
    expect(entry.changedRatio).toBe(0);
    expect(entry.box).toBe(null);
  });
});

describe('ranking the slides by how much moved', () => {
  const entries = [
    { file: 'a.png', status: 'stable', changedRatio: 0.001 },
    { file: 'b.png', status: 'changed', changedRatio: 0.4 },
    { file: 'c.png', status: 'changed', changedRatio: 0.12 },
  ];

  it('puts the loudest slide first', () => {
    expect(rankSlides(entries).map((s) => s.file)).toEqual(['b.png', 'c.png', 'a.png']);
  });

  it('leaves the list it was handed alone', () => {
    rankSlides(entries);
    expect(entries.map((s) => s.file)).toEqual(['a.png', 'b.png', 'c.png']);
  });

  it('keeps the slides nobody could measure at the end, in file order', () => {
    const ranked = rankSlides([
      { file: 'z.png', status: 'missing' },
      { file: 'm.png', status: 'added' },
      { file: 'a.png', status: 'changed', changedRatio: 0.02 },
    ]);
    expect(ranked.map((s) => s.file)).toEqual(['a.png', 'm.png', 'z.png']);
  });
});

describe('the summary and the exit code', () => {
  const slides = [
    { file: 'a.png', status: 'changed', changedRatio: 0.4 },
    { file: 'b.png', status: 'stable', changedRatio: 0 },
    { file: 'c.png', status: 'stable', changedRatio: 0 },
    { file: 'd.png', status: 'added' },
    { file: 'e.png', status: 'missing' },
    { file: 'f.png', status: 'resized' },
  ];

  it('counts every status', () => {
    expect(summarize(slides)).toEqual({ changed: 1, stable: 2, added: 1, missing: 1, resized: 1 });
  });

  it('fails on a changed, a missing or a resized slide', () => {
    expect(diffFailed({ changed: 1, stable: 0, added: 0, missing: 0, resized: 0 })).toBe(true);
    expect(diffFailed({ changed: 0, stable: 0, added: 0, missing: 1, resized: 0 })).toBe(true);
    expect(diffFailed({ changed: 0, stable: 0, added: 0, missing: 0, resized: 1 })).toBe(true);
  });

  it('passes when the only surprise is a slide the baseline never had', () => {
    // A new slide is what adding a slide looks like · it is not a regression.
    expect(diffFailed({ changed: 0, stable: 9, added: 1, missing: 0, resized: 0 })).toBe(false);
  });
});

describe('the human report', () => {
  const report = {
    schema: 'rikiki.render-diff/1',
    baseline: '/tmp/base',
    threshold: 0.5,
    slides: [
      {
        file: '07-intro.png',
        title: 'Intro',
        status: 'changed',
        changedRatio: 0.1234,
        box: { left: 120, top: 300, width: 480, height: 90 },
      },
      { file: '02-b.png', status: 'stable', changedRatio: 0.0001 },
      { file: '09-gone.png', status: 'missing' },
      {
        file: '04-wide.png',
        status: 'resized',
        baselineSize: { width: 1920, height: 1080 },
        size: { width: 1280, height: 720 },
      },
    ],
    summary: { changed: 1, stable: 1, added: 0, missing: 1, resized: 1 },
  };

  it('names each changed slide, how much moved and where', () => {
    const text = formatDiff(report);
    expect(text).toContain('12.34%');
    expect(text).toContain('07-intro.png');
    expect(text).toContain('Intro');
    expect(text).toContain('120,300 480×90');
  });

  it('says nothing about the slides that held still', () => {
    expect(formatDiff(report)).not.toContain('02-b.png');
  });

  it('names the slides nobody could compare', () => {
    const text = formatDiff(report);
    expect(text).toContain('missing 09-gone.png');
    expect(text).toContain('1920×1080 → 1280×720');
  });

  it('ends on the counts', () => {
    const last = formatDiff(report).trim().split('\n').at(-1);
    expect(last).toContain('1 changed');
    expect(last).toContain('1 stable');
    expect(last).toContain('1 missing');
    expect(last).toContain('1 resized');
  });
});
