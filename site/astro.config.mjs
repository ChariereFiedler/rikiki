import { defineConfig } from 'astro/config';

// Rikiki landing site · pure static, no integrations needed.
// The Rikiki web components are loaded at runtime from the sibling rikiki/
// package via plain <script type="module">.
export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://rikiki.tordu-jardin.fr',
  base: '/',
  trailingSlash: 'ignore',
  outDir: './dist',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    server: {
      // Allow serving files from the sibling rikiki/ package during `astro dev`.
      fs: { allow: ['..'] },
    },
  },
});
