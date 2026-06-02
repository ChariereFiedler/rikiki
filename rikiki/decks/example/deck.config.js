export default {
  title: 'Multi-deck example',
  // Output sits in decks/example/, so rikiki lives three levels up.
  theme: '../../tokens.css',
  bundle: '../../dist/index.js',
  transition: 'slide',
  slides: [
    'parts/cover.html',
    'parts/intro.md',
    'parts/closing.html',
  ],
};
