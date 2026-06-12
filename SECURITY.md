# Security Policy

## Scope

rikiki is a client-side presentation framework: decks are static HTML that run
entirely in the viewer's browser, with no server component and no data
collection. The realistic risk surface is small — mainly XSS through deck
content rendered by `deck-md` (Markdown) or through unsanitized HTML a deck
author injects. Treat deck content as you would any HTML you publish.

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
