# Landing content rubric

This rubric evaluates what the landing says, not how it looks. It follows
[GOV.UK's user-needs principle](https://www.gov.uk/guidance/government-design-principles),
the [GOV.UK guidance on learning user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs),
and Nielsen Norman Group's evidence that web copy works better when it is
[concise, scannable, and objective](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/).

## Content gates

A failed gate caps the content score at 7.9/10.

1. Every factual claim maps to a source in code, tests, package metadata, or
   measured release artifacts.
2. Commands, package names, paths, component counts, weights, and output formats
   are executable or verifiable exactly as written.
3. Examples distinguish sample output from product guarantees.
4. The hero answers four questions without scrolling: what it is, who it helps,
   what task it completes, and what the visitor should do next.
5. Headings state an outcome or decision; labels do not carry essential meaning
   alone.
6. Each paragraph has one purpose and begins with its useful information.
7. Links and buttons describe their destination or result.
8. Technical terms are either familiar to the intended audience, demonstrated
   in context, or explained before use.
9. Repeated claims add new evidence; they do not merely restate the promise.
10. The page covers the material objections required for adoption: setup,
    authoring, verification, delivery, offline behavior, customization,
    extensibility, accessibility, and maintenance status.

## Weighted score

| Category | Weight | Requirement for 9/10 |
| --- | ---: | --- |
| Audience and user need | 15% | Primary audience and job are explicit; secondary use cases do not blur the promise. |
| Proposition and differentiation | 15% | The product category, workflow, and practical advantage are concrete without competitor comparison. |
| Factual accuracy | 18% | Every claim is traceable and qualified at the correct level. |
| Completeness for adoption | 12% | The page resolves the main questions that block a first trial. |
| Narrative and prioritization | 12% | Information follows the visitor's decision sequence and puts proof beside claims. |
| Clarity and plain language | 10% | Sentences use concrete verbs, familiar words, and explain unavoidable terms. |
| Scannability and concision | 8% | Headings, labels, and topic sentences carry the argument with little repetition. |
| Proof and credibility | 6% | Demonstrations and numbers identify their provenance and avoid simulated certainty. |
| Calls to action | 4% | Each action sets an accurate expectation and uses the correct command or destination. |

## Review protocol

1. Export all visible text in reading order.
2. Build a claim ledger with an evidence path for every number and product claim.
3. Read once as a presentation author, once as a developer integrating training,
   and once as a maintainer evaluating operational risk.
4. Run five findability tasks: identify the product, create a first deck, verify
   it, deliver it, and customize it. Each answer must be discoverable from a
   heading or first sentence.
5. Fix failed gates, then remove repetition and unsupported promotional language.
6. Ask an independent reviewer to score the revised copy without seeing the
   target score.
7. Stop only when every gate passes, the weighted total is at least 9.0, and no
   category is below 8.0.
