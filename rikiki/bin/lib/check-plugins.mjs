import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export const CHECK_API_VERSION = 1;
const failure = (plugin, code, message) => ({ plugin, code, severity: 'error', message });

export function findCheckConfig(deckPath, explicit) {
  if (explicit) return resolve(explicit);
  let dir = dirname(resolve(deckPath));
  for (;;) {
    const file = join(dir, 'rikiki.config.json');
    if (existsSync(file)) return file;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Data only: no dependency's Node entry point is evaluated. */
export function resolveCheckPlugins(deckPath, { config, plugins = [], noPlugins = false } = {}) {
  const result = { plugins: [], diagnostics: [], notChecked: [], config: {} };
  if (noPlugins) { result.notChecked.push('plugin checks · explicitly disabled'); return result; }
  let file;
  try {
    file = findCheckConfig(deckPath, config);
    result.config = file ? JSON.parse(readFileSync(file, 'utf8')) : {};
    if (!result.config || typeof result.config !== 'object' || Array.isArray(result.config)
      || (result.config.plugins !== undefined && !Array.isArray(result.config.plugins))) throw new Error('plugins must be an array');
  } catch (error) {
    result.diagnostics.push(failure('rikiki', 'CHECK_CONFIG_INVALID', `Cannot load check configuration: ${error.message}`));
    result.notChecked.push('plugin checks · invalid configuration');
    return result;
  }
  const base = file ? dirname(file) : dirname(resolve(deckPath));
  const require = createRequire(pathToFileURL(join(base, 'package.json')));
  const seen = new Map();
  const namespaces = new Set();
  for (const entry of [...(result.config.plugins ?? []), ...plugins]) {
    const spec = typeof entry === 'string' ? { package: entry } : entry;
    let id = spec?.package ?? spec?.manifest ?? 'unknown';
    try {
      if (!spec || typeof spec !== 'object') throw new Error('expected a package name or a plugin descriptor');
      const manifestPath = spec.manifest
        ? resolve(base, spec.manifest)
        : require.resolve(`${spec.package}/rikiki.module.json`);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      id = manifest.id;
      if (manifest.schemaVersion !== 1 || typeof id !== 'string' || !/^[a-zA-Z0-9@/._-]+$/.test(id)
        || typeof manifest.version !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(manifest.namespace ?? '')
        || manifest.checks?.apiVersion !== CHECK_API_VERSION) throw new Error('unsupported module schema or check API');
      const profile = spec.profile ?? 'recommended';
      if (!manifest.checks.profiles?.includes(profile)) throw new Error(`unknown profile: ${profile}`);
      const entryPath = manifest.checks.entry;
      if (typeof entryPath !== 'string' || isAbsolute(entryPath)) throw new Error('checks.entry must be package-relative');
      const root = realpathSync(dirname(manifestPath));
      const script = realpathSync(resolve(root, entryPath));
      const rel = relative(root, script);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('checks.entry escapes the module directory');
      const identity = JSON.stringify([realpathSync(manifestPath), manifest.version, profile]);
      if (seen.has(id)) {
        if (seen.get(id) !== identity) throw new Error(`conflicting versions or profiles of ${id}`);
        continue;
      }
      if (namespaces.has(manifest.namespace)) throw new Error(`duplicate namespace ${manifest.namespace}`);
      seen.set(id, identity);
      namespaces.add(manifest.namespace);
      const skills = (manifest.skills ?? []).map(skill => {
        if (!skill || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name) || typeof skill.path !== 'string') throw new Error('invalid skill descriptor');
        const src = realpathSync(resolve(root, skill.path));
        const rel = relative(root, src);
        if (rel.startsWith('..') || isAbsolute(rel) || !existsSync(join(src, 'SKILL.md'))) throw new Error('invalid skill path');
        return { name: skill.name, src };
      });
      result.plugins.push({ id, version: manifest.version, namespace: manifest.namespace, apiVersion: CHECK_API_VERSION,
        profile, script, skills, status: 'pending', rules: [], executed: [] });
    } catch (error) {
      result.diagnostics.push(failure(String(id), 'CHECK_PLUGIN_LOAD_FAILED', `Cannot load ${id}: ${error.message}`));
      result.notChecked.push(`plugin ${id} · loading failed`);
    }
  }
  if (!result.plugins.length && !result.diagnostics.length) result.notChecked.push('plugin checks · no plugin configured');
  return result;
}

/** Serialized into the browser. This registry has no imports or component side effects. */
export function installCheckBridge() {
  const registered = new Map();
  const key = Symbol.for('rikiki.checks.v1');
  const query = (root, selector, shadow = false) => {
    const found = [...root.querySelectorAll(selector)];
    if (root.matches?.(selector)) found.unshift(root);
    if (shadow) for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) found.push(...query(el.shadowRoot, selector, true));
    }
    return [...new Set(found)];
  };
  const pathOf = (element) => {
    const parts = [];
    for (let el = element; el && el !== document.body;) {
      const tag = el.localName;
      if (!tag) break;
      const siblings = el.parentElement ? [...el.parentElement.children].filter(n => n.localName === tag) : [];
      parts.unshift(el.id ? `${tag}#${CSS.escape(el.id)}` : `${tag}:nth-of-type(${Math.max(1, siblings.indexOf(el) + 1)})`);
      const host = el.getRootNode().host;
      if (!el.parentElement && host) { parts.unshift('::shadow'); el = host; }
      else el = el.parentElement;
    }
    return parts.join(' > ');
  };
  const api = {
    define(plugin) {
      if (plugin.apiVersion !== 1 || !plugin.id || !plugin.version || !Array.isArray(plugin.rules)) throw new Error('Invalid CheckPlugin');
      if (registered.has(plugin.id)) throw new Error(`Duplicate CheckPlugin: ${plugin.id}`);
      const codes = new Set();
      for (const rule of plugin.rules) {
        if (!/^[A-Z][A-Z0-9_]+$/.test(rule.code) || codes.has(rule.code) || typeof rule.run !== 'function'
          || !['document', 'slide', 'state'].includes(rule.scope) || !['error', 'warning'].includes(rule.severity)) throw new Error('Invalid or duplicate check rule');
        codes.add(rule.code);
      }
      registered.set(plugin.id, plugin);
    },
    describe(id) {
      const p = registered.get(id);
      return p ? { id: p.id, version: p.version, apiVersion: p.apiVersion,
        rules: p.rules.map(({ code, scope, severity, profiles }) => ({ code, scope, severity, profiles })) } : null;
    },
    async run({ id, profile, slide, state, documentPass }) {
      const plugin = registered.get(id);
      const root = document.querySelector('deck-root');
      const slides = root ? [...root.children].filter(e => e.localName.startsWith('deck-') && e.localName !== 'deck-root') : [];
      const active = slides[slide - 1];
      const out = [], executed = [], failures = [];
      for (const rule of plugin.rules) {
        if (rule.profiles && !rule.profiles.includes(profile)) continue;
        if (rule.scope === 'document' ? !documentPass : rule.scope === 'slide' ? state !== 0 || !active : !active) continue;
        const scope = rule.scope === 'document' ? root ?? document : active;
        try {
          for (const el of query(scope, '*', true)) if (el.updateComplete) await el.updateComplete;
          await rule.run({ slide, state, profile,
            query: (selector, options = {}) => query(scope, selector, options.shadow ?? false),
            report: (finding) => {
              if (!finding || typeof finding.message !== 'string' || !finding.message.trim()
                || (finding.key !== undefined && typeof finding.key !== 'string')
                || (finding.suggestion !== undefined && typeof finding.suggestion !== 'string')
                || (finding.element !== undefined && !(finding.element instanceof Element))) throw new Error('Invalid diagnostic');
              const el = finding.element;
              const owner = el ? slides.findIndex(s => s === el || s.contains(el) || query(s, '*', true).includes(el)) : -1;
              const measurement = finding.measurement === undefined ? undefined : JSON.parse(JSON.stringify(finding.measurement));
              out.push({ code: rule.code, severity: rule.severity, message: finding.message, suggestion: finding.suggestion,
                element: el ? pathOf(el) : undefined, key: finding.key,
                slide: owner >= 0 ? owner + 1 : rule.scope !== 'document' ? slide : undefined,
                state: rule.scope === 'document' ? undefined : state, measurement });
            },
          });
          executed.push(rule.code);
        } catch (error) { failures.push({ code: rule.code, message: String(error?.message ?? error) }); }
      }
      return { diagnostics: out, executed, failures };
    },
  };
  Object.defineProperty(globalThis, key, { value: api, configurable: true });
}

/** A Node timer closes the page even when synchronous plugin code blocks its JS thread. */
async function bounded(page, operation, timeoutMs) {
  let timer;
  try {
    return await Promise.race([operation(), new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Check plugin execution timed out'));
        void page.close({ runBeforeUnload: false }).catch(() => {});
      }, timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

export async function startCheckPlugins(page, resolution, timeoutMs = 5000) {
  if (!resolution.plugins.length) return;
  await page.evaluate(installCheckBridge);
  for (const plugin of resolution.plugins) {
    try {
      await bounded(page, () => page.addScriptTag({ content: readFileSync(plugin.script, 'utf8') }), timeoutMs);
      const described = await bounded(page, () => page.evaluate(id => globalThis[Symbol.for('rikiki.checks.v1')].describe(id), plugin.id), timeoutMs);
      if (!described || described.version !== plugin.version || described.apiVersion !== CHECK_API_VERSION
        || described.rules.some(r => !r.code.startsWith(plugin.namespace + '_'))) throw new Error('Registration does not match the manifest');
      plugin.rules = described.rules.filter(r => !r.profiles || r.profiles.includes(plugin.profile));
      plugin.status = 'loaded';
    } catch (error) {
      plugin.status = 'failed';
      resolution.diagnostics.push(failure(plugin.id, 'CHECK_PLUGIN_LOAD_FAILED', error.message));
      resolution.notChecked.push(`plugin ${plugin.id} · registration failed`);
    }
  }
}

export async function runCheckPlugins(page, resolution, { slide, state, documentPass }, timeoutMs = 5000) {
  const diagnostics = [];
  for (const plugin of resolution.plugins.filter(p => p.status === 'loaded')) {
    try {
      const result = await bounded(page, () => page.evaluate(args => globalThis[Symbol.for('rikiki.checks.v1')].run(args),
        { id: plugin.id, profile: plugin.profile, slide, state, documentPass }), timeoutMs);
      if (!result || !Array.isArray(result.diagnostics) || !Array.isArray(result.failures) || !Array.isArray(result.executed)) throw new Error('Invalid plugin result');
      for (const d of result.diagnostics) {
        const rule = plugin.rules.find(r => r.code === d.code);
        if (!rule || d.severity !== rule.severity || typeof d.message !== 'string') throw new Error('Invalid plugin diagnostic');
        diagnostics.push({ ...d, plugin: plugin.id });
      }
      plugin.executed = [...new Set([...plugin.executed, ...result.executed])];
      for (const err of result.failures) diagnostics.push(failure(plugin.id, 'CHECK_RULE_FAILED', `${err.code}: ${err.message}`));
      if (result.failures.length) {
        plugin.status = 'failed';
        resolution.notChecked.push(`plugin ${plugin.id} · rule execution failed`);
      }
    } catch (error) {
      plugin.status = 'failed';
      diagnostics.push(failure(plugin.id, 'CHECK_PLUGIN_FAILED', error.message));
      resolution.notChecked.push(`plugin ${plugin.id} · execution incomplete`);
    }
  }
  return diagnostics;
}

export function pluginReport(resolution) {
  return resolution.plugins.map(({ script, skills, ...plugin }) => ({ ...plugin,
    status: plugin.status === 'loaded' ? 'completed' : plugin.status }));
}
