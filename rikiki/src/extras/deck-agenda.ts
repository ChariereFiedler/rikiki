// ════════════════════════════════════════════════════════════════
// <deck-agenda></deck-agenda>
//
// The running order, and where the talk currently is. Over thirty-five minutes
// a room disengages when it cannot tell how much is left. `deck-section` marks
// a boundary but shows no progress.
//
// It reads the deck's OWN chapter structure through the navigation domain, so
// there is nothing to keep in sync: add a section, the agenda grows a line.
//
// OPT-IN · not imported by src/index.ts. Load it next to the bundle:
//   <script type="module" src="dist/deck-agenda.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { coordsOf, outlineOf } from '../domain/deck-outline.js';

interface Entry {
  readonly title: string;
  /** Index of the chapter's first slide · what clicking the line goes to. */
  readonly slide: number;
}

@customElement('deck-agenda')
export class DeckAgenda extends LitElement {
  /* Customization tokens · every default routes to a semantic --rik-* token.

       --deck-agenda-gap            space between entries
       --deck-agenda-size           type size of an entry
       --deck-agenda-color          an entry still to come
       --deck-agenda-done-color     an entry already covered
       --deck-agenda-current-color  the entry in progress
       --deck-agenda-marker         the bullet of the current entry
       --deck-agenda-rule           the rule down the left edge
       --deck-agenda-num-color      the entry number                          */
  static override styles = css`
    :host {
      display: block;
      font-family: var(--rik-font-sans);
    }
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--deck-agenda-gap, var(--rik-space-2));
    }
    li {
      display: flex;
      align-items: baseline;
      gap: var(--rik-space-3);
      font-size: var(--deck-agenda-size, var(--rik-font-size-lead));
      line-height: 1.3;
      color: var(--deck-agenda-color, var(--rik-text-default--faint));
      padding-left: var(--rik-space-3);
      border-left: 3px solid transparent;
      transition: color 0.2s ease, border-color 0.2s ease;
    }
    @media (prefers-reduced-motion: reduce) {
      li { transition: none; }
    }
    /* Covered ground reads as covered · struck through would be shouting, a
       lighter weight is enough. */
    li[data-state='done'] {
      color: var(--deck-agenda-done-color, var(--rik-text-default--faint));
      opacity: 0.55;
    }
    li[data-state='current'] {
      color: var(--deck-agenda-current-color, var(--rik-text-default));
      border-left-color: var(--deck-agenda-rule, var(--rik-accent));
      font-weight: 700;
    }
    .n {
      flex: none;
      min-width: 2ch;
      font-variant-numeric: tabular-nums;
      font-size: var(--rik-font-size-xs);
      letter-spacing: 0.08em;
      color: var(--deck-agenda-num-color, var(--rik-text-default--faint));
    }
    li[data-state='current'] .n {
      color: var(--deck-agenda-marker, var(--rik-accent));
    }
    button {
      /* A line is a jump target · a real button, so it is reachable by keyboard
         and announced, not a div with a click handler. */
      appearance: none;
      background: none;
      border: 0;
      padding: 0;
      margin: 0;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    button:focus-visible {
      outline: var(--rik-focus-ring--width, 2px) solid var(--rik-focus-ring, currentColor);
      outline-offset: var(--rik-focus-ring--offset, 2px);
    }
    @media print {
      li[data-state='current'] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  /** Hide the entry numbers. */
  @property({ type: Boolean, attribute: 'no-numbers' }) noNumbers = false;

  /** Do not let a click jump to the chapter · for a printed running order. */
  @property({ type: Boolean, attribute: 'no-jump' }) noJump = false;

  @state() private _entries: Entry[] = [];
  @state() private _current = 0;

  private get _deck(): (HTMLElement & { current?: number }) | null {
    return this.closest('deck-root');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._read();
    this._deck?.addEventListener('slide-change', this._onSlideChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Paired with the listener above · an agenda on several slides would
    // otherwise leave one behind on every navigation.
    this._deck?.removeEventListener('slide-change', this._onSlideChange);
  }

  private _onSlideChange = (): void => this._read();

  /** Chapter titles and the current position, from the deck itself. */
  private _read(): void {
    const deck = this._deck;
    if (!deck) return;
    const slides = [...deck.children].filter((el) =>
      el.tagName.toLowerCase().startsWith('deck-'),
    ) as HTMLElement[];
    // The same outline the engine navigates by · one source of truth for what
    // a chapter is (see src/domain/deck-outline.ts).
    const outline = outlineOf(slides.map((s) => s.tagName.toLowerCase()));

    this._entries = outline.chapters.map((chapter) => ({
      title: this._titleOf(slides[chapter.start]),
      slide: chapter.start,
    }));
    this._current = coordsOf(outline, deck.current ?? 0).chapter;
  }

  private _titleOf(slide: HTMLElement | undefined): string {
    if (!slide) return '';
    const heading = slide.querySelector('[slot="title"], h1, h2');
    return (heading?.textContent ?? slide.getAttribute('title') ?? '').trim();
  }

  private _state(index: number): 'done' | 'current' | 'todo' {
    if (index === this._current) return 'current';
    return index < this._current ? 'done' : 'todo';
  }

  private _go(entry: Entry): void {
    if (this.noJump) return;
    const deck = this._deck as unknown as { goToSlide?: (i: number) => void } | null;
    // The engine exposes navigation through the hash · the honest public path
    // rather than reaching into a private method.
    if (deck) location.hash = `#${entry.slide + 1}`;
  }

  override render() {
    if (this._entries.length === 0) return html``;
    return html`
      <ol part="list">
        ${this._entries.map(
          (entry, i) => html`<li data-state=${this._state(i)} part="entry">
            ${this.noNumbers ? '' : html`<span class="n">${String(i + 1).padStart(2, '0')}</span>`}
            ${
              this.noJump
                ? html`<span>${entry.title}</span>`
                : html`<button
                    type="button"
                    aria-current=${this._state(i) === 'current' ? 'step' : 'false'}
                    @click=${() => this._go(entry)}
                  >
                    ${entry.title}
                  </button>`
            }
          </li>`,
        )}
      </ol>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-agenda': DeckAgenda;
  }
}
