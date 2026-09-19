// ════════════════════════════════════════════════════════════════
// Minimal livereload · polls Last-Modified on deck files
// Enable either way:
//   · add ?live to the deck URL (index.js lazy-imports this module), or
//   · load this module directly: <script type="module" src="…/dist/livereload.js">
// It auto-starts on import (the IIFE at the bottom) and reloads the page when
// any watched file changes, keeping the current slide via the hash.
// ════════════════════════════════════════════════════════════════

// Paths are resolved relative to this module · works no matter where the deck is served.
const here = (rel: string): string => new URL(rel, import.meta.url).href;

// Watch the deck's actual theme stylesheet(s) wherever they live · the old
// hardcoded here('./tokens.css') assumed the theme sat next to this module in
// dist/, which 404s (the theme lives at the package root, not in dist/).
const sameOrigin = (href: string): boolean => {
  try {
    return new URL(href, location.href).origin === location.origin;
  } catch {
    return false;
  }
};
const themeHrefs = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
  .map((l) => l.href)
  .filter(sameOrigin); // skip cross-origin (CDN fonts) · HEAD would CORS-error every poll

const FILES = [
  ...themeHrefs,
  here('./index.js'),
  here('./deck-root.js'),
  here('./deck-cover.js'),
  here('./deck-section.js'),
  here('./deck-feature.js'),
  here('./deck-split.js'),
  here('./deck-feature-cards.js'),
  here('./deck-takeaway.js'),
  here('./deck-md.js'),
  here('./deck-code.js'),
  here('./deck-callout.js'),
  here('./deck-card.js'),
  here('./deck-mermaid.js'),
  here('./shared-styles.js'),
  here('./deck-stack.js'),
  here('./deck-grid.js'),
  here('./deck-punch.js'),
  location.pathname, // the HTML itself
];

const state = new Map<string, string>();

interface Toast extends HTMLDivElement {
  _t?: ReturnType<typeof setTimeout>;
}
let toast: Toast | undefined;

function showToast(text: string, color: string = '#0a0a0a'): void {
  if (!toast) {
    toast = document.createElement('div') as Toast;
    toast.style.cssText = `position:fixed;bottom:12px;left:12px;z-index:9999;padding:6px 12px;background:${color};color:#F7CB44;font:600 11px/1.4 monospace;border-radius:6px;letter-spacing:.08em;text-transform:uppercase;opacity:0;transition:opacity .2s;pointer-events:none;border:1px solid #F7CB44`;
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  if (toast._t) clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    if (toast) toast.style.opacity = '0';
  }, 1500);
}

async function check(url: string): Promise<boolean> {
  try {
    const r = await fetch(`${url}?_lr=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    const tag =
      r.headers.get('last-modified') ?? r.headers.get('etag') ?? r.headers.get('content-length');
    if (!tag) return false;
    const prev = state.get(url);
    state.set(url, tag);
    return prev !== undefined && prev !== tag;
  } catch {
    return false;
  }
}

async function loop(): Promise<void> {
  while (true) {
    for (const f of FILES) {
      if (await check(f)) {
        showToast(`reload · ${f.split('/').pop()}`);
        await new Promise<void>((r) => setTimeout(r, 150));
        // Keep the current hash so we land on the same slide after reload.
        location.reload();
        return;
      }
    }
    await new Promise<void>((r) => setTimeout(r, 800));
  }
}

// Init: take a snapshot, then loop.
void (async () => {
  await Promise.all(FILES.map(check));
  showToast('livereload on');
  void loop();
})();
