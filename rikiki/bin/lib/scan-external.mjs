// ════════════════════════════════════════════════════════════════
// scanExternal · everything a supposedly self-contained deck could still
// fetch at runtime.
//
// The previous check only matched absolute URLs from a hardcoded domain list,
// so a bundle that reached for `./vendor/mermaid.min.js` reported success and
// rendered an empty diagram offline. This one works the other way round: it
// finds every reference the page can load by itself, then subtracts the ones
// that are genuinely inert (data:, blob:, in-page fragments, user-facing links).
//
// Scripts are scanned separately and narrowly · minified JS is full of strings
// that look like markup (`href:n.href`, `"http://"`), and a whole-file regex
// reports those on every clean bundle.
// ════════════════════════════════════════════════════════════════

/** Attributes through which an element loads something on its own. */
const LOADING_ATTRS = ['src', 'srcset', 'poster', 'href'];

/** `href` only loads for these elements · on `<a>` and `<use>` it is navigation. */
const HREF_LOADS_ON = /^(?:link|image|script|iframe|embed|track|source)$/i;

const isInert = (ref) =>
  !ref ||
  ref.startsWith('data:') ||
  ref.startsWith('blob:') ||
  ref.startsWith('#') ||
  ref.startsWith('mailto:') ||
  ref.startsWith('tel:') ||
  ref.startsWith('javascript:');

/** Keep every opening tag, drop the text inside <script> and <style>.
 *  Their bodies are code, not markup · a `<link …>` quoted in a CSS comment or
 *  a JS string is documentation, not a resource the page loads. */
function stripCodeBodies(html) {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m, tag) => {
    const open = m.match(new RegExp(`<${tag}\\b[^>]*>`, 'i'));
    return open ? `${open[0]}</${tag}>` : '';
  });
}

function scriptBodies(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

function styleBodies(html) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}

function scanTags(html, out) {
  for (const tag of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const name = tag[1];
    const attrs = tag[2] ?? '';
    for (const attr of LOADING_ATTRS) {
      // Quoted first, then unquoted · the inliner only ever handled quoted
      // values, which is how an unquoted src survived it.
      const re = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'gi');
      for (const m of attrs.matchAll(re)) {
        const ref = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        if (isInert(ref)) continue;
        if (attr === 'href' && !HREF_LOADS_ON.test(name)) continue;
        out.push({ kind: 'attribute', element: name.toLowerCase(), attr, ref });
      }
    }
  }
}

function scanCss(rawCss, out) {
  // A commented-out rule is not a dependency · tokens.css documents an
  // alternative <link> inside its header comment.
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?["']?([^;"')]+)/g)) {
    const ref = m[1].trim();
    if (!isInert(ref)) out.push({ kind: 'css-import', ref });
  }
  // url() outside an @import · @import matches are removed first so a single
  // reference is not reported twice.
  const withoutImports = css.replace(/@import[^;]*;?/g, '');
  for (const m of withoutImports.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/g)) {
    const ref = m[1].trim();
    if (!isInert(ref)) out.push({ kind: 'css-url', ref });
  }
}

function scanScript(js, out) {
  // Only constructs that actually fetch · a bare string in minified code does not.
  for (const m of js.matchAll(/new URL\(\s*["'`]([^"'`]+)["'`]\s*,\s*import\.meta\.url/g)) {
    if (!isInert(m[1])) out.push({ kind: 'module-url', ref: m[1] });
  }
  for (const m of js.matchAll(/\bimport\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) {
    if (!isInert(m[1])) out.push({ kind: 'dynamic-import', ref: m[1] });
  }
  // A static import specifier is never a template literal, and the statement
  // starts a line or follows a `;`/`}` · without both constraints, prose inside
  // a library's own error message ("import `x` from `y`") reads as an import.
  for (const m of js.matchAll(/(?:^|[;}])\s*import\s+[^;'"`]*?from\s*["']([^"']+)["']/gm)) {
    if (!isInert(m[1])) out.push({ kind: 'static-import', ref: m[1] });
  }
  for (const m of js.matchAll(/importScripts\(\s*["'`]([^"'`]+)["'`]/g)) {
    if (!isInert(m[1])) out.push({ kind: 'worker-import', ref: m[1] });
  }
}

/** Every runtime reference that would leave the file, deduplicated by ref.
 *  An empty array is the only proof that a bundle is self-contained. */
export function scanExternal(html) {
  const out = [];
  const markup = stripCodeBodies(html);
  scanTags(markup, out);
  // Style bodies come from the ORIGINAL html · markup has had them emptied.
  for (const css of styleBodies(html)) scanCss(css, out);
  for (const js of scriptBodies(html)) scanScript(js, out);
  // Inline style="" attributes can carry url() too.
  for (const m of markup.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) scanCss(m[1], out);

  const seen = new Set();
  return out.filter((hit) => {
    if (seen.has(hit.ref)) return false;
    seen.add(hit.ref);
    return true;
  });
}

/** One line per hit, ready to print. */
export function formatExternal(hits) {
  return hits.map((h) => `    · [${h.kind}] ${h.ref}`).join('\n');
}
