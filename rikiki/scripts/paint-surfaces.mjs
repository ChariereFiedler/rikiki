// ════════════════════════════════════════════════════════════════
// Which `--rik-*` tokens are actually painted as a background
//
// Derived from the source, never maintained by hand: a hand-written list of
// "emphasis tokens" is wrong within one commit, and the failure is silent.
// Both places a rikiki visual can live are scanned · the css`` literals of the
// components and the light-DOM rules of the themes.
//
// Pure string work, no parser, no DOM · unit-testable.
// ════════════════════════════════════════════════════════════════

import { lineAt, styleChunks } from './css-source.mjs';

/** Values that paint nothing, so they carry no contrast obligation. */
const NOT_A_SURFACE = new Set([
  'none',
  'transparent',
  'inherit',
  'initial',
  'unset',
  'currentColor',
]);

/**
 * Walk a stylesheet and yield every declaration with the selector it sits under.
 *
 * A five-line brace walker rather than a CSS parser: rikiki's stylesheets are
 * hand-written and nest at most one level (`@media` around a rule), which this
 * handles by keeping the whole selector stack.
 */
export function* declarations(css) {
  const stack = [];
  let buffer = '';
  let start = 0;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (c === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '));
      buffer = '';
      start = i + 1;
    } else if (c === '}') {
      stack.pop();
      buffer = '';
      start = i + 1;
    } else if (c === ';') {
      const colon = buffer.indexOf(':');
      if (colon > 0) {
        yield {
          property: buffer.slice(0, colon).trim(),
          value: buffer.slice(colon + 1).trim(),
          selector: stack[stack.length - 1] ?? '',
          // Point at the declaration, not at the brace that opened the rule ·
          // a failure message has to name the line a reader would go edit.
          offset: start + (buffer.length - buffer.trimStart().length),
        };
      }
      buffer = '';
      start = i + 1;
    } else {
      buffer += c;
    }
  }
}

/** Every `--rik-*` name mentioned in a value, fallbacks included. */
export function riksIn(value) {
  return [...value.matchAll(/--rik-[\w-]+/g)].map((m) => m[0]);
}

/**
 * Every `--rik-*` token painted as a background, with where it is painted.
 *
 * Returns Map<token, Array<{file, line, selector}>>. A declaration that paints
 * a literal colour is NOT reported here · `rikiki-component` already forbids
 * those, and `scripts/component.test.mjs` is where that rule lives.
 */
export function paintedSurfaces(chunks = styleChunks()) {
  const found = new Map();
  for (const chunk of chunks) {
    for (const decl of declarations(chunk.css)) {
      if (!/^background(-color)?$/.test(decl.property)) continue;
      if (NOT_A_SURFACE.has(decl.value)) continue;
      const line = lineAt(chunk.src, chunk.offset + decl.offset);
      const thin = /\/\*\s*thin\s*\*\//.test(decl.value);
      for (const token of riksIn(decl.value)) {
        const sites = found.get(token) ?? [];
        sites.push({ file: chunk.file, line, selector: decl.selector, theme: chunk.theme, thin });
        found.set(token, sites);
      }
    }
  }
  return found;
}

/**
 * The attributes a component sets to say "this one is different".
 *
 * Derived from the reflected boolean and enum properties the components already
 * declare · a background painted under one of these is a claim about meaning,
 * and a claim the audience cannot see is a defect. A background painted under
 * no state selector is the component's ordinary surface, where being quiet is a
 * legitimate choice and no threshold applies.
 */
const STATE_ATTRIBUTE =
  /\[\s*(?:data-)?(tone|color|active|mark|winner|boxed|current|done|pending|selected|no)\b/;

/** True when the declaration paints a state rather than a resting surface. */
export function isStateSurface(site) {
  return STATE_ATTRIBUTE.test(site.selector);
}

/**
 * True when the author marked the declaration as painting a LINE, not a box.
 *
 * A 3px rule and a 40px block are the same token to a stylesheet, and only one
 * of them owes the eye a contrast against the page. The marker is a CSS comment
 * written at the declaration itself · `background: var(--rik-accent) /* thin *\/;`
 * · so a reviewer reads it on the line it excuses, rather than in a waiver list
 * kept somewhere else. Unmarked and failing is red: the guard fails closed.
 */
export function isThin(site) {
  return site.thin === true;
}

/** A site rendered for a failure message · `path:line (selector)`. */
export function citeSite(site, root = '') {
  const path = root ? site.file.replace(`${root}/`, '') : site.file;
  return `${path}:${site.line} (${site.selector})`;
}
