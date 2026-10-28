// ════════════════════════════════════════════════════════════════
// RIKIKI · scene bench, the page side
//
// Loaded by harness.html. Draws a generated case in the real scene element, on
// the real fonts, and asks the oracles whether the drawing keeps the promises a
// scene makes. One page, thousands of cases · no CLI start per case.
//
// The oracles are the ones a scene's own report could not prove by itself: a
// scene that says "I fitted everything" is checked against the geometry, so a
// scene that is wrong about itself is found here, not on a projector.
// ════════════════════════════════════════════════════════════════

import { choreograph } from '../../dist/choreography.js';
import { CURVE_INSET } from '../../dist/curve.js';
import { INTENTS, INTENT_NAMES } from '../../dist/intent.js';
import { pictureOf, planTransition } from '../../dist/morph.js';
import { MOTION_BUDGET, schedule } from '../../dist/motion.js';
import { COUNTS, KINDS, WIDTHS, caseMarkup, generateCases } from './cases.mjs';
import { diagramMarkup, generateDiagramCases } from './diagram-cases.mjs';

const stage = document.getElementById('stage');
const EDGE = 4;
/** Ink rounding and anti-aliasing · a box this close to another is touching. */
const TOLERANCE = 2;
/** A slide holds about this many units under a one-line title (MAX_SCENE_HEIGHT). */
const SLIDE_UNITS = 620;
const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

const normalise = (text) => (text ?? '').trim().replace(/\s+/g, ' ');
const strip = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ');
const frame = (rect) => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});

/** Draw a case and wait until it has settled · fonts, the scene's own update. */
async function mount(testCase) {
  stage.innerHTML = caseMarkup(testCase);
  const element = stage.firstElementChild;
  element.style.width = `${testCase.width + 2 * EDGE}px`;
  if (testCase.width !== 1600) element.frameWidth = testCase.width;
  await document.fonts.ready;
  await element.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await element.updateComplete;
  return element;
}

/** Every text of a drawing worth measuring, with a box that is its ink, not its
 *  line cell: across, the advance; up and down, the glyphs' middle band. */
function inkBoxes(svg) {
  return [...svg.querySelectorAll('text')]
    .filter((text) => normalise(text.textContent) && text.getNumberOfChars() > 0)
    .map((text) => {
      const rect = text.getBoundingClientRect();
      const height = rect.height;
      return {
        text: normalise(text.textContent),
        box: {
          left: rect.left,
          right: rect.right,
          top: rect.top + 0.18 * height,
          bottom: rect.bottom - 0.22 * height,
        },
      };
    })
    .filter(({ box }) => box.right > box.left && box.bottom > box.top);
}

/** The smallest rect or circle whose box holds a point · the shape a text sits in. */
function smallestShape(shapes, x, y) {
  let best = null;
  for (const shape of shapes) {
    const { left, right, top, bottom } = shape;
    if (x < left || x > right || y < top || y > bottom) continue;
    const area = (right - left) * (bottom - top);
    if (!best || area < best.area) best = { ...shape, area };
  }
  return best;
}

const escapeOf = (box, frame_) =>
  Math.max(
    0,
    frame_.left - box.left,
    box.right - frame_.right,
    frame_.top - box.top,
    box.bottom - frame_.bottom,
  );

const overlapOf = (a, b) => ({
  x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
  y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
});

/** What the flow shape will draw, from the written order · sources before the
 *  emphasised hub (4 at most), outcomes after it (2 at most). */
function expectedFlowDrops(testCase) {
  const hub = testCase.items.findIndex((it) => it.emphasis);
  const before = hub < 0 ? testCase.items.length - 1 : hub;
  const after = hub < 0 ? 0 : testCase.items.length - hub - 1;
  return before > 4 || after > 2;
}

/** The oracles · each returns the failures it found, `{ oracle, detail }`. */
async function judge(testCase, element) {
  const failures = [];
  const fail = (oracle, detail) => failures.push({ oracle, detail });
  const svg = element.shadowRoot?.querySelector('svg');
  if (!svg) {
    if (testCase.kind === 'flow' || testCase.kind === 'lanes') return failures; // a scene may draw nothing
    fail('NO_DRAWING', 'the scene drew no svg');
    return failures;
  }

  let issues = [];
  try {
    issues = JSON.parse(element.getAttribute('data-scene-issues') || '[]');
  } catch {
    fail('ISSUES_NOT_JSON', element.getAttribute('data-scene-issues'));
  }
  const codes = new Set(issues.map((issue) => issue.code));
  const reported = issues
    .flatMap((issue) => issue.fields ?? [])
    .map((f) => normalise(f.text))
    .filter(Boolean);
  const isReported = (text) =>
    reported.some((field) => field.includes(text) || text.includes(field));

  // O1 · numbers · nothing the drawing writes is not a number.
  const markup = strip(svg.outerHTML);
  for (const bad of ['NaN', 'undefined', 'Infinity', 'null']) {
    // "null" and "undefined" only count as an attribute value, not in an author's word.
    if (
      new RegExp(`="[^"]*\\b${bad}\\b[^"]*"`).test(markup) &&
      !testCase.items.some((it) => JSON.stringify(it).includes(bad))
    ) {
      fail('BAD_NUMBER', `${bad} in the drawing`);
      break;
    }
  }

  const drawing = frame(svg.getBoundingClientRect());
  const texts = inkBoxes(svg);
  const shapes = [...svg.querySelectorAll('rect, circle')]
    .map((shape) => frame(shape.getBoundingClientRect()))
    .filter((box) => box.right - box.left > 1 && box.bottom - box.top > 1);

  // O2 · no silent escape · a text past its shape or the drawing was reported.
  for (const { text, box } of texts) {
    const centre = [(box.left + box.right) / 2, (box.top + box.bottom) / 2];
    const shape = smallestShape(shapes, centre[0], centre[1]);
    const past = Math.max(escapeOf(box, drawing), shape ? escapeOf(box, shape) : 0);
    if (past > TOLERANCE && !isReported(text)) {
      fail('SILENT_ESCAPE', `"${text.slice(0, 40)}" runs ${Math.round(past)}px past its box`);
    }
  }

  // O3 · no silent overlap.
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const overlap = overlapOf(texts[i].box, texts[j].box);
      if (
        overlap.x > TOLERANCE &&
        overlap.y > TOLERANCE &&
        !isReported(texts[i].text) &&
        !isReported(texts[j].text)
      ) {
        fail(
          'SILENT_OVERLAP',
          `"${texts[i].text.slice(0, 30)}" over "${texts[j].text.slice(0, 30)}"`,
        );
      }
    }
  }

  // O4 · shapes stay in the drawing.
  for (const shape of shapes) {
    if (escapeOf(shape, drawing) > TOLERANCE + EDGE) {
      fail(
        'SHAPE_PAST_DRAWING',
        `a shape leaves the viewBox by ${Math.round(escapeOf(shape, drawing))}px`,
      );
      break;
    }
  }

  // O5 · nothing is dropped without a word, and nothing is reported that is drawn.
  const droppedWritten =
    testCase.kind === 'flow'
      ? expectedFlowDrops(testCase)
      : testCase.count >
        { cards: 5, steps: 6, bars: 8, matrix: 6, ranges: 8, lanes: 5, units: 3 }[testCase.kind];
  if (droppedWritten && !codes.has('SCENE_ITEMS_DROPPED'))
    fail('UNREPORTED_DROP', 'items past the maximum, no SCENE_ITEMS_DROPPED');
  if (!droppedWritten && codes.has('SCENE_ITEMS_DROPPED'))
    fail('PHANTOM_DROP', 'SCENE_ITEMS_DROPPED with nothing past the maximum');

  // O6 · a drawing taller than a slide says so (when the scene owns its budget).
  const heightUnits = drawing.bottom - drawing.top - 2 * EDGE;
  if (testCase.width === 1600 && heightUnits > SLIDE_UNITS + 4 && !codes.has('SCENE_TOO_TALL')) {
    fail('UNREPORTED_TALL', `${Math.round(heightUnits)} units tall, no SCENE_TOO_TALL`);
  }

  // O7 · the same case draws the same drawing.
  const again = await mount(testCase);
  if (strip(again.shadowRoot.querySelector('svg')?.outerHTML ?? '') !== markup)
    fail('NOT_DETERMINISTIC', 'a second draw differs');

  if (errors.length) {
    fail('PAGE_ERROR', errors.splice(0).join(' | ').slice(0, 200));
  }
  return failures;
}

/** Run cases, return the ones that failed an oracle, and the totals. */
async function run(cases) {
  // The first draw of each shape asks for its fonts · draw one of each before the
  // first judgement, or the first case differs from its own redraw for that reason.
  for (const kind of KINDS) {
    await mount(generateCases(0, 1, [kind])[0]);
    await mount(generateCases(0, 1, [kind])[0]);
  }
  await document.fonts.ready;
  const failed = [];
  for (const testCase of cases) {
    let failures;
    try {
      const element = await mount(testCase);
      failures = await judge(testCase, element);
    } catch (error) {
      failures = [{ oracle: 'THROWS', detail: String(error?.stack ?? error).slice(0, 240) }];
    }
    if (failures.length)
      failed.push({
        id: testCase.id,
        kind: testCase.kind,
        width: testCase.width,
        count: testCase.count,
        failures,
        testCase,
      });
  }
  const byOracle = {};
  for (const f of failed)
    for (const x of f.failures) byOracle[x.oracle] = (byOracle[x.oracle] ?? 0) + 1;
  return { total: cases.length, failed, byOracle };
}

/** Make a failing case smaller while it keeps failing the same oracle · fewer
 *  items, then shorter words · so the case that is read is the one that matters. */
async function reduce(testCase, oracle) {
  const stillFails = async (candidate) => {
    try {
      const element = await mount(candidate);
      return (await judge(candidate, element)).some((f) => f.oracle === oracle);
    } catch {
      return false;
    }
  };
  let current = structuredClone(testCase);
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    for (let i = current.items.length - 1; i >= 0 && current.items.length > 1; i -= 1) {
      const candidate = { ...current, items: current.items.filter((_, k) => k !== i) };
      candidate.count = candidate.items.length;
      if (await stillFails(candidate)) {
        current = candidate;
        changed = true;
      }
    }
    for (const [index, it] of current.items.entries()) {
      for (const field of ['note', 'tag', 'label']) {
        const words = (it[field] ?? '').split(' ');
        if (words.length < 2) continue;
        const candidate = structuredClone(current);
        candidate.items[index][field] = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        if (await stillFails(candidate)) {
          current = candidate;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return current;
}

/** The text fields each shape wraps · what an author can make too long. */
const FIELDS = {
  cards: ['label', 'note', 'tag'],
  steps: ['label', 'note', 'tag'],
  flow: ['label', 'note'],
  bars: ['label'],
  matrix: ['label'],
  ranges: ['label', 'note'],
  lanes: ['label', 'note'],
  units: ['label', 'note'],
};

/** A word of ordinary length, repeated · the capacity is in characters of plain
 *  text, which is how an author counts. */
const PLAIN = 'deploy';

/** A case of `count` identical items, one field filled with `chars` characters. */
function capacityCase(kind, width, count, field, chars) {
  const text = Array.from({ length: Math.ceil(chars / (PLAIN.length + 1)) }, () => PLAIN)
    .join(' ')
    .slice(0, chars)
    .trim();
  const base = { label: 'cache', note: null, tag: null, value: '5' };
  const item = (i) => ({
    ...Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null)),
    [field]: text,
    ...(kind === 'matrix' ? { level: 'prod test none' } : {}),
    ...(kind === 'ranges' ? { from: '1', to: '4' } : {}),
    ...(kind === 'flow' && i === 1 ? { emphasis: true } : {}),
  });
  const attrs =
    kind === 'matrix'
      ? { columns: 'One|Two|Three' }
      : kind === 'ranges'
        ? { scale: '12' }
        : kind === 'units'
          ? { total: '24' }
          : {};
  return {
    id: `capacity:${kind}:${width}:${count}:${field}:${chars}`,
    kind,
    width,
    count,
    attrs,
    items: Array.from({ length: count }, (_, i) => item(i)),
  };
}

/** Does the scene say it could not fit this text, or draw it wrong in silence ·
 *  true when the text is fine. */
async function textFits(testCase) {
  const element = await mount(testCase);
  const issues = JSON.parse(element.getAttribute('data-scene-issues') || '[]');
  if (issues.some((issue) => issue.code === 'SCENE_TEXT_TOO_LONG')) return false;
  const failures = await judge(testCase, element);
  return failures.every((f) => !['SILENT_ESCAPE', 'SILENT_OVERLAP'].includes(f.oracle));
}

/** The longest text, in characters, a field takes at a width and an item count ·
 *  found by halving, since a longer text never fits where a shorter one did not. */
async function capacity(kind, width, count, field) {
  let low = 0;
  let high = 400;
  if (!(await textFits(capacityCase(kind, width, count, field, 1)))) return 0;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (await textFits(capacityCase(kind, width, count, field, mid))) low = mid;
    else high = mid;
  }
  return low;
}

/** The table · for each shape and width, at its fewest, middle and most items. */
async function capacityTable(widths) {
  const table = {};
  for (const kind of KINDS) {
    table[kind] = {};
    const { min, max } = COUNTS[kind];
    const counts = Array.from(
      { length: max - Math.max(1, min) + 1 },
      (_, i) => Math.max(1, min) + i,
    );
    for (const width of widths) {
      table[kind][width] = {};
      for (const count of counts) {
        table[kind][width][count] = {};
        for (const field of FIELDS[kind]) {
          table[kind][width][count][field] = await capacity(kind, width, count, field);
        }
      }
    }
  }
  return table;
}

// ── diagrams · the grammar's own oracles ─────────────────────────────────

const rectsOverlap = (a, b, slack = 0.5) =>
  a.x < b.x + b.w - slack &&
  a.x + a.w > b.x + slack &&
  a.y < b.y + b.h - slack &&
  a.y + a.h > b.y + slack;

/** Draw a diagram case in the real element, on the real fonts, and let it settle. */
async function mountDiagram(testCase) {
  stage.innerHTML = diagramMarkup(testCase);
  const element = stage.firstElementChild;
  element.style.width = '1608px';
  await document.fonts.ready;
  await element.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await element.updateComplete;
  return element;
}

/** Does the segment a→b pass through the inside of a rect, `pad` in from its edge ·
 *  Liang–Barsky, so a diagonal is tested as the line it is, not as its bounding box. */
function segmentHitsRect(a, b, rect, pad) {
  const left = rect.x + pad;
  const right = rect.x + rect.w - pad;
  const top = rect.y + pad;
  const bottom = rect.y + rect.h - pad;
  if (left >= right || top >= bottom) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let near = 0;
  let far = 1;
  for (const [p, q] of [
    [-dx, a.x - left],
    [dx, right - a.x],
    [-dy, a.y - top],
    [dy, bottom - a.y],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) near = Math.max(near, t);
      else far = Math.min(far, t);
      if (near > far) return false;
    }
  }
  return near < far;
}

/** The lanes' own oracles · a gate stands across every lane it names, and every
 *  token of every run rests on its lane's track, off any gate's bar, never on
 *  another token. One failure per oracle is enough to find the case. */
function judgeLanes(drawn) {
  const failures = [];
  const once = (oracle, detail) => {
    if (!failures.some((f) => f.oracle === oracle)) failures.push({ oracle, detail });
  };
  const lanes = drawn.items.filter((i) => i.kind === 'lane');
  const gates = drawn.items.filter((i) => i.kind === 'gate');
  const radius = 10;
  for (const gate of gates) {
    for (const key of gate.lanes) {
      const lane = lanes.find((l) => l.key === key);
      if (lane && (gate.y > lane.cy - radius || gate.y + gate.h < lane.cy + radius))
        once('GATE_OFF_LANE', `gate ${gate.key} does not cross lane ${key}`);
    }
  }
  for (const lane of lanes) {
    const bars = gates.filter((g) => g.lanes.includes(lane.key));
    for (const run of lane.runs) {
      const places = run.tokens.map((t) => t.to).sort((a, b) => a - b);
      for (const at of places) {
        if (at - radius < lane.track.x0 - 0.5 || at + radius > lane.track.x1 + 0.5)
          once(
            'TOKEN_OUT_OF_LANE',
            `a token of ${lane.key} rests at ${Math.round(at)}, its track is ${Math.round(lane.track.x0)} to ${Math.round(lane.track.x1)}`,
          );
        if (bars.some((g) => at + radius > g.x + 0.5 && at - radius < g.x + g.w - 0.5))
          once(
            'TOKEN_ON_GATE',
            `a token of ${lane.key} rests on a gate's bar at ${Math.round(at)}`,
          );
      }
      for (let k = 1; k < places.length; k += 1)
        if (places[k] - places[k - 1] < 2 * radius - 0.5)
          once(
            'TOKENS_OVERLAP',
            `two tokens of ${lane.key} are ${Math.round(places[k] - places[k - 1])} apart`,
          );
    }
  }
  return failures;
}

const countMarks = (node, tag) =>
  (node.tag === tag ? 1 : 0) +
  (node.children ?? []).reduce((sum, child) => sum + countMarks(child, tag), 0);

const rectOf = (i) => ({ x: i.x, y: i.y, w: i.w ?? i.size, h: i.h ?? i.size });

/** The marks that tell a story · each a solid mark of its own place. */
const PIECES = new Set([
  'terminal',
  'table',
  'switch',
  'timer',
  'band',
  'person',
  'screen',
  'counter',
]);

/** O3 to O5 · what a drawing that says it fits promises about its geometry. */
function judgeGeometry(drawn, room, fail) {
  // O3 · inside the room · when it says it fits, it does.
  const things = [
    ...drawn.items.map(rectOf),
    ...drawn.notes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })),
  ];
  for (const t of things) {
    if (t.x < -1 || t.y < -1 || t.x + t.w > room.w + 1 || t.y + t.h > room.h + 1) {
      fail(
        'OUT_OF_ROOM',
        `a mark at ${Math.round(t.x)},${Math.round(t.y)} ${Math.round(t.w)}×${Math.round(t.h)} in ${room.w}×${room.h}`,
      );
      break;
    }
  }
  // O4 · no overlap · boxes, meters and queues (not the surfaces that hold them), and
  // notes against them.
  const solidItems = drawn.items.filter(
    (i) =>
      (i.kind === 'box' && i.node.kind === 'box') ||
      i.kind === 'meter' ||
      i.kind === 'queue' ||
      i.kind === 'curve' ||
      PIECES.has(i.kind),
  );
  const solids = solidItems.map(rectOf);
  outer: for (let i = 0; i < solids.length; i += 1) {
    for (let j = i + 1; j < solids.length; j += 1) {
      if (rectsOverlap(solids[i], solids[j])) {
        fail('BOXES_OVERLAP', `two marks overlap (${solidItems[i].key}, ${solidItems[j].key})`);
        break outer;
      }
    }
  }
  for (const note of drawn.notes) {
    const hit = solids.find((s) => rectsOverlap({ x: note.x, y: note.y, w: note.w, h: note.h }, s));
    if (hit) {
      fail('NOTE_ON_BOX', `a note over a box (${note.target})`);
      break;
    }
  }
  // O5 · links keep out of boxes that are not their ends.
  for (const link of drawn.links) {
    const others = drawn.items
      .filter(
        (i) =>
          ((i.kind === 'box' && i.node.kind === 'box') || PIECES.has(i.kind)) &&
          i.key !== link.from &&
          i.key !== link.to,
      )
      .map(rectOf);
    const crosses = link.points
      .slice(1)
      .some((b, k) => others.some((o) => segmentHitsRect(link.points[k], b, o, 1)));
    if (crosses) {
      fail('LINK_THROUGH_BOX', `${link.from}→${link.to} crosses a box`);
      break;
    }
  }
}

const numbersOf = (list) => (list ?? '').split(/\s+/).filter(Boolean).map(Number);

/** The gauges' own oracles · a meter fills exactly its share of the track on every
 *  click, a queue draws its places and takes as many as it says, and a value written
 *  outside the scale is said (DG_VALUE_RANGE), never drawn as if it were inside. */
function judgeGauges(testCase, drawn, codes, fail) {
  const written = testCase.root.children.filter(
    (c) => c.tag === 'dg-meter' || c.tag === 'dg-queue',
  );
  const gauges = drawn.items.filter((i) => i.kind === 'meter' || i.kind === 'queue');
  if (gauges.length !== written.length)
    fail('GAUGE_LOST', `${written.length} meters and queues written, ${gauges.length} drawn`);
  let outside = false;
  for (const node of written) {
    const item = gauges.find((g) => g.key === node.attrs.name);
    if (!item) continue;
    if (node.tag === 'dg-meter') {
      const max = Number(node.attrs.max);
      const values = numbersOf(node.attrs.value);
      const threshold = node.attrs.threshold === undefined ? 0 : Number(node.attrs.threshold);
      if (values.some((v) => v < 0 || v > max) || threshold > max) outside = true;
      values.forEach((value, k) => {
        const share = Math.min(1, Math.max(0, value / max));
        if (Math.abs(item.fills[k] - share * item.track.w) > 0.5)
          fail(
            'METER_SCALE',
            `${item.key} fills ${Math.round(item.fills[k])} for ${value} of ${max} on click ${k}`,
          );
      });
      if (
        item.threshold !== undefined &&
        (item.threshold < item.track.x - 0.5 || item.threshold > item.track.x + item.track.w + 0.5)
      )
        fail('METER_SCALE', `${item.key}'s threshold stands off its track`);
    } else {
      const count = Number(node.attrs.count);
      const fills = numbersOf(node.attrs.fill);
      if (fills.some((f) => f < 0 || f > count)) outside = true;
      if (item.cells.length !== count)
        fail('QUEUE_COUNT', `${item.key} has ${count} places written, ${item.cells.length} drawn`);
      fills.forEach((fill, k) => {
        if (item.fills[k] !== Math.min(count, Math.max(0, fill)))
          fail(
            'QUEUE_COUNT',
            `${item.key} takes ${item.fills[k]} places for ${fill} on click ${k}`,
          );
      });
      for (let c = 1; c < item.cells.length; c += 1)
        if (item.cells[c].x < item.cells[c - 1].x + item.cells[c - 1].w - 0.5)
          fail('QUEUE_COUNT', `${item.key}'s places ${c - 1} and ${c} overlap`);
    }
  }
  if (judgeCurves(testCase, drawn, codes, fail)) outside = true;
  if (outside && !codes.has('DG_VALUE_RANGE'))
    fail('SILENT_RANGE', 'a value outside its scale was drawn without DG_VALUE_RANGE');
}

/** The curves' own oracles · every value drawn, at equal steps from the left of the
 *  plot to its right, at its exact height on the scale; the threshold on the scale;
 *  the point where the curve crosses it on its line; a series too long said. Returns
 *  whether a value was written outside a scale. */
function judgeCurves(testCase, drawn, codes, fail) {
  const written = testCase.root.children.filter((c) => c.tag === 'dg-curve');
  const curves = drawn.items.filter((i) => i.kind === 'curve');
  if (curves.length !== written.length)
    fail('GAUGE_LOST', `${written.length} curves written, ${curves.length} drawn`);
  let outside = false;
  for (const node of written) {
    const item = curves.find((c) => c.key === node.attrs.name);
    if (!item) continue;
    const values = numbersOf(node.attrs.values);
    if (values.length > 12 && !codes.has('DG_CURVE_POINTS'))
      fail('CURVE_SCALE', `${item.key} has ${values.length} values and nothing says so`);
    const max = item.plot.h > 0 && node.attrs.max ? Number(node.attrs.max) : null;
    if (max !== null && values.some((v) => v > max)) outside = true;
    if (item.points.length !== values.length)
      fail('CURVE_SCALE', `${item.key} draws ${item.points.length} points for ${values.length}`);
    const run = item.plot.w - 2 * CURVE_INSET;
    const step = values.length > 1 ? run / (values.length - 1) : 0;
    const base = item.plot.y + item.plot.h;
    item.points.forEach((p, k) => {
      if (values.length > 1 && Math.abs(p.x - (item.plot.x + CURVE_INSET + k * step)) > 0.5)
        fail('CURVE_SCALE', `${item.key}'s point ${k} is off its step`);
      if (max !== null && values[k] <= max) {
        const wanted = base - (values[k] / max) * item.plot.h;
        if (Math.abs(p.y - wanted) > 0.5)
          fail('CURVE_SCALE', `${item.key} draws ${values[k]} of ${max} at the wrong height`);
      }
      if (p.y < item.plot.y - 0.5 || p.y > base + 0.5)
        fail('CURVE_SCALE', `${item.key}'s point ${k} leaves its plot`);
    });
    if (item.crossing && Math.abs(item.crossing.at.y - item.threshold) > 0.5)
      fail('CURVE_SCALE', `${item.key} crosses off its threshold's line`);
  }
  return outside;
}

/** The boxes a states case shows on click `stage` · the shared children, and the
 *  state whose step was reached last. Read off the case, not off the element. */
function boxesOnClick(root, stage) {
  const states = root.children.filter((c) => c.tag === 'dg-state');
  const reached = states.filter((s) => Number(s.attrs.step ?? 0) <= stage);
  const standing = reached.reduce(
    (best, s) => (!best || Number(s.attrs.step ?? 0) > Number(best.attrs.step ?? 0) ? s : best),
    undefined,
  );
  const shared = root.children.filter((c) => c.tag !== 'dg-state');
  return [...shared, ...(standing ? [standing] : [])].reduce(
    (sum, node) => sum + countMarks(node, 'dg-box'),
    0,
  );
}

/** The morph's own oracles · a picture per click, every one of them whole and in its
 *  room when it fits; what two pictures share by name moves and is never let go and
 *  brought in again; a click moves for the budget at most; the frame does not jump. */
async function judgeStates(testCase, element, codes, fail) {
  const pictures = element.drawnStages;
  const stages = element.parsed.stages;
  if (pictures.length !== stages + 1)
    fail('STATE_PICTURES', `${stages + 1} clicks, ${pictures.length} pictures`);
  const unresolved = pictures.some((p) => p.status === 'unresolved');
  if (unresolved && !codes.has('DG_NO_FIT'))
    fail('SILENT_NO_FIT', 'a picture does not fit, no DG_NO_FIT');
  if (!unresolved && codes.has('DG_NO_FIT'))
    fail('PHANTOM_NO_FIT', 'every picture fits, and DG_NO_FIT reported');
  const shown = pictures.map((drawn, stage) =>
    pictureOf(drawn, choreograph(drawn, drawn.tree).appears, stage),
  );
  pictures.forEach((drawn, stage) => {
    const boxes = drawn.items.filter((i) => i.kind === 'box' && i.node.kind === 'box').length;
    const wanted = boxesOnClick(testCase.root, stage);
    if (boxes !== wanted)
      fail('MARK_LOST', `click ${stage}: ${wanted} boxes written, ${boxes} drawn`);
    if (drawn.status === 'fit')
      judgeGeometry(drawn, testCase.room, (o, d) => fail(o, `click ${stage}: ${d}`));
  });
  for (let stage = 1; stage < shown.length; stage += 1) {
    const before = shown[stage - 1];
    const after = shown[stage];
    const plan = planTransition(before, after);
    const keyOf = (picture, i) => {
      const item = picture.layout.items[i];
      return `${item.kind}:${item.key}${item.kind === 'dot' ? `:${item.index}` : ''}`;
    };
    const was = new Set(before.items.map((i) => keyOf(before, i)));
    const is = new Set(after.items.map((i) => keyOf(after, i)));
    const left = plan.leaving.items.map((i) => keyOf(before, i));
    const came = after.items.filter((i) => plan.entering.has(`i${i}`)).map((i) => keyOf(after, i));
    const lost = [...left.filter((k) => is.has(k)), ...came.filter((k) => was.has(k))];
    const missed = [...was].filter((k) => !is.has(k) && !left.includes(k));
    // One to one · no mark of the picture before stands for two of this one.
    const sources = [...plan.moves.values()].map((m) => m.from);
    const twice = sources
      .filter((from, n) => sources.indexOf(from) !== n)
      .map((i) => keyOf(before, i));
    lost.push(...twice);
    if (lost.length || missed.length)
      fail(
        'MORPH_IDENTITY',
        `click ${stage}: ${[...lost, ...missed].slice(0, 3).join(', ')} not kept one to one`,
      );
    const { timing } = schedule(plan.cues);
    const end = Math.max(0, ...[...timing.values()].map((t) => t.start + t.duration));
    if (end > MOTION_BUDGET + 1e-6)
      fail('MORPH_BUDGET', `click ${stage} moves for ${end.toFixed(2)}s`);
  }
  // The frame is the one of every picture · the same viewBox whatever the click shown.
  const rest = element.shadowRoot.querySelector('svg').getAttribute('viewBox');
  element.playing = true;
  for (let stage = 0; stage <= stages; stage += 1) {
    element.applyStep(stage);
    await element.updateComplete;
    const box = element.shadowRoot.querySelector('svg').getAttribute('viewBox');
    if (box !== rest) fail('MORPH_FRAME', `click ${stage} draws in ${box}, the rest in ${rest}`);
  }
  element.playing = false;
  await element.updateComplete;
}

/** The oracles of the grammar · what a diagram promises about any tree it is given. */
async function judgeDiagram(testCase, element) {
  const failures = [];
  const fail = (oracle, detail) => failures.push({ oracle, detail });
  const drawn = element.drawn;
  if (!drawn) {
    fail('NOT_DRAWN', 'the diagram computed no layout');
    return failures;
  }
  let issues = [];
  try {
    issues = JSON.parse(element.getAttribute('data-scene-issues') || '[]');
  } catch {
    fail('ISSUES_NOT_JSON', element.getAttribute('data-scene-issues'));
  }
  const codes = new Set(issues.map((issue) => issue.code));
  if (testCase.family === 'states') await judgeStates(testCase, element, codes, fail);
  else judgeOnePicture(testCase, drawn, codes, fail, failures);

  // O6 · the drawn text keeps to its box · what the layout says about each line, and
  //      what the browser painted, which no layout can promise by itself.
  const svg = element.shadowRoot?.querySelector('svg');
  if (svg) {
    const reported = issues
      .flatMap((issue) => issue.fields ?? [])
      .map((f) => normalise(f.text))
      .filter(Boolean);
    const isReported = (t) => reported.some((r) => r.includes(t) || t.includes(r));
    const frame = frame_(svg.getBoundingClientRect());
    for (const { text, box: ink } of inkBoxes(svg)) {
      if (escapeOf(ink, frame) > TOLERANCE && !isReported(text) && drawn.status === 'fit') {
        fail(
          'TEXT_PAST_FRAME',
          `"${text.slice(0, 40)}" runs ${Math.round(escapeOf(ink, frame))}px past the drawing`,
        );
        break;
      }
    }
    if (/NaN|Infinity|undefined/.test(strip(svg.outerHTML)))
      fail('BAD_NUMBER', 'a number is not a number in the drawing');
  }

  // O7 · the same tree draws the same drawing · every picture of it.
  const first = JSON.stringify(element.drawnStages);
  const again = await mountDiagram(testCase);
  if (JSON.stringify(again.drawnStages) !== first)
    fail('NOT_DETERMINISTIC', 'a second layout differs');
  if (errors.length) fail('PAGE_ERROR', errors.splice(0).join(' | ').slice(0, 200));
  return failures;
}

/** O1 to O5 for a diagram without states · its one drawing. */
function judgeOnePicture(testCase, drawn, codes, fail, failures) {
  // O1 · never silent · "does not fit" is said exactly when it does not fit.
  if (drawn.status === 'unresolved' && !codes.has('DG_NO_FIT'))
    fail('SILENT_NO_FIT', `unresolved (${drawn.reasons.join('; ')}), no DG_NO_FIT`);
  if (drawn.status === 'fit' && codes.has('DG_NO_FIT'))
    fail('PHANTOM_NO_FIT', 'fit, and DG_NO_FIT reported');

  // O2 · nothing is lost · every box, dot and bar written is drawn.
  const wantedBoxes =
    countMarks(testCase.root, 'dg-box') +
    countMarks(testCase.root, 'dg-text') -
    countMarks(testCase.root, 'dg-text') +
    countMarks(testCase.root, 'dg-bar');
  // A bar on an axis is drawn as a point or a stretch on it.
  const drawnBoxes = drawn.items.filter(
    (i) => (i.kind === 'box' && i.node.kind === 'box') || i.kind === 'bar' || i.kind === 'span',
  ).length;
  if (drawnBoxes !== wantedBoxes)
    fail('MARK_LOST', `${wantedBoxes} boxes and bars written, ${drawnBoxes} drawn`);
  const wantedLanes = countMarks(testCase.root, 'dg-lane');
  const drawnLanes = drawn.items.filter((i) => i.kind === 'lane').length;
  if (drawnLanes !== wantedLanes)
    fail('LANE_LOST', `${wantedLanes} lanes written, ${drawnLanes} drawn`);
  // Like the geometry below, the tokens are judged when the lanes say they fit ·
  // a track too short is reported (DG_NO_FIT), and its queue runs past it.
  if (drawn.status === 'fit') failures.push(...judgeLanes(drawn));
  const wantedDots = (function count(n) {
    return (
      (n.tag === 'dg-dot' ? Number(n.attrs.count ?? 1) : 0) +
      (n.children ?? []).reduce((s, c) => s + count(c), 0)
    );
  })(testCase.root);
  const drawnDots = drawn.items.filter((i) => i.kind === 'dot').length;
  if (drawnDots !== wantedDots) fail('DOT_LOST', `${wantedDots} dots written, ${drawnDots} drawn`);
  const wantedPieces = [...PIECES].reduce(
    (sum, kind) => sum + countMarks(testCase.root, `dg-${kind}`),
    0,
  );
  const drawnPieces = drawn.items.filter((i) => PIECES.has(i.kind)).length;
  if (drawnPieces !== wantedPieces)
    fail(
      'PIECE_LOST',
      `${wantedPieces} terminals, tables, switches… written, ${drawnPieces} drawn`,
    );

  if (drawn.status === 'fit') judgeGeometry(drawn, testCase.room, fail);
  if (testCase.family === 'gauges') judgeGauges(testCase, drawn, codes, fail);
}

const frame_ = (rect) => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});

/** A diagram that asks for every face a diagram sets text in. */
const FONT_WARM_UP = {
  room: { w: 800, h: 500 },
  root: {
    tag: 'deck-diagram',
    attrs: {},
    children: [{ tag: 'dg-meter', attrs: { label: 'warm', value: '1' }, children: [] }],
  },
};

async function runDiagrams(cases) {
  // The first draw asks for the fonts · draw one before judging, as for the scenes,
  // and a meter, whose figures are set in the display face.
  await mountDiagram(generateDiagramCases(0, 1)[0]);
  await mountDiagram(generateDiagramCases(0, 1)[0]);
  await mountDiagram(FONT_WARM_UP);
  await document.fonts.ready;
  const failed = [];
  for (const testCase of cases) {
    let failures;
    try {
      const element = await mountDiagram(testCase);
      failures = await judgeDiagram(testCase, element);
    } catch (error) {
      failures = [{ oracle: 'THROWS', detail: String(error?.stack ?? error).slice(0, 240) }];
    }
    if (failures.length)
      failed.push({
        id: testCase.id,
        layout: testCase.family ?? testCase.root.attrs.layout,
        room: testCase.room,
        failures,
        testCase,
      });
  }
  const byOracle = {};
  for (const f of failed)
    for (const x of f.failures) byOracle[x.oracle] = (byOracle[x.oracle] ?? 0) + 1;
  return { total: cases.length, failed, byOracle };
}

/** The cases of every intent · its skeleton, which must demonstrate it, and each
 *  counter-example it is known for, which must be rejected by its code. */
function intentCases() {
  return INTENT_NAMES.flatMap((name) => {
    const { skeleton, pitfalls } = INTENTS[name].compiled;
    return [
      { id: `${name}:skeleton`, html: skeleton, rejected: null },
      ...pitfalls
        .filter((pitfall) => pitfall.html)
        .map((pitfall) => ({
          id: `${name}:${pitfall.code}`,
          html: pitfall.html,
          rejected: pitfall.code,
        })),
    ];
  });
}

/** The intents' own oracles, in the real element on the real fonts · a skeleton
 *  says nothing of meaning and has no error (INTENT_NOT_SHOWN), a counter-example
 *  is named by its code (INTENT_NOT_REJECTED). */
async function runIntents() {
  const failed = [];
  const cases = intentCases();
  for (const testCase of cases) {
    stage.innerHTML = testCase.html;
    const element = stage.firstElementChild;
    element.style.width = '1608px';
    await document.fonts.ready;
    await element.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await element.updateComplete;
    const issues = JSON.parse(element.getAttribute('data-scene-issues') || '[]');
    const codes = issues.map((issue) => issue.code);
    const wrong = issues.filter(
      (issue) => issue.severity === 'error' || issue.code.startsWith('INT_'),
    );
    if (!testCase.rejected && wrong.length)
      failed.push({ id: testCase.id, oracle: 'INTENT_NOT_SHOWN', detail: codes.join(', ') });
    if (testCase.rejected && !codes.includes(testCase.rejected))
      failed.push({
        id: testCase.id,
        oracle: 'INTENT_NOT_REJECTED',
        detail: `${testCase.rejected} expected · ${codes.join(', ') || 'nothing'} said`,
      });
  }
  return { total: cases.length, failed };
}

/** Make a failing diagram smaller while it keeps failing the same oracle · fewer
 *  marks, then shorter words. */
async function reduceDiagram(testCase, oracle) {
  const stillFails = async (candidate) => {
    try {
      const element = await mountDiagram(candidate);
      return (await judgeDiagram(candidate, element)).some((f) => f.oracle === oracle);
    } catch {
      return false;
    }
  };
  let current = structuredClone(testCase);
  const drop = (path) => {
    const copy = structuredClone(current);
    let parent = copy.root;
    for (const index of path.slice(0, -1)) parent = parent.children[index];
    parent.children.splice(path.at(-1), 1);
    return copy;
  };
  const paths = (node, prefix = []) =>
    (node.children ?? []).flatMap((child, i) => [[...prefix, i], ...paths(child, [...prefix, i])]);
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    for (const path of paths(current.root).reverse()) {
      if (!path.length) continue;
      const candidate = drop(path);
      if (await stillFails(candidate)) {
        current = candidate;
        changed = true;
      }
    }
    const shorten = async (node, path) => {
      for (const field of ['note', 'label', 'tag']) {
        const words = (node.attrs?.[field] ?? '').split(' ');
        if (words.length < 2) continue;
        const candidate = structuredClone(current);
        let target = candidate.root;
        for (const index of path) target = target.children[index];
        target.attrs[field] = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        if (await stillFails(candidate)) {
          current = candidate;
          changed = true;
        }
      }
    };
    for (const path of paths(current.root)) {
      let node = current.root;
      for (const index of path) node = node.children?.[index];
      if (node) await shorten(node, path);
    }
    if (!changed) break;
  }
  return current;
}

window.bench = {
  generateDiagrams: (seed, total) => generateDiagramCases(seed, total),
  runDiagrams,
  runIntents,
  reduceDiagram,
  mountDiagram,
  judgeDiagram,
  KINDS,
  WIDTHS,
  capacity,
  capacityTable,
  // Without widths each shape is drawn at the ones it is declared clean at.
  generate: (seed, total, kinds, widths) =>
    generateCases(seed, total, kinds ?? KINDS, widths ?? undefined),
  run,
  reduce,
  mount,
  judge,
};
window.benchReady = true;
