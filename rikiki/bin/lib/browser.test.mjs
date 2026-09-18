import { describe, expect, it } from 'vitest';
import { launchChromium } from './browser.mjs';

const missingExecutable = () =>
  Object.assign(new Error("browserType.launch: Executable doesn't exist at /cache/chromium-1243/chrome"), {});

/** A Playwright `chromium` stand-in that records every launch it is asked for. */
const fakeChromium = (launch) => {
  const calls = [];
  return {
    calls,
    launch: async (options) => {
      calls.push(options);
      return launch(options);
    },
  };
};

describe('launchChromium', () => {
  it('launches the full Chromium build · the headless shell wraps text differently', async () => {
    const chromium = fakeChromium(async () => 'full');
    const notes = [];
    expect(await launchChromium(chromium, (n) => notes.push(n))).toBe('full');
    expect(chromium.calls).toEqual([{ channel: 'chromium' }]);
    expect(notes).toEqual([]);
  });

  it('falls back to the default build, and says so, when the full one is not installed', async () => {
    const chromium = fakeChromium(async (options) => {
      if (options?.channel) throw missingExecutable();
      return 'shell';
    });
    const notes = [];
    expect(await launchChromium(chromium, (n) => notes.push(n))).toBe('shell');
    expect(chromium.calls).toEqual([{ channel: 'chromium' }, undefined]);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('npx playwright install chromium');
  });

  it('does not hide a launch failure that is not a missing browser', async () => {
    const chromium = fakeChromium(async () => {
      throw new Error('Target page, context or browser has been closed');
    });
    await expect(launchChromium(chromium, () => {})).rejects.toThrow('has been closed');
    expect(chromium.calls).toHaveLength(1);
  });
});
