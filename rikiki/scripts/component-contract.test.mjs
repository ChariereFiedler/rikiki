import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The component contract, enforced rather than described.
//
// docs/design/adr-004-source-modulith-by-family.md · the shape every component
// already has. Measured before this file was written: 44 of 44 component files
// passed every rule below except the color one, which two files failed. So
// this is not a convention being imposed, it is a convention being kept · the
// test exists to stop the next file from being the first exception.
//
// What is deliberately NOT here, and why, because the absence is the decision:
//
//   part= on structural nodes · 21 of 44. A component with no structural
//   wrapper legitimately has none, and a test that cannot tell those apart
//   teaches contributors to write part="wrapper" to silence it.
//
//   a declared property that is never read · written, measured, discarded.
//   Ten survived the CSS-selector pass and every one was a real cross-element
//   read: deck-graph reads from/to/at off its children's attributes. A rule
//   whose every remaining finding is a false positive gets switched off.
//
// Attribute documentation is not here either · scripts/component.test.mjs
// already holds it, against the catalogue entry, with reasoned exceptions.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(PKG_DIR, 'src');
const REFERENCE = resolve(PKG_DIR, 'docs/llms/rikiki-reference.md');

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

const rel = (file) => relative(PKG_DIR, file);
const read = (file) => readFileSync(file, 'utf8');
const tagsIn = (src) => [
  ...[...src.matchAll(/@customElement\('([^']+)'\)/g)].map((m) => m[1]),
  ...[...src.matchAll(/customElements\.define\('([^']+)'/g)].map((m) => m[1]),
];

const componentFiles = sources(SRC).filter((f) => tagsIn(read(f)).length > 0);

describe('every component has the same shape', () => {
  it('finds the components to check', () => {
    // A walk that silently matched nothing would make every case below
    // vacuous · this is the assertion that notices.
    expect(componentFiles.length).toBeGreaterThan(40);
  });

  it.each(componentFiles)('%s opens with a usage header', (file) => {
    // Every component leads with the HTML an author would write. It is the
    // first thing a contributor copies and the only doc that cannot go stale
    // without the file being open.
    const first = read(file).split('\n')[0];
    expect(first.startsWith('//'), `${rel(file)} has no header block`).toBe(true);
  });

  it.each(componentFiles)('%s declares its tags on HTMLElementTagNameMap', (file) => {
    expect(read(file), `${rel(file)} types no tag`).toContain('HTMLElementTagNameMap');
  });

  it.each(componentFiles)('%s styles through `static override styles`', (file) => {
    expect(read(file), `${rel(file)} defines styles some other way`).toContain(
      'static override styles',
    );
  });

  it.each(componentFiles)('%s defines the element it is named after', (file) => {
    // deck-metric.ts may also define deck-metric-list · what it may not do is
    // define neither, which is how a file ends up named after nothing.
    const base = file.slice(file.lastIndexOf('/') + 1, -3);
    expect(tagsIn(read(file)), `${rel(file)} defines no <${base}>`).toContain(base);
  });

  it.each(componentFiles)('%s hardcodes no color', (file) => {
    // An exception is spelled `rikiki:allow-hex <reason>`. It covers the line
    // it is on and the block that follows it, up to the next blank line · so
    // one reason can carry a run of related values without being repeated,
    // and cannot silently spread to the rest of the file. Both live cases were
    // read before being excused, and both carry their measurement.
    const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/;
    const bad = [];
    let excused = false;
    read(file)
      .split('\n')
      .forEach((line, i) => {
        if (line.trim() === '') excused = false;
        if (line.includes('rikiki:allow-hex')) excused = true;
        // #abc in a selector is an id, not a color · the pattern requires a
        // color's length and a boundary after it.
        if (HEX.test(line) && !excused) bad.push(`${i + 1}: ${line.trim()}`);
      });
    expect(bad, `${rel(file)} hardcodes a color · use a --rik-* token`).toEqual([]);
  });
});

describe('every registered tag is documented', () => {
  const reference = readFileSync(REFERENCE, 'utf8');
  const tags = [...new Set(componentFiles.flatMap((f) => tagsIn(read(f))))].sort();

  it('finds the tags to check', () => {
    expect(tags.length).toBeGreaterThan(40);
  });

  it.each(tags)('<%s> appears in the LLM reference', (tag) => {
    expect(
      new RegExp(`(?<![\\w-])${tag}(?![\\w-])`).test(reference),
      `<${tag}> is registered but absent from docs/llms/rikiki-reference.md`,
    ).toBe(true);
  });
});
