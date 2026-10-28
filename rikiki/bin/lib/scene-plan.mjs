// ════════════════════════════════════════════════════════════════
// rikiki scene · plan
//
// From a brief to the shapes that can say it, written, linted and sized before
// any browser opens. Deterministic: the same brief gives the same candidates,
// and no part of it calls a model · choosing among the candidates, and writing
// the words, stay with whoever holds the brief.
//
// What it reuses rather than reimplements:
//   - lintScene, the very lint the scenes run when they draw, so a candidate is
//     judged by the rules it will be judged by on the slide;
//   - capacityOf, the table of how many characters each field holds, measured on
//     the real fonts by the scene bench;
//   - MIN_SCENE_WIDTH and rowFrame, which say what width a composed scene gets
//     and the narrowest each shape draws cleanly at.
// ════════════════════════════════════════════════════════════════

import { rowFrame, parseSplit, minWidthOf } from '../../dist/deck-scene-compose-layout.js';
import { capacityOf } from '../../dist/scene-capacity.js';
import { SCENE_LIMITS, SCENE_WIDTH } from '../../dist/scene-layout.js';
import { lintScene } from '../../dist/scene-lint.js';
import { validateBrief } from './scene-brief.mjs';

const escapeAttr = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/** The field names a scene wraps, per shape · what `capacityOf` was measured for. */
const WRAPPED = {
  cards: ['label', 'note', 'tag'],
  steps: ['label', 'note', 'tag'],
  flow: ['label', 'note'],
  bars: ['label'],
  matrix: ['label'],
  ranges: ['label', 'note'],
  lanes: ['label', 'note'],
  units: ['label', 'note'],
};

/** A scene as data · `kind`, its attributes, its items, and the width it is given. */
const scene = (kind, attrs, items, width = SCENE_WIDTH) => ({ kind, attrs, items, width });

/** The items of a scene as HTML · attributes only, as an author writes them. */
export function sceneMarkup(spec, indent = '') {
  const attrs = Object.entries(spec.attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join('');
  const items = spec.items.map((item) => {
    const parts = Object.entries(item)
      .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== '')
      .map(([name, value]) => (name === 'emphasis' ? ' emphasis' : ` ${name}="${escapeAttr(value)}"`))
      .join('');
    return `${indent}  <deck-scene-item${parts}></deck-scene-item>`;
  });
  return `${indent}<deck-scene-${spec.kind}${attrs}>\n${items.join('\n')}\n${indent}</deck-scene-${spec.kind}>`;
}

function bandMarkup(verdict, indent = '') {
  const parts = ['label', 'note', 'icon']
    .filter((key) => verdict[key])
    .map((key) => ` ${key}="${escapeAttr(verdict[key])}"`)
    .join('');
  return `${indent}<deck-scene-band${parts}></deck-scene-band>`;
}

/** The item as the lint reads it · raw attributes, null when absent. */
const record = (item) => ({
  label: item.label ?? null,
  note: item.note ?? null,
  icon: item.icon ?? null,
  tag: item.tag ?? null,
  value: item.value === undefined ? null : String(item.value),
  level: item.level ?? null,
  from: item.from === undefined ? null : String(item.from),
  to: item.to === undefined ? null : String(item.to),
  emphasis: !!item.emphasis,
});

/** What the scene lint, the capacity table and the width a region gets say about
 *  one scene, as the plan's issues · each has the same `fix` shape `check` gives. */
function judgeScene(spec) {
  // The lint reads attributes as the DOM gives them · strings, null when absent.
  const attrs = Object.fromEntries(
    Object.entries(spec.attrs)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => [name, String(value)]),
  );
  const issues = lintScene(spec.kind, spec.items.map(record), { ...attrs, width: spec.width }).map(
    (issue) => ({ code: issue.code, severity: issue.severity, items: issue.items, message: issue.message }),
  );
  const count = Math.min(spec.items.length, SCENE_LIMITS[spec.kind]?.max ?? spec.items.length);
  const targets = [];
  for (const field of WRAPPED[spec.kind] ?? []) {
    for (const item of spec.items) {
      const text = item[field];
      if (typeof text !== 'string') continue;
      const holds = capacityOf(spec.kind, spec.width, count, field);
      if (holds !== null && text.length > holds) {
        targets.push({ item: item.label ?? '(unnamed)', field, chars: text.length, holds });
      }
    }
  }
  if (targets.length) {
    issues.push({
      code: 'SCENE_TEXT_TOO_LONG',
      severity: 'warning',
      predicted: true,
      items: targets.map((t) => `${t.item} · ${t.field}`),
      message: `by the measured table these hold fewer characters than written, in a ${spec.kind} of ${count} at ${Math.round(spec.width)} units · the scene would shrink them, then report them`,
      fix: { action: 'shorten', targets },
    });
  }
  return issues;
}

const FORM_NOTES = {
  cards: 'equal cards side by side · nothing says one comes before another',
  steps: 'numbered rows in order · the order is the message',
  flow: 'inputs converge on one thing that gives a result',
  bars: 'vertical bars compared by size, the figure above each',
  matrix: 'status dots by row and column, with a legend',
  ranges: 'bars on one shared scale, from when to when',
  lanes: 'lanes of tokens and a gate that comes down across them',
  units: 'one cell per person, the first cells lit',
};

const focusOf = (brief) => (label) => brief.focus !== undefined && label === brief.focus;

/** Items of a brief as scene items · label, note, tag, icon; focus → emphasis. */
const toItems = (list, brief, extra = () => ({})) =>
  (list ?? []).map((entry) => {
    const { label, note, tag, icon } = entry;
    return { label, note, tag, icon, ...extra(entry), emphasis: focusOf(brief)(label) };
  });

// ── one builder per relation · each returns candidates and what it rejected ──

function parallel(brief) {
  return {
    candidates: [
      {
        id: 'cards',
        form: 'cards',
        why: 'options of the same rank · cards say there is no order',
        parts: [scene('cards', {}, toItems(brief.items, brief))],
      },
    ],
    rejected: [{ form: 'steps', reason: 'says "in this order", and these are of the same rank' }],
  };
}

function sequence(brief) {
  const verdict = brief.verdict;
  const attrs = verdict
    ? { conclusion: verdict.label, 'conclusion-note': verdict.note, 'conclusion-icon': verdict.icon }
    : {};
  return {
    candidates: [
      {
        id: 'steps',
        form: 'steps',
        why: 'the order is the message · numbered rows joined by a connector',
        parts: [scene('steps', attrs, toItems(brief.items, brief, () => ({ icon: undefined })))],
        extraIssues: stepsTooTall(brief.items?.length ?? 0, !!verdict),
      },
    ],
    rejected: [{ form: 'cards', reason: 'loses the order, which is the message' }],
  };
}

/** What `check` would say about a steps scene that is taller than the slide holds ·
 *  known before drawing, from how tall the rows are (see SCENE_TOO_TALL). */
function stepsTooTall(count, hasBand) {
  const holds = hasBand ? 4 : 5;
  return count > holds
    ? [
        {
          code: 'SCENE_TOO_TALL',
          severity: 'error',
          predicted: true,
          items: [`${count} steps${hasBand ? ' with the closing band' : ''}`],
          message: `a slide holds about ${holds} steps${hasBand ? ' beside the closing band' : ''} · past that the drawing is taller than the slide`,
          fix: { action: 'reduce-height', options: ['remove-items', 'split-slide'] },
        },
      ]
    : [];
}

function converge(brief) {
  const items = [
    ...toItems(brief.inputs, brief),
    { label: brief.hub.label, note: brief.hub.note, icon: brief.hub.icon, emphasis: true },
    ...toItems(brief.outcomes, brief).map((item) => ({ ...item, emphasis: false })),
  ];
  return {
    candidates: [
      { id: 'flow', form: 'flow', why: 'several inputs converge on one thing that gives a result', parts: [scene('flow', {}, items)] },
    ],
    rejected: [{ form: 'steps', reason: 'has no hub · the inputs do not come one after another' }],
  };
}

function compareSize(brief) {
  const items = (brief.items ?? []).map((entry) => ({
    label: entry.label,
    value: entry.value,
    tag: entry.tag,
    note: entry.group,
    emphasis: focusOf(brief)(entry.label),
  }));
  return {
    candidates: [
      {
        id: 'bars',
        form: 'bars',
        why: 'compared by size · each bar carries its figure',
        parts: [scene('bars', { unit: brief.unit, max: brief.max }, items)],
      },
    ],
    rejected: [{ form: 'cards', reason: 'would put the figure in a note and lose the size' }],
  };
}

function position2d(brief) {
  const statuses = brief.statuses
    ? Object.entries(brief.statuses)
        .map(([status, words]) => `${status}=${words}`)
        .join('|')
    : undefined;
  const items = (brief.rows ?? []).map((row) => ({
    label: row.label,
    level: row.levels.join(' '),
    emphasis: focusOf(brief)(row.label),
  }));
  const rows = items.length;
  return {
    candidates: [
      {
        id: 'matrix',
        form: 'matrix',
        why: 'who stands where, in what state · dots by row and column',
        parts: [scene('matrix', { columns: brief.columns.join('|'), statuses }, items)],
        extraIssues:
          rows > 3
            ? [
                {
                  code: 'SCENE_TOO_TALL',
                  severity: 'error',
                  predicted: true,
                  items: [`${rows} rows`],
                  message: 'a slide holds about 3 rows with the legend · past that the drawing is taller than the slide',
                  fix: { action: 'reduce-height', options: ['remove-items', 'split-slide'] },
                },
              ]
            : [],
      },
    ],
    rejected: [{ form: 'cards', reason: 'one card per cell is a grid drawn badly' }],
  };
}

function spanTime(brief) {
  const items = (brief.rows ?? []).map((row) => ({
    label: row.label,
    note: row.note,
    tag: row.tag,
    from: row.from,
    to: row.to,
  }));
  return {
    candidates: [
      {
        id: 'ranges',
        form: 'ranges',
        why: 'how long, from when to when · bars on one shared scale',
        parts: [scene('ranges', { scale: brief.scale, unit: brief.unit, caption: brief.caption }, items)],
      },
    ],
    rejected: [{ form: 'bars', reason: 'has no start · a duration is a span, not a size' }],
  };
}

function gate(brief) {
  return {
    candidates: [
      {
        id: 'lanes',
        form: 'lanes',
        why: 'the same traffic until one thing changes · a gate comes down across the lanes',
        parts: [
          scene(
            'lanes',
            { gate: brief.gate, trigger: brief.trigger, passed: brief.passed, blocked: brief.blocked },
            toItems(brief.lanes, brief),
          ),
        ],
      },
    ],
    rejected: [{ form: 'flow', reason: 'has no "before" and "after" · nothing comes down' }],
  };
}

function shareOfCrowd(brief) {
  const items = (brief.panels ?? []).map((panel) => ({
    label: panel.label,
    value: panel.value,
    note: panel.note,
    icon: panel.icon,
    emphasis: focusOf(brief)(panel.label),
  }));
  const bars = (brief.panels ?? []).map((panel) => ({
    label: panel.label,
    value: panel.value,
    note: undefined,
    emphasis: focusOf(brief)(panel.label),
  }));
  const candidates = [
    {
      id: 'units',
      form: 'units',
      why: 'a share of a crowd · one cell per person keeps the people, where a percentage loses them',
      parts: [scene('units', { total: brief.total }, items)],
    },
  ];
  if ((brief.panels ?? []).length >= 2) {
    candidates.push({
      id: 'bars',
      form: 'bars',
      why: 'the same values as sizes · reads faster, loses the people',
      parts: [scene('bars', { max: brief.total }, bars)],
    });
  }
  return { candidates, rejected: [], ambiguous: candidates.length > 1 ? 'units says who, bars says how many · they argue different things' : undefined };
}

function beforeAfter(brief) {
  const { before, after } = brief;
  const candidates = [];
  const shareable = before?.of !== undefined && after?.of !== undefined;
  if (shareable) {
    const panel = (side, focus) => ({
      label: side.label,
      value: side.value,
      note: side.note,
      emphasis: focus,
    });
    const afterFocused = brief.focus === undefined || brief.focus === after.label;
    candidates.push({
      id: 'units-row',
      form: 'composition',
      why: 'the same crowd twice · two grids of the same size side by side, the change is what is lit',
      composition: { layout: 'row', link: 'arrow', split: undefined },
      parts: [
        scene('units', { total: before.of }, [panel(before, !afterFocused)], 0),
        scene('units', { total: after.of }, [panel(after, afterFocused)], 0),
      ],
    });
  }
  const sized = [before, after].map((side) => ({
    label: side.label,
    value: side.value,
    note: undefined,
    emphasis: brief.focus === undefined ? side === after : side.label === brief.focus,
  }));
  candidates.push({
    id: 'bars-stack',
    // One scene, not a composition · unless a verdict stacks a band under it.
    form: 'bars',
    why: 'the same measure twice as two bars on one scale · the change is the height',
    parts: [scene('bars', { unit: brief.unit, max: brief.max }, sized, SCENE_WIDTH)],
  });
  return { candidates, rejected: [], ambiguous: shareable ? 'units says "who", bars says "how much"' : undefined };
}

function mechanismProof(brief) {
  const mechanism = brief.mechanism;
  const flowItems = [
    ...toItems(mechanism.inputs, { focus: undefined }),
    { label: mechanism.hub.label, note: mechanism.hub.note, icon: mechanism.hub.icon, emphasis: true },
    ...toItems(mechanism.outcomes, { focus: undefined }),
  ];
  const proof = brief.proof;
  const bars = proof.items.map((entry) => ({
    label: entry.label,
    value: entry.value,
    tag: entry.tag,
    emphasis: focusOf(brief)(entry.label),
  }));
  return {
    candidates: [
      {
        id: 'flow-bars',
        form: 'composition',
        why: 'how it works, then the measure that proves it · two thirds for the mechanism, one third for the proof',
        composition: { layout: 'row', link: 'arrow', split: '2:1' },
        parts: [scene('flow', {}, flowItems, 0), scene('bars', { unit: proof.unit, max: proof.max }, bars, 0)],
      },
    ],
    rejected: [{ form: 'steps', reason: 'a mechanism converges on a hub, it is not a list of stages' }],
  };
}

const BUILDERS = {
  parallel,
  sequence,
  converge,
  'compare-size': compareSize,
  'position-2d': position2d,
  'span-time': spanTime,
  gate,
  'share-of-crowd': shareOfCrowd,
  'before-after': beforeAfter,
  'mechanism-proof': mechanismProof,
};

/** The modules a candidate loads · each scene brings `deck-scene-item` with it. */
function importsOf(parts, composition, hasBand) {
  const modules = new Set(parts.map((part) => `deck-scene-${part.kind}`));
  if (composition) modules.add('deck-scene');
  if (hasBand) modules.add('deck-scene-band');
  return [...modules].sort();
}

/** Give each part of a composition the width its place leaves, then judge it. */
function sizeParts(candidate) {
  const { composition, parts } = candidate;
  if (!composition || composition.layout !== 'row') {
    return parts.map((part) => ({ ...part, width: SCENE_WIDTH }));
  }
  const { shares } = parseSplit(composition.split ?? null, parts.length);
  const { widths } = rowFrame(shares);
  return parts.map((part, i) => ({ ...part, width: widths[i] }));
}

function composedMarkup(candidate, parts, verdict) {
  const indent = '  ';
  const inner = parts.map((part) => sceneMarkup(part, indent)).join('\n');
  const band = verdict ? `\n${bandMarkup(verdict, indent)}` : '';
  const { layout, link, split } = candidate.composition;
  const attrs = [`layout="${layout}"`, split && `split="${split}"`, link && `link="${link}"`].filter(Boolean).join(' ');
  return `<deck-scene ${attrs}>\n${inner}${band}\n</deck-scene>`;
}

/** A plan for one brief: the candidates that can say it, each written and judged,
 *  and the shapes that were left out with the reason. Never throws on a brief
 *  that validates · a brief that does not is returned as `{ ok: false, errors }`. */
export function planScenes(brief) {
  const validation = validateBrief(brief);
  if (!validation.ok) return { ok: false, errors: validation.errors, warnings: validation.warnings };

  const built = BUILDERS[brief.relation](brief);
  const candidates = built.candidates.map((raw) => {
    // A verdict closes a scene with a band under it · a steps scene has its own
    // closing band, everything else is composed with one in a stack.
    const verdict = brief.verdict;
    const composition = raw.composition ?? (verdict && raw.form !== 'steps' ? { layout: 'stack' } : null);
    const candidate = { ...raw, composition };
    const parts = sizeParts(candidate);
    const issues = [...(candidate.extraIssues ?? [])];
    for (const part of parts) {
      for (const issue of judgeScene(part)) issues.push({ ...issue, scene: `deck-scene-${part.kind}` });
    }
    if (composition?.layout === 'row') {
      for (const part of parts) {
        const need = minWidthOf(`deck-scene-${part.kind}`);
        if (part.width < need) {
          issues.push({
            code: 'SCENE_REGION_TOO_NARROW',
            severity: 'error',
            predicted: true,
            items: [`deck-scene-${part.kind} (needs ${need})`],
            message: `the region gets ${Math.round(part.width)} units and the shape draws cleanly from ${need}`,
            fix: { action: 'widen-region', options: ['split', 'stack', 'fewer-scenes'] },
          });
        }
      }
    }
    const hasBand = !!verdict && !!composition;
    const markup = composition
      ? composedMarkup(candidate, parts, hasBand ? verdict : null)
      : sceneMarkup(parts[0]);
    const errors = issues.filter((issue) => issue.severity === 'error').length;
    return {
      id: candidate.id,
      form: candidate.form,
      why: candidate.why,
      note: FORM_NOTES[parts[0].kind],
      composition,
      imports: importsOf(parts, composition, hasBand),
      html: markup,
      issues,
      fits: errors === 0,
    };
  });

  // Candidates that fit first, then the fewest warnings · stable on ties.
  candidates.sort((a, b) => Number(b.fits) - Number(a.fits) || a.issues.length - b.issues.length);
  return {
    ok: true,
    relation: brief.relation,
    claim: brief.claim,
    warnings: validation.warnings,
    candidates,
    rejected: built.rejected ?? [],
    ambiguous: built.ambiguous ?? null,
  };
}

/** The slide for one candidate · the title is the claim, the scene is the
 *  evidence, the source is under it. The notes are the author's words, or a line
 *  that says what is to be said so the slide is not delivered without any. */
export function compileSlide(brief, candidate) {
  const id = slug(brief.claim) || 'scene';
  const eyebrow = brief.eyebrow ? ` eyebrow="${escapeAttr(brief.eyebrow)}"` : '';
  const scenes = candidate.html
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');
  const notes = brief.notes ?? `${brief.claim}`;
  const modules = candidate.imports.map(
    (name) => `<script type="module" src="dist/${name}.js"></script>`,
  );
  return {
    imports: modules,
    html: `<deck-feature id="${id}"${eyebrow}>
  <h1 slot="title">${escapeAttr(brief.claim).replaceAll('&quot;', '"')}</h1>
${scenes}
  <deck-source>${escapeAttr(brief.source.text).replaceAll('&quot;', '"')}</deck-source>
  <deck-notes>
    ${escapeAttr(notes).replaceAll('&quot;', '"')}
  </deck-notes>
</deck-feature>`,
  };
}
