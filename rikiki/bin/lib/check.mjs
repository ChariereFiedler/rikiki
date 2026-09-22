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
import { readFileSync } from 'node:fs';
import { NAVIGATION_TIMEOUT_MS, PAGE_LOAD_TIMEOUT_MS, SLIDE_TITLE_READER, advanceStep, goToSlide, waitForStillFrame, withDeck } from './browser.mjs';
import { BOX_GEOMETRY_READER } from './box-geometry.mjs';
import { GRAPH_GEOMETRY_READER } from './graph-hit.mjs';
import { measureSlides } from './visual.mjs';
import { scanExternal } from './scan-external.mjs';
import { resolveCheckPlugins, startCheckPlugins, runCheckPlugins, pluginReport } from './check-plugins.mjs';
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
};

const diagnostic = (code, severity, message, extra = {}) => ({
  code,
  severity,
  message,
  ...extra,
});

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
const inspectPage = ({ limits, titleReader, graphGeometry, boxGeometry, only = null, scanDocument = true }) => {
  const titleOf = new Function('return ' + titleReader)();
  /** `parseGraphPath` and `polylineHitsRect` from bin/lib/graph-hit.mjs · this
   *  function runs in the page, so they arrive as source and are rebuilt here.
   *  They are unit tested on the node side. */
  const geometry = new Function('return ' + graphGeometry)();
  /** `escapeOf`, `overlapOf` and `encloses` from bin/lib/box-geometry.mjs ·
   *  same reason, same node-side tests. */
  const boxGeom = new Function('return ' + boxGeometry)();
  const root = document.querySelector('deck-root');
  const slides = root
    ? Array.from(root.children).filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
    : [];

  /** A selector a human can paste and an agent can search for. */
  const pathOf = (el) => {
    const parts = [];
    let node = el;
    while (node && node !== document.body) {
      const tag = node.tagName?.toLowerCase();
      if (!tag) break;
      const host = node.getRootNode()?.host;
      if (node.id) {
        parts.unshift(`${tag}#${node.id}`);
      } else if (host) {
        // Inside a component's shadow tree · say so rather than pretend the
        // element is reachable from the document.
        parts.unshift(`${tag}`);
        parts.unshift('::shadow');
        node = host;
        continue;
      } else {
        const siblings = Array.from(node.parentElement?.children ?? []).filter(
          (s) => s.tagName === node.tagName,
        );
        parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
      }
      node = node.parentElement ?? node.getRootNode()?.host ?? null;
    }
    return parts.join(' > ').replace(/ > ::shadow > /g, ' ::shadow ');
  };

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

  const measured = slides.map((slide, index) => {
    const outline = {
      index: index + 1,
      id: slide.id || null,
      tag: slide.tagName.toLowerCase(),
      title: titleOf(slide),
      steps: Number.parseInt(slide.getAttribute('steps') ?? slide.dataset?.steps ?? '0', 10) || 0,
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
      const published = geometry.parseGraphPath(edge.getAttribute('data-path'));
      const points = published.length
        ? published.map((p) => ({ x: p.x + graphBox.left, y: p.y + graphBox.top }))
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

  return {
    announced,
    spokenWords,
    scannedDocument: scanDocument,
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

/** Turn the measurements into findings · this is where policy lives. */
function diagnose(page, source, limits) {
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
 *  first pass, rather than once per state. */
async function diagnoseAllStates(page, slideCount, inspectOpts, source, limits, { steps, plugins, pluginTimeoutMs }) {
  const found = [];
  let statesInspected = 0;
  for (let index = 1; index <= slideCount; index++) {
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
      const scanDocument = index === 1 && state === 0;
      const snapshot = await page.evaluate(inspectPage, { ...inspectOpts, only: index, scanDocument });
      statesInspected += 1;
      for (const d of diagnose(snapshot, source, limits)) found.push(steps ? { ...d, state } : d);
      found.push(...await runCheckPlugins(page, plugins, { slide: index, state, documentPass: scanDocument }, pluginTimeoutMs));
      if (page.isClosed()) break;
      if (!steps || !(await advanceStep(page))) break;
      state += 1;
    }
  }
  return { diagnostics: dedupeStateDiagnostics(found), statesInspected };
}

/**
 * Inspect a deck and report what is wrong with it.
 * @returns {Promise<object>} the versioned report.
 */
export async function checkDeck(
  deckPath,
  { timeoutMs = PAGE_LOAD_TIMEOUT_MS, width = 1920, height = 1080, visual = true, steps = false,
    config, plugins = [], noPlugins = false, pluginTimeoutMs = 5000, narrativeOut, narrativeReview } = {},
) {
  const source = readFileSync(deckPath, 'utf8');
  const limits = LIMITS;
  const resolution = resolveCheckPlugins(deckPath, { config, plugins, noPlugins });
  if (!Number.isFinite(pluginTimeoutMs) || pluginTimeoutMs < 1) throw new Error('pluginTimeoutMs must be positive');

  return withDeck(
    deckPath,
    async ({ page, settled, missing, errors }) => {
      const inspectOpts = { limits, titleReader: SLIDE_TITLE_READER, graphGeometry: GRAPH_GEOMETRY_READER, boxGeometry: BOX_GEOMETRY_READER };
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
      if (settled) await startCheckPlugins(page, resolution, pluginTimeoutMs);
      else for (const plugin of resolution.plugins) {
        plugin.status = 'skipped';
        resolution.notChecked.push(`plugin ${plugin.id} · deck did not settle`);
      }
      if (settled && observed.slides.length && !page.isClosed()) {
        const walked = await diagnoseAllStates(page, observed.slides.length, inspectOpts, source, limits, { steps, plugins: resolution, pluginTimeoutMs });
        diagnostics = walked.diagnostics;
        statesInspected = walked.statesInspected;
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
        const measured = await measureSlides(page, observed.slides.length, goTo);
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

      const summary = { error: 0, warning: 0 };
      for (const d of diagnostics) summary[d.severity] = (summary[d.severity] ?? 0) + 1;

      return {
        schema: REPORT_SCHEMA,
        deck: basename(deckPath),
        settled,
        slideCount: observed.slides.length,
        statesInspected,
        limits,
        visualMeasured,
        summary,
        diagnostics,
        plugins: pluginReport(resolution),
        narrative,
        // Named so a reader does not mistake silence for a clean bill.
        notChecked: [
          ...resolution.notChecked,
          ...(narrative.status === 'completed' ? [] : [`narrative composition · ${narrative.status} (review by the current agent)`]),
          ...(observed.runtimeLoaded
            ? []
            : ['layout · the runtime never ran, so nothing about size or fit was measured']),
          ...(steps ? [] : ['revealed steps · only the opening state of each slide is measured']),
          'accessibility · no contrast, focus order or screen-reader check is run',
          'wording, facts and figures · nothing here reads the content',
          'what a speaker actually says · the length estimate reads the notes, not the room',
          'other viewports · the deck is measured at its own canvas size',
          'text inside a diagram · an SVG scales by its viewBox, which is not measured here',
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

/** The human rendering of a report · the JSON is the machine one. */
export function formatReport(report) {
  const lines = [];
  const icon = { error: '✗', warning: '!' };
  for (const d of report.diagnostics) {
    const at = d.slide ? ` · slide ${d.slide}${d.slideId ? ` (#${d.slideId})` : ''}` : '';
    const atState = d.state !== undefined ? ` · state ${d.state}` : '';
    lines.push(`${icon[d.severity] ?? '·'} ${d.code}${at}${atState}`);
    lines.push(`    ${d.message}`);
    if (d.element) lines.push(`    at  ${d.element}`);
    if (d.suggestion) lines.push(`    try ${d.suggestion}`);
  }
  const { error, warning } = report.summary;
  lines.push('');
  lines.push(
    `${report.deck} · ${report.slideCount} slide(s) · ${error} error(s), ${warning} warning(s)`,
  );
  return lines.join('\n');
}
