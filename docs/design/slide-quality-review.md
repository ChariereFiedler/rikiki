# Screenshot-based slide quality review

A mechanical check is not design approval. Every check report now exposes `quality.status`; ordinary checks show `not-run` and `NOT VERIFIED` in the terminal until a visual review is imported. Existing mechanical checks keep their exit behavior.

Prepare all slide states for the current agent or a human reviewer:

```sh
rikiki check talk.html --quality-out review --require-quality --json
```

This captures every reveal state, regardless of `--steps`, and writes `review/request.json` with image references, content and a review template. The command fails while review is pending. Inspect each PNG at presentation size. Fill in the template with a reviewer, summary and an evidence-backed pass/fail assessment for every criterion on every state:

- hierarchy;
- typography;
- readability, including contrast and small component labels;
- composition, including spacing, alignment and clipping;
- visual evidence: does the chart, image or component support the claim?
- theme coherence across the deck.

A failure needs a concrete correction. Save the completed template as `review/verdict.json`, then import it:

```sh
rikiki check talk.html --quality-review review/verdict.json --require-quality --json
```

Failed judgments are error diagnostics with slide and state references. Missing, incomplete or stale reviews fail strict mode. Review freshness includes source, rendered content, viewport and screenshot hashes: changes to fonts, CSS, assets or component rendering invalidate approval. Pause non-deterministic animations before capturing; changing pixels require a fresh review.

This does not call an AI service or infer taste from a numerical score. The reviewer must actually inspect the screenshots. A hash proves freshness, not that someone looked. Narrative review remains a separate check. After editing, regenerate the request and reassess; do not copy a passing verdict onto new screenshots.
