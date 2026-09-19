#!/usr/bin/env node
// Scaffold a component that already passes the contract.
//
//   npm run new:component -- <family> <deck-tag> [--core]
//
// A guard tells a contributor they are wrong after the fact. This writes
// something right to begin with: the source from the contract template, a
// fixture slide that renders it, and · with --core · the line in the manifest.
//
// Opt-in is the DEFAULT. A core component joins the bundle every deck
// downloads, so it is a deliberate act rather than the path of least
// resistance · Manifesto principle 3 (light by default) expressed in the
// tooling. Both counts are published and pinned, so either choice owes the
// site a number; only the core one owes every reader the bytes.
//
// scripts/new-component.test.mjs runs this into a temporary directory and
// checks the output against the contract rules · neither can drift alone.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Kept in step with scripts/modulith.test.mjs · core/ is not a destination
 *  for a component, it is ADR-001's bounded context. */
const FAMILIES = ['data', 'engine', 'layout', 'media', 'shared', 'structure', 'text'];

function fail(message) {
  console.error(`new:component · ${message}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const intoAt = argv.indexOf('--into');
const into = intoAt === -1 ? PKG_DIR : resolve(argv[intoAt + 1]);
// --into takes a value · skip it too, without swallowing argv[0] when the
// flag is absent and intoAt is -1.
const valueIndex = intoAt === -1 ? -1 : intoAt + 1;
const positional = argv.filter((a, i) => !a.startsWith('--') && i !== valueIndex);
const [family, tag] = positional;

if (!family || !tag) fail('usage: new:component <family> <deck-tag> [--core]');
if (!FAMILIES.includes(family)) {
  fail(`"${family}" is not a family · one of ${FAMILIES.join(', ')}`);
}
if (!/^deck-[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tag)) {
  fail(`"${tag}" is not a deck- custom element name · e.g. deck-thing`);
}

// dist/ is flat, so a basename is the whole namespace · two modules sharing
// one would overwrite each other's output, which build.mjs also refuses.
const registered = new Set();
for (const file of walk(resolve(PKG_DIR, 'src'))) {
  const source = readFileSync(file, 'utf8');
  for (const m of source.matchAll(/@customElement\('([^']+)'\)/g)) registered.add(m[1]);
  for (const m of source.matchAll(/customElements\.define\('([^']+)'/g)) registered.add(m[1]);
}
if (registered.has(tag)) fail(`<${tag}> is already registered · pick another name`);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') ? [full] : [];
  });
}

const className = tag
  .split('-')
  .map((p) => p[0].toUpperCase() + p.slice(1))
  .join('');

const component = `// ════════════════════════════════════════════════════════════════
// <${tag} label="...">
//   Slotted content.
// </${tag}>
//
// One responsibility, composed rather than configured. Say here what this
// element is FOR · the header is the first thing the next contributor reads
// and the only documentation that cannot go stale unnoticed.
//
// Attributes:
//   label · the text shown above the slotted content
//
// Tokens (override on \`:host\` to retheme one instance):
//   --${tag}-gap / --${tag}-label-color
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('${tag}')
export class ${className} extends LitElement {
  static override styles = css\`
    :host {
      display: block;
      /* Semantic tokens only · a literal renders fine in the theme you happen
         to be using and wrong in the other one. */
      gap: var(--${tag}-gap, var(--rik-space-2));
    }
    .label {
      color: var(--${tag}-label-color, var(--rik-text-default--muted));
      font-size: var(--rik-font-size-xs);
    }
  \`;

  /** The text shown above the slotted content. Documented in the header and
   *  in the catalogue entry · scripts/component.test.mjs checks the second. */
  @property({ type: String }) label?: string;

  override render() {
    // Render every declared property · a declared-but-unrendered prop is dead.
    return html\`
      <div class="body" part="body">
        \${this.label ? html\`<span class="label" part="label">\${this.label}</span>\` : ''}
        <slot></slot>
      </div>
    \`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    '${tag}': ${className};
  }
}
`;

const optIn = !flags.has('--core');
const fixture = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rikiki · ${tag}</title>
<link rel="stylesheet" href="../../themes/rikiki.css">
<script type="module" src="../../dist/index.js"></script>
${optIn ? `<script type="module" src="../../dist/${tag}.js"></script>\n` : ''}</head>
<body>
<deck-root>

  <deck-feature eyebrow="${tag}">
    <h1 slot="title">Say what this slide proves, not what it contains</h1>
    <${tag} label="Example">
      Replace this with a real composition · a component that only ever renders
      alone has its spacing against a neighbour still unmeasured.
    </${tag}>
  </deck-feature>

</deck-root>
</body>
</html>
`;

const sourcePath = join(into, 'src', family, `${tag}.ts`);
const fixturePath = join(into, 'decks', 'tests', `${tag}.html`);
for (const [path, contents] of [
  [sourcePath, component],
  [fixturePath, fixture],
]) {
  if (existsSync(path)) fail(`${path} already exists`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

const written = [sourcePath, fixturePath];

if (!optIn) {
  // The manifest is the source of truth for what the default bundle carries ·
  // scripts/component-surfaces.mjs reads these imports rather than a folder.
  const indexPath = join(into, 'src', 'index.ts');
  if (!existsSync(indexPath)) fail(`--core needs src/index.ts · not found at ${indexPath}`);
  const index = readFileSync(indexPath, 'utf8');
  const anchor = `\n// Media · what it embeds or draws`;
  if (!index.includes(anchor))
    fail('src/index.ts no longer has the family sections to insert into');
  writeFileSync(indexPath, index.replace(anchor, `\nimport './${family}/${tag}.js';\n${anchor}`));
  written.push(indexPath);
}

console.log(`\n<${tag}> · ${optIn ? 'opt-in' : 'core'}, in src/${family}/\n`);
for (const path of written) console.log(`  écrit  ${path.replace(`${into}/`, '')}`);

console.log(`
Ce que le générateur ne peut pas faire à ta place :

  1. docs/llms/rikiki-reference.md · l'entrée de <${tag}>, ses slots, ses
     attributs et ses tokens. scripts/component-contract.test.mjs échoue tant
     qu'elle manque, et c'est voulu : la référence fait foi.
  2. site/src/pages/docs/components.astro · l'entrée du catalogue. Tout
     attribut déclaré doit y figurer (scripts/component.test.mjs).
  3. Les pages qui publient un nombre de composants · le compte vient de
     bouger (${optIn ? 'opt-in' : 'core'}), et scripts/component.test.mjs dira
     lesquelles. Les deux comptes sont publiés, pas seulement celui du coeur.
  4. npm run build, puis committer dist/ avec la source.
`);
