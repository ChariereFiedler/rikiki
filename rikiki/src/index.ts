// ════════════════════════════════════════════════════════════════
// RIKIKI · entry point
// Imports every component. Load after tokens.css (or a theme file).
//
// Sources are organised by design-system bucket · runtime/ pilots the
// deck, layouts/ are slide-level containers, molecules/ are composed
// containers, atoms/ are primitives. plugins/ stays opt-in (not
// imported here · consumers call installShiki() etc. themselves).
// The built dist/ stays flat for distribution simplicity.
// ════════════════════════════════════════════════════════════════

// Runtime · orchestrators, hidden chrome
import './engine/deck-root.js';
import './engine/deck-transition.js';
import './engine/deck-help.js';
import './engine/deck-overview.js';
import './engine/deck-presenter.js';
import './engine/deck-notes.js';

// Layouts · slide-level
import './layout/deck-cover.js';
import './layout/deck-section.js';
import './layout/deck-feature.js';
import './layout/deck-split.js';
import './layout/deck-feature-cards.js';
import './layout/deck-photo.js';
import './layout/deck-takeaway.js';
import './structure/deck-bento.js';

// Molecules · containers, multi-slot, lifecycle
import './molecules/deck-callout.js';
import './structure/deck-card.js';
import './molecules/deck-md.js';
import './molecules/deck-mermaid.js';
import './molecules/deck-stat.js';
import './molecules/deck-metric.js';
import './molecules/deck-tier-list.js';
import './molecules/deck-step-list.js';
import './molecules/deck-shortcut.js';
import './structure/deck-stack.js';
import './structure/deck-grid.js';
import './structure/deck-cell.js';
import './structure/deck-point.js';
import './molecules/deck-fit.js';
import './molecules/deck-csv.js';

// Atoms · primitives
import './atoms/deck-badge.js';
import './atoms/deck-kicker.js';
import './atoms/deck-punch.js';
import './atoms/deck-code.js';
import './structure/deck-source.js';

// Public extension API · the plugin hook contract (deckRoot.use) and the
// deck-code highlighter hook, re-exported so authors import them from the one
// bundle they already load (importing from the per-component dist files would
// double-define the elements those files register).
export type { DeckPlugin, DeckContext } from './engine/deck-root.js';
export type { DeckCodeHighlighter } from './atoms/deck-code.js';
export { setDeckCodeHighlighter } from './atoms/deck-code-highlighter.js';

// Mermaid optionnel (chargé via CDN si <deck-mermaid> est présent)
// Voir starter.html pour l'init mermaid.

// Livereload · opt-in via ?live · le poller n'est chargé que sur demande.
// (Sinon, charger directement dist/livereload.js l'active aussi.)
if (new URLSearchParams(location.search).has('live')) {
  import('./engine/livereload.js');
}
