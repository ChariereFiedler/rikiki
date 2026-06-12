// ════════════════════════════════════════════════════════════════
// Starter deck template for `rikiki init`. Returns plain deck HTML whose
// refs (tokens.css / themes / dist) resolve against the rikiki package
// root · the inliner then folds everything into one self-contained file.
// ════════════════════════════════════════════════════════════════

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param {object} o
 * @param {string} o.title        deck title (cover + <title>)
 * @param {'rikiki'|'siliceum'} o.theme
 * @param {boolean} o.withMermaid include + preload the mermaid runtime
 * @param {boolean} o.withShiki   include + activate the Shiki highlighter
 */
export function starterHtml({ title = 'My deck', theme = 'rikiki', withMermaid = false, withShiki = false } = {}) {
  const themeHref = theme === 'siliceum' ? 'themes/siliceum.css' : 'tokens.css';

  // Heavy plugins · injected as refs the inliner folds in. mermaid's UMD sets
  // window.mermaid (deck-mermaid then skips its network load); the shiki module
  // exposes the vendored highlighter as a global and activates it.
  const mermaidTag = withMermaid
    ? '<script src="dist/vendor/mermaid.min.js"></script>\n'
    : '';
  const shikiTag = withShiki
    ? `<script type="module">
import { createHighlighter } from './dist/vendor/shiki.js';
globalThis.__rikikiShiki = createHighlighter;
import { installShiki } from './dist/shiki.js';
await installShiki();
</script>\n`
    : '';

  const mermaidSlide = withMermaid
    ? `
  <deck-feature eyebrow="Diagram">
    <h1 slot="title">A <span class="accent">diagram</span></h1>
    <deck-mermaid>graph LR
  Idea --> Draft --> Share</deck-mermaid>
  </deck-feature>
`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${themeHref}">
${mermaidTag}${shikiTag}<script type="module" src="dist/index.js"></script>
</head>
<body>

<deck-root>

  <deck-cover brand="rikiki" speaker="Your name" duration="~10 min" audience="Your audience">
    <h1>${esc(title)} <span class="accent">deck</span></h1>
    <p class="sub">A self-contained, shareable slide deck.</p>
  </deck-cover>

  <deck-feature eyebrow="Start here">
    <h1 slot="title">Edit <span class="accent">this file</span></h1>
    <deck-md>
This whole deck is **one HTML file** with zero external links.

- open it anywhere, offline
- each \`<deck-*>\` element is a slide
- press **?** for keyboard shortcuts
    </deck-md>
  </deck-feature>
${mermaidSlide}
  <deck-takeaway>
    <h1>Ship it</h1>
    <p>One file. No network. Share it.</p>
  </deck-takeaway>

</deck-root>
</body>
</html>
`;
}
