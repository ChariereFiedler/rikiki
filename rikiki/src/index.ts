// ════════════════════════════════════════════════════════════════
// RIKIKI · entry point
// Imports every component. Load after tokens.css (or a theme file).
//
// Sources are organised by FAMILY · what a component serves, not how big
// it is (ADR-004). engine/ pilots the deck, layout/ frames a whole slide,
// structure/ arranges blocks inside one, text/ is what a slide says, data/
// what it proves, media/ what it embeds or draws. shared/ holds only what
// two families use.
//
// THIS FILE IS THE MANIFEST. What it imports is the default bundle; every
// other registered element is opt-in, and the deck loads it itself. Being
// opt-in is recorded here rather than by living in a directory ·
// scripts/component-surfaces.mjs derives both lists from these imports.
//
// The built dist/ stays flat whatever the family (see build.mjs).
// ════════════════════════════════════════════════════════════════

// Engine · orchestrators, hidden chrome
import './engine/deck-root.js';
import './engine/deck-transition.js';
import './engine/deck-help.js';
import './engine/deck-overview.js';
import './engine/deck-presenter.js';
import './engine/deck-notes.js';

// Layout · the frame of a whole slide
import './layout/deck-cover.js';
import './layout/deck-section.js';
import './layout/deck-feature.js';
import './layout/deck-split.js';
import './layout/deck-feature-cards.js';
import './layout/deck-photo.js';
import './layout/deck-takeaway.js';

// Structure · how blocks are arranged inside one
import './structure/deck-bento.js';
import './structure/deck-cell.js';
import './structure/deck-point.js';
import './structure/deck-grid.js';
import './structure/deck-stack.js';
import './structure/deck-card.js';
import './structure/deck-source.js';

// Text · what a slide says
import './text/deck-md.js';
import './text/deck-callout.js';
import './text/deck-fit.js';
import './text/deck-badge.js';
import './text/deck-kicker.js';
import './text/deck-punch.js';

// Data · what it proves
import './data/deck-stat.js';
import './data/deck-metric.js';
import './data/deck-tier-list.js';
import './data/deck-step-list.js';
import './data/deck-shortcut.js';
import './data/deck-csv.js';

// Media · what it embeds or draws
import './media/deck-code.js';
import './media/deck-mermaid.js';

// Public extension API · the plugin hook contract (deckRoot.use) and the
// deck-code highlighter hook, re-exported so authors import them from the one
// bundle they already load (importing from the per-component dist files would
// double-define the elements those files register).
export type { DeckPlugin, DeckContext } from './engine/deck-root.js';
export type { DeckCodeHighlighter } from './media/deck-code.js';
export { setDeckCodeHighlighter } from './media/deck-code-highlighter.js';

// Mermaid optionnel (chargé via CDN si <deck-mermaid> est présent)
// Voir starter.html pour l'init mermaid.

// Livereload · opt-in via ?live · le poller n'est chargé que sur demande.
// (Sinon, charger directement dist/livereload.js l'active aussi.)
if (new URLSearchParams(location.search).has('live')) {
  import('./engine/livereload.js');
}
