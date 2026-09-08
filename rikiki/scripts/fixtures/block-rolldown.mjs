// Makes `import('rolldown')` fail the way it does on a fresh install, so the
// CLI's missing-peer path can be exercised from a repo that has rolldown.
// Used through NODE_OPTIONS=--import by scripts/init-source.test.mjs.
import { register } from 'node:module';

register('./block-rolldown-hooks.mjs', import.meta.url);
