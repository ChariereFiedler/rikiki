import { describe, expect, it } from 'vitest';
import { scanExternal } from './scan-external.mjs';

const refs = (html) => scanExternal(html).map((h) => h.ref);

describe('what a standalone file may still reach for', () => {
  it('finds a relative script src', () => {
    expect(refs('<script src="./app.js"></script>')).toEqual(['./app.js']);
  });

  it('finds a stylesheet link', () => {
    expect(refs('<link rel="stylesheet" href="theme.css">')).toEqual(['theme.css']);
  });

  it('finds a link that is not a stylesheet', () => {
    // Only <link rel=stylesheet> was ever inlined · an icon still fetches.
    expect(refs('<link rel="icon" href="pic.png">')).toEqual(['pic.png']);
  });

  it('finds an unquoted attribute value', () => {
    // The inliner's regexes require quotes, so these survived it silently.
    expect(refs('<img src=pic.png>')).toEqual(['pic.png']);
  });

  it('finds srcset even when src is already a data URI', () => {
    const html = '<img src="data:image/png;base64,AAA" srcset="pic@2x.png 2x">';
    expect(refs(html)).toEqual(['pic@2x.png 2x']);
  });

  it('finds poster on a video', () => {
    expect(refs('<video poster="cover.jpg"></video>')).toEqual(['cover.jpg']);
  });

  it('finds a css url() inside a style block', () => {
    expect(refs('<style>body { background: url(bg.png) }</style>')).toEqual(['bg.png']);
  });

  it('finds an @import in both its url() and string forms', () => {
    expect(refs('<style>@import url("a.css");</style>')).toEqual(['a.css']);
    expect(refs('<style>@import "b.css";</style>')).toEqual(['b.css']);
  });

  it('finds a runtime module URL built from import.meta.url', () => {
    // The mermaid loader builds its vendor path this way · a 404 in a bundle.
    const html = `<script type="module">
      const s = new URL('./vendor/mermaid.min.js', import.meta.url).href;
    </script>`;
    expect(refs(html)).toEqual(['./vendor/mermaid.min.js']);
  });

  it('finds a dynamic import of a relative path', () => {
    expect(refs('<script type="module">await import("./deck-help.js")</script>')).toEqual([
      './deck-help.js',
    ]);
  });

  it('finds an absolute http URL in an attribute', () => {
    expect(refs('<script src="https://cdn.example.com/x.js"></script>')).toEqual([
      'https://cdn.example.com/x.js',
    ]);
  });

  it('finds a Google Fonts import', () => {
    const html = '<style>@import url(https://fonts.googleapis.com/css2?family=Inter);</style>';
    expect(refs(html)).toEqual(['https://fonts.googleapis.com/css2?family=Inter']);
  });
});

describe('what it must not flag', () => {
  it('ignores data: and blob: URIs', () => {
    expect(refs('<img src="data:image/png;base64,AAA">')).toEqual([]);
    expect(refs('<style>src: url(data:font/woff2;base64,AAA)</style>')).toEqual([]);
  });

  it('ignores in-page anchors and fragment references', () => {
    expect(refs('<a href="#next">next</a>')).toEqual([]);
    expect(refs('<use href="#icon"/>')).toEqual([]);
  });

  it('ignores a plain user-facing link', () => {
    // A link the reader may click is not a runtime dependency · only resources
    // the page loads by itself count.
    expect(refs('<a href="https://example.com">docs</a>')).toEqual([]);
  });

  it('does not mistake minified JS string content for markup', () => {
    // marked's own source contains `href:n.href` and "http://" fragments · a
    // naive whole-file regex reports these on every clean bundle.
    const html = `<script type="module">
      let t={href:n.href,title:n.title};return"http://"+t[0];
      const x = 'src=pic.png inside a string';
    </script>`;
    expect(refs(html)).toEqual([]);
  });

  it('reports nothing for a file that reaches for nothing', () => {
    const html = '<html><body><deck-root><deck-cover></deck-cover></deck-root></body></html>';
    expect(scanExternal(html)).toEqual([]);
  });
});

describe('the report a caller can act on', () => {
  it('labels each hit with the construct that produced it', () => {
    const hits = scanExternal('<link rel="icon" href="pic.png">');
    expect(hits[0]).toMatchObject({ kind: 'attribute', ref: 'pic.png' });
  });

  it('deduplicates repeated references', () => {
    const html = '<img src="a.png"><img src="a.png">';
    expect(refs(html)).toEqual(['a.png']);
  });
});

describe('regressions from real vendored bundles', () => {
  it('does not read a library error message as an import statement', () => {
    // shiki ships this literal string · the first scanner reported it as a bare
    // specifier and failed an otherwise self-contained bundle.
    const html =
      '<script type="module">' +
      'function L0(t){return Ue("import `createOnigurumaEngine` from `@shikijs/engine-oniguruma` or `shiki/engine/oniguruma` instead")}' +
      '</script>';
    expect(scanExternal(html)).toEqual([]);
  });

  it('still finds a genuine static import at the start of a statement', () => {
    const html = `<script type="module">
import { x } from './real.js';
</script>`;
    expect(scanExternal(html).map((h) => h.ref)).toEqual(['./real.js']);
  });

  it('still finds a static import that follows a semicolon on one line', () => {
    const html = `<script type="module">const a=1;import b from "./b.js";</script>`;
    expect(scanExternal(html).map((h) => h.ref)).toEqual(['./b.js']);
  });
});

describe('code bodies are code, not markup', () => {
  it('ignores a link tag quoted inside a CSS comment', () => {
    // tokens.css documents an alternative theme this way · reported as a
    // dangling stylesheet on every standalone build.
    const html =
      '<style>/* import a theme instead:\n' +
      '   <link rel="stylesheet" href="rikiki/themes/siliceum.css">\n' +
      '*/\nbody { margin: 0 }</style>';
    expect(scanExternal(html)).toEqual([]);
  });

  it('ignores a commented-out @import', () => {
    expect(scanExternal('<style>/* @import "old.css"; */</style>')).toEqual([]);
  });

  it('ignores markup quoted inside a script body', () => {
    const html = `<script type="module">const tpl = '<img src="pic.png">';</script>`;
    expect(scanExternal(html)).toEqual([]);
  });

  it('still finds a live rule next to a commented-out one', () => {
    const html = '<style>/* @import "old.css"; */ @import "new.css";</style>';
    expect(scanExternal(html).map((h) => h.ref)).toEqual(['new.css']);
  });
});
