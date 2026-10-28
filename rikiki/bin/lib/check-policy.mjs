// ════════════════════════════════════════════════════════════════
// RIKIKI · which findings a deck keeps, at which severity, and why
//
// The check measures everything, then the deck's policy decides, finding by
// finding: rules selected or dropped, severities raised or lowered, for the
// whole deck or for some of its slides, kinds of slide, tagged slides or
// elements, and exceptions written on the deck itself. What a policy drops is
// not lost: it is reported as suppressed, with what dropped it and why, so a
// clean report never hides a silenced one.
//
// The order, outermost first, the last word winning:
//   1. each rule on, at the severity it was written with;
//   2. the `check` sections of the config files, outermost first: `checks`
//      (a comma list applied in order on what is inherited: `-x` drops,
//      `x` takes back, `-*` drops everything), then `severity`
//      (error, warning or off);
//   3. the command line: `--checks` and `--severity` after the files;
//   4. every override whose slides, kinds, tags and elements all match, in order;
//   5. the exceptions written on the deck (`data-check-off` + `data-check-reason`):
//      they only drop, and by default only warnings (`inline: "warnings"`);
//   6. the findings about the run come back, whatever was written;
//   7. `warningsAsErrors` raises what is left a warning.
//
// Pure: diagnostics and a policy in, kept and suppressed out.
// ════════════════════════════════════════════════════════════════

import { RULE_TOKEN } from './check-config.mjs';
import { codeOf, isAlwaysOn } from './check-registry.mjs';
import { isWithin } from './element-path.mjs';

/** A rule name or a glob, in either spelling, as a pattern over codes. */
export function globPattern(token) {
  const code = codeOf(token);
  const escaped = code.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('[A-Z0-9_]*')}$`);
}

/** A comma list of rules (`-text-*, ill-wordy`) as ordered rules. */
export function parseRuleList(spec, source) {
  const text = Array.isArray(spec) ? spec.join(',') : String(spec ?? '');
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((token) => {
      const negate = token.startsWith('-');
      const glob = negate ? token.slice(1) : token;
      if (!RULE_TOKEN.test(glob)) throw new Error(`"${token}" is not a rule name or a glob (text-too-small, ILL_*, -slide-dense)`);
      return { negate, glob, re: globPattern(glob), source };
    });
}

const severityRules = (map, source) =>
  Object.entries(map ?? {}).map(([glob, level]) => {
    if (!RULE_TOKEN.test(glob)) throw new Error(`"${glob}" is not a rule name or a glob (text-too-small, ILL_*)`);
    return { glob, level, re: globPattern(glob), source };
  });

const words = (value) =>
  (Array.isArray(value) ? value : String(value ?? '').split(/[\s,]+/)).map((w) => w.trim()).filter(Boolean);

/** The policy written by the config files and the command line · `layers` keeps
 *  each file, then the command line, in order: one says its `checks` then its
 *  `severity` before the next one speaks. */
export function buildPolicy({ layers = [], cli = {} } = {}) {
  const policy = {
    layers: [],
    promote: [],
    limits: {},
    options: {},
    inline: 'warnings',
    overrides: [],
    sources: [],
  };
  for (const { file, check } of layers) {
    policy.sources.push(file);
    policy.layers.push({
      rules: parseRuleList(check.checks, `${file}#check.checks`),
      severities: severityRules(check.severity, `${file}#check.severity`),
    });
    policy.promote.push(...parseRuleList(check.warningsAsErrors, `${file}#check.warningsAsErrors`));
    Object.assign(policy.limits, check.limits);
    Object.assign(policy.options, check.options);
    if (check.inline) policy.inline = check.inline;
    (check.overrides ?? []).forEach((entry, index) => {
      const source = `${file}#check.overrides[${index}]`;
      policy.overrides.push({
        source,
        reason: entry.reason ?? null,
        match: {
          ...(entry.slides !== undefined ? { slides: [entry.slides].flat().join(',') } : {}),
          ...(entry.kinds !== undefined ? { kinds: words(entry.kinds) } : {}),
          ...(entry.tags !== undefined ? { tags: words(entry.tags) } : {}),
          ...(entry.elements !== undefined ? { elements: entry.elements } : {}),
        },
        rules: parseRuleList(entry.checks, source),
        severities: severityRules(entry.severity, source),
      });
    });
  }
  if (cli.checks !== undefined || cli.severity || cli.warningsAsErrors !== undefined || cli.limits || cli.options)
    policy.sources.push('command line');
  policy.layers.push({
    rules: parseRuleList(cli.checks, 'command line · --checks'),
    severities: severityRules(cli.severity, 'command line · --severity'),
  });
  policy.promote.push(...parseRuleList(cli.warningsAsErrors, 'command line · --warnings-as-errors'));
  Object.assign(policy.limits, cli.limits);
  Object.assign(policy.options, cli.options);
  if (cli.inline) policy.inline = cli.inline;
  return policy;
}

/** Apply ordered rules to a code · enabled or not, severity, and what decided. */
function applyRules(state, code, rules, severities, by) {
  for (const rule of rules)
    if (rule.re.test(code)) {
      state.enabled = !rule.negate;
      state.by = by(rule);
    }
  for (const rule of severities)
    if (rule.re.test(code)) {
      if (rule.level === 'off') state.enabled = false;
      else state.severity = rule.level;
      state.by = by(rule);
    }
}

/**
 * What the policy makes of one finding.
 * @param {object} scope `overrides`: the overrides that match where it stands, in order ·
 *   `inline`: the exceptions written over it, outermost first.
 * @returns {{ kept: boolean, severity: string, promoted?: true,
 *   by?: { kind: 'config'|'override'|'inline', source: string, reason?: string|null },
 *   refused?: object }}
 */
export function decide(policy, code, severity, { overrides = [], inline = [] } = {}) {
  if (isAlwaysOn(code)) return { kept: true, severity };
  const state = { enabled: true, severity, by: undefined };
  for (const layer of policy.layers)
    applyRules(state, code, layer.rules, layer.severities, (rule) => ({ kind: 'config', source: rule.source }));
  for (const override of overrides)
    applyRules(state, code, override.rules, override.severities, () => ({
      kind: 'override',
      source: override.source,
      reason: override.reason,
    }));
  if (!state.enabled) return { kept: false, severity: state.severity, by: state.by };
  const exception = inline.find((carrier) => carrier.patterns.some((re) => re.test(code)));
  if (exception && policy.inline !== 'none') {
    if (state.severity === 'error' && policy.inline !== 'all') return { ...promoted(policy, code, state), refused: exception };
    return {
      kept: false,
      severity: state.severity,
      by: { kind: 'inline', source: exception.path, reason: exception.reason },
      exception,
    };
  }
  return promoted(policy, code, state);
}

/** `warningsAsErrors`, read in order across the files and the command line · the
 *  last rule that matches says whether a warning is raised (`*,-text-too-small`). */
function promoted(policy, code, state) {
  const last = policy.promote.findLast((rule) => rule.re.test(code));
  if (state.severity === 'warning' && last && !last.negate) return { kept: true, severity: 'error', promoted: true };
  return { kept: true, severity: state.severity };
}

// ── where a finding stands ───────────────────────────────────────────────

const kindPattern = (glob) => new RegExp(`^${glob.toLowerCase().split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);

/** The slide a finding belongs to · its own, or the one whose element holds it. */
export function slideOf(diagnostic, outline) {
  if (diagnostic.slide) return outline.find((s) => s.index === diagnostic.slide) ?? null;
  if (!diagnostic.element) return null;
  return outline.find((s) => s.path && isWithin(diagnostic.element, s.path)) ?? null;
}

/**
 * The overrides of a policy, resolved against a deck · the slides each covers
 * (by the `--slides` grammar, on the whole deck), and the elements each matched.
 * @param {(selector: string) => number[]|null} resolveSlides the slides a selector covers, null when it names none
 * @param {Record<string, string[]>} elementPaths the paths each `elements` selector matched in the page
 */
export function resolveOverrides(policy, { outline, resolveSlides, elementPaths = {} }) {
  return policy.overrides.map((override, index) => {
    const { slides, kinds, tags, elements } = override.match;
    let covered = null;
    let unknownSlides = null;
    if (slides !== undefined) {
      // Slides this deck does not have cover none of its slides · never all of them.
      covered = resolveSlides(slides) ?? [];
      if (!covered.length) unknownSlides = slides;
    }
    const kindRes = kinds?.map(kindPattern);
    const inScope = (slide) =>
      !!slide &&
      (covered === null || covered.includes(slide.index)) &&
      (!kindRes || kindRes.some((re) => re.test(slide.tag))) &&
      (!tags || tags.some((tag) => (slide.tags ?? []).includes(tag)));
    const slideBound = slides !== undefined || kinds !== undefined || tags !== undefined;
    const paths = elements !== undefined ? (elementPaths[elements] ?? []) : null;
    return {
      ...override,
      index,
      unknownSlides,
      slides: slideBound ? outline.filter(inScope).map((s) => s.index) : null,
      elements: paths,
      /** Whether a finding standing here is under this override. */
      covers(diagnostic, slide) {
        if (slideBound && !inScope(slide)) return false;
        if (paths !== null) return paths.some((path) => isWithin(diagnostic.element, path));
        return true;
      },
    };
  });
}

/** The exceptions written on the deck, read · each with its patterns, the slide it
 *  stands on (null for the whole deck) and what is wrong with it. */
export function readExceptions(carriers, outline) {
  return carriers.map((carrier) => {
    const tokens = words(carrier.off);
    const bad = tokens.filter((t) => t === '*' || !RULE_TOKEN.test(t));
    const patterns = tokens.filter((t) => !bad.includes(t)).map(globPattern);
    const slide = carrier.root ? null : (outline.find((s) => s.path && isWithin(carrier.path, s.path)) ?? null);
    return {
      ...carrier,
      tokens,
      bad,
      patterns,
      reason: (carrier.reason ?? '').trim(),
      slideIndex: slide?.index ?? null,
      used: Object.fromEntries(tokens.map((t) => [t, 0])),
      refused: 0,
    };
  });
}

/** Whether an exception is written over a finding · the deck root over all of them,
 *  a slide over its findings, an element over its own and its children's. */
function exceptionCovers(exception, diagnostic, slide) {
  if (exception.root) return true;
  if (exception.isSlide && slide && slide.index === exception.slideIndex) return true;
  return isWithin(diagnostic.element, exception.path);
}

const finding = (code, severity, message, extra = {}) => ({ plugin: 'rikiki', code, severity, message, ...extra });

/** What the policy itself gets wrong, read before the run · a rule name that names
 *  nothing (a typo silences nothing and says nothing), a rule that is always on. */
export function selectionFindings(policy, { known, pending = [] }) {
  const found = [];
  const seen = new Set();
  const tokens = [
    ...policy.layers.flatMap((layer) => [...layer.rules, ...layer.severities]),
    ...policy.promote,
    ...policy.overrides.flatMap((o) => [...o.rules, ...o.severities]),
  ];
  for (const rule of tokens) {
    const key = `${rule.source}|${rule.glob}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // A plugin that did not load still names its rules · its own failure says so.
    if (pending.some((namespace) => rule.re.test(`${namespace}_X`))) continue;
    const matched = known.filter((code) => rule.re.test(code));
    if (!matched.length)
      found.push(
        finding('CHECK_SELECTION_UNMATCHED', 'warning', `"${rule.glob}" (${rule.source}) names no rule · it selects and silences nothing`, {
          measurement: { rule: rule.glob, source: rule.source },
          suggestion: '`rikiki check --list-checks` prints every rule this deck can meet, by name and by code',
        }),
      );
    else if (matched.every(isAlwaysOn))
      found.push(
        finding('CHECK_SELECTION_IGNORED', 'warning', `"${rule.glob}" (${rule.source}) names findings about the run, which are always reported`, {
          measurement: { rule: rule.glob, source: rule.source, codes: matched },
          suggestion: 'a page that threw or a file that did not load is never silenced · fix the run instead',
        }),
      );
  }
  return found;
}

/** The options (`check.options`, `--check-option`) that no rule of this deck reads ·
 *  a typo in the rule they name gives the option to nothing, and would say nothing.
 *  @param {string[]} readers the codes of the plugin rules that loaded
 *  @param {string[]} pending the namespaces of the plugins that did not · their own failure says so */
export function optionFindings(policy, { readers, pending = [] }) {
  return Object.keys(policy.options).flatMap((key) => {
    const code = codeOf(key.slice(0, key.lastIndexOf('.')));
    if (readers.includes(code) || pending.some((namespace) => code.startsWith(`${namespace}_`))) return [];
    return [
      finding('CHECK_OPTION_UNKNOWN', 'warning', `option "${key}" names ${code}, which no plugin rule of this deck reads · it is given to nothing`, {
        measurement: { option: key, rule: code },
        suggestion: '`rikiki check --list-checks` prints every rule this deck can meet · an option goes to a rule of a plugin',
      }),
    ];
  });
}

/**
 * What the exceptions written on the deck get wrong, after the run · without a
 * reason (not applied), naming no rule, never used, or refused on an error.
 * @param {object} coverage which exceptions could be judged unused: `inspected`
 *   (slide indexes walked), `steps`, `visual`, `slideSteps` (index → steps),
 *   `visualCodes`, `unloaded` (plugin namespaces that did not run).
 */
export function exceptionFindings(exceptions, policy, { known, coverage }) {
  const found = [];
  for (const e of exceptions) {
    const where = { element: e.path, ...(e.slideIndex ? { slide: e.slideIndex } : {}) };
    if (!e.reason) {
      found.push(
        finding('CHECK_SUPPRESSION_UNJUSTIFIED', 'error', `data-check-off="${e.off}" has no data-check-reason · not applied`, {
          ...where,
          measurement: { off: e.tokens },
          suggestion: 'say why the deck is right and the rule is not, in data-check-reason, or fix what the rule found',
        }),
      );
      continue;
    }
    for (const token of e.bad)
      found.push(
        finding('CHECK_SUPPRESSION_UNKNOWN', 'warning', `data-check-off names "${token}" · a bare * or a malformed name silences nothing`, {
          ...where,
          suggestion: 'name the rules, by name or family (slide-dense, ill-*)',
        }),
      );
    for (const token of e.tokens.filter((t) => !e.bad.includes(t))) {
      const re = globPattern(token);
      const codes = known.filter((c) => re.test(c));
      if (!codes.length) {
        found.push(
          finding('CHECK_SUPPRESSION_UNKNOWN', 'warning', `data-check-off names "${token}", which is no rule`, {
            ...where,
            measurement: { rule: token },
            suggestion: '`rikiki check --list-checks` prints every rule this deck can meet',
          }),
        );
        continue;
      }
      if (e.used[token] || !verifiable(e, codes, coverage)) continue;
      found.push(
        finding('CHECK_SUPPRESSION_UNUSED', 'warning', `data-check-off="${token}" silenced nothing here · what it was written for is gone`, {
          ...where,
          measurement: { rule: token, reason: e.reason },
          suggestion: 'remove the exception · an exception that silences nothing will silence the next real finding',
        }),
      );
    }
    if (e.refused)
      found.push(
        finding('CHECK_SUPPRESSION_REFUSED', 'warning', `data-check-off cannot silence an error (${e.refused} kept) · the deck's policy lets exceptions silence warnings only`, {
          ...where,
          measurement: { refused: e.refused, inline: policy.inline },
          suggestion: 'fix the error, or, if the deck is right, lower the rule in rikiki.config.json (an override) where a reviewer reads it',
        }),
      );
  }
  return found;
}

/** Whether an unused exception can be told apart from one whose finding was not
 *  looked for · its slide walked in every state, the pixels measured, its plugin run. */
function verifiable(exception, codes, coverage) {
  const slides = exception.slideIndex ? [exception.slideIndex] : coverage.all;
  if (!slides.every((s) => coverage.inspected.includes(s))) return false;
  if (!coverage.steps && slides.some((s) => (coverage.slideSteps[s] ?? 0) > 0)) return false;
  if (!coverage.visual && codes.some((c) => coverage.visualCodes.includes(c))) return false;
  if (codes.some((c) => coverage.unloaded.some((namespace) => c.startsWith(`${namespace}_`)))) return false;
  return true;
}

/** Every finding of a run, through the policy · kept (at their severity) and
 *  suppressed (with what suppressed them). */
/** The overrides and the exceptions over a finding, where it stands. */
export function scopeOf(diagnostic, { outline, overrides, exceptions }) {
  const slide = slideOf(diagnostic, outline);
  return {
    overrides: overrides.filter((o) => o.covers(diagnostic, slide)),
    inline: exceptions.filter((e) => e.reason && e.patterns.length && exceptionCovers(e, diagnostic, slide)),
  };
}

export function applyPolicy(diagnostics, policy, { outline, overrides, exceptions }) {
  const kept = [];
  const suppressed = [];
  for (const diagnostic of diagnostics) {
    const scope = scopeOf(diagnostic, { outline, overrides, exceptions });
    const decision = decide(policy, diagnostic.code, diagnostic.severity, scope);
    if (decision.refused) decision.refused.refused += 1;
    if (decision.exception) {
      const token = decision.exception.tokens.find((t) => globPattern(t).test(diagnostic.code));
      if (token) decision.exception.used[token] += 1;
    }
    for (const override of scope.overrides) override.hits = (override.hits ?? 0) + (decision.by?.source === override.source ? 1 : 0);
    if (decision.kept)
      kept.push({ ...diagnostic, severity: decision.severity, ...(decision.promoted ? { promoted: true } : {}) });
    else suppressed.push({ ...diagnostic, severity: decision.severity, suppressedBy: decision.by });
  }
  return { kept, suppressed };
}
