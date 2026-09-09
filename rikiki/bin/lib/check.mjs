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
import { SLIDE_TITLE_READER, waitForStillFrame, withDeck } from './browser.mjs';
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
};

const diagnostic = (code, severity, message, extra = {}) => ({
  code,
  severity,
  message,
  ...extra,
});

/** Everything the page can tell us about itself, in one round trip. */
const inspectPage = ({ limits, titleReader }) => {
  const titleOf = new Function('return ' + titleReader)();
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

  const measured = slides.map((slide, index) => {
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

    return {
      index: index + 1,
      id: slide.id || null,
      tag: slide.tagName.toLowerCase(),
      title: titleOf(slide),
      clipped,
      fillRatio: box.height ? Math.round((spanned / box.height) * 100) / 100 : 0,
      tiny: tiny.slice(0, 3),
      steps: Number.parseInt(slide.getAttribute('steps') ?? slide.dataset?.steps ?? '0', 10) || 0,
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
  for (const el of document.querySelectorAll('*')) {
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
  for (const el of document.querySelectorAll('*')) {
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
  for (const el of document.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('deck-') && !customElements.get(tag)) {
      unknown.push({ tag, path: pathOf(el) });
    }
  }

  // What the deck says it lasts, and what it gives someone to say. Notes are
  // the script; the projected words are read, not spoken, so they count for
  // little. This is an order of magnitude, never a verdict.
  const coverEl = slides.find((el) => el.tagName.toLowerCase() === 'deck-cover');
  const announced = coverEl?.getAttribute('duration') ?? null;
  const countWords = (text) => (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
  let spokenWords = 0;
  for (const el of document.querySelectorAll('deck-notes')) {
    spokenWords += countWords(el.textContent ?? '');
  }

  return {
    announced,
    spokenWords,
    hasRoot: !!root,
    runtimeLoaded: !!customElements.get('deck-root'),
    slides: measured,
    unknown,
    strayAttributes,
    unslotted,
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
  // fine on a network and empty on a plane.
  for (const hit of scanExternal(source).filter((h) => /^https?:|^\/\//.test(h.ref))) {
    found.push(
      diagnostic('EXTERNAL_DEPENDENCY', SEVERITY.warning, `the deck fetches ${hit.ref} at runtime`, {
        suggestion: 'fine on a network · run `rikiki bundle` for a file that opens offline',
      }),
    );
  }

  return found;
}

/**
 * Inspect a deck and report what is wrong with it.
 * @returns {Promise<object>} the versioned report.
 */
export async function checkDeck(deckPath, { timeoutMs = 30_000, width = 1920, height = 1080, visual = true } = {}) {
  const source = readFileSync(deckPath, 'utf8');
  const limits = LIMITS;

  return withDeck(
    deckPath,
    async ({ page, settled, missing, errors }) => {
      const observed = settled
        ? await page.evaluate(inspectPage, { limits, titleReader: SLIDE_TITLE_READER })
        : await page.evaluate(inspectPage, { limits, titleReader: SLIDE_TITLE_READER }).catch(() => ({
            hasRoot: false,
            runtimeLoaded: false,
            slides: [],
            unknown: [],
          }));

      const diagnostics = diagnose(observed, source, limits);

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
        statesInspected: observed.slides.length,
        limits,
        visualMeasured,
        summary,
        diagnostics,
        // Named so a reader does not mistake silence for a clean bill.
        notChecked: [
          ...(observed.runtimeLoaded
            ? []
            : ['layout · the runtime never ran, so nothing about size or fit was measured']),
          'revealed steps · only the opening state of each slide is measured',
          'accessibility · no contrast, focus order or screen-reader check is run',
          'wording, facts and figures · nothing here reads the content',
          'what a speaker actually says · the length estimate reads the notes, not the room',
          'other viewports · the deck is measured at its own canvas size',
          'text inside a diagram · an SVG scales by its viewBox, which is not measured here',
          "a component's own chrome · only the text an author wrote is measured for size",
          ...(visualMeasured ? [] : ['the pixels · the visual pass did not run']),
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
    lines.push(`${icon[d.severity] ?? '·'} ${d.code}${at}`);
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
