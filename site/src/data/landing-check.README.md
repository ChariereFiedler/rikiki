# Recorded check example

The `flawed` entry in `landing-check.json` and `public/landing/flawed-slide.png`
come from `rikiki-video/captures/check-data.js` and its paired capture, recorded
on 2026-09-23. This is a deliberately broken fixture, not customer evidence.

The `fixed` entry is a fresh check of `examples/stories/check-fixed.html`. Its
paired image is `public/landing/fixed-slide.png`. The revised fixture removes
unsupported claims and shows the supplied 118% figure as an explicitly
illustrative same-cohort index. Update the image and report together.

The landing labels the outputs as recorded CLI runs. Its before/after buttons
do not execute the checker in the browser.

The engraving in `public/landing/engraving.webp` is the existing Rikiki header
illustration also used by rikiki-video. Lucide SVGs are pinned to lucide-static
0.468.0, with their license retained in `public/landing/icons/LICENSE`.
