// ════════════════════════════════════════════════════════════════
// The CSS-in-JS minifier · the descendant combinator before a pseudo
//
// The build collapses whitespace inside every css`` block. One of those
// collapses was wrong in a way no test could see: it tightened the whitespace
// around EVERY colon, including a colon that starts a pseudo-class or
// pseudo-element. In a selector the whitespace in front of such a colon is the
// DESCENDANT COMBINATOR, so `:host([banded]) ::slotted(*)` shipped as
// `:host([banded])::slotted(*)` · still valid CSS, matching nothing.
//
// Three rules died that way and nobody noticed, because the component rendered,
// the tests were green, and the only symptom was a style that never applied.
// This file is the regression net: the three shapes, and the real selectors.
// ════════════════════════════════════════════════════════════════

import { describe, expect, test } from 'vitest';
import { tightenCss } from '../minify-templates.mjs';

/** The plugin collapses whitespace runs before tightening · do the same here so
 *  the input to tightenCss is what it actually receives. */
const tighten = (css) => tightenCss(css.replace(/\s+/g, ' ').trim());

describe('a colon in selector position keeps the space before it', () => {
  test('a ::slotted(x) · a pseudo-ELEMENT after a descendant combinator', () => {
    expect(tighten('a ::slotted(x) { color: red; }')).toBe('a ::slotted(x){color:red}');
  });

  test('a :not(.x) · a pseudo-CLASS after a descendant combinator', () => {
    expect(tighten('a :not(.x) { color: red; }')).toBe('a :not(.x){color:red}');
  });

  test('the combinator is kept inside a functional pseudo too', () => {
    expect(tighten(':is(a :not(.x)) { color: red; }')).toBe(':is(a :not(.x)){color:red}');
  });

  test('a colon with nothing in front of it is untouched', () => {
    expect(tighten('a:hover { color: red; }')).toBe('a:hover{color:red}');
  });
});

describe('a declaration colon still collapses', () => {
  test('color : red', () => {
    expect(tighten('a { color : red; }')).toBe('a{color:red}');
  });

  test('a value keeps its own internal spacing rules', () => {
    expect(tighten('a { padding : 1px  2px ; margin : 0 ; }')).toBe('a{padding:1px 2px;margin:0}');
  });

  test('a media feature collapses like the declaration it resembles', () => {
    expect(tighten('@media (max-width: 640px) { a { color: red; } }')).toBe(
      '@media (max-width:640px){a{color:red}}',
    );
  });

  test('a selector colon inside a group at-rule survives', () => {
    expect(tighten('@media print { a ::slotted(x) { color: red; } }')).toBe(
      '@media print{a ::slotted(x){color:red}}',
    );
  });
});

describe('the rules this bug actually killed', () => {
  // Copied from the sources, not paraphrased · if one of them is reworded the
  // test should be updated deliberately rather than quietly still passing.
  const CASES = [
    [':host([banded]) ::slotted(*) { align-self: start; }', 'deck-point'],
    [":host([direction='row']) ::slotted(*) { flex: 1 1 0; }", 'deck-step-list'],
    [
      ":host([direction='row']) ::slotted(*)::before { content: ''; }",
      'deck-step-list · the connector',
    ],
    [
      ':host([ruled]) ::slotted(deck-kpi:not(:first-child)) { border-left: 2px solid red; }',
      'deck-kpi-grid',
    ],
  ];

  for (const [rule, where] of CASES) {
    test(where, () => {
      const minified = tighten(rule);
      expect(minified, 'the descendant combinator is still there').toContain(') :');
      expect(minified).not.toContain('))::slotted');
      expect(minified).not.toContain(']):');
    });
  }
});

test('whitespace is otherwise still removed', () => {
  const source = `
    :host {
      display : grid ;
      gap : var(--a , 1px) ;
    }
    .x > .y { color : blue ; }
  `;
  // Only the structural punctuation is tightened · a combinator keeps its
  // spaces, which is what makes this minifier safe to reason about.
  expect(tighten(source)).toBe(':host{display:grid;gap:var(--a,1px)}.x > .y{color:blue}');
});
