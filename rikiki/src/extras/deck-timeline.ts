// ════════════════════════════════════════════════════════════════
// <deck-timeline>
//   <deck-milestone date="Jan" label="First audit"></deck-milestone>
//   <deck-milestone date="Mar" label="CI gate" tone="ok"></deck-milestone>
//   <deck-milestone date="Jun" label="v1.0" tone="accent"></deck-milestone>
// </deck-timeline>
//
// A trajectory in time. Telling a room how something progressed over months is
// a recurring need in a retrospective, and a bulleted list of dates does not
// show the distance between them.
//
// OPT-IN · <script type="module" src="dist/deck-timeline.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckMilestoneTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger';

const TONES: Record<DeckMilestoneTone, string> = {
  default: 'var(--rik-text-default--faint)',
  accent: 'var(--rik-accent__text)',
  ok: 'var(--rik-status-success__text)',
  warn: 'var(--rik-status-warn__text)',
  danger: 'var(--rik-status-danger__text)',
};

@customElement('deck-timeline')
export class DeckTimeline extends LitElement {
  /* Customization tokens:
       --deck-timeline-axis / --deck-timeline-axis-width
       --deck-timeline-gap                                                   */
  static override styles = css`
    :host {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
      gap: var(--deck-timeline-gap, var(--rik-space-3));
      position: relative;
      font-family: var(--rik-font-sans);
      padding-top: var(--rik-space-4);
    }
    /* The axis runs behind the markers · one line, drawn once, so the spacing
       between milestones is what the reader measures. */
    :host::before {
      content: '';
      position: absolute;
      top: calc(var(--rik-space-4) + 0.5em);
      left: 0;
      right: 0;
      height: var(--deck-timeline-axis-width, 2px);
      background: var(--deck-timeline-axis, var(--rik-text-default--faint));
    }
    /* Vertical · for a long list, or a narrow column. */
    :host([direction='column']) {
      grid-auto-flow: row;
      grid-auto-columns: auto;
      padding-top: 0;
      padding-left: var(--rik-space-4);
    }
    :host([direction='column'])::before {
      top: 0;
      bottom: 0;
      left: calc(var(--rik-space-4) - 1px);
      right: auto;
      width: var(--deck-timeline-axis-width, 2px);
      height: auto;
    }
    /* Alternate · the axis runs through the middle, odd milestones sit above it
       and even ones below. Each spans two columns: its neighbours are on the
       other side, so the note gets twice the width without touching them. */
    :host([alternate]:not([direction='column'])) {
      grid-auto-flow: row;
      grid-template-columns: repeat(var(--_cols, 2), minmax(0, 1fr));
      grid-template-rows: 1fr 1fr;
      row-gap: 0;
      padding-top: 0;
    }
    :host([alternate]:not([direction='column']))::before {
      top: calc(50% - var(--deck-timeline-axis-width, 2px) / 2);
    }
    ::slotted(deck-milestone[side]) { grid-column: var(--_col) / span 2; }
    ::slotted(deck-milestone[side='up']) { grid-row: 1; align-self: end; }
    ::slotted(deck-milestone[side='down']) { grid-row: 2; align-self: start; }
  `;

  /** `row` (default) or `column`. */
  @property({ type: String, reflect: true }) direction: 'row' | 'column' = 'row';

  /** Row only · milestones alternate above and below the axis, each twice as wide. */
  @property({ type: Boolean, reflect: true }) alternate = false;

  /** Walk the trajectory one milestone per step.
   *
   *  Emphasis, not concealment · at step 0 the whole span is visible, because
   *  the distance between the first and the last date is half the message. */
  @property({ type: Boolean, reflect: true }) reveal = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.reveal) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const needed = this.querySelectorAll('deck-milestone').length;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (needed > declared) slide.setAttribute('data-steps', String(needed));
  }

  /** Called by deck-root on every step change. */
  applyStep(step: number): void {
    if (!this.reveal) return;
    this.querySelectorAll('deck-milestone').forEach((el, i) => {
      el.toggleAttribute('pending', step > 0 && i + 1 > step);
      el.toggleAttribute('active', i + 1 === step);
    });
  }

  override updated(): void {
    this._arrange();
  }

  /** Tell each milestone its side and column · a grid cannot count its items,
   *  so the index is written where the slotted rule can read it. */
  private _arrange = (): void => {
    const milestones = [...this.querySelectorAll<HTMLElement>('deck-milestone')];
    const alternating = this.alternate && this.direction !== 'column';
    milestones.forEach((el, i) => {
      if (alternating) {
        el.setAttribute('side', i % 2 ? 'down' : 'up');
        el.style.setProperty('--_col', String(i + 1));
      } else {
        el.removeAttribute('side');
        el.style.removeProperty('--_col');
      }
    });
    this.style.setProperty('--_cols', String(milestones.length + 1));
  };

  override render() {
    return html`<slot @slotchange=${this._arrange}></slot>`;
  }
}

@customElement('deck-milestone')
export class DeckMilestone extends LitElement {
  /* Customization tokens:
       --deck-milestone-dot / --deck-milestone-dot-size
       --deck-milestone-date-color / --deck-milestone-label-color
       --deck-milestone-note-color / --deck-milestone-pending-opacity        */
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--rik-space-1);
      min-width: 0;
      transition: opacity 0.2s ease;
    }
    @media (prefers-reduced-motion: reduce) {
      :host { transition: none; }
    }
    :host([pending]) {
      opacity: var(--deck-milestone-pending-opacity, 0.25);
    }
    /* The one under discussion · the dot grows, nothing else changes. */
    :host([active]) .dot {
      transform: scale(1.6);
    }
    .dot {
      width: var(--deck-milestone-dot-size, 1em);
      height: var(--deck-milestone-dot-size, 1em);
      border-radius: var(--rik-radius-pill);
      background: var(--deck-milestone-dot, var(--_tone));
      /* The ring hides the axis behind the marker, so the dot reads as a stop
         on the line rather than a bead sitting on top of it. */
      box-shadow: 0 0 0 4px var(--rik-surface-page);
      flex: none;
    }
    /* The date is written, not tagged · it used to be tracked-out small caps,
       which is unreadable across a room and is exactly the template chrome a
       generated slide reaches for. */
    .date {
      font-size: var(--rik-font-size-body);
      color: var(--deck-milestone-date-color, var(--rik-text-default--muted));
      font-variant-numeric: tabular-nums;
    }
    .label {
      font-size: var(--rik-font-size-lead);
      font-weight: 700;
      line-height: 1.25;
      color: var(--deck-milestone-label-color, var(--rik-text-default));
    }
    .note {
      font-size: var(--rik-font-size-body);
      color: var(--deck-milestone-note-color, var(--rik-text-default--muted));
      line-height: 1.35;
    }
    /* Set by an alternating timeline · the dot moves to the axis side and its
       centre lands on the axis, the text keeps its reading order. */
    :host([side]) { padding-block: var(--rik-space-2); }
    :host([side='up']) .dot {
      order: 1;
      margin-bottom: calc(var(--deck-milestone-dot-size, 1em) / -2 - var(--rik-space-2));
    }
    :host([side='down']) .dot {
      margin-top: calc(var(--deck-milestone-dot-size, 1em) / -2 - var(--rik-space-2));
    }
    @media print {
      :host { opacity: 1; }
      .dot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  @property({ type: String }) date?: string;
  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;
  @property({ type: String, reflect: true }) tone: DeckMilestoneTone = 'default';

  override willUpdate(): void {
    this.style.setProperty('--_tone', TONES[this.tone] ?? TONES.default);
  }

  override render() {
    return html`
      <span class="dot" part="dot" aria-hidden="true"></span>
      ${this.date ? html`<span class="date" part="date">${this.date}</span>` : ''}
      ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      ${this.note ? html`<span class="note" part="note">${this.note}</span>` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-timeline': DeckTimeline;
    'deck-milestone': DeckMilestone;
  }
}
