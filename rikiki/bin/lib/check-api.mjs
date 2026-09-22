/** Register only while `rikiki check` has installed its browser bridge. */
export function defineChecks(plugin) {
  const bridge = globalThis[Symbol.for('rikiki.checks.v1')];
  if (!bridge) throw new Error('CheckPlugin must be loaded by rikiki check (API 1)');
  bridge.define(plugin);
}
