// src/deck-cover.ts
import { LitElement, html, css as css2 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";

// src/shared-styles.ts
import { css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var slideShell = css`
  :host {
    display: none;
    position: absolute;
    inset: 0;
    padding: var(--slide-pad-y) var(--slide-pad-x);
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
  }
  :host([active]) { display: flex; }
`;
var typo = css`
  h1 {
    font-size: var(--fs-h1);
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.022em;
    line-height: 1.15;
    margin-bottom: var(--sp-4);
    padding-bottom: var(--sp-2);
    border-bottom: 3px solid var(--yellow);
    display: inline-block;
    align-self: flex-start;
    flex: 0 0 auto;
  }
  h1 .accent { color: var(--yellow); }
  ::slotted(p), p {
    font-size: var(--fs-body);
    line-height: 1.65;
    color: var(--soft);
    margin: 0;
  }
  ::slotted(strong), strong { color: var(--text); font-weight: 700; }
  ::slotted(code), code {
    font-family: var(--mono);
    font-size: var(--fs-mono-sm);
    background: rgba(0,0,0,0.06);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    color: var(--text);
  }
`;
var helpers = css`
  .lbl {
    display: inline-block;
    padding: 4px 12px;
    background: var(--yellow);
    color: var(--dark);
    border-radius: 9999px;
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: var(--sp-1);
    align-self: flex-start;
  }
  .lead {
    font-size: var(--fs-lead);
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: var(--sp-4);
    max-width: 75ch;
    flex: 0 0 auto;
  }
  .kicker {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-3);
    display: block;
  }
  .kicker.on-dark { color: rgba(255,255,255,0.35); }
  .caption {
    font-size: var(--fs-small);
    color: var(--muted);
    line-height: 1.55;
  }
  .caption.on-dark { color: rgba(255,255,255,0.5); }
  .col-label {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-2);
  }
`;
var slideBase = [slideShell, typo, helpers];

// src/deck-cover.ts
var DeckCover = class extends LitElement {
  static {
    this.styles = [...slideBase, css2`
    :host { background: var(--dark); justify-content: center; color: #fff; }
    .brand {
      display: inline-flex; align-items: center; gap: var(--sp-3);
      margin-bottom: var(--sp-5);
      align-self: flex-start;
    }
    .brand-tile {
      width: 64px; height: 64px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .brand-tile img { width: 100%; height: 100%; display: block; }
    .brand-name {
      font-family: var(--display, inherit);
      font-size: var(--fs-micro); font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(255,255,255,0.75);
    }
    .brand-context {
      font-size: var(--fs-micro); font-weight: 700; color: rgba(255,255,255,0.55);
      letter-spacing: 0.2em; text-transform: uppercase;
      padding-left: var(--sp-3); border-left: 1px solid rgba(255,255,255,0.18);
    }
    ::slotted(h1) {
      font-size: clamp(3.6rem, 9vw, 8.5rem); font-weight: 900;
      color: #fff; line-height: 1.02; letter-spacing: -0.035em;
      margin-bottom: var(--sp-4);
      border: none; padding: 0;
    }
    ::slotted(.sub) {
      font-size: var(--fs-h2); color: rgba(255,255,255,0.6);
      margin-bottom: var(--sp-6); max-width: 60ch; line-height: 1.45;
      display: block;
    }
    .meta {
      display: flex; gap: var(--sp-6);
      border-top: 1px solid rgba(255,255,255,0.12);
      padding-top: var(--sp-4);
    }
    .meta-item strong {
      display: block; font-size: var(--fs-micro); letter-spacing: 0.12em;
      text-transform: uppercase; color: rgba(255,255,255,0.4);
      margin-bottom: 6px; font-weight: 700;
    }
    .meta-item span { color: #fff; font-size: var(--fs-body); font-weight: 600; }
  `];
  }
  static {
    this.properties = {
      brand: { type: String },
      brandSrc: { type: String, attribute: "brand-src" },
      speaker: { type: String },
      company: { type: String },
      duration: { type: String },
      audience: { type: String },
      runtime: { type: String },
      // Labels (default FR, override via attrs for i18n)
      speakerLabel: { type: String, attribute: "speaker-label" },
      companyLabel: { type: String, attribute: "company-label" },
      durationLabel: { type: String, attribute: "duration-label" },
      audienceLabel: { type: String, attribute: "audience-label" },
      runtimeLabel: { type: String, attribute: "runtime-label" }
    };
  }
  render() {
    const parts = (this.brand || "").split("\xB7").map((s) => s.trim()).filter(Boolean);
    const brandName = parts[0] || "";
    const context = parts.slice(1).join(" \xB7 ");
    const items = [
      this.speaker && { l: this.speakerLabel || "Pr\xE9sent\xE9 par", v: this.speaker },
      this.company && { l: this.companyLabel || "Entreprise", v: this.company },
      this.duration && { l: this.durationLabel || "Dur\xE9e", v: this.duration },
      this.audience && { l: this.audienceLabel || "Audience", v: this.audience },
      this.runtime && { l: this.runtimeLabel || "Runtime", v: this.runtime }
    ].filter(Boolean);
    const hasMark = !!this.brandSrc;
    return html`
      <div class="brand" part="brand">
        ${hasMark ? html`<span class="brand-tile"><img src="${this.brandSrc}" alt="${brandName || ""}"></span>` : ""}
        ${brandName ? html`<span class="brand-name">${brandName}</span>` : ""}
        ${context ? html`<span class="brand-context">${context}</span>` : ""}
      </div>
      <slot></slot>
      ${items.length ? html`
        <div class="meta" part="meta">
          ${items.map((i) => html`
            <div class="meta-item"><strong>${i.l}</strong><span>${i.v}</span></div>
          `)}
        </div>` : ""}
    `;
  }
};
customElements.define("deck-cover", DeckCover);
export {
  DeckCover
};
//# sourceMappingURL=deck-cover.js.map
