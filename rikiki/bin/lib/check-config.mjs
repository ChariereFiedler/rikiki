// ════════════════════════════════════════════════════════════════
// RIKIKI · the check policy a deck's folders write, read and validated
//
// `rikiki.config.json` holds a `check` section beside `plugins` and `narrative`.
// Every such file from the deck's folder up is read, outermost first, so a
// repository says its policy once and a folder only what differs. The walk stops
// at a file that says `"root": true`, at the folder that holds `.git`, or at the
// filesystem's root · never in a home folder, which would make a laptop and the
// CI disagree. `--config <file>` reads that one file alone.
//
// A section that cannot be read is said (`CHECK_CONFIG_INVALID`, with its file
// and its key) and left out whole · the run goes on with the others, and says so.
// ════════════════════════════════════════════════════════════════

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const CONFIG_FILE = 'rikiki.config.json';

const SECTION_KEYS = Object.freeze([
  'root',
  'checks',
  'severity',
  'warningsAsErrors',
  'limits',
  'options',
  'inline',
  'overrides',
]);
const OVERRIDE_KEYS = Object.freeze(['slides', 'kinds', 'tags', 'elements', 'checks', 'severity', 'reason']);
const MATCH_KEYS = Object.freeze(['slides', 'kinds', 'tags', 'elements']);
export const LEVELS = Object.freeze(['error', 'warning', 'off']);
export const INLINE_MODES = Object.freeze(['warnings', 'all', 'none']);

/** A rule or a glob in either spelling · `text-too-small`, `TEXT_TOO_SMALL`, `ill-*`. */
export const RULE_TOKEN = /^[A-Za-z0-9*][A-Za-z0-9_*-]*$/;

const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const stringList = (value) => typeof value === 'string' || (Array.isArray(value) && value.every((v) => typeof v === 'string'));

/** The files whose `check` sections apply to a deck, outermost first. */
export function configFiles(deckPath, explicit) {
  if (explicit) return [resolve(explicit)];
  const found = [];
  const home = resolve(homedir());
  for (let dir = dirname(resolve(deckPath)); dir !== home; dir = dirname(dir)) {
    const file = join(dir, CONFIG_FILE);
    if (existsSync(file)) {
      found.unshift(file);
      if (readsRoot(file)) break;
    }
    if (existsSync(join(dir, '.git')) || dirname(dir) === dir) break;
  }
  return found;
}

/** A file that ends the walk up · read leniently, its errors are said when it is loaded. */
function readsRoot(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))?.check?.root === true;
  } catch {
    // Unreadable here, said by `loadCheckConfig` with the reason.
    return false;
  }
}

/** Every problem of one `check.checks`-like value · a comma list of tokens. */
function tokenProblems(value, where) {
  if (!stringList(value)) return [`${where} must be a comma list of rule names or globs`];
  const tokens = (Array.isArray(value) ? value.join(',') : value).split(',').map((t) => t.trim()).filter(Boolean);
  return tokens
    .filter((t) => !RULE_TOKEN.test(t.replace(/^-/, '')))
    .map((t) => `${where}: "${t}" is not a rule name or a glob (text-too-small, ILL_*, -slide-dense)`);
}

function severityProblems(value, where) {
  if (!isObject(value)) return [`${where} must map rule names or globs to error, warning or off`];
  return Object.entries(value).flatMap(([rule, level]) => [
    ...(RULE_TOKEN.test(rule) ? [] : [`${where}: "${rule}" is not a rule name or a glob`]),
    ...(LEVELS.includes(level) ? [] : [`${where}.${rule} must be one of ${LEVELS.join(', ')}`]),
  ]);
}

function overrideProblems(entry, where) {
  if (!isObject(entry)) return [`${where} must be an object`];
  const problems = Object.keys(entry)
    .filter((k) => !OVERRIDE_KEYS.includes(k))
    .map((k) =>
      k === 'limits'
        ? `${where}.limits · thresholds apply to the whole deck, not to a part of it`
        : `${where}.${k} is not a key of an override (${OVERRIDE_KEYS.join(', ')})`,
    );
  if (!MATCH_KEYS.some((k) => entry[k] !== undefined))
    problems.push(`${where} matches nothing in particular · give it slides, kinds, tags or elements (or write the rule at the top)`);
  if (entry.slides !== undefined && !stringList(entry.slides)) problems.push(`${where}.slides must be a --slides selector`);
  for (const key of ['kinds', 'tags'])
    if (entry[key] !== undefined && !stringList(entry[key])) problems.push(`${where}.${key} must be a name or a list of names`);
  if (entry.elements !== undefined && typeof entry.elements !== 'string') problems.push(`${where}.elements must be a CSS selector`);
  if (entry.checks !== undefined) problems.push(...tokenProblems(entry.checks, `${where}.checks`));
  if (entry.severity !== undefined) problems.push(...severityProblems(entry.severity, `${where}.severity`));
  if (entry.reason !== undefined && typeof entry.reason !== 'string') problems.push(`${where}.reason must be a sentence`);
  if (entry.checks === undefined && entry.severity === undefined)
    problems.push(`${where} changes nothing · give it checks or severity`);
  return problems;
}

/** Every problem of a `check` section, each naming its key · empty when it reads. */
export function sectionProblems(section) {
  if (!isObject(section)) return ['check must be an object'];
  const problems = Object.keys(section)
    .filter((k) => !SECTION_KEYS.includes(k))
    .map((k) => `check.${k} is not a key of the check section (${SECTION_KEYS.join(', ')})`);
  if (section.root !== undefined && typeof section.root !== 'boolean') problems.push('check.root must be true or false');
  if (section.checks !== undefined) problems.push(...tokenProblems(section.checks, 'check.checks'));
  if (section.warningsAsErrors !== undefined) problems.push(...tokenProblems(section.warningsAsErrors, 'check.warningsAsErrors'));
  if (section.severity !== undefined) problems.push(...severityProblems(section.severity, 'check.severity'));
  if (section.limits !== undefined) {
    if (!isObject(section.limits)) problems.push('check.limits must map threshold names to numbers');
    else
      for (const [key, value] of Object.entries(section.limits))
        if (typeof value !== 'number' || !Number.isFinite(value)) problems.push(`check.limits.${key} must be a finite number`);
  }
  if (section.options !== undefined) {
    if (!isObject(section.options)) problems.push('check.options must map "CODE.option" to values');
    else
      for (const key of Object.keys(section.options))
        if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) problems.push(`check.options."${key}" must read "<rule>.<option>"`);
  }
  if (section.inline !== undefined && !INLINE_MODES.includes(section.inline))
    problems.push(`check.inline must be one of ${INLINE_MODES.join(', ')}`);
  if (section.overrides !== undefined) {
    if (!Array.isArray(section.overrides)) problems.push('check.overrides must be a list');
    else section.overrides.forEach((entry, i) => problems.push(...overrideProblems(entry, `check.overrides[${i}]`)));
  }
  return problems;
}

/** The `check` sections that apply to a deck, outermost first, each with its file ·
 *  and what could not be read, as findings. */
export function loadCheckConfig(deckPath, explicit) {
  const layers = [];
  const diagnostics = [];
  const invalid = (file, problems) =>
    diagnostics.push({
      plugin: 'rikiki',
      code: 'CHECK_CONFIG_INVALID',
      severity: 'error',
      message: `${file} · ${problems.join(' · ')} · its check section is left out, the rest of the policy applies`,
      measurement: { file, problems },
    });
  for (const file of configFiles(deckPath, explicit)) {
    if (!existsSync(file)) {
      invalid(file, ['the file named by --config does not exist']);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      invalid(file, [`not JSON (${error.message})`]);
      continue;
    }
    if (!isObject(parsed)) {
      invalid(file, ['the file must hold an object']);
      continue;
    }
    if (parsed.check === undefined) continue;
    const problems = sectionProblems(parsed.check);
    if (problems.length) invalid(file, problems);
    else layers.push({ file, check: parsed.check });
  }
  return { layers, diagnostics };
}
