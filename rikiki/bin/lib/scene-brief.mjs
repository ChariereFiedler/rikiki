// ════════════════════════════════════════════════════════════════
// rikiki scene · the brief
//
// What the room must understand, written as data before any shape is chosen.
// A shape chosen first is the usual failure (five arrows for "five independent
// things"); the relation between the items is what picks the shape, so the
// brief carries the relation, and the planner reads it.
//
// This module is pure: it validates a brief and says what is wrong with it, in
// words an author can act on. No browser, no file system.
// ════════════════════════════════════════════════════════════════

export const BRIEF_SCHEMA = 'rikiki.scene-brief/1';

/** The relations a scene can say, closed on purpose · a relation that is not here
 *  is a message for a hand-drawn SVG, not a reason to widen this list. Each says
 *  what its `data` holds, so the validator and the documentation read one table. */
export const RELATIONS = Object.freeze({
  parallel: {
    says: 'options of the same rank: pillars, actors, ways out',
    data: 'items: [{ label, note?, tag?, icon? }] · 2 to 5',
  },
  sequence: {
    says: 'things in order: do this, then that',
    data: 'items: [{ label, note?, tag? }] · 1 to 6 · verdict? closes the list',
  },
  converge: {
    says: 'several inputs, one thing, one or two results',
    data: 'inputs: [{ label, note?, icon? }] · 1 to 4, hub: { label, note?, icon? }, outcomes: [{ label, note?, tag? }] · 1 to 2',
  },
  'compare-size': {
    says: 'things compared by size: one number each',
    data: 'items: [{ label, value, tag?, group? }] · 2 to 8, unit?, max?',
  },
  'position-2d': {
    says: 'who stands where, in what state',
    data: 'columns: [string] · 2 to 12, rows: [{ label, levels: [status] }] · 1 to 6, statuses?',
  },
  'span-time': {
    says: 'how long, from when to when',
    data: 'rows: [{ label, from?, to?, note?, tag? }] · 1 to 8, scale, unit?, caption?',
  },
  gate: {
    says: 'the same traffic, until one thing changes: a switch, a freeze, a limit',
    data: 'lanes: [{ label, note?, icon?, tag? }] · 2 to 5, gate, trigger?, passed?, blocked?',
  },
  'share-of-crowd': {
    says: 'a share of a crowd, one cell per person',
    data: 'total, panels: [{ label, value, note?, icon? }] · 1 to 3',
  },
  'before-after': {
    says: 'the same measure twice, and what changed',
    data: 'before: { label, value, of?, note? }, after: { label, value, of?, note? }, unit? · verdict? names the change',
  },
  'mechanism-proof': {
    says: 'how it works, and the measure that proves it',
    data: 'mechanism: { inputs, hub, outcomes } as converge, proof: { items: [{ label, value }], unit?, max? }',
  },
});

export const STATUSES = ['prod', 'pilot', 'test', 'announced', 'none'];

const NATURES = ['measured', 'estimate', 'forecast', 'quote', 'illustration'];

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/** One problem with a brief · where it is, and what to write instead. */
const problem = (path, message) => ({ path, message });

function checkOptionalText(entry, path, fields, errors) {
  for (const field of fields) {
    if (entry[field] !== undefined && typeof entry[field] !== 'string') {
      errors.push(problem(path ? `${path}.${field}` : field, 'must be text when present'));
    }
  }
}

function checkHub(hub, path, errors) {
  if (!isObject(hub) || !isText(hub.label)) errors.push(problem(`${path}.label`, 'is required text'));
  if (isObject(hub)) checkOptionalText(hub, path, ['note', 'icon'], errors);
}

function checkMax(entry, path, errors) {
  if (entry.max !== undefined && (!isNumber(entry.max) || entry.max <= 0)) {
    errors.push(problem(path ? `${path}.max` : 'max', 'is a positive number when present'));
  }
}

function checkItems(list, path, { min, max, need = ['label'], numbers = [] }, errors) {
  if (!Array.isArray(list)) {
    errors.push(problem(path, `must be a list of ${min} to ${max} items`));
    return;
  }
  if (list.length < min || list.length > max) {
    errors.push(problem(path, `holds ${list.length}, the shape draws ${min} to ${max}`));
  }
  list.forEach((entry, i) => {
    if (!isObject(entry)) {
      errors.push(problem(`${path}[${i}]`, 'must be an object'));
      return;
    }
    for (const field of need) {
      if (!isText(entry[field])) errors.push(problem(`${path}[${i}].${field}`, 'is required text'));
    }
    for (const field of numbers) {
      if (!isNumber(entry[field])) errors.push(problem(`${path}[${i}].${field}`, 'must be a number'));
    }
    checkOptionalText(entry, `${path}[${i}]`, ['note', 'tag', 'icon', 'group'], errors);
  });
}

/** Per-relation checks of `data` · the same limits the scenes draw with. */
const DATA_CHECKS = {
  parallel(brief, errors) {
    checkItems(brief.items, 'items', { min: 2, max: 5 }, errors);
  },
  sequence(brief, errors) {
    checkItems(brief.items, 'items', { min: 1, max: 6 }, errors);
  },
  converge(brief, errors) {
    checkItems(brief.inputs, 'inputs', { min: 1, max: 4 }, errors);
    checkHub(brief.hub, 'hub', errors);
    checkItems(brief.outcomes, 'outcomes', { min: 1, max: 2 }, errors);
  },
  'compare-size'(brief, errors) {
    checkItems(brief.items, 'items', { min: 2, max: 8, numbers: ['value'] }, errors);
  },
  'position-2d'(brief, errors) {
    if (!Array.isArray(brief.columns) || brief.columns.length < 2 || brief.columns.length > 12) {
      errors.push(problem('columns', 'is a list of 2 to 12 words'));
    }
    for (const [i, column] of (Array.isArray(brief.columns) ? brief.columns : []).entries()) {
      if (!isText(column)) errors.push(problem(`columns[${i}]`, 'is required text'));
    }
    if (brief.statuses !== undefined) {
      if (!isObject(brief.statuses)) errors.push(problem('statuses', 'is an object mapping statuses to their text labels'));
      else for (const [status, label] of Object.entries(brief.statuses)) {
        if (!STATUSES.includes(status)) errors.push(problem(`statuses.${status}`, `names one of ${STATUSES.join(', ')}`));
        if (!isText(label)) errors.push(problem(`statuses.${status}`, 'is required text'));
      }
    }
    checkItems(brief.rows, 'rows', { min: 1, max: 6 }, errors);
    for (const [i, row] of (Array.isArray(brief.rows) ? brief.rows : []).entries()) {
      const levels = row?.levels;
      if (!Array.isArray(levels) || levels.length !== (brief.columns?.length ?? -1)) {
        errors.push(problem(`rows[${i}].levels`, `one status per column (${brief.columns?.length ?? '?'})`));
      } else if (levels.some((level) => !STATUSES.includes(level))) {
        errors.push(problem(`rows[${i}].levels`, `each one of ${STATUSES.join(', ')}`));
      }
    }
  },
  'span-time'(brief, errors) {
    checkItems(brief.rows, 'rows', { min: 1, max: 8 }, errors);
    if (!isNumber(brief.scale) || brief.scale <= 0) errors.push(problem('scale', 'is a positive number, the end of the scale'));
    for (const [i, row] of (Array.isArray(brief.rows) ? brief.rows : []).entries()) {
      for (const bound of ['from', 'to']) {
        if (row?.[bound] !== undefined && !isNumber(row[bound])) errors.push(problem(`rows[${i}].${bound}`, 'must be a number'));
      }
      if (isNumber(row?.from) && isNumber(row?.to) && row.from > row.to) errors.push(problem(`rows[${i}]`, '`from` comes after `to`'));
      for (const bound of ['from', 'to']) {
        if (isNumber(row?.[bound]) && isNumber(brief.scale) && (row[bound] > brief.scale || row[bound] < 0)) {
          errors.push(problem(`rows[${i}].${bound}`, `is outside the scale (0 to ${brief.scale})`));
        }
      }
    }
  },
  gate(brief, errors) {
    checkItems(brief.lanes, 'lanes', { min: 2, max: 5 }, errors);
    if (!isText(brief.gate)) errors.push(problem('gate', 'is required text, the word on the gate'));
    for (const key of ['passed', 'blocked']) {
      if (brief[key] !== undefined && !(Number.isInteger(brief[key]) && brief[key] >= 0 && brief[key] <= 8)) {
        errors.push(problem(key, 'is a whole number from 0 to 8'));
      }
    }
  },
  'share-of-crowd'(brief, errors) {
    if (!Number.isInteger(brief.total) || brief.total < 1 || brief.total > 400) errors.push(problem('total', 'is a whole number from 1 to 400'));
    checkItems(brief.panels, 'panels', { min: 1, max: 3, numbers: ['value'] }, errors);
    for (const [i, panel] of (Array.isArray(brief.panels) ? brief.panels : []).entries()) {
      if (isNumber(panel?.value) && Number.isInteger(brief.total) && (panel.value < 0 || panel.value > brief.total)) {
        errors.push(problem(`panels[${i}].value`, `is from 0 to the total (${brief.total})`));
      }
    }
  },
  'before-after'(brief, errors) {
    for (const side of ['before', 'after']) {
      if (!isObject(brief[side]) || !isText(brief[side].label) || !isNumber(brief[side].value)) {
        errors.push(problem(side, 'is { label, value }, with `of` (the total) for a share'));
      } else if (brief[side].of !== undefined && !(Number.isInteger(brief[side].of) && brief[side].of >= 1 && brief[side].of <= 400)) {
        errors.push(problem(`${side}.of`, 'is a whole number from 1 to 400'));
      } else if (isNumber(brief[side].of) && brief[side].value > brief[side].of) {
        errors.push(problem(`${side}.value`, `is past the total (${brief[side].of})`));
      }
      if (isObject(brief[side])) checkOptionalText(brief[side], side, ['note'], errors);
    }
    const [b, a] = [brief.before?.of, brief.after?.of];
    if ((b === undefined) !== (a === undefined) || (b !== undefined && b !== a)) {
      errors.push(problem('before.of', 'before and after share one total, or neither has one · two grids of different sizes are not comparable'));
    }
  },
  'mechanism-proof'(brief, errors) {
    if (!isObject(brief.mechanism)) {
      errors.push(problem('mechanism', 'is { inputs, hub, outcomes }'));
    } else {
      checkItems(brief.mechanism.inputs, 'mechanism.inputs', { min: 1, max: 4 }, errors);
      checkHub(brief.mechanism.hub, 'mechanism.hub', errors);
      checkItems(brief.mechanism.outcomes, 'mechanism.outcomes', { min: 1, max: 1 }, errors);
    }
    if (!isObject(brief.proof)) errors.push(problem('proof', 'is { items: [{ label, value }] }'));
    else {
      checkItems(brief.proof.items, 'proof.items', { min: 2, max: 4, numbers: ['value'] }, errors);
      checkOptionalText(brief.proof, 'proof', ['unit'], errors);
      checkMax(brief.proof, 'proof', errors);
    }
  },
};

/** The names of the items a brief names, for the focus check. */
function labelsOf(brief) {
  const lists = [
    brief.items,
    brief.inputs,
    brief.outcomes,
    brief.rows,
    brief.lanes,
    brief.panels,
    brief.mechanism?.inputs,
    brief.mechanism?.outcomes,
    brief.proof?.items,
  ];
  const labels = lists.flatMap((list) => (Array.isArray(list) ? list.map((e) => e?.label) : []));
  for (const key of ['hub', 'before', 'after']) labels.push(brief[key]?.label);
  labels.push(brief.mechanism?.hub?.label);
  return labels.filter(isText);
}

/** Check a brief. Returns `{ ok, errors, warnings }` · errors stop the plan,
 *  warnings are said and the plan goes on. */
export function validateBrief(brief) {
  const errors = [];
  const warnings = [];
  if (!isObject(brief)) return { ok: false, errors: [problem('', 'a brief is a JSON object')], warnings };
  if (brief.schema !== BRIEF_SCHEMA) errors.push(problem('schema', `must be "${BRIEF_SCHEMA}"`));
  if (!isText(brief.claim)) errors.push(problem('claim', 'is required: the sentence the slide proves, its future title'));
  if (!isText(brief.relation) || !Object.hasOwn(RELATIONS, brief.relation)) {
    errors.push(problem('relation', `is one of ${Object.keys(RELATIONS).join(', ')}`));
  } else {
    DATA_CHECKS[brief.relation](brief, errors);
  }

  const source = brief.source;
  if (!isObject(source) || !isText(source.text)) {
    errors.push(problem('source.text', 'is required: every figure has its source, or says it is an illustration'));
  } else if (source.nature !== undefined && !NATURES.includes(source.nature)) {
    errors.push(problem('source.nature', `is one of ${NATURES.join(', ')}`));
  }

  checkOptionalText(brief, '', ['eyebrow', 'notes', 'unit', 'caption', 'trigger'], errors);
  checkMax(brief, '', errors);
  if (brief.focus !== undefined && (!isText(brief.focus) || !labelsOf(brief).includes(brief.focus))) {
    errors.push(problem('focus', `names no item (it is the label of the one the title argues for): ${labelsOf(brief).slice(0, 8).join(', ')}`));
  }
  if (brief.focus === undefined && brief.relation !== 'position-2d' && brief.relation !== 'gate') {
    warnings.push(problem('focus', 'is missing · a scene with nothing put forward is a list · name the item the claim argues for'));
  }
  if (brief.verdict !== undefined && (!isObject(brief.verdict) || !isText(brief.verdict.label))) {
    errors.push(problem('verdict', 'is { label, note?, icon? }'));
  }
  if (isObject(brief.verdict)) checkOptionalText(brief.verdict, 'verdict', ['note', 'icon'], errors);
  if (isText(brief.claim) && brief.claim.trim().split(/\s+/).length > 14) {
    warnings.push(problem('claim', 'is over 14 words · it becomes the title, and a two-line title costs the slide its room'));
  }
  return { ok: errors.length === 0, errors, warnings };
}
