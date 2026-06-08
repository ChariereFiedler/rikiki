// Minify CSS-in-JS · esbuild's --minify doesn't touch template-literal
// contents, so every `css`...`` block ships verbatim with comments and
// whitespace. This esbuild plugin strips comments + collapses whitespace
// inside css` and html` blocks before esbuild ever sees them.
//
// Shared by build.mjs (which disables it in dev mode · sourcemaps wouldn't
// line up otherwise) and build-standalone.mjs.

import { readFileSync } from 'node:fs';

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
            m = m.replace(/\s*([{}:;,])\s*/g, '$1');
            // Drop the final ; before }
            m = m.replace(/;}/g, '}');
          }
          return tag + '`' + m.trim() + '`';
        });
        return { contents: src, loader: 'ts' };
      });
    },
  };
}
