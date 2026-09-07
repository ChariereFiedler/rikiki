import { describe, expect, it } from 'vitest';
import { MOUSE_MECHANISMS, mouseEnabled } from './mouse-nav.js';

describe('mouseEnabled', () => {
  it('enables everything by default', () => {
    for (const m of MOUSE_MECHANISMS) {
      expect(mouseEnabled(undefined, m)).toBe(true);
      expect(mouseEnabled(null, m)).toBe(true);
      expect(mouseEnabled('', m)).toBe(true);
      expect(mouseEnabled('all', m)).toBe(true);
    }
  });

  it('disables everything on none', () => {
    // The escape hatch an integrator uses to stop an embedded deck from
    // swallowing the host page's scroll.
    for (const m of MOUSE_MECHANISMS) expect(mouseEnabled('none', m)).toBe(false);
  });

  it('treats anything else as an allowlist', () => {
    expect(mouseEnabled('click wheel', 'click')).toBe(true);
    expect(mouseEnabled('click wheel', 'wheel')).toBe(true);
    expect(mouseEnabled('click wheel', 'arrows')).toBe(false);
    expect(mouseEnabled('click wheel', 'aux')).toBe(false);
  });

  it('tolerates irregular spacing', () => {
    expect(mouseEnabled('  click   aux ', 'aux')).toBe(true);
  });

  it('fails closed on a typo rather than enabling everything', () => {
    // "whel" enables nothing · the safe direction for a knob whose job is to
    // stop the deck from capturing input.
    expect(mouseEnabled('whel', 'wheel')).toBe(false);
    expect(mouseEnabled('whel', 'click')).toBe(false);
  });
});
