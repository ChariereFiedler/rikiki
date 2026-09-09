import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { createHash } from 'node:crypto';

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

export function packageRoot(file) {
  let dir = dirname(file);
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`No package owns ${file}`);
    dir = parent;
  }
  return dir;
}

function dependencyRoot(name, from) {
  let dir = from;
  while (!existsSync(join(dir, 'node_modules', name, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Missing installed dependency ${name} from ${from}`);
    dir = parent;
  }
  return join(dir, 'node_modules', name);
}

export function writeInventory(root, metafiles) {
  const out = join(root, 'dist/vendor');
  const overrides = readJson(join(root, 'scripts/vendor-notices.json'));
  const records = new Map();
  const artifacts = [];
  function add(dir, artifact, evidence, input) {
    const pkg = readJson(join(dir, 'package.json'));
    const id = `${pkg.name}@${pkg.version}:${relative(root, dir)}`;
    if (!records.has(id)) {
      const notices = readdirSync(dir)
        .sort()
        .filter(
          (name) =>
            /^(licen[cs]e|copying|notice)([.-]|$)/i.test(name) &&
            statSync(join(dir, name)).isFile(),
        )
        .map((name) => ({
          source: `${relative(root, dir)}/${name}`,
          text: readFileSync(join(dir, name), 'utf8'),
        }));
      if (!notices.length) {
        const fallback =
          overrides[`${pkg.name}@${pkg.version}`] ??
          (pkg.name.startsWith('micromark') ? overrides['micromark-family'] : null);
        if (fallback) notices.push(fallback);
      }
      records.set(id, {
        id,
        name: pkg.name,
        version: pkg.version,
        license: pkg.license ?? 'UNKNOWN',
        location: relative(root, dir),
        notices,
        evidence: [],
        inputs: [],
        dependencies: [],
      });
    }
    const record = records.get(id);
    if (!record.evidence.some((e) => e.artifact === artifact && e.kind === evidence))
      record.evidence.push({ artifact, kind: evidence });
    if (input && !record.inputs.includes(input)) record.inputs.push(input);
    return record;
  }
  for (const [file, meta] of Object.entries(metafiles)) {
    for (const output of Object.values(meta.outputs)) {
      if (output.imports.length) throw new Error(`External imports remain in ${file}`);
      for (const [input, contribution] of Object.entries(output.inputs)) {
        if (!contribution.bytesInOutput || input === '<stdin>') continue;
        add(packageRoot(resolve(root, input)), file, 'esbuild-bytes-in-output', input);
      }
    }
    artifacts.push({
      file,
      sha256: sha256(readFileSync(join(out, file))),
      provenance: 'esbuild-metafile',
    });
  }
  // A published UMD has no input map. Its locally resolved dependency closure
  // is a conservative audit candidate set, NEVER evidence of embedded versions.
  const visited = new Set();
  function closure(dir) {
    const record = add(
      dir,
      'mermaid.min.js',
      dir === join(root, 'node_modules/mermaid')
        ? 'upstream-package'
        : 'installed-candidate-not-proven-embedded',
    );
    if (visited.has(dir)) return record.id;
    visited.add(dir);
    const pkg = readJson(join(dir, 'package.json'));
    for (const name of Object.keys(pkg.dependencies ?? {}).sort())
      record.dependencies.push(closure(dependencyRoot(name, dir)));
    return record.id;
  }
  closure(dependencyRoot('mermaid', root));
  const mermaid = readFileSync(join(out, 'mermaid.min.js'), 'utf8');
  // These upstream banners provide versions independently of node_modules.
  const embedded = [...mermaid.matchAll(/(?:DOMPurify|js-yaml)\s+\d+\.\d+\.\d+/g)].map(
    ([match]) => {
      const [name, version] = match.split(/\s+/);
      return { name: name === 'DOMPurify' ? 'dompurify' : name, version, evidence: match };
    },
  );
  artifacts.push({
    file: 'mermaid.min.js',
    sha256: sha256(mermaid),
    provenance: 'opaque-upstream-umd',
    embeddedVersions: [...new Map(embedded.map((p) => [`${p.name}@${p.version}`, p])).values()],
  });
  const packages = [...records.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const p of packages) {
    p.inputs.sort();
    p.dependencies.sort();
  }
  const coverage = {
    complete: false,
    limitations: [
      'Mermaid UMD has no source map/SBOM: installed candidates do not establish all embedded packages or versions. Banners only establish the explicitly listed embeddedVersions.',
      'Package inventories do not expand third-party code/data already embedded by upstream packages (including Shiki grammars/themes). Their supplied notices are preserved.',
      'Scope: JavaScript vendors. Fonts and other non-JavaScript assets require a separate inventory.',
    ],
    missingNotices: packages.filter((p) => !p.notices.length).map((p) => p.id),
  };
  const inventory = { schemaVersion: 1, coverage, artifacts, packages };
  writeFileSync(join(out, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
  const notice = [
    'RIKIKI — THIRD-PARTY JAVASCRIPT NOTICES',
    'Distributed with the package, site assets and standalone HTML bundles.',
    'Conservative superset: curated bundles may use only some of these packages.',
    ...coverage.limitations,
    ...packages.map(
      (p) =>
        `\n===== ${p.name}@${p.version} (${p.license}) =====\nEvidence: ${p.evidence.map((e) => e.kind).join(', ')}\n${p.notices.length ? p.notices.map((n) => `Source: ${n.source}\n${n.text}`).join('\n') : 'NOTICE MISSING — release review required'}`,
    ),
    '\n===== Legal banners preserved in upstream Mermaid bundle =====',
    ...(mermaid.match(/\/\*![\s\S]*?\*\//g) ?? []),
  ].join('\n\n');
  writeFileSync(join(out, 'THIRD-PARTY-NOTICES.txt'), `${notice}\n`);
  return inventory;
}

export function verifyInventory(root) {
  const vendor = join(root, 'dist/vendor');
  const inventory = readJson(join(vendor, 'inventory.json'));
  for (const artifact of inventory.artifacts) {
    if (sha256(readFileSync(join(vendor, artifact.file))) !== artifact.sha256)
      throw new Error(`Vendor hash mismatch: ${artifact.file}; rebuild vendors`);
  }
  if (inventory.coverage.missingNotices.length)
    throw new Error(`Missing notices: ${inventory.coverage.missingNotices.join(', ')}`);
  const notices = readFileSync(join(vendor, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  for (const pkg of inventory.packages)
    for (const notice of pkg.notices) {
      if (!notices.includes(notice.text))
        throw new Error(`Notice missing from distribution: ${pkg.id}`);
    }
  return inventory;
}
