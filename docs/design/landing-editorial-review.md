# Landing editorial review

The English product page keeps its existing language and product structure.
The `voix-cedric` skill from the Tordu Jardin project informed the tone; its
French typography rules were not applied to English. `humanize-text` and the
final anti-template pass preserve claims, commands and examples.

The initial draft repeated short three-part slogans and described the same
agent loop in several sections. The final pass replaced repeated slogans with
concrete actions and kept the botanical identity in the artwork and the name.
No personal anecdote, performance claim or product guarantee was added.

| Section | Rhythm retained | Information carried by plain prose |
| --- | --- | --- |
| Hero | “Small toolkit. Wild ideas.” | HTML components, checks and screenshots |
| Film | A short invitation to watch | Duration, music, coming-soon Sales status |
| Agents | Question about presenting the first draft; microphone aside | Brief, skills, diagnostics and visual review |
| Examples | ACME's repeated design review | Three fictional decks of fifteen slides |
| Components | Short imperative heading | Composition, navigation, presenter mode and export |
| Themes | Brief heading | Same content, changed visual tokens |
| Source | “Yes, the whole cover.” | Editable HTML, CSS and version control |
| Workflow | Browser/bundler aside | Commands and prerequisites |
| Optional modules | Compact heading | Actual measured gzip sizes and module purpose |
| FAQ | Reader questions | Factual setup and usage answers |
| Closing | “Got a strange idea?” | Installation and the setup guide |

The restraint pass leaves the technical paragraphs unembellished. Effects sit
at section boundaries, rather than in every sentence; the remaining three-part
lists name actual parallel actions or the three requested example decks.

Readability is checked separately by `site/scripts/check-landing-readability.mjs`:
14px minimum for landing UI, code fit, horizontal overflow and film-section text
contrast. Slide previews are scaled documents and are reviewed as decks.
