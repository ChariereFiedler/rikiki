// ════════════════════════════════════════════════════════════════
// Optional Shiki highlighter for <deck-code> · NOT in the core bundle.
//
// Usage in a deck:
//   <script type="module">
//     import { installShiki } from './rikiki/dist/shiki-plugin.js';
//     await installShiki({ theme: 'one-dark-pro', langs: ['ts', 'tsx', 'html', 'css'] });
//   </script>
//
// After install, all <deck-code> instances re-render through Shiki,
// loaded from the vendored dist/vendor/shiki.js at first use (offline · no
// CDN). The default regex highlighter remains the fallback when the language
// isn't loaded.
//
// Trade-off: the vendored Shiki bundle is large (every grammar + theme, JS
// engine, no wasm). That's why this is opt-in and lazy · the core stays small.
// ════════════════════════════════════════════════════════════════

interface InstallOpts {
  /** Shiki theme name (https://shiki.style/themes) · default 'one-dark-pro'. */
  theme?: string;
  /** Languages to preload · default ['ts', 'js', 'html', 'css', 'json']. */
  langs?: string[];
}

interface ShikiHighlighter {
  codeToHtml(code: string, opts: { lang: string; theme: string }): string;
  loadLanguage?: (lang: string) => Promise<void>;
}

let highlighter: ShikiHighlighter | null = null;
let theme = 'one-dark-pro';

async function loadHighlighter(opts: Required<InstallOpts>): Promise<ShikiHighlighter> {
  if (highlighter) return highlighter;
  // Prefer a pre-injected highlighter factory · single-file bundles (rikiki
  // init/bundle --with-shiki) inline the vendored Shiki and expose it as
  // globalThis.__rikikiShiki so there's no module URL to fetch. Otherwise load
  // the vendored bundle (JS regex engine, no wasm) next to this module.
  const injected = (
    globalThis as unknown as {
      __rikikiShiki?: (o: unknown) => Promise<ShikiHighlighter>;
    }
  ).__rikikiShiki;
  const createHighlighter =
    injected ??
    (await import(/* @vite-ignore */ new URL('./vendor/shiki.js', import.meta.url).href))
      .createHighlighter;
  highlighter = await createHighlighter({
    themes: [opts.theme],
    langs: opts.langs,
  });
  return highlighter!;
}

/** Strip the inline color styles Shiki bakes into every span so our component
 *  tokens (`--deck-code-syntax-*`) still drive the colors. Returns the original
 *  HTML when the user wants Shiki's exact theme. */
function stripInlineColors(html: string): string {
  return html.replace(/ style="[^"]*"/g, '');
}

export async function installShiki(opts: InstallOpts = {}): Promise<void> {
  const resolved: Required<InstallOpts> = {
    theme: opts.theme ?? 'one-dark-pro',
    langs: opts.langs ?? ['ts', 'js', 'html', 'css', 'json'],
  };
  theme = resolved.theme;
  const hl = await loadHighlighter(resolved);

  // Patch DeckCode's render path: replace its internal _highlight() with one
  // that goes through Shiki. We do this on the prototype so every existing
  // and future instance picks it up.
  const ctor = customElements.get('deck-code') as
    | (typeof HTMLElement & { prototype: any })
    | undefined;
  if (!ctor) {
    console.warn('[rikiki/shiki] <deck-code> is not defined yet · import rikiki first');
    return;
  }
  const proto = ctor.prototype;

  // Cache the original so we can fall back when a lang isn't loaded.
  const original = proto._highlight;
  proto._highlight = function () {
    const self = this as unknown as { textContent: string | null; lang: string; _html: string };
    const raw = self.textContent ?? '';
    try {
      const out = hl.codeToHtml(raw, { lang: self.lang || 'txt', theme });
      // Shiki emits a <pre><code> wrapper; we already wrap in our render template.
      // Extract just the inner spans + keep the syntax classes for theming.
      const inner = out.replace(/^<pre[^>]*><code[^>]*>/, '').replace(/<\/code><\/pre>$/, '');
      self._html = stripInlineColors(inner);
    } catch {
      // Lang not loaded · fall back to the regex highlighter
      original.call(this);
    }
  };

  // Re-render all existing <deck-code> instances now that the highlighter changed.
  document
    .querySelectorAll<HTMLElement & { _highlight?: () => void; requestUpdate?: () => void }>(
      'deck-code',
    )
    .forEach((el) => {
      el._highlight?.();
      el.requestUpdate?.();
    });
}
