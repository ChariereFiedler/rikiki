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
import { SLIDE_TITLE_READER, advanceStep, goToSlide, waitForStillFrame, withDeck } from './browser.mjs';
import { BOX_GEOMETRY_READER } from './box-geometry.mjs';
import { GRAPH_GEOMETRY_READER } from './graph-hit.mjs';
import { measureSlides } from './visual.mjs';
import { scanExternal } from './scan-external.mjs';

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
    if (!tag.startsWith('deck-')) continue;
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
    if (!parent.tagName.toLowerCase().startsWith('deck-')) continue;
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
  for (const el of scanDocument ? document.querySelectorAll('*') : []) {
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('deck-') && !customElements.get(tag)) {
      unknown.push({ tag, path: pathOf(el) });
    }
  }

  // Graph failures are geometric: valid markup can still place a node outside
  // the drawing area, drop one on top of another, or route an edge through a
  // node it does not connect. Read the painted boxes after layout, and the
  // polyline the component says it painted, rather than inferring either from
  // the authored `at`.
  const graphIssues = [];
  const centreOf = ({ box }) => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });
  const graphScope = only === null ? document : slides[only - 1];
  for (const graph of graphScope ? graphScope.querySelectorAll('deck-graph') : []) {
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
        : diagnostic('UNKNOWN_ELEMENT', SEVERITY.error, `<${u.tag}> is not a rikiki element · it renders as nothing`, {
            element: u.path,
            suggestion: 'check the spelling against the reference · an undefined custom element is silently empty',
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

/** Two diagnostics identical on (code, slide, element, wording) are the same
 *  finding seen at a different moment · keep the earliest state it held.
 *
 *  The wording counts because one element carries several findings of the same
 *  code · two attributes it ignores are two diagnostics on the same path. The
 *  numbers inside it do not: a measurement drifts by a pixel between states,
 *  and that is still one finding. */
function dedupeStateDiagnostics(diagnostics) {
  const kept = new Map();
  for (const d of diagnostics) {
    const wording = String(d.message ?? '').replace(/[\d.]+/g, '#');
    const key = JSON.stringify([d.code, d.slide ?? null, d.element ?? null, wording]);
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
async function diagnoseAllStates(page, slideCount, inspectOpts, source, limits, { steps }) {
  const found = [];
  let statesInspected = 0;
  for (let index = 1; index <= slideCount; index++) {
    await goToSlide(page, index);
    let state = 0;
    for (;;) {
      const scanDocument = index === 1 && state === 0;
      const snapshot = await page.evaluate(inspectPage, { ...inspectOpts, only: index, scanDocument });
      statesInspected += 1;
      for (const d of diagnose(snapshot, source, limits)) found.push(steps ? { ...d, state } : d);
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
  { timeoutMs = 30_000, width = 1920, height = 1080, visual = true, steps = false } = {},
) {
  const source = readFileSync(deckPath, 'utf8');
  const limits = LIMITS;

  return withDeck(
    deckPath,
    async ({ page, settled, missing, errors }) => {
      const inspectOpts = { limits, titleReader: SLIDE_TITLE_READER, graphGeometry: GRAPH_GEOMETRY_READER, boxGeometry: BOX_GEOMETRY_READER };
      const observed = settled
        ? await page.evaluate(inspectPage, inspectOpts)
        : await page.evaluate(inspectPage, inspectOpts).catch(() => ({
            hasRoot: false,
            runtimeLoaded: false,
            slides: [],
            unknown: [],
          }));

      let diagnostics;
      let statesInspected;
      if (settled && observed.slides.length) {
        const walked = await diagnoseAllStates(page, observed.slides.length, inspectOpts, source, limits, { steps });
        diagnostics = walked.diagnostics;
        statesInspected = walked.statesInspected;
      } else {
        // Nothing to walk: the deck never settled, or it holds no slide at
        // all. The single document-wide pass is all there is to report.
        diagnostics = diagnose(observed, source, limits);
        statesInspected = observed.slides.length;
      }

      // The pixel pass needs a settled deck and one screenshot per slide · it
      // is the slowest thing here, so it is skippable.
      let visualMeasured = false;
      if (visual && settled && observed.slides.length) {
        const goTo = async (index) => {
          await page.evaluate((i) => {
            window.location.hash = `#${i}`;
          }, index);
          await page
            .waitForFunction((i) => document.querySelector('deck-root')?.current === i - 1, index, {
              timeout: 5_000,
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
        // Named so a reader does not mistake silence for a clean bill.
        notChecked: [
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
