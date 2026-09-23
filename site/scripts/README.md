# Landing readability oracle

With the local site running, use Node 22.12 or newer:

```sh
npm run check:readability
# Or target another preview:
npm run check:readability -- http://127.0.0.1:7804/
```

This uses Playwright Chromium and Firefox at widths 390, 768, 1440 and 2048. It opens FAQ disclosures and checks rendered text nodes for a minimum 14 CSS-pixel font size, accounting for CSS transform scale. It also rejects horizontal page overflow and overflowing source/command blocks. Failure exits with code 1 and identifies browser, viewport, text and measured size.

Slide screenshots and embedded deck documents are deliberately scaled previews; the oracle checks the landing UI, not the contents of those images/frames. It is not an aesthetic judgment or a full accessibility audit. Inspect screenshots separately for composition, contrast and overlap.

The readability oracle also checks a 4.5:1 minimum text contrast in the film
section, to catch pale text accidentally carried over from a dark section.

The landing film is generated in the sibling `rikiki-video` project. Run its
oracles, render and music scripts before replacing `public/landing/rikiki-demo.mp4`.
The web copy uses H.264/AAC, 1920×1080 and fast-start metadata. Keep `preload="none"`
and no autoplay, so the film is fetched only when the visitor plays it.

`engraving-hd.webp` comes from the 3808×1280 original of the same supplied
illustration as rikiki-video's `assets/header.webp`. The 1600px copy serves normal
density screens; the HD copy serves high-density and wide screens.
