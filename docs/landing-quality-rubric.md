# Landing page quality rubric

This rubric is the acceptance contract for the Rikiki landing page. A score is
valid only when every gate passes and the page is reviewed at actual size. A
scaled full-page thumbnail can show rhythm, but it cannot support typography,
spacing, interaction, or accessibility scores.

## Reference set

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for reflow, keyboard access,
  visible focus, contrast, and target size.
- [W3C guidance for text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum):
  4.5:1 for body text and 3:1 for large text.
- [W3C guidance for target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum):
  at least 24 by 24 CSS pixels, with 44 by 44 used here for primary controls.
- [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
  for visible system status, familiar language, consistency, recognition over
  recall, and aesthetic minimalism.
- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
  for LCP, INP, and CLS.

## Mandatory gates

Failure of one gate caps the total score at 7.9/10.

1. No horizontal page overflow at 320, 390, 768, 1280, and 1920 CSS pixels.
2. No content, control, focus ring, anchor target, or sticky navigation overlap.
3. WCAG AA contrast for informative text and controls.
4. Every interactive element works with keyboard alone and has visible focus.
5. Primary touch targets are at least 44 by 44 CSS pixels; all targets satisfy
   WCAG 2.5.8.
6. With text zoomed to 200%, no information or function is lost.
7. No browser errors, broken links, broken previews, or layout shift caused by
   unloaded fonts/media.
8. Reduced-motion preference removes nonessential motion.
9. The first viewport identifies the product, audience outcome, differentiator,
   and next action without relying on later sections.
10. Components introduce no raw color values. New color data belongs to the
    palette layer; component styles consume semantic tokens only.

## Weighted score

Each category is scored from 0 to 10, then multiplied by its weight.

| Category | Weight | Evidence required for 9/10 |
| --- | ---: | --- |
| Message and positioning | 18% | A new visitor can state what Rikiki produces, how it works, and why the workflow is credible after the hero. No unexplained internal jargon. |
| Information architecture | 12% | One continuous story: promise, working proof, use cases, system, extensions, decision support, action. Every section earns its place. |
| Visual hierarchy | 14% | Clear reading order at actual size, restrained heading scale, deliberate alignment, and no competing focal points. |
| Composition and rhythm | 12% | Balanced density, consistent spacing logic, meaningful variation between sections, and no accidental voids or repetitive card walls. |
| Product proof | 12% | At least one real editable interaction, visible Doctor feedback, a real embedded carousel, and concrete delivery outcomes. |
| Conversion and orientation | 10% | Primary CTA remains consistent; the visitor knows what happens after clicking; installation and agent paths are visible at the right moment. |
| Interaction and feedback | 8% | Controls expose state, labels describe outcomes, errors explain recovery, and interactive examples respond immediately. |
| Responsive design | 8% | Mobile compositions are redesigned for the viewport rather than merely stacked; horizontal rails expose their interaction. |
| Accessibility | 4% | All mandatory accessibility gates pass, semantics are meaningful, and status changes are announced. |
| Performance and resilience | 2% | LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at p75 when field data exists; local audits show no avoidable regressions. |

## Review protocol

1. Capture the whole page at 1440 by 900 and 390 by 844 to judge narrative and
   overall rhythm.
2. Capture every major section at 100% scale at 1920, 1280, 768, 390, and 320
   widths. Never grade a section from a downscaled full-page image.
3. Exercise every editor, theme selector, carousel, copy button, disclosure, and
   navigation link with pointer and keyboard.
4. Record computed overflow, target dimensions, contrast, console errors, and
   page height. Run the production build so development overlays do not pollute
   the evidence.
5. Score the page independently against the table. Every deduction must name a
   visible defect, violated criterion, and concrete repair.
6. Fix all gates first, then the highest weighted deductions. Recapture only the
   affected sections plus one whole-page rhythm view.
7. Stop only when all gates pass, the weighted score is at least 9.0, and no
   individual category is below 8.0.

## Scoring record

Every review records the date, build commit, viewport, screenshots, gate
results, category scores, weighted total, and remaining defects. This prevents
an attractive miniature or a single desktop view from being mistaken for a
finished interface.
