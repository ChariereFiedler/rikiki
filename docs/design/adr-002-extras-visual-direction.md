# ADR-002 · The visual direction of the opt-in components

Status: accepted, 2026-09-07. Supersedes the "engineering editorial" signature
that shipped in `src/extras/signature.ts`.

## Why this exists

The opt-in components were rejected three times as visually poor. The first two
rounds tuned the existing devices; the third measured them. The measurement said
the emphasis surfaces were invisible, which was true and has been fixed. It did
not explain why the slides still read as generic, and that turned out to be a
separate problem with a separate cause.

The signature was assembled from a catalogue of devices rather than from the
medium: a short accent rule under every title, a mono uppercase micro-label for
every piece of metadata, hairlines instead of containers, 01 / 02 / 03 markers,
metadata strung together with middle dots. Those are, as of 2026, the most
recognisable marks of a generated page. The look was not under-designed. It was
designed from the wrong source.

## The subject

Not a page. A slide, projected in a room.

- Seen from three to ten metres, for something like forty seconds.
- Emitted light on a wall, not ink on paper, often through a mediocre projector.
- The audience glances at it and returns their attention to the person talking.
- Read a second time in a 4-across overview grid at thumbnail size, and a third
  time as a PDF page.

That subject decides everything below, because it decides what physically
survives the trip across the room.

**Survives:** area, size, position, one saturated colour, empty space.
**Does not survive:** hairlines, type under about 20 pixels on the wall, letter
spacing, small caps, thin strokes, low-contrast tints, anything that has to be
compared against something else to be understood.

The old signature was built entirely from the second list. That is the whole
finding. It was not "faiblement graphique" by accident; it was made of the
things that disappear.

## Colour · fixed, not a design axis

The palette is the siliceum brand and predates this work. Four roles, and there
is no fifth:

| role | rikiki | siliceum |
|---|---|---|
| paper | `#faf8f5` | `#fafaf8` |
| ink | `--rik-text-default` | idem |
| block | `--rik-surface-inverse` (18.9:1) | idem (18.9:1) |
| accent | `#f07020` | `#F7CB44` |

Everything is a token. Nothing new is invented here.

## Type · two sizes, and that is the constraint

`themes/siliceum.css` maps `--rik-font-display` to the same family as
`--rik-font-sans`. One of the two shipped themes therefore has **no display
face at all**, so a direction that leans on a display-versus-body contrast works
in one theme and collapses in the other.

Hierarchy comes from size and weight, in **two steps**:

- **statement** · `--rik-text-xl` to `2xl`, weight 800, tracking `-0.02em`
- **reading** · `--rik-font-size-body` to `lead`, weight 400 to 600

There is deliberately no third step. The absent third step is what removes the
mono uppercase micro-label from all fourteen components at once: with nowhere to
put a label, the metadata has to be written as words at reading size, which is
what a person in the back row can actually read anyway.

## Layout · one block, one scale

Today, and the shape every component repeats:

```
  EYEBROW
  Title
  ────────────                 accent rule
  ▁▁▁▁                         mono micro-label
  34
  components
```

Proposed:

```
  Title

     9 310                     the statement, alone
     APAC, on the Pro plan     the reading line

  ███████████████████████      one mass, and only when
  ███  the one that matters    something is actually marked
  ███████████████████████
```

Alignment is left, always, ragged right. Centred text loses the vertical
scanning edge that makes a glance cheap, and centring is the default a generated
slide reaches for.

## The four rules every component follows

1. **One mass, at most.** A single filled area per component, carrying the item
   that is marked, active, winning or current. Everything else has no fill, no
   border and no tile. A component with nothing marked has no mass at all.
2. **Two sizes.** Statement and reading. Anything that seems to need a third
   size needs to be cut instead.
3. **No label above content.** No eyebrow, no caption on top, no all-caps tag.
   Context is written after the thing, at reading size, in sentence case.
4. **A line only where two things would otherwise touch.** A table header
   separating from its body, an axis a timeline hangs from, an edge in a graph.
   Never as decoration, never as a signature.

## Reviewed against the current generated-design clusters

- *Warm cream with a terracotta accent* · that is our palette, and it is an
  explicit brand constraint. Kept, deliberately, and the freedom is spent
  elsewhere rather than on the neighbouring defaults.
- *Broadsheet hairlines at zero radius* · this is what we are leaving. Rules
  move from ornament to load-bearing, under rule 4.
- *Template chrome: all-caps eyebrows, mono data labels, middle-dot metadata* ·
  removed by rules 2 and 3.
- *The card kit* · the risk of "one mass" is that it becomes a dark card on
  every slide, which is the same failure wearing a different colour. Rule 1
  guards it: the mass exists only where the markup marks something.

**Revised after this review.** The first version of this plan kept the accent
rule and shortened it, and kept the mono label and reduced it. That is the trap:
the same devices, tuned, arrived at from the same place any similar brief would
arrive at. Both are removed instead. Numbering survives in exactly two
components, `deck-flow` and `deck-agenda`, because those two genuinely are
sequences; it is removed everywhere else.

## The eyebrow, decided separately

`deck-feature` and its siblings print an `eyebrow` above the title on every
slide of every deck, and it was a filled pill holding tracked-out small caps ·
two of the plainest marks of a generated page, stacked, and a coloured smudge at
projection distance. It was raised as a separate decision because it lives in
core layouts rather than in the opt-in set, and the answer was to restyle it,
not to remove it.

It now renders as a short accent-coloured line in sentence case. No API changes,
so no deck is rewritten, and `--deck-eyebrow-bg` and its siblings still bring
the badge back for a deck that wants one. Rule 3 is bent rather than applied:
the eyebrow is a label above content, but the slot is used by every deck the
project ships and removing it would be a breaking change made for a stylistic
reason. Making it legible is the proportionate move.
