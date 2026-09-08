// ════════════════════════════════════════════════════════════════
// Starter deck template for `rikiki init`. Returns plain deck HTML.
//
// `assetBase` decides which of the two shapes it takes:
//   ''         · refs resolve against the rikiki package root · the inliner
//                then folds everything into one self-contained file.
//   'rikiki/'  · refs point at the runtime copied next to the deck · the file
//                stays a readable source you serve over HTTP and keep editing.
// Both are bundle-able: the inliner maps a `rikiki/…` ref back to the package.
// ════════════════════════════════════════════════════════════════

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param {object} o
 * @param {string} o.title        deck title (cover + <title>)
 * @param {'rikiki'|'siliceum'} o.theme
 * @param {boolean} o.withMermaid include + preload the mermaid runtime
 * @param {boolean} o.withShiki   include + activate the Shiki highlighter
 * @param {string}  o.assetBase   prefix every asset ref ('' or 'rikiki/')
 */
export function starterHtml({ title = 'My deck', theme = 'rikiki', withMermaid = false, withShiki = false, assetBase = '' } = {}) {
  const asset = (path) => assetBase + path;
  const themeHref = asset(theme === 'siliceum' ? 'themes/siliceum.css' : 'tokens.css');

  // Heavy plugins · injected as refs the inliner folds in. mermaid's UMD sets
  // window.mermaid (deck-mermaid then skips its network load); the shiki module
  // exposes the vendored highlighter as a global and activates it.
  const mermaidTag = withMermaid
    ? `<script src="${asset('dist/vendor/mermaid.min.js')}"></script>\n`
    : '';
  const shikiTag = withShiki
    ? `<script type="module">
import { createHighlighter } from './${asset('dist/vendor/shiki.js')}';
globalThis.__rikikiShiki = createHighlighter;
import { installShiki } from './${asset('dist/shiki.js')}';
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
${mermaidTag}${shikiTag}<script type="module" src="${asset('dist/index.js')}"></script>
</head>
<body>

<deck-root>

  <deck-cover brand="rikiki" speaker="Your name" duration="~10 min" audience="Your audience">
    <h1>${esc(title)} <span class="accent">deck</span></h1>
    <p class="sub">${assetBase ? 'An editable deck · one HTML file you own.' : 'A self-contained, shareable slide deck.'}</p>
  </deck-cover>

  <deck-feature eyebrow="Start here">
    <h1 slot="title">Edit <span class="accent">this file</span></h1>
    <deck-md>
${assetBase
  ? `This deck is **plain HTML** you edit by hand.

- each \`<deck-*>\` element is a slide
- the runtime sits in \`${assetBase.replace(/\/$/, '')}/\` next to this file
- serve the folder over HTTP, then \`rikiki bundle\` it to share one file`
  : `This whole deck is **one HTML file** with zero external links.

- open it anywhere, offline
- each \`<deck-*>\` element is a slide
- press **?** for keyboard shortcuts`}
    </deck-md>
  </deck-feature>
${mermaidSlide}
  <deck-takeaway>
    <h1>Ship it</h1>
    <p>${assetBase ? 'Write, check, bundle, share.' : 'One file. No network. Share it.'}</p>
  </deck-takeaway>

</deck-root>
</body>
</html>
`;
}
