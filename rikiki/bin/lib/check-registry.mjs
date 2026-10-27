// ════════════════════════════════════════════════════════════════
// RIKIKI · every rule `rikiki check` knows, by its code
//
// A deck selects, tunes and silences rules by code (`TEXT_TOO_SMALL`) or by name
// (`text-too-small`), so the check must know every code it can emit · the ones
// it writes itself, the illustration rules and their richness, the findings scenes and diagrams
// write of themselves, the intent proofs, the review criteria. Each comes from
// the table its own rules are written against (`ILL_CODES`, `SCENE_ISSUE_CODES`,
// `INT_CODES`, the review criteria), never from reading source text, so a rule
// added there is known here.
//
// Some findings are about the run, not the deck · a page that threw, a file that
// did not load, a review that could not be read, the check's own configuration.
// They are ALWAYS ON: no selection hides "I could not look".
// ════════════════════════════════════════════════════════════════

import { DECK_MOTIF_CODES } from '../../dist/deck-motifs.js';
import { ILL_CODES } from '../../dist/ill-rules.js';
import { INT_CODES } from '../../dist/intent-specs.js';
import { RICHNESS_CODES } from '../../dist/richness.js';
import { SCENE_ISSUE_CODES } from '../../dist/scene-lint.js';
import { NARRATIVE_CRITERIA } from './narrative.mjs';
import { QUALITY_CRITERIA } from './quality.mjs';

/** What `check.mjs` writes itself, by what it measures. */
const CORE = Object.freeze({
  layout: [
    'CONTENT_CLIPPED',
    'CONTENT_ESCAPES_BOX',
    'CONTENT_NOT_RENDERED',
    'CONTENT_OVERLAPS_SIBLING',
    'SLIDE_DENSE',
    'SCROLL_SLIVER',
    'TEXT_TOO_SMALL',
    'TEXT_LAST_LINE_ORPHAN',
    'ICON_DOUBLED',
  ],
  markup: ['UNKNOWN_ELEMENT', 'UNKNOWN_ATTRIBUTE', 'STRAY_MARKUP', 'DUPLICATE_SLIDE_ID', 'EXTERNAL_DEPENDENCY'],
  talk: ['TALK_SHORTER_THAN_ANNOUNCED'],
  graph: [
    'GRAPH_EDGE_CROSSES_NODE',
    'GRAPH_EDGE_SKEWED',
    'GRAPH_LAYOUT_NOT_SEMANTIC',
    'GRAPH_NODE_COVERS_LABEL',
    'GRAPH_NODE_OUT_OF_BOUNDS',
    'GRAPH_NODE_OVERLAPS_NODE',
    'GRAPH_NODE_SIZES_MIXED',
    'GRAPH_NODES_OFF_AXIS',
  ],
  svg: ['SVG_TEXT_ESCAPES', 'SVG_TEXT_OVERLAP', 'SVG_TEXT_TOO_SMALL', 'SVG_TEXT_CONTRAST_LOW', 'SCENE_FONT_FALLBACK'],
  /** Read off the pixels · only when the visual pass runs. */
  visual: ['SLIDE_TOP_HEAVY'],
  /** About the deck as a whole · two drawings alike, and the motifs that tie slides
   *  (a pair, a camera opened from the slide before, the strip of an act). */
  deck: ['ILL_REPEATED_LOOK', ...DECK_MOTIF_CODES],
});

/** The run itself · the walk, the page, the reviews. */
const RUN = Object.freeze([
  'PAGE_ERROR',
  'RESOURCE_MISSING',
  'NAVIGATION_STALLED',
  'RUNTIME_NOT_LOADED',
  'NO_DECK_ROOT',
  'NO_SLIDES',
  'NARRATIVE_UNAVAILABLE',
  'NARRATIVE_REVIEW_INVALID',
  'QUALITY_REQUIRED',
  'QUALITY_REVIEW_INVALID',
]);

/** The check's own findings · its configuration, its plugins, its exceptions. */
export const CHECK_CODES = Object.freeze([
  'CHECK_CONFIG_INVALID',
  'CHECK_PLUGIN_LOAD_FAILED',
  'CHECK_PLUGIN_FAILED',
  'CHECK_RULE_FAILED',
  'CHECK_SELECTION_UNMATCHED',
  'CHECK_SELECTION_IGNORED',
  'CHECK_OPTION_UNKNOWN',
  'CHECK_SUPPRESSION_UNJUSTIFIED',
  'CHECK_SUPPRESSION_UNKNOWN',
  'CHECK_SUPPRESSION_UNUSED',
  'CHECK_SUPPRESSION_REFUSED',
]);

/** A review criterion as its finding's code · `visual-evidence` is `QUALITY_VISUAL_EVIDENCE`. */
const criterionCode = (prefix, criterion) => `${prefix}_${criterion.replaceAll('-', '_').toUpperCase()}`;

/** The rules every deck can meet, without a plugin · `{ code, origin, alwaysOn }`. */
export const BUILTIN_RULES = Object.freeze(
  [
    ...Object.entries(CORE).flatMap(([origin, codes]) => codes.map((code) => ({ code, origin }))),
    ...ILL_CODES.map((code) => ({ code, origin: 'illustration' })),
    // A measure, said only when asked (`--richness`) · selectable like any rule.
    ...RICHNESS_CODES.map((code) => ({ code, origin: 'richness' })),
    ...SCENE_ISSUE_CODES.map((code) => ({ code, origin: code.startsWith('DG_') ? 'diagram' : 'scene' })),
    ...INT_CODES.map((code) => ({ code, origin: 'intent' })),
    ...NARRATIVE_CRITERIA.map((c) => ({ code: criterionCode('NARRATIVE', c), origin: 'review' })),
    ...QUALITY_CRITERIA.map((c) => ({ code: criterionCode('QUALITY', c), origin: 'review' })),
    ...RUN.map((code) => ({ code, origin: 'run', alwaysOn: true })),
    ...CHECK_CODES.map((code) => ({ code, origin: 'check', alwaysOn: true })),
  ].map((rule) => Object.freeze({ alwaysOn: false, ...rule })),
);

const ALWAYS_ON = new Set(BUILTIN_RULES.filter((r) => r.alwaysOn).map((r) => r.code));

/** Whether a finding is about the run, which no selection hides. */
export const isAlwaysOn = (code) => ALWAYS_ON.has(code) || code.startsWith('CHECK_');

/** The families a plugin may not take as its namespace · they would let it
 *  declare a rule under a built-in name, and be silenced or kept with it. */
export const RESERVED_NAMESPACES = Object.freeze([
  ...new Set(BUILTIN_RULES.map((r) => r.code.split('_')[0])),
]);

/** `TEXT_TOO_SMALL` is named `text-too-small` · both spellings are accepted. */
export const nameOf = (code) => code.toLowerCase().replaceAll('_', '-');
export const codeOf = (name) => name.toUpperCase().replaceAll('-', '_');

/** Codes read off the pixels · a finding only the visual pass can make. */
export const VISUAL_CODES = Object.freeze([...CORE.visual]);
