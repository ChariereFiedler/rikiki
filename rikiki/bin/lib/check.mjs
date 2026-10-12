// ════════════════════════════════════════════════════════════════
// rikiki check · what is wrong with this deck, said in a way you can act on.
//
// A picture shows a problem; it does not name the element. This measures the
// deck in a real browser and reports each finding with a stable code, the slide
// it belongs to, a path that reaches inside the Shadow DOM, and the number that
// justifies it. The JSON shape is versioned because an agent parses it.
//
// What it deliberately does not do: call a slide bad for being sparse, or claim
// a deck is accessible. Empty space is a choice, and four measurements are not
// an accessibility audit.
// ════════════════════════════════════════════════════════════════

import { basename } from 'node:path';
import { capacityOf } from '../../dist/scene-capacity.js';
import { ILL_LIMITS, lintIllustration, scoreIssues } from '../../dist/ill-rules.js';
import { deckMotifIssues } from '../../dist/deck-motifs.js';
import { measureDiversity, repeatedLookIssues, signatureFromInk } from '../../dist/diversity.js';
import { RICHNESS_CRITERIA, measureRichness, modelRepeatIssues, richnessIssues, wordsByMark } from '../../dist/richness.js';
import { reviewQuality } from './quality.mjs';
import { readFileSync } from 'node:fs';
import { NAVIGATION_TIMEOUT_MS, PAGE_LOAD_TIMEOUT_MS, SLIDE_TITLE_READER, advanceStep, goToSlide, waitForStillFrame, withDeck } from './browser.mjs';
import { BOX_GEOMETRY_READER } from './box-geometry.mjs';
import { GRAPH_GEOMETRY_READER } from './graph-hit.mjs';
import { selectSlides } from './slide-selector.mjs';
import { measureSlides } from './visual.mjs';
import { scanExternal } from './scan-external.mjs';
import { resolveCheckPlugins, startCheckPlugins, runCheckPlugins, pluginReport } from './check-plugins.mjs';
import { loadCheckConfig } from './check-config.mjs';
import {
  applyPolicy,
  buildPolicy,
  decide,
  exceptionFindings,
  optionFindings,
  readExceptions,
  resolveOverrides,
  scopeOf,
  selectionFindings,
} from './check-policy.mjs';
import { BUILTIN_RULES, VISUAL_CODES, codeOf, nameOf } from './check-registry.mjs';
import { ELEMENT_PATH_READER } from './element-path.mjs';
import { collectNarrative, narrativeRequest, applyNarrativeReview } from './narrative.mjs';

export const REPORT_SCHEMA = 1;

export const SEVERITY = { error: 'error', warning: 'warning' };

// Thresholds are named, not scattered · each says what a reader would notice.
const LIMITS = {
  // Speech runs at 130 to 160 words a minute at a normal pace, and public
  // speaking on technical material sits lower, around 100 to 120. A deck is
  // measured against the slower end: what a room can follow, not what a
  // speaker can articulate.
  wordsPerMinute: 120,
  // The gap that is worth a word. Below this the estimate is noise: how much
  // someone says around a slide varies more than any measurement can capture.
  talkLengthTolerance: 0.5,
  // Under this, the back row of a room cannot read it. Measured against the
  // deck's own canvas, so it holds whatever the projector does.
  minTextPx: 18,
  // A slide whose content spans more than this much of its height has nothing
  // left to breathe · it reads as a wall.
  denseFillRatio: 0.92,
  // One pixel of clipping is a rounding artefact; a lost line is not.
  clipPx: 4,
  // A dead band under the content, as a share of the slide height. Empty space
  // is a choice; a third of the slide empty *below* a full top is a slide that
  // forgot to distribute itself. Measured on the pixels, chrome excluded.
  tailBand: 0.3,
  // How far the ink may sit above centre before the slide reads as top-heavy.
  verticalBias: -0.1,
  // Below this a box is a label or an icon, not a block worth comparing
  // against its neighbours · an <em> inside an <h1> must never count.
  paintedBoxMinWidth: 40,
  paintedBoxMinHeight: 20,
  // Two boxes sharing a few pixels at a corner is normal layout slop; sharing
  // this many on both axes is one painted over the other.
  siblingOverlapPx: 8,
  // Under a pixel, two coordinates are the same coordinate · a percentage
  // resolved into device pixels lands a hair apart and means nothing by it.
  graphAlignFloorPx: 1,
  // How far apart two graph centres may sit and still read as an attempt at
  // the same row or the same column. A few tens of pixels on a 1920 canvas is
  // the band where the eye says "almost" · beyond it the author moved the node
  // somewhere else on purpose.
  graphAlignSlackPx: 24,
  // An edge whose smaller delta is under this share of its larger one was
  // aiming at horizontal or vertical. Above it the line is a diagonal, and a
  // diagonal is a choice nobody needs told about.
  graphSkewRatio: 0.3,
  // Two nodes of one row differing by less than this share read as a failed
  // attempt at the same size; differing by more reads as a deliberate
  // hierarchy. Paired with a floor, because text metrics move a box by a
  // pixel or two on nothing but the glyphs in it.
  graphSizeSlack: 0.3,
  graphSizeFloorPx: 3,
  // Below three nodes, one row is not an arrangement · two nodes side by side
  // are just two nodes, and `layout` would say less than the coordinates do.
  graphSemanticMinNodes: 3,
  // A last line narrower than this share of the widest one is a stub hanging
  // under the block · the classic orphan of a slide.
  orphanLineRatio: 0.25,
  // Under this many words there is no paragraph to break badly: a two-word
  // label wrapping is the layout, not a typographic accident.
  orphanMinWords: 8,
  // A component's own icon (a callout's chip, a checklist mark) is drawn at
  // icon size · anything larger in its shadow tree is a diagram or a canvas,
  // not a second icon competing with an emoji. Canvas pixels.
  iconMaxPx: 96,
  // A box that scrolls by less than one of its own lines was never meant to
  // scroll · the slide is a hair too full and the room sees a scrollbar for a
  // sliver. A line or more may be a deliberate scroll, and is left alone.
  scrollSliverLines: 1,
  // A drawn label is placed by hand, to the unit, and its box is the font's
  // own cell · a glyph overshooting by a pixel is the typeface, two more is a
  // word that no longer fits the shape it was written into. Screen pixels.
  svgTextPx: 2,
  // A drawing that went wrong goes wrong everywhere at once: past a handful of
  // labels, more lines say nothing the first ones did not.
  svgFindingsPerSlide: 5,
  // WCAG contrast of a drawn label against what is behind it · 4.5 for text, 3
  // for large text (24px, or 18.7px bold).
  svgContrast: 4.5,
  svgContrastLarge: 3,
};

/** The thresholds a deck's policy sets (`check.limits`), over the built-in ones ·
 *  a check threshold by its name (`minTextPx`), an illustration one prefixed
 *  (`ill.words`). A name that is neither is said, never silently ignored. */
function limitsOf(asked) {
  const core = { ...LIMITS };
  const ill = {};
  const unknown = [];
  for (const [key, value] of Object.entries(asked)) {
    if (key.startsWith('ill.') && Object.hasOwn(ILL_LIMITS, key.slice(4))) ill[key.slice(4)] = value;
    else if (Object.hasOwn(LIMITS, key)) core[key] = value;
    else unknown.push(key);
  }
  return { limits: { ...core, ...(Object.keys(ill).length ? { ill } : {}) }, unknown };
}

const diagnostic = (code, severity, message, extra = {}) => ({
  code,
  severity,
  message,
  ...extra,
});

/** What to do about a scene finding · for a field that did not fit, the fix of
 *  that field (a figure is not shortened like a note). */
const FIELD_FIXES = {
  figure: 'the figure is too wide even at the smallest size a figure shrinks to · write a shorter `tag`, drop the unit, or draw fewer bars so each gets wider',
  label: 'shorten the label of that item (one to three words) · the detail goes in the note',
  note: 'shorten the note of that item to one short sentence',
  caption: "shorten the group's `note`, which is its caption",
  tag: 'shorten the `tag` of that item',
  text: 'shorten the label or the note of that item',
};

/** What to say about an illustration finding, by how serious it is · the number
 *  and the fix are in the finding itself. */
const ILL_ADVICE = {
  error: 'the drawing is wrong, not merely unbalanced · fix it before shipping, whatever its score',
  warning: 'balance is judged, not proven · fix it, or say the drawing is meant to be so (`balance="free"`)',
};

/** What a reader (an agent, usually) can act on without parsing the message · the
 *  action, and the numbers that size it. Null where the code has no number to give. */
const sceneFix = (issue) => {
  switch (issue.code) {
    case 'SCENE_TEXT_TOO_LONG': {
      const scene = issue.scene;
      const targets = (issue.fields ?? []).map((f) => ({
        item: f.item,
        field: f.field,
        chars: f.text ? f.text.length : null,
        // How much that field holds here, measured on the real fonts · null for
        // a field the table does not cover (a figure, a caption).
        holds: scene ? capacityOf(scene.kind, scene.width, scene.count, f.field) : null,
        needsUnits: f.measured === undefined ? null : Math.round(f.measured),
        hasUnits: f.budget === undefined ? null : Math.round(f.budget),
      }));
      return { action: 'shorten', targets };
    }
    case 'SCENE_ITEMS_DROPPED':
      return { action: 'remove-items', items: issue.items };
    case 'SCENE_TOO_TALL':
      return { action: 'reduce-height', options: ['remove-items', 'split-slide'] };
    case 'SCENE_REGION_TOO_NARROW':
      return { action: 'widen-region', regions: issue.items, options: ['split', 'stack', 'fewer-scenes'] };
    case 'SCENE_VALUE_CLIPPED':
      return { action: 'raise-scale', items: issue.items, options: ['max', 'scale'] };
    default:
      // A diagram's findings (DG_*) carry their own fix, sized by the diagram.
      return issue.fix ?? null;
  }
};

/** What a diagram wrote of itself on its svg · null for any other drawing, or for
 *  an attribute that is not the diagram's JSON (a hand-written one). */
const declaredSignature = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** A diagram's intent finding · the drawing does not show what it declares. */
const isMeaning = (issue) => issue.code.startsWith('INT_');

/** What an intent finding takes off the `meaning` facet of its drawing. */
const MEANING_COST = { error: 50, warning: 10 };

/** How far a drawing demonstrates the intent it declares, read off the `INT_*`
 *  findings its diagram wrote · 100 for a drawing with none, or with no intent. */
const meaningOf = (illustration, sceneIssues) => {
  const found = sceneIssues.filter((s) => s.path === illustration.path && isMeaning(s));
  const errors = found.filter((s) => s.severity === SEVERITY.error).length;
  const facet = Math.max(0, 100 - found.reduce((sum, s) => sum + MEANING_COST[s.severity], 0));
  return { errors, facet };
};

const sceneSuggestion = (issue, fields, fix) => {
  if (isMeaning(issue) && issue.severity === SEVERITY.error)
    return 'the drawing does not demonstrate its intent · a defect of meaning fails the picture whatever its score · `rikiki intent <name>` prints a diagram that does';
  if (issue.code === 'SCENE_TEXT_TOO_LONG') {
    const fixes = [...new Set(fields.map((f) => FIELD_FIXES[f.field] ?? FIELD_FIXES.text))];
    const sized = (fix?.targets ?? [])
      .filter((t) => t.holds !== null && t.chars !== null)
      .map((t) => `${t.item} · ${t.field} is ${t.chars} characters, about ${t.holds} fit here`);
    const sizes = sized.length ? ` · ${sized.join('; ')}` : '';
    return `${fixes.join(' · ')}${sizes} · the scene already tried smaller sizes, and a scene does not grow`;
  }
  return issue.severity === SEVERITY.error
    ? 'the slide shows a picture that looks finished and is not · fix the attribute before shipping'
    : 'a writing rule, not a defect · the picture is drawn as written';
};

/** Everything the page can tell us about itself, in one round trip.
 *
 *  `only` is the 1-based slide to measure · `deck-root` lays out the slide on
 *  screen and hides the rest, so measuring the whole document at once reads
 *  empty rects everywhere but there. The caller walks the deck and names one
 *  slide per call; `null` measures them all, which is right only on a page
 *  that never settled.
 *
 *  `scanDocument` covers what does not depend on which slide is showing ·
 *  unknown tags, stray attributes, unslotted content, the notes word count.
 *  Asking for them once per slide would walk the whole document N times over
 *  for the same answer. */
const inspectPage = ({ limits, titleReader, graphGeometry, boxGeometry, pathReader, scopeSelectors = [], only = null, scanDocument = true }) => {
  const titleOf = new Function('return ' + titleReader)();
  /** `parseGraphPath` and `polylineHitsRect` from bin/lib/graph-hit.mjs · this
   *  function runs in the page, so they arrive as source and are rebuilt here.
   *  They are unit tested on the node side. */
  const geometry = new Function('return ' + graphGeometry)();
  /** `escapeOf`, `overlapOf`, `encloses`, `mapBox` and `smallestContaining`
   *  from bin/lib/box-geometry.mjs · same reason, same node-side tests. */
  const boxGeom = new Function('return ' + boxGeometry)();
  const root = document.querySelector('deck-root');
  const slides = root
    ? Array.from(root.children).filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
    : [];

  /** A selector a human can paste and an agent can search for · `pathOf` of
   *  bin/lib/element-path.mjs, the one the plugin bridge uses too. */
  const pathOf = new Function('return ' + pathReader)();

  /** Every box that clips, light DOM and shadow alike · asked of the computed
   *  style rather than of a list of class names that happened to clip once. */
  const clippersIn = (slide) => {
    const found = [];
    const seen = new Set();
    const collect = (node) => {
      for (const el of node.querySelectorAll('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        const overflow = getComputedStyle(el).overflow;
        if (overflow === 'hidden' || overflow === 'clip') found.push(el);
        if (el.shadowRoot) collect(el.shadowRoot);
      }
    };
    found.push(slide);
    if (slide.shadowRoot) collect(slide.shadowRoot);
    collect(slide);
    return found;
  };

  /** Boxes that scroll (overflow auto/scroll) and do overflow, shadow trees
   *  included · the scrolling twin of `clippersIn`. Layout pixels, so the
   *  zoom-to-fit scale moves neither the overflow nor the line it is compared
   *  against. */
  const scrollersIn = (slide) => {
    const found = [];
    const collect = (node) => {
      for (const el of node.querySelectorAll('*')) {
        if (el.shadowRoot) collect(el.shadowRoot);
        const style = getComputedStyle(el);
        const y = /auto|scroll/.test(style.overflowY) ? el.scrollHeight - el.clientHeight : 0;
        const x = /auto|scroll/.test(style.overflowX) ? el.scrollWidth - el.clientWidth : 0;
        if (y <= 1 && x <= 1) continue;
        const line = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
        found.push({ el, y: Math.max(0, y), x: Math.max(0, x), line });
      }
    };
    collect(slide);
    return found;
  };

  /** Does `el` sit inside one of `tags`, at any depth? Shadow boundaries
   *  crossed via the host, same walk as `pathOf`. Any depth and not just the
   *  nearest one: a graph node's own label is two levels below `deck-graph`,
   *  and stopping at the first `deck-*` ancestor let it through. */
  const isInside = (el, tags) => {
    let node = el.parentElement ?? el.getRootNode()?.host ?? null;
    while (node) {
      const tag = node.tagName?.toLowerCase();
      if (tag && tags.has(tag)) return true;
      node = node.parentElement ?? node.getRootNode()?.host ?? null;
    }
    return false;
  };

  /** Components that paint marks and nodes over each other by design, and
   *  report it under their own codes · nothing inside them is a painted box
   *  to compare against its neighbours. */
  const PAINTS_OVER_ITSELF = new Set(['deck-annotate', 'deck-graph']);

  /** Is `node` `ancestorEl` itself, or reached by walking up from it? Shadow
   *  boundaries crossed via the host, same as `pathOf`. */
  const containsAcrossShadow = (ancestorEl, node) => {
    let current = node;
    while (current) {
      if (current === ancestorEl) return true;
      current = current.parentElement ?? current.getRootNode()?.host ?? null;
    }
    return false;
  };

  const textHead = (el) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 36);

  /** Every box worth comparing against its neighbours: rendered, in normal
   *  flow, big enough to be more than a label, and carrying words · light DOM
   *  and shadow alike, same walk as `clippersIn`. `deck-notes` is never shown,
   *  and `deck-annotate` / `deck-graph` paint marks and nodes on top of each
   *  other by design and have their own codes, so their internals are not
   *  painted boxes here. */
  const paintedBoxesIn = (slide) => {
    const boxes = [{ el: slide, rect: slide.getBoundingClientRect() }];
    const seen = new Set();
    const collect = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.shadowRoot) collect(el.shadowRoot);
        if (el.tagName.toLowerCase() === 'deck-notes') continue;
        if (el.closest?.('deck-notes')) continue;
        if (isInside(el, PAINTS_OVER_ITSELF)) continue;
        // Inside a drawing, a label is placed by coordinates, not laid out ·
        // it is measured against the shape it is written in, by the
        // SVG_TEXT_* codes, and saying it twice under a layout code is noise.
        if (el.ownerSVGElement) continue;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (style.position === 'absolute' || style.position === 'fixed') continue;
        // An inline run (em, strong, a plain link inside a sentence) is not a
        // box an author laid out · its rect follows the line box of the font
        // actually used for that run, which an italic or bold face can offset
        // from its parent's by a dozen px on nothing but metrics. Comparing it
        // against its container reports the font, not a defect.
        if (style.display === 'inline') continue;
        const rect = el.getBoundingClientRect();
        if (!(rect.width > limits.paintedBoxMinWidth && rect.height > limits.paintedBoxMinHeight)) continue;
        if (!el.textContent?.trim()) continue;
        boxes.push({ el, rect });
      }
    };
    collect(slide);
    return boxes;
  };

  /** The worst `CONTENT_ESCAPES_BOX` offender on a slide: a painted box whose
   *  rect leaves its nearest painted ancestor by more than `clipPx`, skipping
   *  any ancestor that already clips · that is `CONTENT_CLIPPED`'s job. */
  const worstEscape = (boxes) => {
    const boxSet = new Set(boxes.map((b) => b.el));
    let worst = null;
    for (const box of boxes) {
      if (box.el === boxes[0].el) continue; // the slide itself has no ancestor here
      let ancestorEl = box.el.parentElement ?? box.el.getRootNode()?.host ?? null;
      while (ancestorEl && !boxSet.has(ancestorEl)) {
        ancestorEl = ancestorEl.parentElement ?? ancestorEl.getRootNode()?.host ?? null;
      }
      if (!ancestorEl) continue;
      const overflow = getComputedStyle(ancestorEl).overflow;
      if (overflow === 'hidden' || overflow === 'clip') continue;
      const ancestorBox = boxes.find((b) => b.el === ancestorEl);
      const escape = boxGeom.escapeOf(box.rect, ancestorBox.rect);
      if (escape.pixels > limits.clipPx && escape.pixels > (worst?.pixels ?? 0)) {
        worst = {
          pixels: Math.round(escape.pixels),
          path: pathOf(box.el),
          text: textHead(box.el),
          containerPath: pathOf(ancestorEl),
          containerText: textHead(ancestorEl),
        };
      }
    }
    return worst;
  };

  /** The worst `CONTENT_OVERLAPS_SIBLING` offender on a slide: two painted
   *  boxes, neither containing the other in the DOM and neither enclosing the
   *  other, whose rects intersect by more than `siblingOverlapPx` on both
   *  axes. Ranked by overlapping area. */
  const worstOverlap = (boxes) => {
    let worst = null;
    for (let i = 1; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (containsAcrossShadow(a.el, b.el) || containsAcrossShadow(b.el, a.el)) continue;
        const overlap = boxGeom.overlapOf(a.rect, b.rect);
        if (overlap.x <= limits.siblingOverlapPx || overlap.y <= limits.siblingOverlapPx) continue;
        if (boxGeom.encloses(a.rect, b.rect) || boxGeom.encloses(b.rect, a.rect)) continue;
        const area = overlap.x * overlap.y;
        if (area > (worst?.area ?? 0)) {
          worst = {
            area,
            overlap: { x: Math.round(overlap.x), y: Math.round(overlap.y) },
            pathA: pathOf(a.el),
            textA: textHead(a.el),
            pathB: pathOf(b.el),
            textB: textHead(b.el),
          };
        }
      }
    }
    return worst;
  };

  /** Where a component re-renders the author's own prose into its shadow tree ·
   *  the lines the browser broke are in there, not in the light DOM. */
  const PROSE_IN_SHADOW = new Set(['deck-md']);

  /** Text whose line breaks are not the browser's to judge: a code listing
   *  breaks where it was typed, a diagram and a table lay their own text out,
   *  and notes are never shown. */
  const NOT_PROSE = new Set(['deck-notes', 'deck-code', 'deck-mermaid', 'deck-table', 'deck-graph', 'deck-annotate']);
  const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  const INLINE_DISPLAY = new Set(['inline', 'inline-block', 'inline-flex', 'contents']);

  /** The words the browser put on the line starting at `lineTop` · measured
   *  one word at a time, because nothing short of a rect says where a line
   *  actually broke. Only ever asked of the block already found guilty. */
  const wordsOnLine = (el, lineTop) => {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const m of (node.textContent ?? '').matchAll(/\S+/g)) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const r = range.getBoundingClientRect();
        if (r.height && Math.abs(r.top - lineTop) < r.height / 2) out.push(m[0]);
      }
    }
    return out.join(' ');
  };

  /** The worst `TEXT_LAST_LINE_ORPHAN` offender on a slide: a block of prose
   *  whose last line is a stub of the ones above it.
   *
   *  The lines are read with a Range over the block's own contents · the
   *  stylesheet says where text *may* break, only the painted rects say where
   *  it did. Headings and short blocks are left alone: a title wrapping onto a
   *  second line is the composition, not an accident. */
  const worstOrphan = (slide) => {
    let worst = null;
    const consider = (el) => {
      const tag = el.tagName.toLowerCase();
      if (HEADINGS.has(tag) || NOT_PROSE.has(tag) || isInside(el, NOT_PROSE)) return;
      if (el.ownerSVGElement) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (INLINE_DISPLAY.has(style.display)) return;
      if (style.whiteSpace.startsWith('pre')) return;
      // A container is judged through its children, never as one block: a
      // Range over it would read every line of every paragraph it holds and
      // call the last one an orphan of the first.
      for (const child of el.children) {
        if (!INLINE_DISPLAY.has(getComputedStyle(child).display)) return;
      }
      const words = ((el.textContent ?? '').match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
      if (words < limits.orphanMinWords) return;

      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (rects.length < 2) return;
      // Several rects share one line · an <em> mid-sentence is a rect of its
      // own, not a line of its own.
      const lines = [];
      for (const r of rects) {
        const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
        if (line) {
          line.left = Math.min(line.left, r.left);
          line.right = Math.max(line.right, r.right);
        } else {
          lines.push({ top: r.top, left: r.left, right: r.right });
        }
      }
      if (lines.length < 2) return;
      const last = lines[lines.length - 1];
      const widest = Math.max(...lines.map((l) => l.right - l.left));
      if (!widest) return;
      const ratio = (last.right - last.left) / widest;
      if (ratio >= limits.orphanLineRatio) return;
      if (ratio < (worst?.ratio ?? Number.POSITIVE_INFINITY)) {
        worst = { ratio, lines: lines.length, path: pathOf(el), tail: wordsOnLine(el, last.top).slice(0, 40) };
      }
    };

    const seen = new Set();
    const scan = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.shadowRoot && PROSE_IN_SHADOW.has(el.tagName.toLowerCase())) scan(el.shadowRoot);
        consider(el);
      }
    };
    scan(slide);
    return worst;
  };

  /** Every element of a slide, light DOM and open shadow trees at any depth ·
   *  the slide's own shadow tree included. Notes are never shown. */
  const everythingIn = (slide) => {
    const found = [];
    const seen = new Set();
    const collect = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.shadowRoot) collect(el.shadowRoot);
        if (!el.closest('deck-notes')) found.push(el);
      }
    };
    if (slide.shadowRoot) collect(slide.shadowRoot);
    collect(slide);
    return found;
  };

  /** SVG containers whose content is a definition, never painted where it
   *  stands · a <rect> in a <clipPath> is a shape, not a box on the slide. */
  const SVG_NOT_PAINTED = new Set(['defs', 'clipPath', 'mask', 'pattern', 'symbol', 'marker']);

  /** Is this element of `svg` on screen at all? `display: none` on it or on
   *  any group above it, `visibility: hidden`, and sitting in a definition all
   *  say no. Walked by hand: `checkVisibility()` answers true for a <text>
   *  inside a hidden <g>. */
  const isDrawnIn = (el, svg) => {
    for (let node = el; node && node !== svg; node = node.parentElement) {
      if (SVG_NOT_PAINTED.has(node.localName)) return false;
      if (getComputedStyle(node).display === 'none') return false;
    }
    return getComputedStyle(el).visibility !== 'hidden';
  };

  /** The screen rect of an SVG element's box (its `getBBox()` unless told
   *  otherwise) · every transform above it, the viewBox and the slide's
   *  fit-to-screen scale included. Null for a box with no area, which draws
   *  nothing worth comparing. */
  const screenBoxOf = (el, local = el.getBBox()) => {
    const matrix = el.getScreenCTM();
    if (!matrix) return null;
    const box = boxGeom.mapBox(local, matrix);
    return box.right - box.left > 0 && box.bottom - box.top > 0 ? box : null;
  };

  /** The box a label inks, in its own user space. `getBBox()` stacks the
   *  font's whole line cell, internal leading included · two lines of a
   *  hand-drawn caption set 28 units apart at 25px have cells that overlap by
   *  three pixels while their letters are well clear of each other, and a
   *  pill drawn snug around a word reads as escaped. Across, the advance is
   *  kept; up and down, the glyphs' own ascent and descent around the
   *  baseline replace the cell. A label spread over several baselines keeps
   *  its cell: one glyph measure does not describe two lines. */
  const inkContext = document.createElement('canvas').getContext('2d');
  const inkBoxOf = (text) => {
    const box = text.getBBox();
    const chars = text.getNumberOfChars();
    const baseline = text.getStartPositionOfChar(0).y;
    if (text.getStartPositionOfChar(chars - 1).y !== baseline) return box;
    const style = getComputedStyle(text);
    inkContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const ink = inkContext.measureText(text.textContent.trim());
    const height = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    if (!(height > 0)) return box;
    return { x: box.x, width: box.width, y: baseline - ink.actualBoundingBoxAscent, height };
  };

  /** Where a <text> is anchored, on screen: the first baseline, at the x its
   *  `text-anchor` hangs it from. A centred label that outgrows its pill on
   *  both sides is still anchored inside the pill, which is how the pill is
   *  found. */
  const ANCHOR_SHARE = { start: 0, middle: 0.5, end: 1 };
  const anchorOf = (text) => {
    const box = text.getBBox();
    const baseline = text.getStartPositionOfChar(0).y;
    const share = ANCHOR_SHARE[getComputedStyle(text).textAnchor] ?? 0;
    const local = { x: box.x + box.width * share, y: baseline, width: 0, height: 0 };
    const point = boxGeom.mapBox(local, text.getScreenCTM());
    return { x: point.left, y: point.top };
  };

  /** The frame a drawing promises to stay inside: its viewBox, on screen. An
   *  <svg> without one is framed by its own box. */
  const frameOf = (svg) => {
    const viewBox = svg.viewBox?.baseVal;
    const matrix = svg.getScreenCTM();
    if (!viewBox?.width || !viewBox?.height || !matrix) return svg.getBoundingClientRect();
    return boxGeom.mapBox(viewBox, matrix);
  };

  /** A shape a label can be written into: painted (a fill or a stroke), drawn,
   *  and with an area. */
  const shapesOf = (svg) => [...svg.querySelectorAll('rect, circle')]
    .filter((shape) => {
      const style = getComputedStyle(shape);
      return (style.fill !== 'none' || style.stroke !== 'none') && isDrawnIn(shape, svg);
    })
    .map((shape) => {
      const box = screenBoxOf(shape);
      return box && { el: shape, ...box };
    })
    .filter(Boolean);

  /** Every label of a drawing worth measuring: words in it, drawn, with an
   *  area. Its box is the ink it lays down, on screen. */
  const labelsOf = (svg) => [...svg.querySelectorAll('text')]
    .filter((text) => text.textContent.trim() && text.getNumberOfChars() && isDrawnIn(text, svg))
    .map((text) => ({ el: text, box: screenBoxOf(text, inkBoxOf(text)) }))
    .filter((label) => label.box);

  /** `SVG_TEXT_ESCAPES` for one drawing: each label that leaves the shape it
   *  is anchored in, or the drawing's viewBox, by more than `svgTextPx`. The
   *  worse of the two is what is reported. */
  const svgEscapesIn = (svg, labels) => {
    const shapes = shapesOf(svg);
    const found = [];
    for (const label of labels) {
      const frame = frameOf(label.el.ownerSVGElement ?? svg);
      const past = { against: 'viewBox', pixels: boxGeom.escapeOf(label.box, frame).pixels, shapePath: null };
      const shape = boxGeom.smallestContaining(shapes, anchorOf(label.el));
      const pastShape = shape ? boxGeom.escapeOf(label.box, shape).pixels : 0;
      if (pastShape > past.pixels) Object.assign(past, { against: shape.el.localName, pixels: pastShape, shapePath: pathOf(shape.el) });
      if (past.pixels <= limits.svgTextPx) continue;
      found.push({ ...past, pixels: Math.round(past.pixels), path: pathOf(label.el), text: textHead(label.el) });
    }
    return found;
  };

  /** `SVG_TEXT_OVERLAP` for one drawing: two labels whose boxes share more
   *  than `svgTextPx` on both axes. */
  const svgOverlapsIn = (labels) => {
    const found = [];
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const overlap = boxGeom.overlapOf(labels[i].box, labels[j].box);
        if (overlap.x <= limits.svgTextPx || overlap.y <= limits.svgTextPx) continue;
        found.push({
          area: overlap.x * overlap.y,
          overlap: { x: Math.round(overlap.x), y: Math.round(overlap.y) },
          pathA: pathOf(labels[i].el),
          textA: textHead(labels[i].el),
          pathB: pathOf(labels[j].el),
          textB: textHead(labels[j].el),
        });
      }
    }
    return found;
  };

  /** `SVG_TEXT_TOO_SMALL` for one drawing · the labels whose size ON SCREEN is
   *  under the readable floor. The size on screen is the size in the drawing's own
   *  units times what the drawing is scaled by (its viewBox against its box, and the
   *  deck against the screen), which `getScreenCTM()` carries, so a 14-unit label in
   *  a drawing scaled by 0.8 is 11px, the number the room sees. One finding per
   *  drawing: the smallest label, and how many there are. */
  const svgSmallIn = (labels) => {
    const small = labels
      .map((label) => {
        const scale = label.el.getScreenCTM()?.a ?? 1;
        const units = Number.parseFloat(getComputedStyle(label.el).fontSize);
        return { label, px: units * scale };
      })
      .filter(({ px }) => px > 0 && px < limits.minTextPx);
    if (!small.length) return [];
    const smallest = small.reduce((a, b) => (b.px < a.px ? b : a));
    return [{
      count: small.length,
      px: Math.round(smallest.px * 10) / 10,
      path: pathOf(smallest.label.el),
      text: textHead(smallest.label.el),
    }];
  };

  /** A CSS colour as [r, g, b, a], by letting the canvas resolve it · computed
   *  styles can be `rgb()`, `color(srgb …)` or `oklch()` and the canvas reads all
   *  three. Null for what is not a colour (`none`, `url(#gradient)`). */
  const colourCanvas = document.createElement('canvas');
  colourCanvas.width = 1;
  colourCanvas.height = 1;
  const colourContext = colourCanvas.getContext('2d', { willReadFrequently: true });
  const toRgba = (css) => {
    if (!colourContext || !css || css === 'none' || css.startsWith('url(')) return null;
    colourContext.clearRect(0, 0, 1, 1);
    colourContext.fillStyle = '#000';
    colourContext.fillStyle = css;
    colourContext.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colourContext.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const luminanceOf = ([r, g, b]) => {
    const lin = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const contrastBetween = (a, b) => {
    const [hi, lo] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (top, bottom) => {
    const alpha = top[3];
    return [0, 1, 2].map((i) => top[i] * alpha + bottom[i] * (1 - alpha)).concat([1]);
  };

  /** The colour a slide shows behind a drawing · the first ancestor with a
   *  background, crossing shadow roots, else the page's. */
  const pageBackgroundBehind = (el) => {
    for (let node = el; node; node = node.parentElement ?? node.getRootNode()?.host) {
      if (node.nodeType !== 1) continue;
      const colour = toRgba(getComputedStyle(node).backgroundColor);
      if (colour && colour[3] > 0.5) return colour;
    }
    return [255, 255, 255, 1];
  };

  /** `SVG_TEXT_CONTRAST_LOW` for one drawing · the label's colour against what is
   *  behind it: the smallest rect or circle that holds it and has a fill, else the
   *  slide. WCAG's ratio, 4.5 for text and 3 for large text (24px, or 18.7px bold).
   *  A fill that is a gradient or a pattern is not a colour and is not measured. */
  const svgContrastIn = (svg, labels) => {
    // What is painted at a point of a drawing is the last shape drawn over it, not
    // the smallest · so shapes keep document order, and one that is not painted
    // (opacity 0 on it or on a group above, a layer waiting for its reveal) is not
    // a background, nor is a label that is not painted a thing to compare: its
    // contrast is 1:1 by construction, and reporting it would be reporting the
    // animation.
    const opacityOf = (el) => {
      let opacity = 1;
      for (let node = el; node && node !== svg.parentNode; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      return opacity;
    };
    const shapes = [...svg.querySelectorAll('rect, circle')]
      .filter((shape) => isDrawnIn(shape, svg))
      .map((shape) => {
        const fill = toRgba(getComputedStyle(shape).fill);
        const opacity = opacityOf(shape) * Number(getComputedStyle(shape).fillOpacity);
        const box = screenBoxOf(shape);
        return box && fill ? { el: shape, ...box, fill: [fill[0], fill[1], fill[2], fill[3] * opacity] } : null;
      })
      .filter((shape) => shape && shape.fill[3] > 0.3);
    const topmostAt = (point) => [...shapes].reverse().find(
      (s) => point.x >= s.left && point.x <= s.right && point.y >= s.top && point.y <= s.bottom,
    ) ?? null;
    const behind = pageBackgroundBehind(svg);
    const found = [];
    for (const label of labels) {
      const style = getComputedStyle(label.el);
      const ink = toRgba(style.fill);
      if (!ink || opacityOf(label.el) < 0.1) continue;
      const box = label.box;
      const centre = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
      const holder = topmostAt(centre);
      const background = holder ? over(holder.fill, behind) : behind;
      const alpha = ink[3] * Number(style.opacity) * Number(style.fillOpacity);
      const foreground = over([ink[0], ink[1], ink[2], alpha], background);
      const ratio = contrastBetween(foreground, background);
      const px = Number.parseFloat(style.fontSize) * (label.el.getScreenCTM()?.a ?? 1);
      const large = px >= 24 || (px >= 18.66 && Number(style.fontWeight) >= 700);
      const needed = large ? limits.svgContrastLarge : limits.svgContrast;
      if (ratio >= needed) continue;
      found.push({
        ratio: Math.round(ratio * 100) / 100,
        needed,
        severity: ratio < limits.svgContrastLarge ? 'error' : 'warning',
        path: pathOf(label.el),
        text: textHead(label.el),
        on: holder ? holder.el.localName : 'slide',
      });
    }
    return found;
  };

  /** How a drawing moves, read BEFORE it is brought to its last frame: when the
   *  last finite animation ends (delay included), and whether one never does. The
   *  animations of a scene fill `both`, so they are still listed once finished. */
  const motionOf = (svg) => {
    let endMs = 0;
    let endless = false;
    let endlessFromMs = Number.POSITIVE_INFINITY;
    for (const animation of svg.getAnimations({ subtree: true })) {
      const timing = animation.effect?.getComputedTiming();
      if (!timing) continue;
      if (timing.iterations === Number.POSITIVE_INFINITY) {
        endless = true;
        // A loop of ambience may start once a story has played · when it starts is said.
        endlessFromMs = Math.min(endlessFromMs, timing.delay ?? 0);
      } else endMs = Math.max(endMs, timing.endTime);
    }
    return { endMs, endless, ...(endless ? { endlessFromMs } : {}) };
  };

  /** The script of a story a diagram plays on entry (`data-story`) · null else. */
  const storyOf = (svg) => {
    const raw = svg.getAttribute('data-story');
    if (!raw) return null;
    try {
      const script = JSON.parse(raw);
      return {
        playedMs: script.playedMs,
        budgetMs: script.budgetMs,
        steadyMs: script.steadyMs,
        beats: script.beats ?? [],
      };
    } catch {
      // Not the diagram's own script: a story nobody can read is judged as an entrance.
      return null;
    }
  };

  /** The deck's accent as a colour, for telling which shape puts something forward. */
  const accentColour = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--rik-accent').trim();
    return raw ? toRgba(raw) : null;
  };

  /** What a painted element belongs to, when its drawing says · its part
   *  (`data-role`: focal, barrier, overlay, frame, link-label…) and the mark that
   *  drew it (`data-mark`, its kind, and for a note the mark it points at), so a
   *  finding names the mark and the attribute to change. */
  const ownerOf = (el) => {
    const role = el.closest('[data-role]')?.getAttribute('data-role');
    const owner = el.closest('[data-mark]');
    return {
      ...(role ? { role } : {}),
      ...(owner ? { mark: owner.getAttribute('data-mark'), markKind: owner.getAttribute('data-kind') ?? undefined } : {}),
      ...(owner?.hasAttribute('data-for') ? { markFor: owner.getAttribute('data-for') } : {}),
    };
  };

  /** A stroke this wide on screen is a band of colour (the parts of a ring), not a line. */
  const SURFACE_STROKE_PX = 12;

  /** Every shape of a drawing as painted: its box on screen, its fill, its stroke,
   *  and whether the fill is the accent · what the illustration rules read. */
  const inkShapesOf = (svg, accent) => {
    const painted = [...svg.querySelectorAll('rect, circle, ellipse, path, line, polygon, polyline')]
      .filter((shape) => isDrawnIn(shape, svg));
    return painted
      .map((shape) => {
        const style = getComputedStyle(shape);
        const box = screenBoxOf(shape);
        if (!box) return null;
        const fill = toRgba(style.fill);
        const alpha = fill ? fill[3] * Number(style.fillOpacity) * Number(style.opacity) : 0;
        const opaque = alpha > 0.3;
        const strokeColour = toRgba(style.stroke);
        const scale = shape.getScreenCTM()?.a ?? 1;
        const stroke = strokeColour && strokeColour[3] > 0.1 ? Number.parseFloat(style.strokeWidth) * scale : 0;
        const near = (a, b) => Math.abs(a - b) < 14;
        // A tint of the accent (an open gate at a third of its colour) is a mark that
        // stepped back, not the thing put forward · the accent is the colour at half
        // its strength or more.
        const isAccent = !!(alpha >= 0.5 && accent && near(fill[0], accent[0]) && near(fill[1], accent[1]) && near(fill[2], accent[2]));
        // A tint (a surface at a fifth of its colour) weighs nothing, but it paints ·
        // what the richness reads to tell the roles of a drawing apart.
        // A stroke as thick as a band (the parts of a ring) paints a surface too.
        const strokeAlpha = strokeColour ? strokeColour[3] * Number(style.strokeOpacity) * Number(style.opacity) : 0;
        const band = !(alpha > 0.05) && stroke >= SURFACE_STROKE_PX && strokeAlpha > 0.05;
        const tint = fill && alpha > 0.05
          ? { paint: [fill[0], fill[1], fill[2], Math.round(alpha * 100) / 100] }
          : band ? { paint: [strokeColour[0], strokeColour[1], strokeColour[2], Math.round(strokeAlpha * 100) / 100] } : {};
        return {
          kind: shape.localName === 'rect' ? 'rect' : shape.localName === 'circle' || shape.localName === 'ellipse' ? 'circle' : shape.localName === 'line' ? 'line' : 'path',
          box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
          fill: opaque ? [fill[0], fill[1], fill[2]] : null,
          ...tint,
          accent: isAccent,
          stroke,
          ...ownerOf(shape),
        };
      })
      .filter(Boolean);
  };

  /** A shape the rules weigh · a fill or a stroke. One that is only a tint paints
   *  a surface without weight, read apart (`tints`). */
  const isInked = (shape) => !!(shape.fill || shape.stroke);

  /** What the illustration rules read: the drawing's frame and the room it was
   *  given, its texts and shapes as painted, and how it moves · or null for an
   *  icon or a rule, which has nothing to balance. */
  const inkModelOf = (svg, labels, motion, accent) => {
    const frameBox = svg.getBoundingClientRect();
    if (frameBox.width < 240 || frameBox.height < 120) return null;
    const host = svg.getRootNode()?.host ?? svg;
    const hostBox = host.getBoundingClientRect();
    // The strip of an act stands above a diagram's drawing · the room the drawing was
    // given starts under it, or every drawing with a strip would weigh low.
    const strip = svg.parentNode?.querySelector?.(':scope > svg[data-act]');
    const room = strip && strip !== svg
      ? { left: hostBox.left, right: hostBox.right, top: strip.getBoundingClientRect().bottom, bottom: hostBox.bottom }
      : hostBox;
    const painted = inkShapesOf(svg, accent);
    const shapes = painted.filter(isInked);
    const tints = painted.filter((shape) => !isInked(shape) && shape.paint);
    const texts = labels.map((label) => {
      const style = getComputedStyle(label.el);
      return {
        text: label.el.textContent.trim().replace(/\s+/g, ' '),
        box: { left: label.box.left, top: label.box.top, right: label.box.right, bottom: label.box.bottom },
        size: Number.parseFloat(style.fontSize) * (label.el.getScreenCTM()?.a ?? 1),
        weight: Number(style.fontWeight) || 400,
        ...ownerOf(label.el),
      };
    });
    if (shapes.length + texts.length < 3) return null;
    return {
      frame: { left: frameBox.left, top: frameBox.top, right: frameBox.right, bottom: frameBox.bottom },
      allocated: { left: room.left, top: room.top, right: room.right, bottom: room.bottom },
      texts,
      shapes,
      ...(tints.length ? { tints } : {}),
      motion,
      // `balance="free"` on the scene, or on anything around the drawing, says an
      // asymmetry is meant · and so does a drawing whose intent leans by nature (a
      // drift from a fixed line), which says it on its svg.
      ...(host.closest?.('[balance="free"]') || svg.getAttribute('data-balance') === 'free'
        ? { balance: 'free' }
        : {}),
      ...(svg.getAttribute('data-layout') ? { layout: svg.getAttribute('data-layout') } : {}),
      ...(svg.getAttribute('data-lean') === 'x' ? { lean: 'x' } : {}),
      ...(svg.getAttribute('data-intent') ? { intent: svg.getAttribute('data-intent') } : {}),
      ...(storyOf(svg) ? { story: storyOf(svg) } : {}),
    };
  };

  /** Bring a drawing to its last frame. Scenes stagger their entrances (a card
   *  grows from zero width, a label pops in from 60%), and the wait for a
   *  still frame gives up before a late one ends · measured then, a label sits
   *  on a third of its card. The last frame is the one the room looks at; an
   *  endless animation (a travelling token) has none and is left running. */
  const settleDrawing = (svg) => {
    for (const animation of svg.getAnimations({ subtree: true })) {
      if (animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY) animation.finish();
    }
  };

  /** A scene, the composition of several, or a diagram (a scene written as a
   *  grammar, whose DG_* findings ride the same attribute) · `deck-scene-item` is
   *  data, not a scene. */
  const isSceneElement = (el) => (el.localName === 'deck-scene' || el.localName.startsWith('deck-scene-')
    || el.localName === 'deck-diagram')
    && el.localName !== 'deck-scene-item';

  /** The generic keywords a font stack ends with · a stack that names only
   *  these has no family to be missing. */
  const GENERIC_FAMILIES = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
    'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong',
  ]);

  /** The first family a CSS font stack names, unquoted · null when it is a keyword. */
  const firstFamily = (stack) => {
    const first = (stack ?? '').split(',')[0]?.trim().replace(/^['"]|['"]$/g, '');
    return first && !GENERIC_FAMILIES.has(first.toLowerCase()) ? first : null;
  };

  /** Whether a family is really there, by the usual trick: a string measured in
   *  it, with a fallback behind, differs from the fallback alone. */
  const familyIsAvailable = (family) => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return true;
    const width = (font) => {
      ctx.font = `72px ${font}`;
      return ctx.measureText('mmmmmmmmmmlli1WQ').width;
    };
    return width(`"${family}", monospace`) !== width('monospace')
      || width(`"${family}", serif`) !== width('serif');
  };

  /** The text measurements of every drawing on a slide, hand-drawn or a
   *  component's own. A text a scene already reported as too long
   *  (`SCENE_TEXT_TOO_LONG`, with the field and its measure) is not reported a
   *  second time as a geometry finding of its drawing · but the rest of that
   *  drawing is still measured, so a known fault cannot hide another. */
  const svgTextIn = (slide) => {
    const elements = everythingIn(slide);
    // What the scene's lint wrote about the author's items (`scene-lint.ts`) ·
    // each issue arrives with its own code, severity and the items concerned.
    const sceneIssues = elements
      .filter((el) => isSceneElement(el) && el.hasAttribute('data-scene-issues') && el.checkVisibility())
      .flatMap((scene) => {
        let issues = [];
        try {
          issues = JSON.parse(scene.getAttribute('data-scene-issues'));
        } catch {
          // A hand-written attribute that is not the lint's JSON: nothing to read.
        }
        return issues.map((issue) => ({ path: pathOf(scene), tag: scene.localName, ...issue }));
      });
    // A scene measures its text in the theme's fonts · a family that is not
    // there makes every width a measure of the fallback, which the room will
    // not see. Named once per family, by the deck-level pass.
    const sceneFonts = [...new Set(elements
      .filter((el) => isSceneElement(el) && el.checkVisibility())
      .flatMap((scene) => {
        const style = getComputedStyle(scene);
        return ['--rik-font-sans', '--rik-font-display']
          .map((token) => firstFamily(style.getPropertyValue(token)))
          .filter((family) => family && !familyIsAvailable(family));
      }))];
    // The words a scene already reported as too long, normalised like textHead.
    const reported = sceneIssues
      .flatMap((issue) => issue.fields ?? [])
      .map((field) => (field.text ?? '').trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    const isReported = (text) => !!text && reported.some((field) => field.includes(text));
    const drawings = elements.filter((el) => el instanceof SVGSVGElement && !el.ownerSVGElement
      && el.checkVisibility({ visibilityProperty: true }));
    const escapes = [];
    const overlaps = [];
    const small = [];
    const contrast = [];
    const illustrations = [];
    const motifs = [];
    const accent = accentColour();
    // The slide names where its figures come from · what the richness asks of a fact.
    const sourced = elements.some((el) => el.localName === 'deck-source');
    for (const svg of drawings) {
      const motion = motionOf(svg);
      settleDrawing(svg);
      const labels = labelsOf(svg);
      const model = inkModelOf(svg, labels, motion, accent);
      // A diagram says what it is made of (`data-signature`) · what `diversity`
      // compares, beside the ink measured here.
      // The strip of an act (`data-act`) says where the deck stands, it is no drawing ·
      // its words are measured like any, and it is not judged as an illustration.
      if (model && !svg.hasAttribute('data-act')) illustrations.push({ path: pathOf(svg.getRootNode()?.host ?? svg), tag: (svg.getRootNode()?.host ?? svg).localName, model, signature: svg.getAttribute('data-signature'), motif: svg.getAttribute('data-motif'), sourced });
      // What a diagram declares of its place in the deck (`data-motif`) is read on every
      // one, scored or too small to be · a pair or a zoom-from may name any of them.
      if (svg.hasAttribute('data-motif') && !svg.hasAttribute('data-act'))
        motifs.push({
          path: pathOf(svg.getRootNode()?.host ?? svg),
          motif: svg.getAttribute('data-motif'),
          texts: labels.map((label) => ({ text: label.el.textContent.trim().replace(/\s+/g, ' '), ...ownerOf(label.el) })),
        });
      escapes.push(...svgEscapesIn(svg, labels).filter((found) => !isReported(found.text)));
      overlaps.push(
        ...svgOverlapsIn(labels).filter((found) => !isReported(found.textA) && !isReported(found.textB)),
      );
      small.push(...svgSmallIn(labels));
      contrast.push(...svgContrastIn(svg, labels));
    }
    return {
      svgTextEscapes: escapes.sort((a, b) => b.pixels - a.pixels).slice(0, limits.svgFindingsPerSlide),
      svgTextOverlaps: overlaps.sort((a, b) => b.area - a.area).slice(0, limits.svgFindingsPerSlide),
      svgTextSmall: small.sort((a, b) => a.px - b.px).slice(0, limits.svgFindingsPerSlide),
      svgTextContrast: contrast.sort((a, b) => a.ratio - b.ratio).slice(0, limits.svgFindingsPerSlide),
      illustrations: illustrations.slice(0, 6),
      motifs,
      sceneIssues,
      sceneFonts,
    };
  };

  const measured = slides.map((slide, index) => {
    const outline = {
      index: index + 1,
      id: slide.id || null,
      tag: slide.tagName.toLowerCase(),
      title: titleOf(slide),
      steps: Number.parseInt(slide.getAttribute('steps') ?? slide.dataset?.steps ?? '0', 10) || 0,
      // What a deck's check policy finds a slide by · its path and its tags.
      path: pathOf(slide),
      tags: (slide.dataset?.tags ?? '').split(/\s+/).filter(Boolean),
    };
    if (only !== null && outline.index !== only) return { ...outline, measured: false };

    const box = slide.getBoundingClientRect();
    let clipped = null;
    for (const el of clippersIn(slide)) {
      const overflowY = el.scrollHeight - el.clientHeight;
      const overflowX = el.scrollWidth - el.clientWidth;
      const worst = Math.max(overflowY, overflowX);
      if (worst > (clipped?.pixels ?? 0)) {
        clipped = { pixels: Math.round(worst), axis: overflowY >= overflowX ? 'y' : 'x', path: pathOf(el) };
      }
    }

    // A scrollbar for a sliver: nothing is cut, so the clip pass is silent,
    // but the slide shows a scrollbar and a last line sliced in half.
    const scrollSlivers = [];
    for (const s of scrollersIn(slide)) {
      const axis = s.y > 1 ? 'y' : 'x';
      const px = axis === 'y' ? s.y : s.x;
      if (!(s.line > 0) || px >= s.line * limits.scrollSliverLines) continue;
      const host = s.el.getRootNode()?.host ?? s.el;
      scrollSlivers.push({ path: pathOf(host), tag: host.tagName.toLowerCase(), axis, px: Math.round(px), line: Math.round(s.line) });
    }

    const written = Array.from(slide.children)
      .filter((el) => el.tagName.toLowerCase() !== 'deck-notes')
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.height > 0);
    const spanned = written.length
      ? Math.max(...written.map((b) => b.bottom)) - Math.min(...written.map((b) => b.top))
      : 0;

    // Text too small to read from the back.
    //
    // The size that matters is the one on the wall, not the one in the
    // stylesheet: a deck is scaled to fit its canvas. Comparing the laid-out
    // height with the painted height gives that factor whatever produced it.
    // Elements inside an SVG are skipped · a diagram scales by its viewBox,
    // which this ratio cannot see, and guessing there would cry wolf.
    const IGNORED = new Set(['style', 'script', 'template', 'noscript', 'title']);
    const tiny = [];
    // Only the author's own text. A component's chrome (a cover's meta labels,
    // a counter) is sized by the theme, and telling an author to fix a span
    // they never wrote is noise. Slotted content stays in the light DOM, so it
    // is measured here with the styles the component gives it · but two
    // elements re-render the author's own words into their shadow tree, and
    // skipping those hid a code block nobody could read.
    const AUTHOR_TEXT_IN_SHADOW = new Set(['deck-md', 'deck-code']);
    const walk = (node) => {
      for (const el of node.querySelectorAll('*')) {
        if (el.shadowRoot && AUTHOR_TEXT_IN_SHADOW.has(el.tagName.toLowerCase())) walk(el.shadowRoot);
        if (IGNORED.has(el.tagName.toLowerCase())) continue;
        if (el.ownerSVGElement || el.tagName.toLowerCase() === 'svg') continue;
        const text = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join('');
        if (!text) continue;
        const px = Number.parseFloat(getComputedStyle(el).fontSize);
        if (!(px > 0) || !el.offsetHeight) continue;
        const painted = el.getBoundingClientRect().height / el.offsetHeight;
        const onScreen = px * (painted || 1);
        if (onScreen < limits.minTextPx) {
          tiny.push({ path: pathOf(el), px: Math.round(onScreen), text: text.slice(0, 40) });
        }
      }
    };
    walk(slide);

    // Two icons in one box: a component that already paints its own icon
    // (deck-callout's chip, deck-check's mark) whose text then opens with an
    // emoji. The pair reads as a stutter, and the theme only styles one of
    // them. "Its own icon" is a small SVG in its shadow tree, measured in
    // canvas pixels so the zoom-to-fit scale does not move the threshold.
    // An emoji is a pictograph shown as one: emoji by default, or forced by
    // VS16. Text symbols such as ©, ®, ™ and arrows stay text.
    const PICTOGRAPH = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)/u;
    const scale = slide.offsetWidth ? slide.getBoundingClientRect().width / slide.offsetWidth : 1;
    const leadingText = (host) => {
      const texts = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement?.closest('deck-notes, script, style')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      for (let n = texts.nextNode(); n; n = texts.nextNode()) {
        const t = n.textContent.trim();
        if (t) return t;
      }
      return '';
    };
    const doubledIcons = [];
    for (const host of slide.querySelectorAll('*')) {
      if (!host.shadowRoot || !host.tagName.toLowerCase().startsWith('deck-')) continue;
      const text = leadingText(host);
      const emoji = text.match(PICTOGRAPH)?.[0];
      if (!emoji) continue;
      const icon = Array.from(host.shadowRoot.querySelectorAll('svg')).find((svg) => {
        const r = svg.getBoundingClientRect();
        return r.width > 0 && r.height > 0
          && r.width / scale <= limits.iconMaxPx && r.height / scale <= limits.iconMaxPx;
      });
      if (icon) {
        doubledIcons.push({
          path: pathOf(host),
          tag: host.tagName.toLowerCase(),
          emoji,
          iconPx: Math.round(icon.getBoundingClientRect().width / scale),
          text: text.slice(0, 40),
        });
      }
    }

    // Nothing clips, yet the paint still runs outside its box or over a
    // sibling: most layouts do not set overflow hidden anywhere, so a box
    // that is simply too small for its content just paints past its own
    // edges, silently.
    const boxes = paintedBoxesIn(slide);

    return {
      ...outline,
      measured: true,
      clipped,
      fillRatio: box.height ? Math.round((spanned / box.height) * 100) / 100 : 0,
      tiny: tiny.slice(0, 3),
      escapesBox: worstEscape(boxes),
      overlapsSibling: worstOverlap(boxes),
      lastLineOrphan: worstOrphan(slide),
      doubledIcons,
      scrollSlivers,
      // A drawing lays its own text out, by coordinates: nothing wraps, nothing
      // clips, and a label too long for its card simply runs over the edge.
      ...svgTextIn(slide),
    };
  });

  // An attribute a component does not observe is dropped in silence: the author
  // wrote label="Budget consumed" on an element whose label comes from its
  // content, and the words simply never appeared. Custom elements publish what
  // they listen to, so this is asked rather than guessed.
  const GLOBAL_ATTRS = /^(id|class|style|slot|hidden|title|lang|dir|part|exportparts|tabindex|role|steps|active|contenteditable|draggable|translate|spellcheck|itemscope|itemtype|itemprop|inert|popover|is)$/;

  /** Attributes a component's own stylesheet selects on.
   *
   *  `compact` on deck-mermaid changes nothing in JavaScript · it exists purely
   *  as `:host([compact])` in the shadow styles. An attribute that only styles
   *  is still an attribute the element reads. */
  const styledAttrsOf = (el) => {
    const names = new Set();
    const sheets = [...(el.shadowRoot?.adoptedStyleSheets ?? []), ...(el.shadowRoot?.styleSheets ?? [])];
    for (const sheet of sheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // a cross-origin sheet · nothing to read, nothing to guess
      }
      for (const rule of rules) {
        for (const m of (rule.selectorText ?? '').matchAll(/\[\s*([a-zA-Z-]+)/g)) names.add(m[1]);
      }
    }
    return names;
  };

  const strayAttributes = [];
  const styledCache = new Map();
  for (const el of scanDocument ? document.querySelectorAll('*') : []) {
    const tag = el.tagName.toLowerCase();
    if (!tag.includes('-')) continue;
    const ctor = customElements.get(tag);
    if (!ctor) continue;
    if (!styledCache.has(tag)) styledCache.set(tag, styledAttrsOf(el));
    const observed = new Set([...(ctor.observedAttributes ?? []), ...styledCache.get(tag)]);
    for (const attr of el.getAttributeNames()) {
      if (observed.has(attr)) continue;
      if (GLOBAL_ATTRS.test(attr) || attr.startsWith('data-') || attr.startsWith('aria-')) continue;
      strayAttributes.push({ tag, attr, path: pathOf(el), observed: [...observed] });
    }
  }

  // Content a component never took. An element whose parent has a shadow root
  // is rendered only if a <slot> accepts it: writing slot="a" where no such
  // slot exists, or putting a block inside a component that only forwards
  // named slots, drops it silently and leaves the slide blank.
  const unslotted = [];
  for (const el of scanDocument ? document.querySelectorAll('*') : []) {
    const parent = el.parentElement;
    if (!parent?.shadowRoot) continue;
    if (!parent.tagName.toLowerCase().includes('-')) continue;
    if (el.assignedSlot) continue;
    if (el.tagName.toLowerCase() === 'deck-notes') continue; // read by the presenter, never shown
    const offered = [...parent.shadowRoot.querySelectorAll('slot')].map((n) => n.name || '(default)');
    // A component with no slot at all reads its own textContent · deck-code and
    // deck-mermaid do, and every element the parser leaves in there is theirs
    // to interpret, not ours to complain about.
    if (offered.length === 0) continue;
    const wanted = el.getAttribute('slot');
    unslotted.push({ tag: el.tagName.toLowerCase(), parent: parent.tagName.toLowerCase(), wanted, offered, path: pathOf(el) });
  }

  // A tag that was never defined renders as an empty inline box: the author
  // typed `deck-callot`, and the slide simply lost a block with no error.
  const unknown = [];
  const elements = scanDocument ? [...document.querySelectorAll('*')] : [];
  const knownPrefixes = new Set(['deck']);
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (customElements.get(tag)) knownPrefixes.add(tag.split('-')[0]);
  }
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (el.namespaceURI === 'http://www.w3.org/1999/xhtml' && tag.includes('-') && !customElements.get(tag)) {
      unknown.push({ tag, path: pathOf(el), knownPrefix: knownPrefixes.has(tag.split('-')[0]) });
    }
  }

  // Graph failures are geometric: valid markup can still place a node outside
  // the drawing area, drop one on top of another, or route an edge through a
  // node it does not connect. Read the painted boxes after layout, and the
  // polyline the component says it painted, rather than inferring either from
  // the authored `at`.
  const graphIssues = [];
  const centreOf = ({ box }) => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });
  /** Every `deck-graph` of the slide under inspection · the slide itself
   *  counts, since a deck can put a graph straight into `deck-root`. */
  const graphsOf = (scope) => {
    if (!scope) return [];
    const found = [...scope.querySelectorAll('deck-graph')];
    if (scope.tagName?.toLowerCase() === 'deck-graph') found.unshift(scope);
    return found;
  };
  for (const graph of only === null ? document.querySelectorAll('deck-graph') : graphsOf(slides[only - 1])) {
    const graphBox = graph.getBoundingClientRect();
    if (!graphBox.width || !graphBox.height) continue;
    const slide = slides.find((candidate) => candidate.contains(graph));
    const slideIndex = slide ? slides.indexOf(slide) + 1 : null;
    const nodes = [...graph.querySelectorAll('deck-node')].map((node) => ({
      node,
      id: node.id,
      box: node.getBoundingClientRect(),
    }));
    for (const { node, box } of nodes) {
      const overflow = {
        left: Math.max(0, graphBox.left - box.left),
        right: Math.max(0, box.right - graphBox.right),
        top: Math.max(0, graphBox.top - box.top),
        bottom: Math.max(0, box.bottom - graphBox.bottom),
      };
      const pixels = Math.max(...Object.values(overflow));
      if (pixels > limits.clipPx) {
        graphIssues.push({ kind: 'node-out', slide: slideIndex, graph: pathOf(graph), node: pathOf(node), pixels: Math.round(pixels), overflow });
      }
    }
    // Two nodes on top of each other hide each other's words. The boxes are
    // already measured for the edge geometry; nobody was comparing them.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const x = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
        const y = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
        if (x > limits.clipPx && y > limits.clipPx) {
          graphIssues.push({ kind: 'node-overlap', slide: slideIndex, graph: pathOf(graph), node: pathOf(a.node), other: pathOf(b.node), a: a.id || null, b: b.id || null, overlap: { x: Math.round(x), y: Math.round(y) } });
        }
      }
    }

    // A caption painted under a node is a caption nobody reads. The generic
    // sibling rule skips everything inside a graph — the component stacks its
    // own layers by design — so the region and edge captions have no net but
    // this one. They live in shadow trees: the graph paints the edge labels,
    // each deck-group / deck-lane paints its own.
    const labels = [];
    for (const tag of graph.shadowRoot?.querySelectorAll('.edge-label') ?? []) {
      labels.push({ el: tag, kind: 'edge', text: tag.textContent?.trim() ?? '', box: tag.getBoundingClientRect() });
    }
    for (const region of graph.querySelectorAll('deck-group, deck-lane')) {
      const tag = region.shadowRoot?.querySelector('.tag');
      if (!tag) continue;
      const kind = region.tagName.toLowerCase() === 'deck-lane' ? 'lane' : 'group';
      labels.push({ el: region, kind, text: region.getAttribute('label') ?? '', box: tag.getBoundingClientRect() });
    }
    for (const label of labels) {
      if (!label.box.width || !label.box.height) continue;
      let covered = null;
      for (const candidate of nodes) {
        const x = Math.min(candidate.box.right, label.box.right) - Math.max(candidate.box.left, label.box.left);
        const y = Math.min(candidate.box.bottom, label.box.bottom) - Math.max(candidate.box.top, label.box.top);
        if (x <= limits.siblingOverlapPx || y <= limits.siblingOverlapPx) continue;
        if (x * y > (covered?.area ?? 0)) {
          covered = { area: x * y, entry: candidate, overlap: { x: Math.round(x), y: Math.round(y) } };
        }
      }
      if (covered) {
        graphIssues.push({ kind: 'label-covered', slide: slideIndex, graph: pathOf(graph), label: pathOf(label.el), labelKind: label.kind, text: label.text, node: pathOf(covered.entry.node), nodeId: covered.entry.id || null, overlap: covered.overlap });
      }
    }

    // What the author meant to line up, and what the browser painted. These
    // read the centres rather than the authored `at`: a percentage is resolved
    // against the canvas, and two nodes written 2% apart are as misaligned as
    // the canvas is wide.
    const centres = nodes.map((entry) => ({
      ...entry,
      cx: (entry.box.left + entry.box.right) / 2,
      cy: (entry.box.top + entry.box.bottom) / 2,
    }));

    // One sloppy row must not produce one diagnostic per pair · the worst
    // offender names the row, and fixing it is what the author does anyway.
    let offAxis = null;
    for (let i = 0; i < centres.length; i++) {
      for (let j = i + 1; j < centres.length; j++) {
        for (const axis of ['x', 'y']) {
          const delta = Math.abs(axis === 'x' ? centres[i].cx - centres[j].cx : centres[i].cy - centres[j].cy);
          if (delta <= limits.graphAlignFloorPx || delta > limits.graphAlignSlackPx) continue;
          if (delta > (offAxis?.delta ?? 0)) offAxis = { delta, axis, a: centres[i], b: centres[j] };
        }
      }
    }
    if (offAxis) {
      graphIssues.push({ kind: 'nodes-off-axis', slide: slideIndex, graph: pathOf(graph), axis: offAxis.axis, pixels: Math.round(offAxis.delta), node: pathOf(offAxis.a.node), other: pathOf(offAxis.b.node), a: offAxis.a.id || null, b: offAxis.b.id || null });
    }

    /** The nodes grouped into rows (`cy`) or columns (`cx`) · a run of centres
     *  no further apart than the alignment slack is one row. */
    const runsOn = (key) => {
      const sorted = [...centres].sort((a, b) => a[key] - b[key]);
      const runs = [];
      let run = [];
      for (const entry of sorted) {
        if (run.length && entry[key] - run[run.length - 1][key] > limits.graphAlignSlackPx) {
          runs.push(run);
          run = [];
        }
        run.push(entry);
      }
      if (run.length) runs.push(run);
      return runs.filter((r) => r.length > 1);
    };
    // A ragged edge down a column, or an uneven baseline across a row · the
    // dimension compared is the one whose mismatch is visible as a ragged
    // line, so a row is judged on height and a column on width.
    let mixedSizes = null;
    const compareSizes = (run, dimension, along) => {
      for (let i = 0; i < run.length; i++) {
        for (let j = i + 1; j < run.length; j++) {
          const a = run[i].box[dimension];
          const b = run[j].box[dimension];
          const diff = Math.abs(a - b);
          const largest = Math.max(a, b);
          if (!largest || diff <= limits.graphSizeFloorPx) continue;
          if (diff / largest >= limits.graphSizeSlack) continue;
          if (diff > (mixedSizes?.diff ?? 0)) {
            mixedSizes = { diff, ratio: diff / largest, dimension, along, a: run[i], b: run[j] };
          }
        }
      }
    };
    for (const row of runsOn('cy')) compareSizes(row, 'height', 'row');
    for (const column of runsOn('cx')) compareSizes(column, 'width', 'column');
    if (mixedSizes) {
      graphIssues.push({ kind: 'sizes-mixed', slide: slideIndex, graph: pathOf(graph), dimension: mixedSizes.dimension, along: mixedSizes.along, pixels: Math.round(mixedSizes.diff), share: Math.round(mixedSizes.ratio * 100), node: pathOf(mixedSizes.a.node), other: pathOf(mixedSizes.b.node), a: mixedSizes.a.id || null, b: mixedSizes.b.id || null });
    }

    // Hand-placed coordinates that spell out an arrangement the component
    // already has a word for. `layout` reflects, and its default reflects as
    // `free`, so both readings mean "the author placed every node".
    const declaredLayout = (graph.getAttribute('layout') ?? 'free').toLowerCase();
    if (declaredLayout === 'free' && centres.length >= limits.graphSemanticMinNodes) {
      const spread = (key) => Math.max(...centres.map((c) => c[key])) - Math.min(...centres.map((c) => c[key]));
      const arrangement =
        spread('cy') <= limits.graphAlignSlackPx ? 'row' : spread('cx') <= limits.graphAlignSlackPx ? 'column' : null;
      if (arrangement) {
        graphIssues.push({ kind: 'layout-not-semantic', slide: slideIndex, graph: pathOf(graph), layout: arrangement, nodes: centres.length });
      }
    }

    // An edge is a band of ink, not a mathematical line. Half the stroke width
    // on each side of the centre line paints, so a line that misses a node by
    // one pixel still crosses it on screen · that half width is the tolerance,
    // and it replaces an inset of 2px that was narrower than the ink it was
    // meant to excuse.
    const painted = graph.shadowRoot?.querySelector('.edge');
    const strokeWidth = painted ? Number.parseFloat(getComputedStyle(painted).strokeWidth) : Number.NaN;
    const inkMargin = (Number.isFinite(strokeWidth) ? strokeWidth : 4) / 2;

    const byId = new Map(nodes.filter(({ id }) => id).map((entry) => [entry.id, entry]));
    for (const edge of graph.querySelectorAll('deck-edge')) {
      const from = byId.get(edge.getAttribute('from') ?? '');
      const to = byId.get(edge.getAttribute('to') ?? '');
      if (!from || !to) continue;
      // What deck-graph publishes is what deck-graph painted, orthogonal bends
      // and boundary anchors included. A runtime older than this attribute
      // publishes nothing: fall back to the straight centre-to-centre segment,
      // which is right for `route="straight"` and only approximates an ortho
      // route.
      // The path is in the graph's own CSS pixels; the node boxes are screen
      // pixels, after the deck's fit-to-screen scale.
      const published = geometry.parseGraphPath(edge.getAttribute('data-path'));
      const graphScale = graph.offsetWidth ? graphBox.width / graph.offsetWidth : 1;
      const points = published.length
        ? published.map((p) => ({ x: p.x * graphScale + graphBox.left, y: p.y * graphScale + graphBox.top }))
        : [centreOf(from), centreOf(to)];
      for (const candidate of nodes) {
        if (candidate === from || candidate === to) continue;
        if (geometry.polylineHitsRect(points, candidate.box, inkMargin)) {
          graphIssues.push({ kind: 'edge-crosses-node', slide: slideIndex, graph: pathOf(graph), edge: pathOf(edge), node: pathOf(candidate.node), from: from.id, to: to.id });
        }
      }
      // An arrow that almost lands on horizontal or vertical reads as a slip;
      // a frank diagonal reads as a decision. Only the first offending segment
      // is reported · an ortho route bends at right angles and never fires.
      for (let p = 1; p < points.length; p++) {
        const dx = Math.abs(points[p].x - points[p - 1].x);
        const dy = Math.abs(points[p].y - points[p - 1].y);
        const minor = Math.min(dx, dy);
        const major = Math.max(dx, dy);
        if (!major || minor <= limits.graphAlignFloorPx || minor > limits.graphAlignSlackPx) continue;
        if (minor / major >= limits.graphSkewRatio) continue;
        graphIssues.push({ kind: 'edge-skewed', slide: slideIndex, graph: pathOf(graph), edge: pathOf(edge), from: from.id, to: to.id, axis: dx >= dy ? 'horizontal' : 'vertical', pixels: Math.round(minor), slope: Math.round((minor / major) * 100) });
        break;
      }
    }
  }

  // What the deck says it lasts, and what it gives someone to say. Notes are
  // the script; the projected words are read, not spoken, so they count for
  // little. This is an order of magnitude, never a verdict.
  const coverEl = slides.find((el) => el.tagName.toLowerCase() === 'deck-cover');
  const announced = scanDocument ? coverEl?.getAttribute('duration') ?? null : null;
  const countWords = (text) => (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
  let spokenWords = 0;
  for (const el of scanDocument ? document.querySelectorAll('deck-notes') : []) {
    spokenWords += countWords(el.textContent ?? '');
  }

  // The exceptions the deck writes on itself (`data-check-off`, with its reason),
  // and the elements the policy's overrides name by a selector · both read once.
  const checkExceptions = [];
  const scopeMatches = {};
  const scopeErrors = {};
  if (scanDocument) {
    for (const el of document.querySelectorAll('[data-check-off]')) {
      checkExceptions.push({
        path: pathOf(el),
        off: el.getAttribute('data-check-off') ?? '',
        reason: el.getAttribute('data-check-reason') ?? '',
        root: el === root,
        isSlide: slides.includes(el),
      });
    }
    const deep = (scope, selector, into) => {
      for (const el of scope.querySelectorAll(selector)) into.add(el);
      for (const el of scope.querySelectorAll('*')) if (el.shadowRoot) deep(el.shadowRoot, selector, into);
      return into;
    };
    for (const selector of scopeSelectors) {
      try {
        scopeMatches[selector] = [...deep(document, selector, new Set())].map(pathOf);
      } catch (error) {
        scopeErrors[selector] = String(error?.message ?? error);
      }
    }
  }

  return {
    announced,
    spokenWords,
    scannedDocument: scanDocument,
    checkExceptions,
    scopeMatches,
    scopeErrors,
    hasRoot: !!root,
    runtimeLoaded: !!customElements.get('deck-root'),
    slides: measured,
    unknown,
    strayAttributes,
    unslotted,
    graphIssues,
  };
};

/** What the pixels say · imbalance only, never the amount of empty space. */
function diagnoseVisual(visual, outline, limits) {
  const found = [];
  for (const slide of visual) {
    if (slide.empty) continue;
    const named = outline[slide.index - 1] ?? {};
    // Both conditions together: ink pulled up AND a dead band under it. Either
    // one alone is a legitimate composition.
    if (slide.tailBand > limits.tailBand && slide.verticalBias < limits.verticalBias) {
      found.push(
        diagnostic('SLIDE_TOP_HEAVY', SEVERITY.warning, `the content sits in the top of the slide · ${Math.round(slide.tailBand * 100)}% of the height below it is empty`, {
          slide: slide.index,
          slideId: named.id ?? null,
          slideTag: named.tag ?? null,
          measurement: {
            emptyBandBelow: Math.round(slide.tailBand * 100) / 100,
            verticalBias: Math.round(slide.verticalBias * 100) / 100,
            inkRatio: Math.round(slide.inkRatio * 100) / 100,
          },
          suggestion: 'distribute with `spread` (center, between, around), or give the slide content that earns the space · a lone box under a headline is not restraint',
        }),
      );
    }
  }
  return found;
}

/** Turn the measurements into findings · this is where policy lives. `illustrations`
 *  gathers the drawings scored, `motifs` what every diagram declares of the deck. */
function diagnose(page, source, limits, illustrations = null, motifs = null) {
  const found = [];

  if (!page.runtimeLoaded) {
    found.push(
      diagnostic(
        'RUNTIME_NOT_LOADED',
        SEVERITY.error,
        'the rikiki runtime never registered its elements · every slide stays raw HTML',
        { suggestion: 'check the <script type="module"> path, and serve over http:// · ES modules do not load from file://' },
      ),
    );
  }
  if (!page.hasRoot) {
    found.push(
      diagnostic('NO_DECK_ROOT', SEVERITY.error, 'the page has no <deck-root>', {
        suggestion: 'wrap the slides in <deck-root>…</deck-root>',
      }),
    );
  } else if (page.slides.length === 0) {
    found.push(
      diagnostic('NO_SLIDES', SEVERITY.error, '<deck-root> holds no deck-* element', {
        suggestion: 'add at least one slide, e.g. <deck-cover><h1>…</h1></deck-cover>',
      }),
    );
  }

  // When the runtime never loaded, every deck-* element is undefined. Saying so
  // once is a diagnosis; saying it per element is noise on top of the cause.
  for (const u of page.runtimeLoaded ? page.unknown : []) {
    // A name no custom element could ever have was not typed as markup: it is
    // prose that reached the parser unescaped, and the parser made a node of it.
    const impossible = !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(u.tag);
    found.push(
      impossible
        ? diagnostic('STRAY_MARKUP', SEVERITY.warning, `<${u.tag}> is not a possible element name · this looks like text the parser read as a tag`, {
            element: u.path,
            suggestion: 'escape the angle brackets (&lt; &gt;) where the deck talks about markup',
          })
        : diagnostic('UNKNOWN_ELEMENT', u.knownPrefix || u.tag.startsWith('deck-') ? SEVERITY.error : SEVERITY.warning, `<${u.tag}> is not defined · its component behavior is unavailable`, {
            element: u.path,
            suggestion: 'check the spelling and load the module that defines this custom element',
          }),
    );
  }

  for (const lost of page.runtimeLoaded ? page.unslotted : []) {
    found.push(
      diagnostic('CONTENT_NOT_RENDERED', SEVERITY.error, `<${lost.tag}> is inside <${lost.parent}> but no slot takes it · nothing of it appears`, {
        element: lost.path,
        measurement: { wantedSlot: lost.wanted, slotsOffered: lost.offered },
        suggestion: lost.wanted
          ? `<${lost.parent}> offers ${lost.offered.join(', ')} · check the slot name`
          : `<${lost.parent}> only forwards named slots · give this element one of ${lost.offered.join(', ')}`,
      }),
    );
  }

  for (const stray of page.runtimeLoaded ? page.strayAttributes : []) {
    found.push(
      diagnostic('UNKNOWN_ATTRIBUTE', SEVERITY.warning, `<${stray.tag}> ignores ${stray.attr}="…" · the value is dropped, not rendered`, {
        element: stray.path,
        measurement: { accepts: stray.observed },
        suggestion: `this element reads ${stray.observed.length ? stray.observed.join(', ') : 'no attribute'} · everything else goes in its content`,
      }),
    );
  }

  for (const issue of page.runtimeLoaded ? page.graphIssues ?? [] : []) {
    const outline = issue.slide ? page.slides[issue.slide - 1] : null;
    const where = {
      slide: issue.slide ?? undefined,
      slideId: outline?.id ?? null,
      slideTag: outline?.tag ?? null,
      element: issue.node,
    };
    if (issue.kind === 'node-out') {
      found.push(
        diagnostic('GRAPH_NODE_OUT_OF_BOUNDS', SEVERITY.error, `a graph node sits ${issue.pixels}px outside its canvas`, {
          ...where,
          measurement: { overflowPx: issue.pixels, sides: issue.overflow },
          suggestion: 'move the node inward with `at`, shorten its note, or constrain it with `width` / `--deck-node-size`',
        }),
      );
    } else if (issue.kind === 'node-overlap') {
      const name = (id, path) => (id ? `"${id}"` : path);
      found.push(
        diagnostic('GRAPH_NODE_OVERLAPS_NODE', SEVERITY.error, `the ${name(issue.a, issue.node)} and ${name(issue.b, issue.other)} nodes overlap by ${issue.overlap.x}x${issue.overlap.y}px`, {
          ...where,
          measurement: { overlapPx: issue.overlap, nodes: [issue.node, issue.other] },
          suggestion: 'move one of them with `at`, or narrow both with `width` / `--deck-node-size` · a node hidden behind another is a node nobody reads',
        }),
      );
    } else if (issue.kind === 'edge-crosses-node') {
      found.push(
        diagnostic('GRAPH_EDGE_CROSSES_NODE', SEVERITY.warning, `the ${issue.from} → ${issue.to} edge passes under another node`, {
          ...where,
          element: issue.edge,
          measurement: { obstructingNode: issue.node, from: issue.from, to: issue.to },
          suggestion: 'move the obstructing node or split the route into a clear path; an orthogonal route is preferable when available',
        }),
      );
    } else if (issue.kind === 'label-covered') {
      found.push(
        diagnostic('GRAPH_NODE_COVERS_LABEL', SEVERITY.error, `a node is painted over the "${issue.text}" ${issue.labelKind} label · ${issue.overlap.x}x${issue.overlap.y}px of it`, {
          ...where,
          element: issue.label,
          measurement: { overlapPx: issue.overlap, node: issue.node },
          suggestion: issue.labelKind === 'edge'
            ? 'move the node with `at`, or the caption with `label-offset` · a label under a node is a label nobody reads'
            : 'move the node with `at`, or the region with its own `at` · a label under a node is a label nobody reads',
        }),
      );
    } else if (issue.kind === 'edge-skewed') {
      found.push(
        diagnostic('GRAPH_EDGE_SKEWED', SEVERITY.warning, `the ${issue.from} → ${issue.to} edge misses ${issue.axis} by ${issue.pixels}px`, {
          ...where,
          element: issue.edge,
          measurement: { deviationPx: issue.pixels, slopePercent: issue.slope, axis: issue.axis },
          suggestion: 'give both nodes the same `at` coordinate on that axis, or set `route="ortho"` · a frank diagonal is a choice, a three-degree slope is a slip',
        }),
      );
    } else if (issue.kind === 'nodes-off-axis') {
      const name = (id, path) => (id ? `"${id}"` : path);
      const line = issue.axis === 'x' ? 'column' : 'row';
      found.push(
        diagnostic('GRAPH_NODES_OFF_AXIS', SEVERITY.warning, `the ${name(issue.a, issue.node)} and ${name(issue.b, issue.other)} nodes miss the same ${line} by ${issue.pixels}px`, {
          ...where,
          measurement: { offsetPx: issue.pixels, axis: issue.axis, nodes: [issue.node, issue.other] },
          suggestion: `give them the same \`at\` coordinate on that axis · this close, they were meant to share a ${line}`,
        }),
      );
    } else if (issue.kind === 'sizes-mixed') {
      const name = (id, path) => (id ? `"${id}"` : path);
      found.push(
        diagnostic('GRAPH_NODE_SIZES_MIXED', SEVERITY.warning, `the ${name(issue.a, issue.node)} and ${name(issue.b, issue.other)} nodes share a ${issue.along} but differ by ${issue.pixels}px in ${issue.dimension} · ${issue.share}%`, {
          ...where,
          measurement: { differencePx: issue.pixels, sharePercent: issue.share, dimension: issue.dimension, nodes: [issue.node, issue.other] },
          suggestion: 'set `width` or `--deck-node-size` on both, or even out their notes · near-equal boxes read as a failed attempt at the same size, clearly different ones read as a hierarchy',
        }),
      );
    } else if (issue.kind === 'layout-not-semantic') {
      found.push(
        diagnostic('GRAPH_LAYOUT_NOT_SEMANTIC', SEVERITY.warning, `every node of this graph sits on one ${issue.layout} · the \`at\` coordinates spell out what layout="${issue.layout}" already says`, {
          ...where,
          element: issue.graph,
          measurement: { nodes: issue.nodes, arrangement: issue.layout },
          suggestion: `set layout="${issue.layout}" and drop the \`at\` · the arrangement then survives a node added or removed`,
        }),
      );
    }
  }

  const ids = page.slides.map((s) => s.id).filter(Boolean);
  const duplicated = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  for (const id of duplicated) {
    found.push(
      diagnostic('DUPLICATE_SLIDE_ID', SEVERITY.warning, `two slides share the id "${id}"`, {
        suggestion: 'ids address a slide for a targeted edit or a render selection · make them unique',
      }),
    );
  }

  // Layout measurements read a styled deck. On a page whose runtime never ran,
  // every box is raw HTML: the numbers would be real and meaningless.
  const warnedFonts = new Set();
  for (const slide of page.runtimeLoaded ? page.slides : []) {
    if (slide.measured === false) continue; // measured by another pass of the walk
    const where = { slide: slide.index, slideId: slide.id, slideTag: slide.tag };
    const clippedHere = slide.clipped && slide.clipped.pixels > limits.clipPx;
    if (clippedHere) {
      found.push(
        diagnostic('CONTENT_CLIPPED', SEVERITY.error, `content is cut off · ${slide.clipped.pixels}px do not fit`, {
          ...where,
          element: slide.clipped.path,
          measurement: { clippedPx: slide.clipped.pixels, axis: slide.clipped.axis },
          suggestion: 'the engine clips rather than scrolls · cut a sentence, move detail into <deck-notes>, or split the slide',
        }),
      );
    }
    for (const sl of slide.scrollSlivers ?? []) {
      found.push(
        diagnostic('SCROLL_SLIVER', SEVERITY.warning, `<${sl.tag}> scrolls ${sl.axis === 'y' ? 'vertically' : 'horizontally'} by ${sl.px}px · ${Math.round((sl.px / sl.line) * 100)}% of a line, a scrollbar for a sliver`, {
          ...where,
          element: sl.path,
          measurement: { axis: sl.axis, overflowPx: sl.px, linePx: sl.line },
          suggestion: 'the slide is a hair too full · cut or merge one line, shorten what sits above the box, or shrink the type',
        }),
      );
    }
    // Density is what you say about a slide that still fits. Once it is
    // clipped, saying "nothing is cut yet" underneath contradicts the line
    // above it.
    if (!clippedHere && slide.fillRatio > limits.denseFillRatio) {
      found.push(
        diagnostic('SLIDE_DENSE', SEVERITY.warning, `the content spans ${Math.round(slide.fillRatio * 100)}% of the slide height`, {
          ...where,
          measurement: { fillRatio: slide.fillRatio },
          suggestion: 'nothing is cut yet, but there is no room left · consider splitting',
        }),
      );
    }
    if (slide.escapesBox) {
      const e = slide.escapesBox;
      found.push(
        diagnostic('CONTENT_ESCAPES_BOX', SEVERITY.error, `"${e.text}" spills ${e.pixels}px past its box · "${e.containerText}"`, {
          ...where,
          element: e.path,
          measurement: { escapePx: e.pixels, container: e.containerPath, containerText: e.containerText },
          suggestion: 'nothing clips here, so the box is simply too small for what is inside it · shorten the text, or give the box more room',
        }),
      );
    }
    if (slide.overlapsSibling) {
      const o = slide.overlapsSibling;
      found.push(
        diagnostic('CONTENT_OVERLAPS_SIBLING', SEVERITY.error, `"${o.textA}" overlaps "${o.textB}" by ${o.overlap.x}x${o.overlap.y}px`, {
          ...where,
          element: o.pathA,
          measurement: { overlapPx: o.overlap, other: o.pathB, otherText: o.textB },
          suggestion: 'two unrelated blocks paint over each other · give the earlier one a fixed height, or the layout more room to breathe',
        }),
      );
    }
    for (const e of slide.svgTextEscapes ?? []) {
      const past = e.against === 'viewBox' ? "the drawing's viewBox" : `the <${e.against}> it is written in`;
      found.push(
        diagnostic('SVG_TEXT_ESCAPES', SEVERITY.error, `"${e.text}" spills ${e.pixels}px past ${past}`, {
          ...where,
          element: e.path,
          measurement: { escapePx: e.pixels, against: e.against, shape: e.shapePath },
          excerpt: e.text,
          suggestion: e.against === 'viewBox'
            ? 'a drawing does not wrap its own text · move the label inward, shorten it, or widen the viewBox'
            : 'a drawing does not wrap its own text · shorten the label, break it onto a second <tspan>, or widen the shape',
        }),
      );
    }
    for (const o of slide.svgTextOverlaps ?? []) {
      found.push(
        diagnostic('SVG_TEXT_OVERLAP', SEVERITY.error, `"${o.textA}" overlaps "${o.textB}" by ${o.overlap.x}x${o.overlap.y}px in the drawing`, {
          ...where,
          element: o.pathA,
          measurement: { overlapPx: o.overlap, other: o.pathB, otherText: o.textB },
          suggestion: 'two labels of one drawing paint over each other · move one of them, or shorten both',
        }),
      );
    }
    for (const s of slide.svgTextSmall ?? []) {
      found.push(
        diagnostic('SVG_TEXT_TOO_SMALL', SEVERITY.warning, `a drawing sets text at ${s.px}px on screen · "${s.text}"${s.count > 1 ? ` and ${s.count - 1} more` : ''}`, {
          ...where,
          element: s.path,
          measurement: { px: s.px, minPx: limits.minTextPx, labels: s.count },
          excerpt: s.text,
          suggestion: `a drawing scales by its viewBox, so its font-size is not what the room sees · set text at ${limits.minTextPx}px or more on screen (in a 1600-wide viewBox that is about ${Math.ceil(limits.minTextPx * 1600 / 1920)} units), or draw it as a scene, which sets its own sizes`,
        }),
      );
    }
    for (const c of slide.svgTextContrast ?? []) {
      found.push(
        diagnostic('SVG_TEXT_CONTRAST_LOW', c.severity, `"${c.text}" has a contrast of ${c.ratio}:1 on the ${c.on} · ${c.needed}:1 is needed`, {
          ...where,
          element: c.path,
          measurement: { ratio: c.ratio, needed: c.needed, on: c.on },
          excerpt: c.text,
          suggestion: 'text this close to its background in colour is not read from the back of the room · change the fill of the text or of what it sits on (in a scene, the colour comes from a theme token: change the token, not the drawing)',
        }),
      );
    }
    for (const declared of slide.motifs ?? [])
      motifs?.push({
        slide: slide.index,
        slideId: slide.id,
        element: declared.path,
        motif: { ...declaredSignature(declared.motif), words: wordsByMark({ texts: declared.texts }) },
      });
    for (const illustration of slide.illustrations ?? []) {
      const verdict = lintIllustration(illustration.model, limits.ill);
      const meaning = meaningOf(illustration, slide.sceneIssues ?? []);
      const declared = declaredSignature(illustration.signature);
      illustrations?.push({
        slide: slide.index,
        slideId: slide.id,
        element: illustration.path,
        tag: illustration.tag,
        ...(illustration.model.intent ? { intent: illustration.model.intent } : {}),
        score: verdict.score,
        // A drawing that does not demonstrate its intent fails, whatever its score.
        verdict: meaning.errors ? 'fail' : verdict.verdict,
        facets: { ...verdict.facets, meaning: meaning.facet },
        signature: signatureFromInk(illustration.tag, illustration.model, declared),
        // Whether there is something to see · a measure, never part of the verdict.
        richness: measureRichness({ model: illustration.model, signature: declared, sourced: illustration.sourced, tag: illustration.tag }),
        // The words of its named marks and what it says of its place in the deck
        // (`data-motif`: its marks, its act, its pair, its zoom-from) · whether a
        // repeat progresses and what the deck declares, read by `diversityOf`,
        // `richnessOf` and `motifsOf`, and dropped from the report.
        motif: { ...declaredSignature(illustration.motif), words: wordsByMark(illustration.model) },
        // What the verdict is made of · judged again once the deck's policy has
        // dropped findings or changed their severity (`rescoreIllustrations`).
        findings: {
          ill: verdict.issues.map(({ code, severity, facet }) => ({ code, severity, facet })),
          meaning: (slide.sceneIssues ?? [])
            .filter((s) => s.path === illustration.path && isMeaning(s))
            .map(({ code, severity }) => ({ code, severity })),
        },
      });
      for (const issue of verdict.issues) {
        found.push(
          diagnostic(issue.code, issue.severity, issue.message, {
            ...where,
            element: illustration.path,
            measurement: issue.measurement,
            facet: issue.facet,
            suggestion: ILL_ADVICE[issue.severity],
            ...(issue.fix ? { fix: issue.fix } : {}),
          }),
        );
      }
    }
    for (const family of slide.sceneFonts ?? []) {
      if (warnedFonts.has(family)) continue;
      warnedFonts.add(family);
      found.push(
        diagnostic('SCENE_FONT_FALLBACK', SEVERITY.warning, `a scene is measured in a fallback: the font "${family}" is not installed or did not load`, {
          ...where,
          measurement: { family },
          suggestion: 'every width a scene measured is the fallback\'s, not the room\'s · serve the theme\'s font files (rikiki init copies them) or check the network, then run check again',
        }),
      );
    }
    for (const s of slide.sceneIssues ?? []) {
      const fields = s.fields ?? [];
      const fix = sceneFix(s);
      found.push(
        diagnostic(s.code, s.severity, `<${s.tag}> ${s.items.map((item) => `"${item}"`).join(', ')} · ${s.message}`, {
          ...where,
          element: s.path,
          measurement: { items: s.items, ...(fields.length ? { fields } : {}), ...(s.measurement ?? {}) },
          ...(s.expected !== undefined ? { expected: s.expected } : {}),
          suggestion: sceneSuggestion(s, fields, fix),
          ...(fix ? { fix } : {}),
        }),
      );
    }
    if (slide.lastLineOrphan) {
      const o = slide.lastLineOrphan;
      found.push(
        diagnostic('TEXT_LAST_LINE_ORPHAN', SEVERITY.warning, `"${o.tail}" hangs alone on the last line · ${Math.round(o.ratio * 100)}% of the width above it`, {
          ...where,
          element: o.path,
          measurement: { lastLineRatio: Math.round(o.ratio * 100) / 100, lines: o.lines, floorRatio: limits.orphanLineRatio },
          excerpt: o.tail,
          suggestion: 'set `text-wrap: pretty`, shorten the wording, or bind the last words with a non-breaking space · on a wall this reads as a typographic accident',
        }),
      );
    }
    for (const d of slide.doubledIcons ?? []) {
      found.push(
        diagnostic('ICON_DOUBLED', SEVERITY.warning, `<${d.tag}> paints its own icon and its text opens with ${d.emoji} · two icons in one box`, {
          ...where,
          element: d.path,
          measurement: { emoji: d.emoji, iconPx: d.iconPx, iconMaxPx: limits.iconMaxPx },
          excerpt: d.text,
          suggestion: 'drop the emoji: the component already carries an icon · pick the type whose icon says it, or move the emoji out of the box',
        }),
      );
    }
    for (const t of slide.tiny) {
      found.push(
        diagnostic('TEXT_TOO_SMALL', SEVERITY.warning, `text renders at ${t.px}px · the back row will not read it`, {
          ...where,
          element: t.path,
          measurement: { renderedPx: t.px, floorPx: limits.minTextPx },
          excerpt: t.text,
          suggestion: 'use the deck type scale rather than a hardcoded size',
        }),
      );
    }
  }

  // A duration on the cover is a promise to whoever books the room.
  const minutes = Number.parseFloat(String(page.announced ?? '').replace(',', '.'));
  if (page.runtimeLoaded && Number.isFinite(minutes) && minutes > 0) {
    const spokenMinutes = page.spokenWords / limits.wordsPerMinute;
    const ratio = spokenMinutes / minutes;
    if (ratio < limits.talkLengthTolerance) {
      found.push(
        diagnostic('TALK_SHORTER_THAN_ANNOUNCED', SEVERITY.warning, `the cover announces ${minutes} min · the notes carry about ${spokenMinutes.toFixed(0)} min of speech`, {
          measurement: { announcedMinutes: minutes, spokenWords: page.spokenWords, wordsPerMinute: limits.wordsPerMinute },
          suggestion: 'either the deck has more to say than its notes admit, or the slot is shorter than announced · an estimate from the notes alone, never a verdict',
        }),
      );
    }
  }

  // Said about the file, not about the run: a deck that fetches from a CDN is
  // fine on a network and empty on a plane. It is about the source, so it is
  // said on the pass that reads the whole document, not once per slide.
  for (const hit of page.scannedDocument === false ? [] : scanExternal(source).filter((h) => /^https?:|^\/\//.test(h.ref))) {
    found.push(
      diagnostic('EXTERNAL_DEPENDENCY', SEVERITY.warning, `the deck fetches ${hit.ref} at runtime`, {
        suggestion: 'fine on a network · run `rikiki bundle` for a file that opens offline',
      }),
    );
  }

  return found;
}

/** Codes whose message states a measurement. Between two states of one slide
 *  that number drifts by a pixel and the finding is still the same one, so it
 *  is blanked out of the identity. Nowhere else: two dependencies that differ
 *  only by a version number are two dependencies, and blanking their digits
 *  reported one. */
const MEASURED_IN_MESSAGE = new Set([
  'CONTENT_CLIPPED',
  'CONTENT_ESCAPES_BOX',
  'CONTENT_OVERLAPS_SIBLING',
  'SLIDE_DENSE',
  'SLIDE_TOP_HEAVY',
  'TEXT_TOO_SMALL',
  'TEXT_LAST_LINE_ORPHAN',
  'SCROLL_SLIVER',
  'SVG_TEXT_ESCAPES',
  'SVG_TEXT_OVERLAP',
  'GRAPH_NODE_OUT_OF_BOUNDS',
  'GRAPH_NODE_OVERLAPS_NODE',
  'GRAPH_NODE_COVERS_LABEL',
  'GRAPH_EDGE_SKEWED',
  'GRAPH_NODES_OFF_AXIS',
  'GRAPH_NODE_SIZES_MIXED',
  'TALK_SHORTER_THAN_ANNOUNCED',
]);

/** Two diagnostics identical on (code, slide, element, wording) are the same
 *  finding seen at a different moment · keep the earliest state it held.
 *
 *  The wording counts because one element carries several findings of the same
 *  code · two attributes it ignores are two diagnostics on the same path, and
 *  a diagnostic with no element at all is identified by its words alone. */
function dedupeStateDiagnostics(diagnostics) {
  const kept = new Map();
  for (const d of diagnostics) {
    const message = String(d.message ?? '');
    const wording = MEASURED_IN_MESSAGE.has(d.code) ? message.replace(/[\d.]+/g, '#') : message;
    const key = JSON.stringify([d.plugin ?? 'rikiki', d.code, d.slide ?? null, d.element ?? null, d.key ?? wording]);
    const prior = kept.get(key);
    if (!prior || d.state < prior.state) kept.set(key, d);
  }
  return [...kept.values()];
}

/** Walk the deck slide by slide, running `diagnose` on each.
 *
 *  Both modes take this path: a slide is only laid out while it is on screen,
 *  so even the opening state of slide 2 has to be navigated to before it can
 *  be measured. With `steps`, each slide is also carried through every state
 *  `advanceStep` reaches and the finding is tagged with the state it was
 *  measured in · 0 for the opening state. Without it there is one state per
 *  slide and nothing to tag.
 *
 *  Whatever does not depend on which slide is showing is asked once, on the
 *  first pass, rather than once per state. `indexes` are the 1-based slides to
 *  walk, in deck order · all of them, or the ones `--slides` picked. */
async function diagnoseAllStates(page, indexes, slideCount, inspectOpts, source, limits, { steps, plugins, pluginTimeoutMs, pluginPolicy }) {
  const found = [];
  const illustrations = [];
  const motifs = [];
  let statesInspected = 0;
  for (const index of indexes) {
    if (page.isClosed()) break;
    try {
      await goToSlide(page, index);
    } catch {
      // The deck did not arrive · a script swallowing the hash, a slide that
      // throws on connect. Report it and keep what the earlier slides gave:
      // a deck nobody can walk still deserves the report it already earned,
      // and an agent reading the JSON gets a diagnosis instead of a crash.
      found.push(
        diagnostic('NAVIGATION_STALLED', SEVERITY.error, `the deck never arrived at slide ${index} · the walk stopped there`, {
          slide: index,
          measurement: { slidesMeasured: index - 1, slideCount },
          suggestion: 'navigation is driven by the location hash · check for a script that intercepts it, or a slide that throws while connecting',
        }),
      );
      break;
    }
    let state = 0;
    for (;;) {
      // What belongs to the whole document is read once, on the first slide
      // walked · slide 1 unless the selection starts later.
      const scanDocument = index === indexes[0] && state === 0;
      const snapshot = await page.evaluate(inspectPage, { ...inspectOpts, only: index, scanDocument });
      statesInspected += 1;
      for (const d of diagnose(snapshot, source, limits, illustrations, motifs)) found.push(steps ? { ...d, state } : d);
      found.push(...await runCheckPlugins(page, plugins, { slide: index, state, documentPass: scanDocument }, pluginTimeoutMs, pluginPolicy));
      if (page.isClosed()) break;
      if (!steps || !(await advanceStep(page))) break;
      state += 1;
    }
  }
  // Every state of every drawing · the policy judges each before the worst is kept.
  // What each diagram declares, as the last state walked shows it · the picture the room is left with.
  const declared = new Map(motifs.map((row) => [`${row.slide}|${row.element}`, row]));
  return { diagnostics: dedupeStateDiagnostics(found), statesInspected, illustrationStates: illustrations, motifs: [...declared.values()] };
}

/** One row per drawing · a slide walked through several states measures the same
 *  drawing more than once, and the row that stands is the worst of them. Its
 *  richness is the one of the last state walked: the picture the room is left with. */
function worstPerDrawing(rows) {
  const byDrawing = new Map();
  const last = new Map();
  const worse = (row, seen) =>
    (row.verdict === 'fail') !== (seen.verdict === 'fail') ? row.verdict === 'fail' : row.score < seen.score;
  for (const row of rows) {
    const key = `${row.slide}|${row.element}`;
    const seen = byDrawing.get(key);
    if (!seen || worse(row, seen)) byDrawing.set(key, row);
    last.set(key, row);
  }
  return [...byDrawing].map(([key, row]) => ({ ...row, richness: last.get(key).richness, motif: last.get(key).motif }));
}

/** Each drawing judged again on the findings the deck's policy kept, at the
 *  severity it gave them · a silenced rule no longer weighs on a verdict, a raised
 *  one may fail it. The row says which of its findings were left out. */
function rescoreIllustrations(rows, judge) {
  return rows.map(({ findings, ...row }) => {
    if (!findings) return row;
    const where = { slide: row.slide, element: row.element };
    const left = [];
    const keep = (list) =>
      list.flatMap((issue) => {
        const decision = judge({ ...issue, ...where });
        if (!decision.kept) left.push(issue.code);
        return decision.kept ? [{ ...issue, severity: decision.severity }] : [];
      });
    const ill = keep(findings.ill);
    const meaning = keep(findings.meaning);
    const verdict = scoreIssues(ill);
    const meaningErrors = meaning.filter((s) => s.severity === SEVERITY.error).length;
    return {
      ...row,
      score: verdict.score,
      verdict: meaningErrors ? 'fail' : verdict.verdict,
      facets: {
        ...verdict.facets,
        meaning: Math.max(0, 100 - meaning.reduce((sum, s) => sum + MEANING_COST[s.severity], 0)),
      },
      ...(left.length ? { suppressed: [...new Set(left)] } : {}),
    };
  });
}

/** One verdict per drawing, on the findings the deck's policy kept · every state
 *  walked is judged again first, then the worst of them stands: a state that was
 *  the worst before the policy may be the best after it. */
export function illustrationVerdicts(rows, judge) {
  return worstPerDrawing(rescoreIllustrations(rows, judge)).map(({ motif: _motif, ...row }) => row);
}

/** How alike the illustrations of the deck are · the gallery's numbers, and one
 *  `ILL_REPEATED_LOOK` warning per pair that is the same look twice. A warning
 *  about the deck: neither slide is wrong alone. The matrix of every distance is
 *  long, and only kept when asked (`--diversity`). */
function diversityOf(illustrations, { matrix }) {
  if (illustrations.length < 2) return { report: null, issues: [] };
  const measured = measureDiversity(illustrations);
  const issues = repeatedLookIssues(measured).map(({ code: _code, severity, message, ...extra }) =>
    diagnostic('ILL_REPEATED_LOOK', severity, message, {
      ...extra,
      suggestion: 'a repeated look is a warning about the deck, not a defect of a slide · vary the intent, the layout or the marks of one of the two, or merge them',
    }),
  );
  const { matrix: distances, ...summary } = measured;
  return { report: matrix ? { ...summary, matrix: distances } : summary, issues };
}

/** Whether the illustrations hold something to see · the mean, the poorest, how each
 *  criterion does where it applies. A measure, not a verdict: its findings
 *  (`ILL_GENERIC`, `ILL_FLAT_PAINT`, `ILL_MODEL_REPEAT`) only when asked (`--richness`). */
function richnessOf(illustrations, { findings }) {
  if (!illustrations.length) return { report: null, issues: [] };
  const scores = illustrations.map((row) => row.richness.score);
  const poorest = illustrations.reduce((a, b) => (b.richness.score < a.richness.score ? b : a));
  const criteria = Object.fromEntries(RICHNESS_CRITERIA.map((name) => {
    const points = illustrations.map((row) => row.richness.criteria[name].points).filter((p) => p !== null);
    const mean = points.length ? Math.round(points.reduce((s, p) => s + p, 0) / points.length) : null;
    return [name, { applies: points.length, mean }];
  }));
  const report = {
    illustrations: illustrations.length,
    mean: Math.round(scores.reduce((s, n) => s + n, 0) / scores.length),
    min: { score: poorest.richness.score, slide: poorest.slide },
    max: Math.max(...scores),
    criteria,
  };
  if (!findings) return { report, issues: [] };
  const suggestion = 'a measure of what there is to see, never a defect · the fix says what the drawing lacks, and a reviewer decides';
  const own = illustrations.flatMap((row) => richnessIssues(row.richness).map(({ code, severity, message, ...extra }) =>
    diagnostic(code, severity, message, { slide: row.slide, slideId: row.slideId, element: row.element, ...extra, suggestion })));
  const uses = illustrations.map((row) => ({ ...row.motif, slide: row.slide, slideId: row.slideId, model: row.richness.model }));
  const repeats = modelRepeatIssues(uses).map(({ code, severity, message, ...extra }) =>
    diagnostic(code, severity, message, { slide: extra.measurement.slide, slideId: extra.measurement.slideId, ...extra, suggestion }));
  return { report, issues: [...own, ...repeats] };
}

/** What the motifs of the deck declare wrong · a pair whose remedy is missing or drops
 *  the incident's marks, a camera that opens from a slide that is not the one before,
 *  one act written two ways. Always said: the author declared them. `partial` when
 *  only some slides were walked, so a slide that was not is not called missing.
 *  `declared` is every diagram's declaration, scored as an illustration or not. */
function motifsOf(declared, { partial }) {
  return deckMotifIssues(declared, { partial }).map(({ code, severity, message, ...extra }) =>
    diagnostic(code, severity, message, {
      ...extra,
      suggestion: 'a motif of the deck ties two slides · the fix names the attribute and the slide to change',
    }));
}

/** Every code this run can meet · the built-in rules and the rules of the plugins that loaded. */
const knownCodes = (resolution) => [
  ...BUILTIN_RULES.map((r) => r.code),
  ...resolution.plugins.flatMap((p) => p.rules.map((r) => r.code)),
];

/** What the policy itself gets wrong against this deck and its plugins · said by a
 *  check and by `--list-checks` alike, which exits 2 on such an error. */
function policyMistakes(policy, resolution, overrides, scopeErrors) {
  const pending = resolution.plugins.filter((p) => p.status !== 'loaded').map((p) => p.namespace);
  const readers = resolution.plugins.filter((p) => p.status === 'loaded').flatMap((p) => p.rules.map((r) => r.code));
  return [
    ...selectionFindings(policy, { known: knownCodes(resolution), pending }),
    ...optionFindings(policy, { readers, pending }),
    ...overrideFindings(overrides, scopeErrors),
  ];
}

/** What a plugin's rules may do on a slide · which are silenced there (they then do
 *  not run at all) and the options the policy gives each (`check.options`,
 *  `--check-option`). A rule of the whole document is judged on the deck's policy;
 *  a rule of a slide also on the overrides that cover that slide by its slides,
 *  kinds or tags · one that names elements is judged on its findings, after. */
function pluginPolicyOf(policy, placed) {
  const optionsOf = (code) => {
    const own = {};
    for (const [key, value] of Object.entries(policy.options)) {
      const dot = key.lastIndexOf('.');
      if (codeOf(key.slice(0, dot)) === code) own[key.slice(dot + 1)] = value;
    }
    return own;
  };
  return (rules, slideIndex) => {
    const slide = placed.outline.find((s) => s.index === slideIndex) ?? null;
    const slideOverrides = placed.overrides.filter((o) => o.elements === null && slide && o.covers({ slide: slideIndex }, slide));
    // An override that names elements may take a rule back under one of them · the
    // rule then runs, and its findings are judged where they stand, after.
    const elementOverrides = (rule) =>
      placed.overrides.filter((o) => o.elements?.length && (rule.scope === 'document' || o.slides === null || o.slides.includes(slideIndex)));
    const keptWith = (rule, overrides) => decide(policy, rule.code, rule.severity, { overrides }).kept;
    const silenced = (rule) => {
      const around = rule.scope === 'document' ? [] : slideOverrides;
      if (keptWith(rule, around)) return false;
      // One element override at a time, in the order written, is enough to tell.
      return !elementOverrides(rule).some((one) => keptWith(rule, placed.overrides.filter((o) => o === one || around.includes(o))));
    };
    return {
      disabled: rules.filter(silenced).map((r) => r.code),
      options: Object.fromEntries(rules.map((r) => [r.code, optionsOf(r.code)])),
    };
  };
}

/** What the overrides get wrong against this deck · slides it does not have, a
 *  selector the browser cannot read. */
function overrideFindings(overrides, scopeErrors) {
  const found = [];
  for (const o of overrides) {
    if (o.unknownSlides)
      found.push(diagnostic('CHECK_SELECTION_UNMATCHED', SEVERITY.warning, `${o.source} names slides "${o.unknownSlides}", which this deck does not have · it applies to no slide here`, {
        plugin: 'rikiki',
        measurement: { slides: o.unknownSlides, source: o.source },
        suggestion: 'name slides by id or by data-tags rather than by position · inserting a slide shifts every position after it',
      }));
    const error = o.match.elements === undefined ? null : scopeErrors[o.match.elements];
    if (error)
      found.push(diagnostic('CHECK_CONFIG_INVALID', SEVERITY.error, `${o.source}.elements "${o.match.elements}" is not a CSS selector the browser reads (${error}) · it applies to nothing`, {
        plugin: 'rikiki',
        measurement: { elements: o.match.elements, source: o.source },
      }));
  }
  return found;
}

/** The policy as it applied, for the report · where it was written, each override
 *  with what it covered and silenced, each exception with how much it silenced. */
function selectionReport(policy, overrides, exceptions) {
  return {
    sources: policy.sources,
    inline: policy.inline,
    overrides: overrides.map((o) => ({
      source: o.source,
      match: o.match,
      ...(o.reason ? { reason: o.reason } : {}),
      ...(o.slides ? { slides: o.slides } : {}),
      ...(o.elements ? { elements: o.elements.length } : {}),
      decided: o.hits ?? 0,
    })),
    exceptions: exceptions.map((e) => ({
      element: e.path,
      ...(e.slideIndex ? { slide: e.slideIndex } : {}),
      off: e.tokens,
      reason: e.reason || null,
      used: e.used,
      ...(e.refused ? { refused: e.refused } : {}),
    })),
  };
}

/** `--list-checks` · every rule this deck can meet, whether the policy keeps it,
 *  at what severity, and what decided · per slide when the overrides make it vary.
 *  Nothing is measured. */
function listChecksReport({ deckPath, policy, placed, resolution, chosen, findings }) {
  const rules = [
    ...BUILTIN_RULES,
    ...resolution.plugins.flatMap((p) => p.rules.map((r) => ({ code: r.code, origin: `plugin ${p.id}`, alwaysOn: false }))),
  ];
  const checks = rules.map(({ code, origin, alwaysOn }) => {
    const deck = decide(policy, code, 'default');
    const bySlide = chosen.map((index) => {
      const slide = placed.outline.find((s) => s.index === index);
      const overrides = placed.overrides.filter((o) => o.elements === null && slide && o.covers({ slide: index }, slide));
      return { index, kept: decide(policy, code, 'default', { overrides }).kept };
    });
    const on = bySlide.filter((s) => s.kept).map((s) => s.index);
    const off = bySlide.filter((s) => !s.kept).map((s) => s.index);
    const enabled = !off.length ? true : !on.length ? false : 'mixed';
    return {
      code,
      name: nameOf(code),
      origin,
      ...(alwaysOn ? { alwaysOn: true } : {}),
      enabled: chosen.length ? enabled : deck.kept,
      ...(deck.severity !== 'default' ? { severity: deck.severity } : {}),
      ...(deck.by ? { decidedBy: deck.by.source } : {}),
      ...(enabled === 'mixed' ? { slides: { on, off } } : {}),
    };
  });
  return {
    schema: REPORT_SCHEMA,
    deck: basename(deckPath),
    checks,
    selection: selectionReport(policy, placed.overrides, placed.exceptions),
    diagnostics: findings,
    notChecked: [
      'the deck · --list-checks measures nothing, it says what a check would look for',
      ...resolution.notChecked,
      'elements · an override that names elements decides per finding, so it is not shown per slide here',
    ],
  };
}

/**
 * Inspect a deck and report what is wrong with it.
 * @returns {Promise<object>} the versioned report.
 */
export async function checkDeck(
  deckPath,
  { timeoutMs = PAGE_LOAD_TIMEOUT_MS, width = 1920, height = 1080, visual = true, steps = false, slides, diversity = false, richness = false,
    config, plugins = [], noPlugins = false, pluginTimeoutMs = 5000, narrativeOut, narrativeReview, qualityOut, qualityReview, requireQuality = false,
    selection = {}, listChecks = false } = {},
) {
  const source = readFileSync(deckPath, 'utf8');
  const resolution = resolveCheckPlugins(deckPath, { config, plugins, noPlugins });
  if (!Number.isFinite(pluginTimeoutMs) || pluginTimeoutMs < 1) throw new Error('pluginTimeoutMs must be positive');
  // The deck's policy · its folders' `check` sections, then the command line (whose
  // mistakes the CLI refused before a browser was spent).
  const loaded = loadCheckConfig(deckPath, config);
  const policy = buildPolicy({ layers: loaded.layers, cli: selection });
  const { limits, unknown: unknownLimits } = limitsOf(policy.limits);
  const policyFindings = [...loaded.diagnostics];
  if (unknownLimits.length)
    policyFindings.push(diagnostic('CHECK_CONFIG_INVALID', SEVERITY.error, `check.limits names ${unknownLimits.map((k) => `"${k}"`).join(', ')}, which is no threshold · ignored`, {
      plugin: 'rikiki',
      measurement: { unknown: unknownLimits, known: [...Object.keys(LIMITS), ...Object.keys(ILL_LIMITS).map((k) => `ill.${k}`)] },
    }));

  return withDeck(
    deckPath,
    async ({ page, settled, missing, errors }) => {
      const scopeSelectors = [...new Set(policy.overrides.flatMap((o) => (o.match.elements === undefined ? [] : [o.match.elements])))];
      const inspectOpts = { limits, titleReader: SLIDE_TITLE_READER, graphGeometry: GRAPH_GEOMETRY_READER, boxGeometry: BOX_GEOMETRY_READER,
        pathReader: ELEMENT_PATH_READER, scopeSelectors };
      // The outline, and nothing measured · `only: 0` names no slide. What the
      // walk below needs from this pass is how many slides there are and what
      // they are called; measuring them here would read the empty rects of
      // every slide that is not on screen, which is the bug this walk fixes.
      const outlineOpts = { ...inspectOpts, only: 0 };
      const observed = settled
        ? await page.evaluate(inspectPage, outlineOpts)
        : await page.evaluate(inspectPage, outlineOpts).catch(() => ({
            hasRoot: false,
            runtimeLoaded: false,
            slides: [],
            unknown: [],
          }));

      let diagnostics;
      let statesInspected;
      let illustrations = [];
      let illustrationStates = [];
      let declaredMotifs = [];
      if (settled) await startCheckPlugins(page, resolution, pluginTimeoutMs);
      else for (const plugin of resolution.plugins) {
        plugin.status = 'skipped';
        resolution.notChecked.push(`plugin ${plugin.id} · deck did not settle`);
      }
      // `--slides` narrows the walk and the pixel pass · a bad selector fails
      // here, before anything is measured, naming what the deck holds.
      // A deck that never settled, or holds no slide, is reported whole.
      const outline = settled && observed.slides.length ? selectSlides(observed.slides, slides, { command: 'check', exitCode: 2 }) : observed.slides;
      const chosen = outline.map((slide) => slide.index);
      const subset = chosen.length < observed.slides.length;

      // The policy, resolved against this deck · the slides each override covers
      // (on the whole deck, whatever `--slides` walks), the elements it names, the
      // exceptions the deck writes on itself.
      const deck = observed.slides;
      const overrides = resolveOverrides(policy, {
        outline: deck,
        resolveSlides: (selector) => {
          try {
            return selectSlides(deck, selector, { command: 'check' }).map((s) => s.index);
          } catch {
            // Named below, as a selection that matches nothing in this deck.
            return null;
          }
        },
        elementPaths: observed.scopeMatches ?? {},
      });
      const exceptions = readExceptions(observed.checkExceptions ?? [], deck);
      const placed = { outline: deck, overrides, exceptions };
      const judge = (finding) => decide(policy, finding.code, finding.severity, scopeOf(finding, placed));
      const pluginPolicy = pluginPolicyOf(policy, placed);

      if (listChecks) {
        const mistakes = policyMistakes(policy, resolution, overrides, observed.scopeErrors ?? {});
        return listChecksReport({ deckPath, policy, placed, resolution, chosen, findings: [...policyFindings, ...resolution.diagnostics, ...mistakes] });
      }

      if (settled && observed.slides.length && !page.isClosed()) {
        const walked = await diagnoseAllStates(page, chosen, observed.slides.length, inspectOpts, source, limits, { steps, plugins: resolution, pluginTimeoutMs, pluginPolicy });
        diagnostics = walked.diagnostics;
        statesInspected = walked.statesInspected;
        illustrationStates = walked.illustrationStates;
        declaredMotifs = walked.motifs;
        illustrations = worstPerDrawing(illustrationStates);
      } else {
        // Nothing to walk: the deck never settled, or it holds no slide at
        // all. One whole-document pass is all there is to report · on a deck
        // that never settled the geometry is unreliable anyway, but saying
        // nothing about it would be worse.
        const whole = observed.slides.length && !page.isClosed()
          ? await page.evaluate(inspectPage, { ...inspectOpts, only: null }).catch(() => observed)
          : observed;
        diagnostics = diagnose(whole, source, limits);
        statesInspected = observed.slides.length;
      }
      diagnostics.push(...resolution.diagnostics);
      const { report: diversityReport, issues: repeatedLooks } = diversityOf(illustrations, { matrix: diversity });
      diagnostics.push(...repeatedLooks);
      const { report: richnessReport, issues: richnessFindings } = richnessOf(illustrations, { findings: richness });
      diagnostics.push(...richnessFindings);
      diagnostics.push(...motifsOf(declaredMotifs, { partial: subset }));

      let narrative = { status: 'not-run' };
      if ((narrativeOut || narrativeReview) && !page.isClosed() && settled) {
        const slides = await page.evaluate(collectNarrative);
        const request = narrativeRequest(deckPath, source, slides, { width, height }, resolution.config.narrative);
        if (narrativeOut) {
          const { writeFileSync } = await import('node:fs');
          writeFileSync(narrativeOut, JSON.stringify(request, null, 2) + '\n');
          narrative = { status: 'pending', digest: request.digest, request: narrativeOut };
        }
        if (narrativeReview) {
          const reviewed = applyNarrativeReview(request, narrativeReview);
          narrative = reviewed.narrative;
          diagnostics.push(...reviewed.diagnostics);
        }
      } else if (narrativeOut || narrativeReview) {
        narrative = { status: 'failed' };
        diagnostics.push(diagnostic('NARRATIVE_UNAVAILABLE', 'error', 'Narrative review requires a settled deck and an open browser'));
      }

      // The pixel pass needs a settled deck and one screenshot per slide · it
      // is the slowest thing here, so it is skippable.
      let visualMeasured = false;
      if (visual && settled && observed.slides.length && !page.isClosed()) {
        const goTo = async (index) => {
          await page.evaluate((i) => {
            window.location.hash = `#${i}`;
          }, index);
          await page
            .waitForFunction((i) => document.querySelector('deck-root')?.current === i - 1, index, {
              timeout: NAVIGATION_TIMEOUT_MS,
            })
            .catch(() => {});
          await waitForStillFrame(page);
        };
        const measured = await measureSlides(page, chosen, goTo);
        diagnostics.push(...diagnoseVisual(measured, observed.slides, limits));
        visualMeasured = true;
      }

      for (const message of [...new Set(errors)]) {
        diagnostics.unshift(
          diagnostic('PAGE_ERROR', SEVERITY.error, `the page threw: ${message}`, {
            suggestion: 'an exception during setup usually leaves the rest of the deck unbuilt',
          }),
        );
      }
      // The same miss arrives twice, once as a failed request and once as a 4xx
      // response · one file, one diagnostic.
      const byUrl = new Map();
      for (const entry of missing) {
        const url = entry.replace(/ \(HTTP \d+\)$/, '');
        const status = entry.match(/ \(HTTP (\d+)\)$/)?.[1];
        byUrl.set(url, status ?? byUrl.get(url) ?? null);
      }
      for (const [url, status] of byUrl) {
        diagnostics.unshift(
          diagnostic('RESOURCE_MISSING', SEVERITY.error, `the deck could not load ${url}${status ? ` (HTTP ${status})` : ''}`, {
            url,
            httpStatus: status ? Number(status) : null,
            suggestion: 'check the path · a missing runtime leaves every slide raw, a missing image leaves a gap',
          }),
        );
      }

      const qualityResult = await reviewQuality({ page, deckPath, source, settled, width, height,
        outDir: qualityOut, reviewFile: qualityReview, required: requireQuality });
      diagnostics.push(...qualityResult.diagnostics);
      const quality = qualityResult.quality;

      // The deck's policy, finding by finding · then what the policy itself got
      // wrong, which no policy silences.
      const applied = applyPolicy(diagnostics, policy, placed);
      const known = knownCodes(resolution);
      const coverage = {
        all: deck.map((s) => s.index),
        inspected: settled ? chosen : [],
        steps,
        visual: visualMeasured,
        slideSteps: Object.fromEntries(deck.map((s) => [s.index, s.steps])),
        visualCodes: VISUAL_CODES,
        unloaded: resolution.plugins.filter((p) => p.status !== 'loaded').map((p) => p.namespace),
      };
      diagnostics = [
        ...applied.kept,
        ...policyFindings,
        // Read again after the walk · a plugin may have stopped loading on the way.
        ...policyMistakes(policy, resolution, overrides, observed.scopeErrors ?? {}),
        ...exceptionFindings(exceptions, policy, { known, coverage }),
      ];
      const suppressed = applied.suppressed;
      illustrations = illustrationVerdicts(illustrationStates, judge);
      // `suppressed` only when there is some · a report of a deck with no policy keeps
      // the shape a consumer already reads.
      const summary = { error: 0, warning: 0, ...(suppressed.length ? { suppressed: suppressed.length } : {}) };
      for (const d of diagnostics) summary[d.severity] = (summary[d.severity] ?? 0) + 1;

      return {
        schema: REPORT_SCHEMA,
        deck: basename(deckPath),
        settled,
        slideCount: observed.slides.length,
        slidesChecked: chosen,
        statesInspected,
        limits,
        visualMeasured,
        summary,
        diagnostics,
        // What the deck's policy left out, each with what left it out and why ·
        // a clean report is never a silenced one in disguise.
        suppressed,
        selection: selectionReport(policy, overrides, exceptions),
        // One row per illustration measured: its score, its verdict and the six
        // facets · the score ranks variants, the verdict is what a defect decides.
        illustrations,
        // How alike the illustrations are to each other · null under two drawings.
        diversity: diversityReport,
        // Whether they hold something to see, out of 100 · null with no drawing.
        richness: richnessReport,
        plugins: pluginReport(resolution),
        narrative,
        quality,
        // Named so a reader does not mistake silence for a clean bill.
        notChecked: [
          ...(quality.status === 'completed' ? [] : ['slide design quality · ' + quality.status + ' (requires screenshot review)']),
          ...resolution.notChecked,
          ...(narrative.status === 'completed' ? [] : [`narrative composition · ${narrative.status} (review by the current agent)`]),
          ...(observed.runtimeLoaded
            ? []
            : ['layout · the runtime never ran, so nothing about size or fit was measured']),
          ...(subset ? [`other slides · ${chosen.length} of ${observed.slides.length} slides measured (--slides), the rest were not looked at`] : []),
          ...(suppressed.length
            ? [`silenced findings · ${suppressed.length} measured and left out by the deck's policy (listed under suppressed, with their reason)`]
            : []),
          ...(steps ? [] : ['revealed steps · only the opening state of each slide is measured']),
          'accessibility · no contrast, focus order or screen-reader check is run',
          'wording, facts and figures · nothing here reads the content',
          'what a speaker actually says · the length estimate reads the notes, not the room',
          'other viewports · the deck is measured at its own canvas size',
          'the size of text inside a diagram · an SVG scales by its viewBox, which is not measured here',
          "a component's own chrome · only the text an author wrote is measured for size",
          ...(visualMeasured
            ? ['pixels of revealed states · the visual pass photographs only the opening state of each slide']
            : ['the pixels · the visual pass did not run']),
        ],
      };
    },
    { timeoutMs, viewport: { width, height } },
  );
}

/** The diversity of the illustrations, in words · one line, then the pairs that are
 *  the same look twice, then (with `--diversity`) each drawing's nearest neighbour. */
function formatDiversity(diversity, illustrations) {
  const family = diversity.largestFamily;
  const lines = [
    `Diversity · ${diversity.illustrations} illustrations · ${diversity.structures} structures (${diversity.structuresPer100}/100)`
      + ` · ${diversity.intents.length} intents · largest family ${family ? `${family.name} ${Math.round(family.share * 100)} %` : 'none'}`
      + ` · ${diversity.repeated.length} pair(s) alike · ${diversity.progressing?.length ?? 0} motif(s) that progress · mean nearest ${diversity.meanNearest}`,
  ];
  for (const pair of diversity.repeated)
    lines.push(`    alike  slide ${pair.a.slide} · slide ${pair.b.slide} · distance ${pair.distance.d}`);
  for (const pair of diversity.progressing ?? [])
    lines.push(`    motif  slide ${pair.a.slide} · slide ${pair.b.slide} · distance ${pair.distance.d} · ${pair.progress.join(', ')}`);
  if (!diversity.matrix) return lines;
  diversity.matrix.forEach((row, i) => {
    const others = row.map((d, j) => ({ d, j })).filter(({ j }) => j !== i);
    const nearest = others.reduce((a, b) => (b.d < a.d ? b : a));
    const own = illustrations[i];
    const { intent, layouts } = own.signature.structure;
    const shape = intent ?? (layouts.join('+') || own.tag);
    lines.push(`    slide ${own.slide} · ${shape} · nearest slide ${illustrations[nearest.j].slide} at ${nearest.d}`);
  });
  return lines;
}

/** The richness of the illustrations, in words · one line, then (with `--richness`)
 *  each drawing's points on the five criteria, `-` where a criterion does not apply. */
function formatRichness(richness, illustrations, { detailed }) {
  const criteria = Object.entries(richness.criteria)
    .map(([name, c]) => `${name} ${c.mean === null ? '-' : `${c.mean}/20`}`)
    .join(' · ');
  const lines = [
    `Richness · ${richness.illustrations} illustrations · mean ${richness.mean}/100 · poorest ${richness.min.score} (slide ${richness.min.slide}) · ${criteria}`,
  ];
  if (!detailed) return lines;
  // Columns as wide as ` content`, the longest header once demonstration is `demo`.
  const column = (text) => String(text).padStart(8);
  const headers = RICHNESS_CRITERIA.map((name) => column(name === 'demonstration' ? 'demo' : name)).join('');
  lines.push(`    slide  score${headers}  model`);
  for (const row of illustrations) {
    const points = RICHNESS_CRITERIA.map((name) => column(row.richness.criteria[name].points ?? '-')).join('');
    lines.push(`    ${String(row.slide).padStart(5)}  ${String(row.richness.score).padStart(5)}${points}  ${row.richness.model}`);
  }
  return lines;
}

/** The human rendering of a report · the JSON is the machine one. */
export function formatReport(report, { showSuppressed = false, richness = false } = {}) {
  const lines = [];
  const icon = { error: '✗', warning: '!' };
  const where = (d) =>
    `${d.slide ? ` · slide ${d.slide}${d.slideId ? ` (#${d.slideId})` : ''}` : ''}${d.state !== undefined ? ` · state ${d.state}` : ''}`;
  for (const d of report.diagnostics) {
    lines.push(`${icon[d.severity] ?? '·'} ${d.code}${where(d)}${d.promoted ? ' · raised to an error by the deck\'s policy' : ''}`);
    lines.push(`    ${d.message}`);
    if (d.element) lines.push(`    at  ${d.element}`);
    if (d.suggestion) lines.push(`    try ${d.suggestion}`);
  }
  for (const d of showSuppressed ? (report.suppressed ?? []) : []) {
    const by = d.suppressedBy ?? {};
    lines.push(`· ${d.code}${where(d)} · silenced by ${by.kind} ${by.source}${by.reason ? ` · ${by.reason}` : ''}`);
    lines.push(`    ${d.message}`);
  }
  const { error, warning, suppressed = 0 } = report.summary;
  lines.push('');
  lines.push(
    `${report.deck} · ${report.slideCount} slide(s) · ${error} error(s), ${warning} warning(s)`
      + (suppressed ? ` · ${suppressed} silenced by the deck's policy${showSuppressed ? '' : ' (--show-suppressed)'}` : ''),
  );
  if (report.illustrations?.length) {
    const { illustrations } = report;
    const mean = Math.round(illustrations.reduce((sum, i) => sum + i.score, 0) / illustrations.length);
    const failed = illustrations.filter((i) => i.verdict === 'fail').length;
    lines.push(`Illustrations · ${illustrations.length} measured · mean score ${mean}${failed ? ` · ${failed} fail` : ''}`);
  }
  if (report.diversity) lines.push(...formatDiversity(report.diversity, report.illustrations));
  if (report.richness) lines.push(...formatRichness(report.richness, report.illustrations, { detailed: richness }));
  lines.push('Design quality · ' + (report.quality?.status ?? 'not-run')
    + (report.quality?.verdict ? ' · ' + report.quality.verdict : ' · NOT VERIFIED'));
  if (report.quality?.request) lines.push('Review material · ' + report.quality.request);
  return lines.join('\n');
}
