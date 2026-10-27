// ════════════════════════════════════════════════════════════════
// rikiki scene · what the command prints
//
// The plan, the budgets of a shape and the problems of a brief, as lines a
// reader can act on. Pure: the command decides where they go.
// ════════════════════════════════════════════════════════════════

import { minWidthOf } from '../../dist/deck-scene-compose-layout.js';
import { MAX_OUTCOMES, MAX_SOURCES } from '../../dist/deck-scene-flow-layout.js';
import { capacityFields, capacityOf } from '../../dist/scene-capacity.js';
import { SCENE_LIMITS, SCENE_WIDTH } from '../../dist/scene-layout.js';
import { SCENE_KINDS } from '../../dist/scene-lint.js';

export { SCENE_KINDS, SCENE_WIDTH };

/** The fewest items a flow says something with · a source and its hub. */
const FLOW_MIN_ITEMS = 2;

/** How many items each shape draws · a flow counts its sources, its hub and its
 *  outcomes, which is how its capacity was measured. */
const ITEM_COUNTS = {
  ...SCENE_LIMITS,
  flow: { min: FLOW_MIN_ITEMS, max: MAX_SOURCES + 1 + MAX_OUTCOMES },
};

/** What each field of a shape holds at `width`, for every number of items it
 *  draws, and the narrowest width it draws cleanly at. */
export function sceneBudgets(kind, width) {
  const fields = capacityFields(kind);
  const { min, max } = ITEM_COUNTS[kind];
  const counts = [];
  for (let count = min; count <= max; count += 1) {
    const chars = Object.fromEntries(fields.map((field) => [field, capacityOf(kind, width, count, field)]));
    counts.push({ count, chars });
  }
  return { kind, width, minWidth: minWidthOf(kind), fields, counts };
}

export function formatBudgets(budgets) {
  const { kind, width, minWidth, fields, counts } = budgets;
  const column = (text) => String(text).padStart(6);
  const lines = [
    `rikiki · scene budgets · ${kind} at ${width} units`,
    `  draws cleanly from ${minWidth} units`,
    '  characters per field, by number of items (plain words, rounded down to a measured width)',
    `    ${column('items')}${fields.map(column).join('')}`,
    ...counts.map(({ count, chars }) => `    ${column(count)}${fields.map((f) => column(chars[f] ?? '·')).join('')}`),
  ];
  if (width < minWidth) {
    lines.push(`  note · under ${minWidth} units a ${kind} can draw wrong without saying so`);
  }
  return lines.join('\n');
}

/** The problems of a brief, one per line · where, then what. */
export function formatProblems(problems, label) {
  return problems.map((p) => `  ${label} · ${p.path || '(brief)'} · ${p.message}`);
}

function formatIssue(issue) {
  const predicted = issue.predicted ? ', predicted' : '';
  const where = issue.scene ? ` <${issue.scene}>` : '';
  const items = issue.items?.length ? ` · ${issue.items.join(', ')}` : '';
  return `      ${issue.severity === 'error' ? '✗' : '!'} ${issue.code} (${issue.severity}${predicted})${where} · ${issue.message}${items}`;
}

function formatCandidate(candidate) {
  const lines = [
    `  candidate ${candidate.id} · ${candidate.form} · ${candidate.fits ? 'fits' : 'does not fit'}`,
    `      ${candidate.why}`,
    `      imports ${candidate.imports.join(', ')}`,
    ...candidate.issues.map(formatIssue),
  ];
  if (candidate.measured) {
    lines.push(`      measured · ${candidate.measured.height} units tall · ${candidate.measured.shot}`);
    lines.push(...candidate.measured.issues.map(formatIssue));
  }
  return lines;
}

export function formatPlan(plan) {
  const fitting = plan.candidates.filter((c) => c.fits).length;
  const lines = [
    `rikiki · scene plan · ${plan.relation}`,
    `  claim · ${plan.claim}`,
    ...formatProblems(plan.warnings, 'warning'),
    ...plan.candidates.flatMap(formatCandidate),
    ...plan.rejected.map((r) => `  rejected ${r.form} · ${r.reason}`),
  ];
  if (plan.ambiguous) lines.push(`  ambiguous · ${plan.ambiguous}`);
  lines.push(`rikiki · scene plan · ${plan.candidates.length} candidate(s), ${fitting} fit(s)`);
  return lines.join('\n');
}

/** The slide of one candidate, headed by the modules it needs as a comment ·
 *  they go once in the deck's <head>, not beside every slide. */
export function compiledSlide({ imports, html }, id) {
  return [
    `<!-- rikiki scene · candidate ${id} · load these once in the deck's <head>:`,
    ...imports.map((tag) => `  ${tag}`),
    '-->',
    html,
    '',
  ].join('\n');
}
