// Minify CSS-in-JS · esbuild's --minify doesn't touch template-literal
// contents, so every `css`...`` block ships verbatim with comments and
// whitespace. This esbuild plugin strips comments + collapses whitespace
// inside css` and html` blocks before esbuild ever sees them.
//
// Shared by build.mjs (which disables it in dev mode · sourcemaps wouldn't
// line up otherwise) and build-standalone.mjs.

import { readFileSync } from 'node:fs';

/** At-rules whose block holds RULES rather than declarations · inside one of
 *  these, a colon is still a selector colon. Everything else that opens a block
 *  opens a declaration block. */
const GROUP_AT_RULE = /^@(media|supports|container|layer|scope|document|keyframes|[\w-]*keyframes)\b/;

/** Does an identifier, or another colon, start here? · that is what tells a
 *  pseudo-class or pseudo-element from a colon that opens a value. */
const STARTS_PSEUDO = /[a-zA-Z_\-:]/;

/**
 * Tighten CSS whitespace around structural punctuation.
 *
 * The subtle case is the colon, and getting it wrong costs real rules. A
 * declaration colon (`color: red`) may lose the whitespace on both sides; a
 * colon that starts a pseudo-class or pseudo-element (`:host([banded])
 * ::slotted(*)`) may NOT, because the whitespace in front of it is the
 * DESCENDANT COMBINATOR. Eating it silently rewrites the selector to mean
 * "the host that is also ::slotted", which matches nothing · the rule is still
 * there, still valid, and simply never applies.
 *
 * That is not hypothetical: it shipped, and it killed
 * `:host([banded]) ::slotted(*)` in deck-point, both
 * `:host([direction='row']) ::slotted(*)` rules in deck-step-list, and
 * `:host([ruled]) ::slotted(deck-kpi:not(:first-child))` in deck-kpi-grid.
 *
 * The two are told apart by CONTEXT, not by shape, because `a :not(.x)` and
 * `color : red` look identical locally. A colon inside a declaration block is a
 * declaration colon; a colon in a selector or an at-rule prelude is not. The
 * scan therefore tracks what kind of block it is in.
 *
 * @param {string} css whitespace already collapsed to single spaces
 * @returns {string}
 */
export function tightenCss(css) {
  let out = '';
  // The innermost block decides how a colon reads. Top level holds rules.
  const blocks = ['rules'];
  // Text since the last `{`, `}` or `;` · the prelude of the block a `{` opens.
  let prelude = '';

  const inRules = () => blocks[blocks.length - 1] === 'rules';
  /** Emit a character that owns its own whitespace on both sides. */
  const tight = (char, index) => {
    out = out.trimEnd() + char;
    let next = index;
    while (css[next + 1] === ' ') next++;
    return next;
  };

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      blocks.push(GROUP_AT_RULE.test(prelude.trim()) ? 'rules' : 'declarations');
      prelude = '';
      i = tight('{', i);
      continue;
    }
    if (c === '}') {
      if (blocks.length > 1) blocks.pop();
      prelude = '';
      // Drop the final `;` before `}` while we are here.
      out = out.trimEnd().replace(/;$/, '');
      i = tight('}', i);
      continue;
    }
    if (c === ';') {
      prelude = '';
      i = tight(';', i);
      continue;
    }
    if (c === ',') {
      prelude += c;
      i = tight(',', i);
      continue;
    }
    if (c === ':') {
      prelude += c;
      // In a selector or a prelude, a colon that begins a pseudo keeps the
      // space in front of it · that space is the descendant combinator.
      if (inRules() && STARTS_PSEUDO.test(css[i + 1] ?? '')) {
        out += ':';
        while (css[i + 1] === ' ') i++;
        continue;
      }
      i = tight(':', i);
      continue;
    }
    out += c;
    prelude += c;
  }
  return out;
}

export function minifyTemplates(enabled = true) {
  return {
    name: 'minify-templates',
    setup(b) {
      if (!enabled) return;
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        let src = readFileSync(args.path, 'utf8');
        // Walk every `css\`...\`` (and `html\`...\``) and minify its body.
        src = src.replace(/(css|html)`([\s\S]*?)`/g, (_, tag, body) => {
          let m = body;
          // Block comments
          m = m.replace(/\/\*[\s\S]*?\*\//g, '');
          // Collapse runs of whitespace · keep newlines as single spaces
          m = m.replace(/\s+/g, ' ');
          if (tag === 'css') {
            // Tighten around CSS punctuation · CSS only. In html templates
            // this would eat the space after a }-closing binding and glue it
            // to the next attribute (`?disabled=${x}@click=${y}`), which
            // corrupts Lit's attribute parsing.
            m = tightenCss(m);
          }
          return tag + '`' + m.trim() + '`';
        });
        return { contents: src, loader: 'ts' };
      });
    },
  };
}
