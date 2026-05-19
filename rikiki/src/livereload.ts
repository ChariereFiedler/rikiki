// ════════════════════════════════════════════════════════════════
// Livereload minimal · poll Last-Modified sur les fichiers du deck
// Activer en ajoutant ?live à l'URL, ou en chargeant ce module direct.
// ════════════════════════════════════════════════════════════════

// Résout les chemins relativement à ce module : marche peu importe où le deck est servi.
const here = (rel) => new URL(rel, import.meta.url).href;

const FILES = [
  here('./tokens.css'),
  here('./index.js'),
  here('./deck-root.js'),
  here('./deck-cover.js'),
  here('./deck-section.js'),
  here('./deck-hero.js'),
  here('./deck-split.js'),
  here('./deck-hero-detail.js'),
  here('./deck-hook.js'),
  here('./deck-md.js'),
  here('./deck-code.js'),
  here('./deck-callout.js'),
  here('./deck-card.js'),
  here('./deck-mermaid.js'),
  here('./shared-styles.js'),
  here('./deck-stack.js'),
  here('./deck-grid.js'),
  here('./deck-punch.js'),
  location.pathname,            // le HTML lui-même
];

const state = new Map();
let toast;

function showToast(text, color = '#0a0a0a') {
  if (!toast) {
    toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:12px;left:12px;z-index:9999;padding:6px 12px;background:${color};color:#F7CB44;font:600 11px/1.4 monospace;border-radius:6px;letter-spacing:.08em;text-transform:uppercase;opacity:0;transition:opacity .2s;pointer-events:none;border:1px solid #F7CB44`;
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.opacity = '0'), 1500);
}

async function check(url) {
  try {
    const r = await fetch(url + '?_lr=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
    const tag = r.headers.get('last-modified') || r.headers.get('etag') || r.headers.get('content-length');
    if (!tag) return false;
    const prev = state.get(url);
    state.set(url, tag);
    return prev !== undefined && prev !== tag;
  } catch {
    return false;
  }
}

async function loop() {
  while (true) {
    for (const f of FILES) {
      if (await check(f)) {
        showToast(`reload · ${f.split('/').pop()}`);
        await new Promise(r => setTimeout(r, 150));
        // Préserve hash courant pour rester sur la même slide
        location.reload();
        return;
      }
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

// Init : snapshot initial puis loop
(async () => {
  await Promise.all(FILES.map(check));
  showToast('livereload on');
  loop();
})();
