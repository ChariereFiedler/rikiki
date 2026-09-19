// ════════════════════════════════════════════════════════════════
// Optional Shiki highlighter for <deck-code> · NOT in the core bundle.
//
// Usage in a deck:
//   <script type="module">
//     import { installShiki } from './rikiki/dist/shiki.js';
//     await installShiki({ theme: 'one-dark-pro', langs: ['ts', 'js', 'html', 'css'] });
//   </script>
//
// After install, all <deck-code> instances re-render through Shiki,
// loaded from the vendored dist/vendor/shiki.js at first use (offline · no
// CDN). The default regex highlighter remains the fallback when the language
// isn't loaded.
//
// Integration · this registers a highlighter through deck-code's public
// setDeckCodeHighlighter() hook rather than monkey-patching the component's
// private render path · the hook owns the markup and may decline (return null)
// to fall back to the built-in regex highlighter.
//
// The vendored bundle contains the JS engine, one-dark-pro and the five default
// grammars only. The explicit set prevents Shiki's complete catalogues from
// entering the offline artifact.
// ════════════════════════════════════════════════════════════════

import { setDeckCodeHighlighter } from './deck-code-highlighter.js';

interface InstallOpts {
  /** Bundled theme · currently 'one-dark-pro'. */
  theme?: string;
  /** Bundled languages · ts, js, html, css and json (long aliases accepted). */
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

export async function installShiki(opts: InstallOpts = {}): Promise<void> {
  const resolved: Required<InstallOpts> = {
    theme: opts.theme ?? 'one-dark-pro',
    langs: opts.langs ?? ['ts', 'js', 'html', 'css', 'json'],
  };
  theme = resolved.theme;
  const hl = await loadHighlighter(resolved);

  // Register the Shiki highlighter through deck-code's public hook · it reaches
  // the shared <deck-code> class via customElements.get (no value import that
  // would double-define the element) and re-highlights existing instances. The
  // highlighter owns the block markup, or returns null when the language isn't
  // loaded so the built-in regex highlighter takes over.
  setDeckCodeHighlighter((code, lang) => {
    try {
      const out = hl.codeToHtml(code, { lang: lang || 'txt', theme });
      // Shiki emits a <pre><code> wrapper; we already wrap in our render
      // template · extract just the inner content. Keep Shiki's inline token
      // colors verbatim: its default HTML colors each token with an inline
      // `style="color:…"` and carries NO scope class, so stripping the styles
      // would leave every token unclassed and unstyled (monochrome). The deck's
      // `--deck-code-syntax-*` tokens only drive the built-in highlighter; under
      // Shiki, the chosen `theme` owns the palette. The `class="line"` wrappers
      // survive, so per-line step dimming still works.
      return out.replace(/^<pre[^>]*><code[^>]*>/, '').replace(/<\/code><\/pre>$/, '');
    } catch {
      return null; // lang not loaded · fall back to the regex highlighter
    }
  });
}
