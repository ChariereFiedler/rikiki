import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DELTA_E_DISTINCT,
  WCAG_AA,
  contrastRatio,
  deltaE,
  flatten,
  isOpaque,
  parseColor,
  readTokens,
} from '../tools/contrast.ts';

// The paint of a diagram, measured on every theme · the roles a surface says (pale,
// gold, ink, ok, bad), the words set on each, the discs of the icons and what the
// marks write in a status colour. Read from the diagram's own stylesheets and the
// theme files, never copied by hand: a value changed in either is measured again.
//
// Three themes · the two shipped, and a dark one written the way the rikiki-theme
// skill says (scripts/fixtures/dark-probe.css over themes/rikiki.css): a paint that
// holds on paper only is a paint that breaks the day a deck goes dark.
//
// A surface is seen when it clears 3:1 or a delta E of 10 against what it lies on
// (tools/contrast.ts says why both axes). Words clear 4.5:1, a figure or a tag set
// large 3:1, an icon 3:1 (WCAG non-text).

const THEMES = {
  rikiki: readFileSync('themes/rikiki.css', 'utf8'),
  siliceum: readFileSync('themes/siliceum.css', 'utf8'),
  dark:
    readFileSync('themes/rikiki.css', 'utf8') +
    readFileSync('scripts/fixtures/dark-probe.css', 'utf8'),
};

/** In the order the diagram stacks them (`static styles`) · a later rule wins. */
const SOURCES = [
  'src/media/scene-kit.ts',
  'src/media/diagram/draw-charts.ts',
  'src/media/diagram/draw-marks.ts',
  'src/media/deck-diagram.ts',
];

/** Every rule of the css`…` blocks of the diagram, selector by selector · the
 *  interpolations (`${unsafeCSS(…)}`) and comments taken out, later rules winning. */
function readRules() {
  const rules = new Map();
  for (const file of SOURCES) {
    const source = readFileSync(file, 'utf8');
    for (const [, block] of source.matchAll(/css`((?:\\`|[^`])*)`/g)) {
      const clean = block.replace(/\$\{[^}]*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, selectors, body] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const declarations = Object.fromEntries(
          [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map(([, prop, value]) => [
            prop,
            value.trim().replace(/\s+/g, ' '),
          ]),
        );
        for (const selector of argsOf(selectors).flatMap(expandIs)) {
          rules.set(selector, { ...(rules.get(selector) ?? {}), ...declarations });
        }
      }
    }
  }
  return rules;
}
/** `.on-pale :is(.a, .b)` is `.on-pale .a` and `.on-pale .b`. */
function expandIs(selector) {
  const one = selector.trim().replace(/\s+/g, ' ');
  const is = /:is\(([^()]*)\)/.exec(one);
  if (!is) return [one];
  return argsOf(is[1]).map((inner) => one.replace(is[0], inner));
}

const RULES = readRules();

/** A declaration of a rule · the test fails loudly when the selector is gone. */
function declared(selector, prop) {
  const value = RULES.get(selector)?.[prop];
  if (!value) throw new Error(`no "${prop}" on "${selector}" in ${SOURCES.join(', ')}`);
  return value;
}

/** The arguments of a css function, split on its own commas. */
function argsOf(inner) {
  const args = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '(') depth += 1;
    else if (inner[i] === ')') depth -= 1;
    else if (inner[i] === ',' && depth === 0) {
      args.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...args, inner.slice(start).trim()];
}

/** A css colour value as the browser computes it · `var()` with its fallbacks,
 *  `color-mix(in srgb, a p%, b)`, a literal. `scope` holds the custom properties
 *  a surrounding rule sets (`.on-ink`), over the theme's. */
function colourOf(value, tokens, scope = {}) {
  const v = value.trim();
  const call = /^([\w-]+)\(([\s\S]*)\)$/.exec(v);
  if (call?.[1] === 'var') {
    const [name, ...fallback] = argsOf(call[2]);
    const own = scope[name] ?? tokens.get(name);
    if (own !== undefined) return colourOf(own, tokens, scope);
    return fallback.length ? colourOf(fallback.join(','), tokens, scope) : null;
  }
  if (call?.[1] === 'color-mix') {
    const [, first, second] = argsOf(call[2]);
    const [, a, share] = /^(.*?)\s+([\d.]+)%$/.exec(first);
    const p = Number(share) / 100;
    const x = colourOf(a, tokens, scope);
    // Mixed with transparent, a colour keeps its hue at that share of opacity (a tint).
    if (second === 'transparent') return { ...x, a: p * (x.a ?? 1) };
    const y = colourOf(second, tokens, scope);
    return { r: x.r * p + y.r * (1 - p), g: x.g * p + y.g * (1 - p), b: x.b * p + y.b * (1 - p) };
  }
  return parseColor(v);
}

const seen = (a, b) =>
  contrastRatio(a, b) >= WCAG_AA.uiComponent || deltaE(a, b) >= DELTA_E_DISTINCT;
const fmt = (a, b) => `${contrastRatio(a, b).toFixed(2)}:1, delta E ${deltaE(a, b).toFixed(1)}`;

describe.each(Object.keys(THEMES))('theme %s · the paint of a diagram', (theme) => {
  const tokens = readTokens(THEMES[theme]);
  const page = colourOf('var(--rik-surface-page)', tokens);
  /** A fill as seen on what lies under it. */
  const over = (colour, under) => (isOpaque(colour) ? colour : flatten(colour, under));
  const fill = (selector, under = page, scope) =>
    over(colourOf(declared(selector, 'fill'), tokens, scope), under);
  const roles = ['pale', 'gold', 'ink', 'ok', 'bad'];
  const surface = Object.fromEntries(roles.map((role) => [role, fill(`.p-${role}`)]));
  const onInk = RULES.get('.on-ink');
  const ink = (selector) => colourOf(declared(selector, 'fill'), tokens, onInk);

  it.each(roles)('the %s surface is seen on the page', (role) => {
    expect(seen(surface[role], page), `.p-${role} on the page · ${fmt(surface[role], page)}`).toBe(
      true,
    );
  });

  it('the surfaces of the roles are told apart', () => {
    for (const a of roles)
      for (const b of roles)
        if (a < b)
          expect(
            seen(surface[a], surface[b]),
            `.p-${a} / .p-${b} · ${fmt(surface[a], surface[b])}`,
          ).toBe(true);
  });

  // `rikiki check` weighs a fill over 0.3 of opacity in a drawing's balance (a byte
  // of alpha rounds 0.3 to 0.302) · the states are tints, weightless as the theme's.
  it.each(['gold', 'ok', 'bad'])('the %s surface stays a tint, out of the balance', (role) => {
    const own = colourOf(declared(`.p-${role}`, 'fill'), tokens);
    expect(own.a ?? 1, `.p-${role}`).toBeLessThan(0.3);
  });

  it.each(['pale', 'gold', 'ok', 'bad'])('words and notes read on the %s surface', (role) => {
    const text = colourOf('var(--rik-text-default)', tokens);
    const note = fill('.note', surface[role]);
    expect(contrastRatio(text, surface[role])).toBeGreaterThanOrEqual(WCAG_AA.normalText);
    expect(contrastRatio(note, surface[role]), `.note on .p-${role}`).toBeGreaterThanOrEqual(
      WCAG_AA.normalText,
    );
  });

  it('words, notes, lines and tokens read on the ink surface', () => {
    const under = surface.ink;
    const text = over(ink('.on-inverse'), under);
    const note = over(ink('.on-inverse.note'), under);
    const line = over(
      colourOf('var(--deck-scene-line, var(--rik-text-default))', tokens, onInk),
      under,
    );
    expect(contrastRatio(text, under), `.on-inverse · ${fmt(text, under)}`).toBeGreaterThanOrEqual(
      WCAG_AA.normalText,
    );
    expect(
      contrastRatio(note, under),
      `.on-inverse.note · ${fmt(note, under)}`,
    ).toBeGreaterThanOrEqual(WCAG_AA.normalText);
    expect(
      contrastRatio(line, under),
      `a line on ink · ${fmt(line, under)}`,
    ).toBeGreaterThanOrEqual(WCAG_AA.uiComponent);
  });

  it('a card on a pale panel stands out of it', () => {
    const card = fill('.on-pale .p-pale', surface.pale);
    expect(seen(card, surface.pale), `card on pale · ${fmt(card, surface.pale)}`).toBe(true);
  });

  it.each([
    ['pale', ['.state-disc.d-pale', '.icon.on-disc']],
    ['gold', ['.state-disc.d-gold', '.icon.on-disc.d-gold']],
    ['ink', ['.state-disc.d-ink', '.icon.on-disc.d-ink']],
    ['ok', ['.state-disc.d-ok', '.icon.on-disc.d-ok']],
    ['bad', ['.state-disc.d-bad', '.icon.on-disc.d-bad']],
  ])('the icon of a %s disc reads on it', (_role, [disc, icon]) => {
    const behind = fill(disc);
    // A disc with no icon colour of its own takes the one every disc's icon has.
    const glyph = colourOf(
      declared(RULES.get(icon)?.stroke ? icon : '.icon.on-disc', 'stroke'),
      tokens,
    );
    expect(
      contrastRatio(glyph, behind),
      `${icon} on ${disc} · ${fmt(glyph, behind)}`,
    ).toBeGreaterThanOrEqual(WCAG_AA.uiComponent);
  });

  it.each([
    '.fig-ok',
    '.fig-danger',
    '.fig-accent',
    '.band-tag',
    '.status-fail',
    '.tag',
    '.col-scale',
  ])('what %s writes reads on the page and on a pale surface', (selector) => {
    for (const under of [page, surface.pale]) {
      const text = fill(selector, under);
      expect(
        contrastRatio(text, under),
        `${selector} · ${fmt(text, under)}`,
      ).toBeGreaterThanOrEqual(WCAG_AA.largeText);
    }
  });
});
