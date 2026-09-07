// ════════════════════════════════════════════════════════════════
// <deck-icon name="check" tone="ok"></deck-icon>
// <deck-icon size="lg"><svg viewBox="0 0 24 24">…</svg></deck-icon>
//
// A symbol on a card, a step or an item. Without one every slide reads as text
// and they all look alike.
//
// Two ways in, and the second is the escape hatch that keeps the first small:
//   `name`   one of the twenty-four glyphs in src/shared/icon-set.ts
//   a slot   any <svg> you supply, normalised to the same size and tone
//
// Nothing is vendored and nothing is fetched · the set is drawn in this repo,
// weighs under 3 KB, and survives `rikiki bundle` like any other module.
//
// OPT-IN · not imported by src/index.ts:
//   <script type="module" src="dist/deck-icon.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';

export type DeckIconSize = 'sm' | 'md' | 'lg' | 'xl';
export type DeckIconTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'muted';

const SIZES: Record<DeckIconSize, string> = {
  sm: '1em',
  md: '1.5em',
  lg: '2.5em',
  xl: '4em',
};

const TONES: Record<DeckIconTone, string> = {
  default: 'currentColor',
  accent: 'var(--rik-accent__text)',
  ok: 'var(--rik-status-success__text)',
  warn: 'var(--rik-status-warn__text)',
  danger: 'var(--rik-status-danger__text)',
  info: 'var(--rik-status-info, var(--rik-accent__text))',
  muted: 'var(--rik-text-default--faint)',
};

@customElement('deck-icon')
export class DeckIcon extends LitElement {
  /* Customization tokens · both defaults route to a semantic --rik-* token.

       --deck-icon-size     diameter (overrides the size attribute)
       --deck-icon-color    stroke colour (overrides the tone attribute)
       --deck-icon-stroke   stroke width, in the 24-unit grid               */
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--deck-icon-size, var(--_size));
      height: var(--deck-icon-size, var(--_size));
      color: var(--deck-icon-color, var(--_tone));
      flex: none;
      /* Optical alignment with the text it sits beside. */
      vertical-align: -0.125em;
    }
    svg,
    ::slotted(svg) {
      width: 100%;
      height: 100%;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: var(--deck-icon-stroke, 2);
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;

  /** One of the glyphs in the set · an unknown name falls back to the slot. */
  @property({ type: String, reflect: true }) name?: string;

  @property({ type: String, reflect: true }) size: DeckIconSize = 'md';

  @property({ type: String, reflect: true }) tone: DeckIconTone = 'default';

  /** What a screen reader should say · absent means decorative, and the icon
   *  is hidden from the accessibility tree rather than announced as "image". */
  @property({ type: String }) label?: string;

  override willUpdate(): void {
    // The style follows the ATTRIBUTE everywhere in this library.
    this.style.setProperty('--_size', SIZES[this.size] ?? SIZES.md);
    this.style.setProperty('--_tone', TONES[this.tone] ?? TONES.default);
    // Decorative by default · a slide is full of icons that repeat the text
    // beside them, and announcing each one makes the deck unusable by ear.
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }

  override render() {
    const path = iconPath(this.name);
    if (!path) return html`<slot></slot>`;
    return html`<svg viewBox="0 0 24 24" part="svg" focusable="false">
      <path d=${path} />
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-icon': DeckIcon;
  }
}
