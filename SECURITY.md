# Security Policy

## Scope

rikiki is a client-side presentation framework: decks are static HTML that run
entirely in the viewer's browser, with no server component and no data
collection.

## Trust model

The line rikiki draws, and the one it will keep drawing in 1.x:

- **Deck content is trusted.** The HTML, Markdown and diagram source in a deck
  is code its author publishes, exactly like the rest of their page. `deck-md`
  renders raw HTML on purpose · that is the documented contract, not an
  oversight, and it is frozen by a test (`e2e/security.spec.ts`).
- **Text derived from deck content is not trusted.** A library error message
  quotes the source that broke it, so it is attacker-reachable in a way the
  author never wrote. Every such string is escaped before it reaches an
  `innerHTML` sink (`src/shared/escape-html.ts`).
- **Third-party renderers run locked down.** mermaid is initialised at its
  `strict` security level; a permissive mode is not offered.

**Do not** feed rikiki markdown or diagram source that came from an untrusted
party (user submissions, a public API, a CMS field anyone can edit) without
sanitising it yourself first. rikiki is a presentation engine, not a sandbox.

## Supported versions

Only the latest published `rikiki-deck` release receives fixes. There are no
long-term support branches.

| Version | Supported |
|---------|-----------|
| latest `0.x` | ✅ |
| older `0.x` | ❌ |

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

- Email **chariere.fiedler.cedric@gmail.com** with a description, affected version, and a
  reproduction if possible.
- Expect an acknowledgement within a few working days.
- Once a fix is released, the issue may be described publicly in the
  `CHANGELOG.md`, crediting the reporter unless they prefer otherwise.
