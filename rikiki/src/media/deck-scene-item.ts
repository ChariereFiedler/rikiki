// ════════════════════════════════════════════════════════════════
// <deck-scene-item icon="target" label="MCP" tag="safe bet" emphasis
//   note="one connector for every assistant"></deck-scene-item>
//
// One entry of a scene. It carries words and figures and draws nothing · the
// scene around it decides where they go. Every deck-scene-* reads the same
// vocabulary, so an author learns one element for six shapes.
//
// OPT-IN · loaded by every deck-scene-* module, never on its own, and safe to
// load more than once.
//
// Attributes (each scene reads the ones it draws):
//   label    · the name of the entry, one to three words
//   note     · one sentence, wrapped by the scene to the room it has
//   icon     · a deck-icon name
//   tag      · a short status shown in the accent
//   value    · a figure (bars)
//   level    · one status per column, space-separated (matrix)
//   from, to · the start and end of a range (ranges)
//   emphasis · the one entry the scene puts forward
// ════════════════════════════════════════════════════════════════

import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';

export class DeckSceneItem extends LitElement {
  /* No tokens · an item is never painted, its scene paints it. */
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;
  @property({ type: String }) icon?: string;
  @property({ type: String }) tag?: string;
  @property({ type: String }) value?: string;
  @property({ type: String }) level?: string;
  @property({ type: String }) from?: string;
  @property({ type: String }) to?: string;
  @property({ type: Boolean, reflect: true }) emphasis = false;

  override render() {
    return null;
  }
}

// Every scene module bundles its own copy of this element, and a deck with two
// scenes loads two copies · the second must not throw on an existing name, or
// its whole module, scene included, fails to load.
if (!customElements.get('deck-scene-item')) customElements.define('deck-scene-item', DeckSceneItem);

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-item': DeckSceneItem;
  }
}
