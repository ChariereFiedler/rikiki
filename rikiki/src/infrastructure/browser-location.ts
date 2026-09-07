// ════════════════════════════════════════════════════════════════
// RIKIKI · infrastructure · the URL fragment
//
// The only implementation of LocationPort, and the only place the engine
// touches `location` or `history` for navigation. Everything above it is
// testable without a browser because of this file.
// ════════════════════════════════════════════════════════════════

import type { LocationPort } from '../application/deep-link.js';

/** Reads and replaces the fragment of the current document. */
export const browserLocation: LocationPort = {
  read() {
    return typeof location === 'undefined' ? '' : location.hash;
  },
  write(hash: string) {
    if (typeof history === 'undefined') return;
    try {
      history.replaceState(null, '', hash);
    } catch {
      // A srcdoc or sandboxed iframe has an opaque origin, and replaceState to a
      // real URL throws SecurityError there. The slide has already changed on
      // screen, so navigation still works · only deep-linking is unavailable,
      // which is the honest outcome for a document with no addressable URL.
    }
  },
};
