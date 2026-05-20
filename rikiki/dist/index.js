// src/deck-root.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckRoot = class extends LitElement {
  constructor() {
    super();
    // Flat list of all <deck-*> children (excluding deck-root itself)
    this.slides = [];
    // 2D index · chapters are bounded by <deck-section> elements
    this.chapters = [];
    this._onHash = () => {
      this._readHash(false);
    };
    this._onKey = (e) => {
      if (e.target && e.target.matches?.("input,textarea,[contenteditable]")) return;
      if (this.overview) {
        if (e.key === "Escape" || e.key === "o" || e.key === "O") {
          e.preventDefault();
          this.overview = false;
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          this.overview = false;
          return;
        }
        return;
      }
      if (e.key === "?" || e.key === "h" || e.key === "H") {
        this._toggleHelp();
        return;
      }
      if (e.key === "Escape") {
        this._closeHelp();
        return;
      }
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        this.overview = true;
        return;
      }
      if (e.key === "Home") {
        this._goTo(0);
        return;
      }
      if (e.key === "End") {
        this._goTo(this.slides.length - 1);
        return;
      }
      if (e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        this._advance();
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        this._back();
        return;
      }
      if (this._has2DNav()) {
        const { c, i } = this._coords(this.current);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          if (c + 1 < this.chapters.length) this._goToCoords(c + 1, 0);
          else this._advance();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (c - 1 >= 0) this._goToCoords(c - 1, 0);
          else this._back();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const chap = this.chapters[c];
          if (chap && i + 1 < chap.slides.length) this._goToCoords(c, i + 1);
          else this._advance();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (i - 1 >= 0) this._goToCoords(c, i - 1);
          else this._back();
          return;
        }
      } else {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          this._advance();
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          this._back();
          return;
        }
      }
    };
    this.current = 0;
    this.step = 0;
    this.overview = false;
  }
  static {
    this.styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      position: relative;
      background: var(--bg);
    }
    #progress {
      position: fixed; bottom: 0; left: 0;
      height: 3px; background: linear-gradient(90deg, var(--yellow), var(--yellow-soft));
      transition: width 0.25s ease;
      z-index: 100;
    }
    #counter {
      position: fixed; bottom: 1rem; right: 1.5rem;
      font-size: var(--fs-micro);
      color: var(--muted);
      font-family: var(--mono);
      z-index: 100;
    }
    #step-dots {
      position: fixed; bottom: 1rem; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 6px;
      z-index: 100;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #d4d4d0; transition: background 0.2s; }
    .dot.active { background: var(--yellow); }

    #kb-hint {
      position: fixed; bottom: 1rem; left: 1.5rem;
      display: inline-flex; align-items: center; gap: 6px;
      font: 600 0.62rem/1 var(--mono);
      color: var(--muted);
      z-index: 100;
      opacity: 0.5;
      transition: opacity 0.2s ease;
      cursor: help;
    }
    #kb-hint:hover { opacity: 1; }
    #kb-hint kbd {
      background: var(--card);
      border: 1px solid var(--border);
      border-bottom: 2px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      color: var(--text);
      font: inherit;
      min-width: 16px; text-align: center;
    }
    #kb-hint .sep { opacity: 0.4; }

    /* Keyboard help overlay */
    #kb-overlay {
      position: fixed; inset: 0;
      background: rgba(10,10,10,0.7);
      display: none; align-items: center; justify-content: center;
      z-index: 200;
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #kb-overlay.open { display: flex; opacity: 1; }
    .kb-card {
      background: var(--card); color: var(--text);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 2.2rem 2.5rem;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      width: min(560px, 90vw);
      font-family: var(--sans);
      animation: kbSlideIn 0.22s ease;
    }
    @keyframes kbSlideIn {
      from { transform: translateY(8px) scale(0.98); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .kb-card-header {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.4rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .kb-card h3 {
      font: 700 1.05rem/1.2 var(--sans);
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .kb-group-label {
      font: 700 0.62rem/1 var(--mono);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0.8rem 0 0.3rem;
    }
    .kb-group-label:first-of-type { margin-top: 0; }
    .kb-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.4rem 0;
      font-size: 0.88rem;
    }
    .kb-row .keys { display: flex; gap: 4px; align-items: center; }
    .kb-row kbd {
      background: linear-gradient(180deg, #fff 0%, var(--bg) 100%);
      border: 1px solid var(--border);
      border-bottom: 2px solid #c4c4be;
      border-radius: 5px;
      padding: 3px 9px;
      font: 600 0.78rem/1 var(--mono);
      color: var(--text);
      min-width: 22px; text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
    }
    .kb-row .desc { color: var(--soft); }

    /* Overview mode · live cloned thumbnails laid out as a path (à la reveal.js).
       Each chapter is a row; the section marker sits at the left, sub-slides
       flow rightward. Vertical = sections, horizontal = slides within. */
    :host([overview]) ::slotted(*) {
      /* Hide the real slides; the grid renders cloned thumbnails. */
      display: none !important;
    }
    :host([overview]) #overview-grid {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      gap: 28px;
      padding: 32px 48px;
      background: var(--bg);
      overflow: auto;
      z-index: 80;
    }
    :host([overview]) .ov-row {
      display: flex; gap: 14px;
      align-items: center;
      flex-wrap: wrap;
    }
    :host([overview]) .ov-row-label {
      flex: 0 0 200px;
      font: 700 0.72rem/1.3 var(--mono);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      padding-right: 12px;
      text-align: right;
      white-space: normal;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    :host([overview]) .ov-cell {
      position: relative;
      flex: 0 0 auto;
      width: clamp(160px, 14vw, 260px);
      aspect-ratio: 16 / 9;
      background: var(--card);
      border: 2px solid var(--border);
      border-radius: var(--r-md);
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: var(--shadow-card);
    }
    :host([overview]) .ov-connector {
      flex: 0 0 auto;
      width: 16px; height: 2px;
      background: var(--border);
    }
    :host([overview]) .ov-cell:hover {
      transform: translateY(-2px);
      border-color: var(--yellow-soft);
      box-shadow: var(--shadow-hover);
    }
    :host([overview]) .ov-cell[data-current] {
      border-color: var(--yellow);
      box-shadow: 0 0 0 3px rgba(247,203,68,0.35);
    }
    :host([overview]) .ov-thumb {
      /* Render the cloned slide at the live viewport's exact dimensions, then
         scale down. Using actual viewport size (instead of a fixed 1920×1080
         reference) keeps clones layout-identical to the live slides, no matter
         how text or padding scale with viewport. */
      position: absolute; top: 0; left: 0;
      width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
      transform: scale(var(--overview-scale, 0.2));
      transform-origin: top left;
      pointer-events: none;
    }
    :host([overview]) .ov-thumb > * {
      /* Force the cloned slide to render fully (override its :host[active] gate). */
      display: flex !important;
    }
    :host([overview]) .ov-cell-label {
      position: absolute; bottom: 6px; right: 8px;
      font: 700 0.72rem/1 var(--mono);
      color: var(--text);
      background: rgba(255,255,255,0.9);
      padding: 3px 7px; border-radius: 4px;
      z-index: 2;
      pointer-events: none;
    }
    :host(:not([overview])) #overview-grid { display: none; }
  `;
  }
  static {
    this.properties = {
      current: { type: Number, state: true },
      step: { type: Number, state: true },
      overview: { type: Boolean, reflect: true }
    };
  }
  firstUpdated() {
    this.slides = Array.from(this.querySelectorAll(":scope > *")).filter(
      (el) => el.tagName?.toLowerCase().startsWith("deck-") && el.tagName?.toLowerCase() !== "deck-root"
    );
    this._buildChapters();
    this._readHash(true);
    this._applyActive();
    this._applyStep();
    this._updateUI();
    this.requestUpdate();
    window.addEventListener("keydown", this._onKey);
    window.addEventListener("hashchange", this._onHash);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKey);
    window.removeEventListener("hashchange", this._onHash);
  }
  /** Group slides into chapters bounded by <deck-section> markers. */
  _buildChapters() {
    this.chapters = [];
    let current = null;
    this.slides.forEach((slide, i) => {
      const isSection = slide.tagName?.toLowerCase() === "deck-section";
      if (isSection || !current) {
        current = { startIdx: i, slides: [slide] };
        this.chapters.push(current);
      } else {
        current.slides.push(slide);
      }
    });
  }
  /** Whether 2D nav is enabled (i.e. at least one chapter has multiple slides). */
  _has2DNav() {
    return this.chapters.some((c) => c.slides.length > 1) && this.chapters.length > 1;
  }
  /** Convert flat index → {chapter, intra-chapter index}. */
  _coords(flatIdx) {
    for (let c = 0; c < this.chapters.length; c++) {
      const chap = this.chapters[c];
      const local = flatIdx - chap.startIdx;
      if (local >= 0 && local < chap.slides.length) return { c, i: local };
    }
    return { c: 0, i: 0 };
  }
  _flatFromCoords(c, i) {
    const chap = this.chapters[c];
    if (!chap) return 0;
    return chap.startIdx + Math.max(0, Math.min(chap.slides.length - 1, i));
  }
  _readHash(initial) {
    const h = location.hash;
    const m2D = h.match(/^#(\d+)\.(\d+)(?:s(\d+))?$/);
    const m1D = h.match(/^#(\d+)(?:\.(\d+))?$/);
    let target = this.current;
    let stepTarget = this.step;
    if (this._has2DNav() && m2D) {
      const c = parseInt(m2D[1], 10) - 1;
      const i = parseInt(m2D[2], 10) - 1;
      target = this._flatFromCoords(Math.max(0, c), Math.max(0, i));
      stepTarget = m2D[3] ? parseInt(m2D[3], 10) : 0;
    } else if (m1D) {
      target = parseInt(m1D[1], 10) - 1;
      stepTarget = m1D[2] ? parseInt(m1D[2], 10) : 0;
    } else {
      return;
    }
    if (target === this.current && stepTarget === this.step && !initial) return;
    this.current = Math.max(0, Math.min(this.slides.length - 1, target));
    this.step = Math.max(0, stepTarget);
    if (!initial) {
      this._applyActive();
      this._applyStep();
      this._updateUI();
    }
  }
  _writeHash() {
    const h = `#${this.current + 1}` + (this.step > 0 ? `.${this.step}` : "");
    if (location.hash !== h) history.replaceState(null, "", h);
  }
  _toggleHelp() {
    const o = this.renderRoot.querySelector("#kb-overlay");
    o?.classList.toggle("open");
  }
  _closeHelp() {
    this.renderRoot.querySelector("#kb-overlay")?.classList.remove("open");
  }
  _maxSteps() {
    const s = this.slides[this.current];
    if (!s) return 0;
    const direct = parseInt(s.getAttribute("steps") || s.dataset?.["steps"] || "0", 10);
    if (direct > 0) return direct;
    const code = s.querySelector("deck-code[step-groups]");
    if (code) {
      try {
        return JSON.parse(code.getAttribute("step-groups")).length;
      } catch {
      }
    }
    return 0;
  }
  _advance() {
    const max = this._maxSteps();
    if (this.step < max) {
      this.step++;
      this._applyStep();
      this._updateUI();
      this._writeHash();
    } else if (this.current < this.slides.length - 1) {
      this._goTo(this.current + 1);
    }
  }
  _back() {
    if (this.step > 0) {
      this.step--;
      this._applyStep();
      this._updateUI();
      this._writeHash();
    } else if (this.current > 0) {
      this._goTo(this.current - 1);
      this.step = this._maxSteps();
      this._applyStep();
      this._updateUI();
      this._writeHash();
    }
  }
  _goTo(n) {
    this.current = Math.max(0, Math.min(this.slides.length - 1, n));
    this.step = 0;
    this._applyActive();
    this._applyStep();
    this._updateUI();
    this._writeHash();
  }
  _goToCoords(c, i) {
    const clampedC = Math.max(0, Math.min(this.chapters.length - 1, c));
    const chap = this.chapters[clampedC];
    if (!chap) return;
    const clampedI = Math.max(0, Math.min(chap.slides.length - 1, i));
    this._goTo(this._flatFromCoords(clampedC, clampedI));
  }
  _applyActive() {
    this.slides.forEach((s, i) => {
      if (i === this.current) s.setAttribute("active", "");
      else s.removeAttribute("active");
    });
    const active = this.slides[this.current];
    const win = window;
    if (active && win.mermaid) {
      active.querySelectorAll("deck-mermaid:not([rendered])").forEach((el) => el.render?.());
    }
  }
  _applyStep() {
    const slide = this.slides[this.current];
    if (!slide) return;
    slide.applyStep?.(this.step);
    slide.querySelectorAll("*").forEach((el) => el.applyStep?.(this.step));
    slide.querySelectorAll("[data-step-block]").forEach((el) => {
      const n = parseInt(el.dataset["stepBlock"], 10);
      el.style.transition = "opacity 0.25s ease";
      el.style.opacity = this.step === 0 || n <= this.step ? "1" : "0.15";
    });
  }
  _updateUI() {
    const total = this.slides.length;
    const n = this.current + 1;
    const progress = this.renderRoot.querySelector("#progress");
    const counter = this.renderRoot.querySelector("#counter");
    const dots = this.renderRoot.querySelector("#step-dots");
    if (progress) progress.style.width = n / total * 100 + "%";
    if (counter) counter.textContent = `${n} / ${total}`;
    const max = this._maxSteps();
    if (dots) {
      dots.innerHTML = max === 0 ? "" : Array.from(
        { length: max },
        (_, i) => `<div class="dot${i < this.step ? " active" : ""}"></div>`
      ).join("");
    }
  }
  updated() {
    this._updateUI();
    this._renderOverviewIfActive();
  }
  /** Inject tokens.css into our shadow root so cloned slides get the
   *  light-DOM-only styling (deck-cover > h1, .lead, .sub, etc.). */
  _ensureOverviewTokens() {
    if (this.renderRoot.querySelector("link[data-overview-tokens]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset["overviewTokens"] = "1";
    link.href = new URL("../tokens.css", import.meta.url).href;
    this.renderRoot.appendChild(link);
  }
  _renderOverviewIfActive() {
    if (!this.overview) return;
    const grid = this.renderRoot.querySelector("#overview-grid");
    if (!grid) return;
    grid.innerHTML = "";
    this._ensureOverviewTokens();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    grid.style.setProperty("--ov-thumb-w", `${vw}px`);
    grid.style.setProperty("--ov-thumb-h", `${vh}px`);
    requestAnimationFrame(() => {
      const cellW = grid.querySelector(".ov-cell")?.clientWidth ?? 360;
      grid.style.setProperty("--overview-scale", String(cellW / vw));
    });
    this.chapters.forEach((chap) => {
      const row = document.createElement("div");
      row.className = "ov-row";
      const label = document.createElement("span");
      label.className = "ov-row-label";
      const first = chap.slides[0];
      const h1 = first?.querySelector("h1");
      const sectionTitle = h1 ? Array.from(h1.childNodes).map((n) => n.nodeName === "BR" ? " " : n.textContent || "").join("").replace(/\s+/g, " ").trim() : "";
      label.textContent = sectionTitle || `Slide ${chap.startIdx + 1}`;
      row.appendChild(label);
      chap.slides.forEach((slide, j) => {
        if (j > 0) {
          const conn = document.createElement("div");
          conn.className = "ov-connector";
          row.appendChild(conn);
        }
        const idx = chap.startIdx + j;
        const cell = document.createElement("div");
        cell.className = "ov-cell";
        if (idx === this.current) cell.dataset["current"] = "1";
        const thumb = document.createElement("div");
        thumb.className = "ov-thumb";
        const clone = slide.cloneNode(true);
        clone.setAttribute("active", "");
        thumb.appendChild(clone);
        cell.appendChild(thumb);
        const num = document.createElement("span");
        num.className = "ov-cell-label";
        num.textContent = String(idx + 1);
        cell.appendChild(num);
        cell.addEventListener("click", () => {
          this.overview = false;
          this._goTo(idx);
        });
        row.appendChild(cell);
      });
      grid.appendChild(row);
    });
  }
  render() {
    return html`
      <div id="progress"></div>
      <div id="counter"></div>
      <div id="step-dots"></div>
      <div id="kb-hint">
        <kbd>←</kbd><kbd>→</kbd>
        ${this._has2DNav() ? html`<kbd>↑</kbd><kbd>↓</kbd>` : ""}
        <span>·</span>
        <kbd>O</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <div id="overview-grid"></div>
      <div id="kb-overlay" @click="${() => this._closeHelp()}">
        <div class="kb-card" @click="${(e) => e.stopPropagation()}">
          <div class="kb-card-header">
            <h3>Keyboard shortcuts</h3>
            <span class="esc"><kbd>Esc</kbd> to close</span>
          </div>
          <div class="kb-group-label">Navigation</div>
          <div class="kb-row"><span class="desc">Next slide (linear)</span><span class="keys"><kbd>Space</kbd><kbd>PgDn</kbd></span></div>
          <div class="kb-row"><span class="desc">Previous slide</span><span class="keys"><kbd>PgUp</kbd></span></div>
          <div class="kb-row"><span class="desc">Previous / Next chapter</span><span class="keys"><kbd>←</kbd><kbd>→</kbd></span></div>
          <div class="kb-row"><span class="desc">Up / Down inside a chapter</span><span class="keys"><kbd>↑</kbd><kbd>↓</kbd></span></div>
          <div class="kb-row"><span class="desc">First / Last slide</span><span class="keys"><kbd>Home</kbd><kbd>End</kbd></span></div>
          <div class="kb-group-label">View</div>
          <div class="kb-row"><span class="desc">Toggle overview</span><span class="keys"><kbd>O</kbd></span></div>
          <div class="kb-row"><span class="desc">Show this help</span><span class="keys"><kbd>?</kbd><kbd>H</kbd></span></div>
        </div>
      </div>
      <slot></slot>
    `;
  }
};
customElements.define("deck-root", DeckRoot);

// src/deck-cover.ts
import { LitElement as LitElement2, html as html2, css as css3 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";

// src/shared-styles.ts
import { css as css2 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var slideShell = css2`
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
var typo = css2`
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
var helpers = css2`
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
var DeckCover = class extends LitElement2 {
  static {
    /* Tokens:
         --deck-cover-bg          slide background          (defaults to --dark)
         --deck-cover-text        primary on-dark text      (--on-dark-text)
         --deck-cover-soft        soft on-dark text         (--on-dark-soft)
         --deck-cover-muted       very soft on-dark text    (--on-dark-muted)
         --deck-cover-faint       faintest on-dark text     (--on-dark-faint)
         --deck-cover-border      meta separator border     (--on-dark-border) */
    this.styles = [...slideBase, css3`
    :host {
      background: var(--deck-cover-bg, var(--dark));
      justify-content: center;
      color: var(--deck-cover-text, var(--on-dark-text));
    }
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
      color: var(--deck-cover-soft, var(--on-dark-soft));
    }
    .brand-context {
      font-size: var(--fs-micro); font-weight: 700;
      color: var(--deck-cover-muted, var(--on-dark-muted));
      letter-spacing: 0.2em; text-transform: uppercase;
      padding-left: var(--sp-3);
      border-left: 1px solid var(--deck-cover-border, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: clamp(3.6rem, 9vw, 8.5rem); font-weight: 900;
      color: var(--deck-cover-text, var(--on-dark-text));
      line-height: 1.02; letter-spacing: -0.035em;
      margin-bottom: var(--sp-4);
      border: none; padding: 0;
    }
    ::slotted(.sub) {
      font-size: var(--fs-h2);
      color: var(--deck-cover-muted, var(--on-dark-muted));
      margin-bottom: var(--sp-6); max-width: 60ch; line-height: 1.45;
      display: block;
    }
    .meta {
      display: flex; gap: var(--sp-6);
      border-top: 1px solid var(--deck-cover-border, var(--on-dark-border));
      padding-top: var(--sp-4);
    }
    .meta-item strong {
      display: block; font-size: var(--fs-micro); letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--deck-cover-faint, var(--on-dark-faint));
      margin-bottom: 6px; font-weight: 700;
    }
    .meta-item span {
      color: var(--deck-cover-text, var(--on-dark-text));
      font-size: var(--fs-body); font-weight: 600;
    }
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
    return html2`
      <div class="brand" part="brand">
        ${hasMark ? html2`<span class="brand-tile"><img src="${this.brandSrc}" alt="${brandName || ""}"></span>` : ""}
        ${brandName ? html2`<span class="brand-name">${brandName}</span>` : ""}
        ${context ? html2`<span class="brand-context">${context}</span>` : ""}
      </div>
      <slot></slot>
      ${items.length ? html2`
        <div class="meta" part="meta">
          ${items.map((i) => html2`
            <div class="meta-item"><strong>${i.l}</strong><span>${i.v}</span></div>
          `)}
        </div>` : ""}
    `;
  }
};
customElements.define("deck-cover", DeckCover);

// src/deck-section.ts
import { LitElement as LitElement3, html as html3, css as css4 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckSection = class extends LitElement3 {
  static {
    /* Tokens:
         --deck-section-bg          (defaults to --dark)
         --deck-section-num-color   small section number      (--on-dark-faint)
         --deck-section-rule-color  line on each side         (--on-dark-border)
         --deck-section-title-color (defaults to --yellow)
         --deck-section-em-color    italic inside h1          (--on-dark-soft) */
    this.styles = [...slideBase, css4`
    :host {
      background: var(--deck-section-bg, var(--dark));
      color: var(--on-dark-text);
      justify-content: center; align-items: center; text-align: center;
    }
    .sec-num {
      font-size: var(--fs-micro); font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--deck-section-num-color, var(--on-dark-faint));
      margin-bottom: var(--sp-3);
      display: inline-flex; align-items: center; gap: 0.8rem;
      font-family: var(--mono);
    }
    .sec-num::before, .sec-num::after {
      content: ''; width: 32px; height: 1px;
      background: var(--deck-section-rule-color, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: var(--fs-section); font-weight: 900;
      color: var(--deck-section-title-color, var(--yellow));
      line-height: 1.02; letter-spacing: -0.03em;
      max-width: 18ch;
      border: none; padding: 0; margin: 0;
      text-align: center; align-self: center;
    }
    ::slotted(h1 em) {
      color: var(--deck-section-em-color, var(--on-dark-soft));
      font-style: normal; font-weight: 700;
    }
  `];
  }
  static {
    this.properties = { num: { type: String } };
  }
  render() {
    return html3`
      ${this.num ? html3`<div class="sec-num" part="num">${this.num}</div>` : ""}
      <slot></slot>
    `;
  }
};
customElements.define("deck-section", DeckSection);

// src/deck-hero.ts
import { LitElement as LitElement4, html as html4, css as css5 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckHero = class extends LitElement4 {
  static {
    this.styles = [...slideBase, css5`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      justify-content: flex-start;
      gap: var(--sp-3);
      overflow: hidden;
    }
    ::slotted(deck-code:not([nested])),
    ::slotted(deck-mermaid),
    ::slotted(table),
    ::slotted(pre),
    ::slotted(svg),
    ::slotted(.hero-main) { max-height: 100%; flex: 0 1 auto; }
  `];
  }
  static {
    this.properties = { eyebrow: { type: String } };
  }
  render() {
    return html4`
      ${this.eyebrow ? html4`<span class="lbl">${this.eyebrow}</span>` : ""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
};
customElements.define("deck-hero", DeckHero);

// src/deck-split.ts
import { LitElement as LitElement5, html as html5, css as css6 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckSplit = class extends LitElement5 {
  static {
    this.styles = [...slideBase, css6`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: minmax(0, 1fr);
      gap: var(--_gap, var(--sp-5));
    }
    :host([cols="1-2"]) .body { grid-template-columns: 1fr 2fr; }
    :host([cols="2-1"]) .body { grid-template-columns: 2fr 1fr; }
    :host([cols="3"])   .body { grid-template-columns: 1fr 1fr 1fr; gap: var(--_gap, var(--sp-4)); }
    .col {
      display: flex; flex-direction: column;
      min-height: 0; min-width: 0;
      gap: var(--_col-gap, var(--sp-3));
      overflow: hidden;
    }
    .col.center { justify-content: center; }
  `];
  }
  static {
    this.properties = {
      eyebrow: { type: String },
      cols: { type: String },
      // '1-1' (default), '1-2', '2-1', '3'
      gap: { type: String },
      // between-column gap · '1'..'6' or raw value
      colGap: { type: String, attribute: "col-gap" }
      // inside-column gap · '1'..'6' or raw value
    };
  }
  /** Map '1'..'6' to var(--sp-N); fall through to raw values otherwise. */
  _resolveSp(v) {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--sp-${n})`;
    return v;
  }
  updated() {
    if (this.gap) this.style.setProperty("--_gap", this._resolveSp(this.gap));
    if (this.colGap) this.style.setProperty("--_col-gap", this._resolveSp(this.colGap));
  }
  render() {
    const hasA = this.querySelector('[slot="a"]');
    const isThree = this.cols === "3" || hasA;
    return html5`
      ${this.eyebrow ? html5`<span class="lbl">${this.eyebrow}</span>` : ""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body">
        ${isThree ? html5`
          <div class="col" part="col"><slot name="a"></slot></div>
          <div class="col" part="col"><slot name="b"></slot></div>
          <div class="col" part="col"><slot name="c"></slot></div>
        ` : html5`
          <div class="col" part="col"><slot name="left"></slot></div>
          <div class="col" part="col"><slot name="right"></slot></div>
        `}
      </div>
    `;
  }
};
customElements.define("deck-split", DeckSplit);

// src/deck-hero-detail.ts
import { LitElement as LitElement6, html as html6, css as css7 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckHeroDetail = class extends LitElement6 {
  static {
    this.styles = [...slideBase, css7`
    :host { justify-content: flex-start; }
    /* The hero (code/chart) gets at least half the available height; .detail
       (bullets + diagram) is capped at ~40%. Without these caps a tall mermaid
       can grow to its intrinsic size and squeeze .hero to 0 (this is what
       happens in overview clones, which render the diagrams from scratch). */
    .hero {
      flex: 1 1 50%; min-height: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    ::slotted(deck-code), ::slotted(deck-mermaid), ::slotted(pre), ::slotted(table), ::slotted(svg) {
      max-height: 100%; flex: 1 1 auto;
    }
    .detail {
      flex: 0 1 40%;
      min-height: 0;
      margin-top: var(--sp-3);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-4);
      overflow: hidden;
    }
    .col {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
  `];
  }
  static {
    this.properties = { eyebrow: { type: String } };
  }
  render() {
    return html6`
      ${this.eyebrow ? html6`<span class="lbl">${this.eyebrow}</span>` : ""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="hero" part="hero"><slot></slot></div>
      <div class="detail" part="detail">
        <div class="col"><slot name="left"></slot></div>
        <div class="col"><slot name="right"></slot></div>
      </div>
    `;
  }
};
customElements.define("deck-hero-detail", DeckHeroDetail);

// src/deck-hook.ts
import { LitElement as LitElement7, html as html7, css as css8 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckHook = class extends LitElement7 {
  static {
    /* Tokens:
         --deck-hook-bg               (defaults to --dark)
         --deck-hook-display-color    (defaults to --yellow)
         --deck-hook-caption-color    (defaults to --on-dark-muted)
         --deck-hook-gap              vertical gap between elements */
    this.styles = [...slideBase, css8`
    :host {
      background: var(--deck-hook-bg, var(--dark));
      color: var(--on-dark-text);
      justify-content: center; align-items: center; text-align: center;
    }
    .body {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--deck-hook-gap, var(--sp-4));
      max-width: 75vw;
    }
    ::slotted(.display) {
      font-family: var(--display, var(--sans));
      font-size: clamp(3rem, 7vw, 5.5rem);
      font-weight: 900;
      color: var(--deck-hook-display-color, var(--yellow));
      letter-spacing: -0.03em; line-height: 1.05;
      margin: 0;
    }
    ::slotted(.display.danger) { color: var(--red); }
    ::slotted(.caption) {
      font-size: var(--fs-lead);
      color: var(--deck-hook-caption-color, var(--on-dark-muted));
    }
  `];
  }
  static {
    this.properties = { kicker: { type: String } };
  }
  render() {
    return html7`
      <div class="body" part="body">
        ${this.kicker ? html7`<span class="kicker on-dark">${this.kicker}</span>` : ""}
        <slot></slot>
      </div>
    `;
  }
};
customElements.define("deck-hook", DeckHook);

// src/deck-md.ts
import { LitElement as LitElement8, html as html8, css as css9 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12/+esm";
marked.setOptions({ gfm: true, breaks: false });
var DeckMd = class extends LitElement8 {
  static {
    this.styles = css9`
    :host { display: block; color: var(--soft); font-family: var(--sans); }
    h1, h2, h3, h4 { color: var(--text); font-weight: 700; letter-spacing: -0.01em; }
    h2 { font-size: var(--fs-h2); margin-bottom: var(--sp-2); }
    h3 { font-size: var(--fs-lead); margin-bottom: var(--sp-2); margin-top: var(--sp-3); }
    h4 { font-size: var(--fs-body); margin-bottom: var(--sp-1); margin-top: var(--sp-3); }
    p { font-size: var(--fs-body); line-height: 1.65; margin: 0 0 var(--sp-3); }
    p:last-child { margin-bottom: 0; }
    strong { color: var(--text); font-weight: 700; }
    em { font-style: italic; }
    code {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
    pre {
      background: var(--deck-md-pre-bg, var(--code-bg));
      border: 1px solid var(--deck-md-pre-border, var(--code-border));
      border-radius: var(--r-md);
      padding: var(--sp-3) var(--sp-4);
      overflow: auto;
      font-family: var(--mono); font-size: var(--fs-mono);
      line-height: 1.75; color: var(--deck-md-pre-text, var(--code-text));
      margin: 0 0 var(--sp-3);
      box-shadow: var(--shadow-card);
    }
    pre code { background: none; padding: 0; color: inherit; border-radius: 0; }
    ul, ol { padding-left: 1.4rem; margin: 0 0 var(--sp-3); }
    li { margin-bottom: var(--sp-1); font-size: var(--fs-body); line-height: 1.55; }
    li::marker { color: var(--yellow); }
    a { color: var(--yellow); text-decoration: underline; text-decoration-thickness: 1px; }
    blockquote {
      border-left: 3px solid var(--yellow);
      padding: var(--sp-1) var(--sp-3);
      color: var(--muted); font-style: italic;
      margin: 0 0 var(--sp-3);
    }
    hr { border: none; border-top: 1px solid var(--border); margin: var(--sp-4) 0; }
    .content { display: contents; }
  `;
  }
  static {
    this.properties = { _html: { state: true } };
  }
  connectedCallback() {
    super.connectedCallback();
    this._parse();
  }
  _parse() {
    const raw = this.textContent || "";
    const lines = raw.split("\n");
    const indent = lines.filter((l) => l.trim().length > 0).reduce((min, l) => Math.min(min, l.match(/^ */)[0].length), Infinity);
    const cleaned = indent === Infinity ? raw : lines.map((l) => l.slice(indent)).join("\n");
    this._html = marked.parse(cleaned.trim());
    this.textContent = "";
  }
  render() {
    return html8`<div class="content" .innerHTML="${this._html || ""}"></div>`;
  }
};
customElements.define("deck-md", DeckMd);

// src/deck-code.ts
import { LitElement as LitElement9, html as html9, css as css10 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
function highlight(src, lang) {
  let s = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const placeholders = [];
  const stash = (cls, text) => {
    const id = "P" + placeholders.length + "E";
    placeholders.push('<span class="' + cls + '">' + text + "</span>");
    return id;
  };
  const isHtml = lang === "html" || lang === "xml" || lang === "svg";
  const isCss = lang === "css" || lang === "scss" || lang === "less";
  if (isHtml) {
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (m) => stash("cmt", m));
    s = s.replace(/(&lt;!doctype[^&]*&gt;)/gi, (m) => stash("cmt", m));
    s = s.replace(/("[^"]*"|'[^']*')/g, (m) => stash("str", m));
    s = s.replace(
      /(&lt;\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g,
      (_, lt, tag) => lt + stash("kw", tag)
    );
    s = s.replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/g, (m) => stash("prop", m));
  } else if (isCss) {
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, (m) => stash("cmt", m));
    s = s.replace(/("[^"]*"|'[^']*')/g, (m) => stash("str", m));
    s = s.replace(/([a-zA-Z-]+)(?=\s*:)/g, (m) => stash("prop", m));
    s = s.replace(/(#[0-9a-fA-F]{3,8})\b/g, (m) => stash("num", m));
    s = s.replace(
      /\b(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg)?/g,
      (_, n, u) => stash("num", n + (u || ""))
    );
  } else {
    s = s.replace(/(\/\/[^\n]*)/g, (m) => stash("cmt", m));
    s = s.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (m) => stash("str", m));
    s = s.replace(
      /\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,
      (m) => stash("kw", m)
    );
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => stash("num", m));
  }
  s = s.replace(/P(\d+)E/g, (_, i) => placeholders[+i]);
  return s;
}
var DeckCode = class extends LitElement9 {
  static {
    /* Customization tokens:
         --deck-code-bg / -border / -text
         --deck-code-radius / -padding-y / -padding-x
         --deck-code-syntax-{kw,str,num,cmt,ty,prop,fn}
       All default to the theme's --code-* tokens. */
    this.styles = css10`
    :host {
      display: block;
      background: var(--deck-code-bg, var(--code-bg));
      border: 1px solid var(--deck-code-border, var(--code-border));
      border-radius: var(--deck-code-radius, var(--r-md));
      padding: var(--deck-code-padding-y, var(--sp-3)) var(--deck-code-padding-x, var(--sp-4));
      font-family: var(--mono);
      font-size: var(--fs-mono);
      line-height: 1.7;
      color: var(--deck-code-text, var(--code-text));
      box-shadow: var(--shadow-card);
      overflow: auto;
      white-space: pre;
    }
    :host([hero]) { display: flex; align-items: safe center; padding: var(--sp-4) var(--sp-5); }
    :host([nested]) {
      box-shadow: none;
      border-radius: var(--r-sm);
      padding: var(--sp-2) var(--sp-3);
    }
    pre { margin: 0; font: inherit; color: inherit; }
    code { display: block; width: 100%; font: inherit; color: inherit; }
    .line { transition: opacity 0.25s ease; display: block; }
    .line.dim { opacity: 0.25; }
    .line.lit { opacity: 1; }
    .kw   { color: var(--deck-code-syntax-kw,   var(--code-kw)); }
    .fn   { color: var(--deck-code-syntax-fn,   var(--code-fn)); }
    .str  { color: var(--deck-code-syntax-str,  var(--code-str)); }
    .num  { color: var(--deck-code-syntax-num,  var(--code-num)); }
    .cmt  { color: var(--deck-code-syntax-cmt,  var(--code-cmt)); font-style: italic; }
    .ty   { color: var(--deck-code-syntax-ty,   var(--code-ty)); }
    .prop { color: var(--deck-code-syntax-prop, var(--code-prop)); }
  `;
  }
  static {
    this.properties = {
      lang: { type: String },
      hero: { type: Boolean, reflect: true },
      nested: { type: Boolean, reflect: true },
      "step-groups": { attribute: "step-groups", type: String },
      _html: { state: true }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._highlight();
    try {
      this._groups = JSON.parse(this.getAttribute("step-groups") || "null");
    } catch {
      this._groups = null;
    }
  }
  _highlight() {
    const raw = this.textContent || "";
    const lines = raw.split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indent = lines.filter((l) => l.trim().length > 0).reduce((min, l) => Math.min(min, l.match(/^ */)[0].length), Infinity);
    const cleaned = indent === Infinity ? lines : lines.map((l) => l.slice(indent));
    this._html = cleaned.map(
      (line, i) => '<span class="line" data-line="' + (i + 1) + '">' + highlight(line || " ", this.lang) + "</span>"
    ).join("");
  }
  applyStep(n) {
    if (!this._groups) return;
    const lines = this.shadowRoot?.querySelectorAll(".line");
    if (!lines) return;
    if (n === 0) {
      lines.forEach((l) => l.classList.remove("dim", "lit"));
    } else {
      const active = this._groups[Math.min(n - 1, this._groups.length - 1)];
      lines.forEach((l) => {
        const num = parseInt(l.dataset.line, 10);
        l.classList.toggle("lit", active.includes(num));
        l.classList.toggle("dim", !active.includes(num));
      });
    }
  }
  render() {
    return html9`<pre><code .innerHTML="${this._html || ""}"></code></pre>`;
  }
};
customElements.define("deck-code", DeckCode);

// src/deck-callout.ts
import { LitElement as LitElement10, html as html10, css as css11 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var ICONS = {
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>'
};
var DeckCallout = class extends LitElement10 {
  static {
    this.styles = css11`
    :host {
      display: flex; gap: var(--sp-3);
      padding: var(--deck-callout-padding-y, var(--sp-3)) var(--deck-callout-padding-x, var(--sp-4));
      border-radius: var(--deck-callout-radius, var(--r-md));
      background: var(--deck-callout-bg, var(--surface-info));
      border: 1px solid var(--deck-callout-border, var(--border-info));
      box-shadow: var(--shadow-card);
      align-items: center;
      color: var(--soft);
      font-family: var(--sans);
      font-size: var(--fs-body); line-height: 1.55;
    }
    /* Type-based mapping · every value points at a theme token. */
    :host([type="info"])   { --deck-callout-bg: var(--surface-info);   --deck-callout-border: var(--border-info);   --deck-callout-stroke: var(--yellow); }
    :host([type="warn"])   { --deck-callout-bg: var(--surface-warn);   --deck-callout-border: var(--border-warn);   --deck-callout-stroke: var(--orange); }
    :host([type="danger"]) { --deck-callout-bg: var(--surface-bad);    --deck-callout-border: var(--border-bad);    --deck-callout-stroke: var(--red); }
    :host([type="ok"])     { --deck-callout-bg: var(--surface-ok);     --deck-callout-border: var(--border-ok);     --deck-callout-stroke: var(--green); }

    .icon-box {
      flex-shrink: 0;
      width: var(--icon-2xl); height: var(--icon-2xl);
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--surface-tint);
    }
    .icon-box svg {
      width: var(--icon-lg); height: var(--icon-lg);
      stroke: var(--deck-callout-stroke, var(--yellow));
      stroke-width: 2.2;
    }
    .content { flex: 1; }
    ::slotted(p) { margin: 0; }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
  `;
  }
  static {
    this.properties = { type: { type: String } };
  }
  render() {
    const t = this.type || "info";
    const icon = ICONS[t] || ICONS.info;
    return html10`
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             .innerHTML="${icon}"></svg>
      </div>
      <div class="content"><slot></slot></div>
    `;
  }
};
customElements.define("deck-callout", DeckCallout);

// src/deck-card.ts
import { LitElement as LitElement11, html as html11, css as css12 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckCard = class extends LitElement11 {
  static {
    this.styles = css12`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: var(--sp-3) var(--sp-4);
      box-shadow: var(--shadow-card);
      min-height: 0;
      font-family: var(--sans);
      color: var(--soft);
    }
    :host([color="yellow"]) { background: var(--surface-info-faint); border-color: var(--border-info); }
    :host([color="orange"]) { background: var(--surface-warn);       border-color: var(--border-warn); }
    :host([color="green"])  { background: var(--surface-ok);         border-color: var(--border-ok); }
    :host([color="red"])    { background: var(--surface-bad);        border-color: var(--border-bad); }
    ::slotted(h3) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-h2);
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin: 0;
    }
    ::slotted(p) {
      font-size: var(--fs-body);
      line-height: 1.55;
      margin: 0;
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    :host([center])  { text-align: center; align-items: center; }
    :host([compact]) { padding: var(--sp-2) var(--sp-3); }
  `;
  }
  static {
    this.properties = { color: { type: String } };
  }
  render() {
    return html11`<slot></slot>`;
  }
};
customElements.define("deck-card", DeckCard);

// src/deck-mermaid.ts
import { LitElement as LitElement12, html as html12, css as css13 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var mermaidReady = false;
async function ensureMermaid() {
  if (mermaidReady) return;
  if (!window.mermaid) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      background: "#0f0f10",
      mainBkg: "#2a2a2a",
      nodeBorder: "#555",
      lineColor: "#777",
      textColor: "#e5e5e5",
      fontSize: "13px",
      edgeLabelBackground: "#111"
    },
    flowchart: { curve: "basis", htmlLabels: true, padding: 12 },
    securityLevel: "loose"
  });
  mermaidReady = true;
}
var mermaidId = 0;
var DeckMermaid = class extends LitElement12 {
  static {
    /* Tokens:
         --deck-mermaid-bg / -border / -radius / -padding
       Defaults to the --code-* theme tokens · diagrams sit on the same
       dark surface as code blocks for visual consistency. */
    this.styles = css13`
    :host {
      display: flex; align-items: center; justify-content: center;
      background: var(--deck-mermaid-bg, var(--code-bg));
      border: 1px solid var(--deck-mermaid-border, var(--code-border));
      border-radius: var(--deck-mermaid-radius, var(--r-md));
      padding: var(--deck-mermaid-padding, var(--sp-4));
      box-shadow: var(--shadow-card);
      overflow: hidden;
      min-width: 0;
    }
    :host([compact]) { padding: var(--sp-2); }
    .canvas { width: 100%; max-width: 100%; text-align: center; overflow: hidden; }
    .canvas svg { width: 100% !important; height: auto !important; max-width: 100% !important; max-height: 60vh; }
    :host([compact]) .canvas { max-width: 60%; }
    :host([compact]) .canvas svg { max-height: 22vh; }
  `;
  }
  static {
    this.properties = {
      _svg: { state: true },
      rendered: { type: Boolean, reflect: true }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._source = (this.textContent || "").trim();
    const lines = this._source.split("\n");
    const indent = lines.filter((l) => l.trim()).reduce((m, l) => Math.min(m, l.match(/^ */)[0].length), Infinity);
    if (indent < Infinity) this._source = lines.map((l) => l.slice(indent)).join("\n");
    this.render = this.render.bind(this);
    this._render();
  }
  async _render() {
    if (!this._source) return;
    await ensureMermaid();
    const id = `mmd-${++mermaidId}`;
    try {
      const { svg } = await window.mermaid.render(id, this._source);
      this._svg = svg;
      this.rendered = true;
    } catch (e) {
      console.error("Mermaid render error", e);
      this._svg = `<pre style="color:#f87171">${e.message}</pre>`;
    }
  }
  render() {
    return html12`<div class="canvas" .innerHTML="${this._svg || ""}"></div>`;
  }
};
customElements.define("deck-mermaid", DeckMermaid);

// src/deck-step-list.ts
import { LitElement as LitElement13, html as html13, css as css14 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckStepList = class extends LitElement13 {
  static {
    this.styles = css14`
    :host {
      display: flex; flex-direction: column;
      gap: var(--gap-xs);
    }
  `;
  }
  render() {
    return html13`<slot></slot>`;
  }
};
customElements.define("deck-step-list", DeckStepList);
var DeckStep = class extends LitElement13 {
  static {
    this.styles = css14`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--gap-xs) var(--sp-3);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
      font-size: var(--fs-body);
    }
    .step-num {
      flex: 0 0 auto;
      width: var(--icon-sm); height: var(--icon-sm);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--yellow); color: var(--dark);
      border-radius: 50%;
      font: 700 var(--fs-micro)/1 var(--sans);
    }
    .label {
      flex: 1;
      font-family: var(--mono); font-weight: 600;
      color: var(--text);
    }
    .chip {
      flex: 0 0 auto;
      display: inline-block;
      padding: 2px var(--sp-2);
      background: var(--surface-tint);
      color: var(--muted);
      border-radius: var(--r-pill);
      font: 600 var(--fs-small)/1.4 var(--sans);
    }
  `;
  }
  static {
    this.properties = {
      n: { type: String },
      note: { type: String }
    };
  }
  render() {
    return html13`
      <span class="step-num">${this.n}</span>
      <span class="label"><slot></slot></span>
      ${this.note ? html13`<span class="chip">${this.note}</span>` : ""}
    `;
  }
};
customElements.define("deck-step", DeckStep);

// src/deck-metric.ts
import { LitElement as LitElement14, html as html14, css as css15 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckMetricList = class extends LitElement14 {
  static {
    this.styles = css15`
    :host { display: flex; flex-direction: column; gap: var(--sp-2); }
  `;
  }
  render() {
    return html14`<slot></slot>`;
  }
};
customElements.define("deck-metric-list", DeckMetricList);
var DeckMetric = class extends LitElement14 {
  static {
    this.styles = css15`
    :host {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--sp-2) var(--sp-4);
      font-family: var(--sans);
      font-size: var(--fs-body);
      color: var(--soft);
      box-shadow: var(--shadow-card);
    }
    .label { font-family: inherit; }
    .label.mono { font-family: var(--mono); font-size: var(--fs-small); color: var(--muted); }
    .value { font-weight: 700; }
    .value[data-severity="bad"]  { color: var(--red); }
    .value[data-severity="warn"] { color: var(--orange); }
    .value[data-severity="ok"]   { color: var(--green); }
    .value[data-severity="info"] { color: var(--text-info); }
  `;
  }
  static {
    this.properties = {
      value: { type: String },
      severity: { type: String },
      mono: { type: Boolean }
    };
  }
  render() {
    return html14`
      <span class="label ${this.mono ? "mono" : ""}"><slot></slot></span>
      <span class="value" data-severity="${this.severity || ""}">${this.value}</span>
    `;
  }
};
customElements.define("deck-metric", DeckMetric);

// src/deck-tier-list.ts
import { LitElement as LitElement15, html as html15, css as css16 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckTierList = class extends LitElement15 {
  static {
    this.styles = css16`
    :host { display: flex; flex-direction: column; gap: var(--gap-xs); }
  `;
  }
  render() {
    return html15`<slot></slot>`;
  }
};
customElements.define("deck-tier-list", DeckTierList);
var DeckTier = class extends LitElement15 {
  static {
    this.styles = css16`
    :host {
      display: flex; flex-direction: column; gap: var(--gap-hair);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--sp-2) var(--sp-4);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
    }
    :host([hot]) {
      border-color: var(--border-info);
      background: var(--surface-info-faint);
    }
    .head {
      display: flex; justify-content: space-between; align-items: baseline;
    }
    .name { font: 700 var(--fs-body)/1 var(--mono); color: var(--text); }
    :host([hot]) .name { color: var(--yellow); }
    .speed { font: 700 var(--fs-body)/1 var(--mono); }
    .speed[data-severity="muted"] { color: var(--muted); }
    .speed[data-severity="warn"]  { color: var(--orange); }
    .speed[data-severity="ok"]    { color: var(--green); }
    :host([hot]) .speed { color: var(--yellow); }
    .desc { font-size: var(--fs-small); color: var(--muted); line-height: 1.4; }
  `;
  }
  static {
    this.properties = {
      name: { type: String },
      speed: { type: String },
      severity: { type: String },
      hot: { type: Boolean, reflect: true }
    };
  }
  render() {
    return html15`
      <div class="head">
        <span class="name">${this.name}</span>
        <span class="speed" data-severity="${this.severity || (this.hot ? "hot" : "")}">${this.speed}</span>
      </div>
      <div class="desc"><slot></slot></div>
    `;
  }
};
customElements.define("deck-tier", DeckTier);
var DeckTierArrow = class extends LitElement15 {
  static {
    this.styles = css16`
    :host {
      display: block; text-align: center;
      color: var(--muted); opacity: var(--opacity-soft);
      font-size: var(--fs-micro);
      padding: 2px 0;
    }
  `;
  }
  render() {
    return html15`<slot></slot>`;
  }
};
customElements.define("deck-tier-arrow", DeckTierArrow);

// src/deck-badge.ts
import { LitElement as LitElement16, html as html16, css as css17 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckBadge = class extends LitElement16 {
  static {
    this.styles = css17`
    :host {
      display: inline-block;
      padding: var(--deck-badge-padding-y, var(--sp-1)) var(--deck-badge-padding-x, var(--sp-3));
      margin-bottom: var(--sp-2);
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: var(--deck-badge-radius, var(--r-pill));
      background: var(--deck-badge-bg, var(--surface-tint));
      color: var(--deck-badge-fg, var(--muted));
      border: 1px solid var(--deck-badge-border, var(--border));
    }
    :host([type="bad"])  { --deck-badge-bg: var(--surface-bad);          --deck-badge-fg: var(--red);       --deck-badge-border: var(--border-bad); }
    :host([type="ok"])   { --deck-badge-bg: var(--surface-ok);           --deck-badge-fg: var(--green);     --deck-badge-border: var(--border-ok); }
    :host([type="info"]) { --deck-badge-bg: var(--surface-info-strong);  --deck-badge-fg: var(--text-info); --deck-badge-border: var(--border-info); }
    :host([type="warn"]) { --deck-badge-bg: var(--surface-warn);         --deck-badge-fg: var(--orange);    --deck-badge-border: var(--border-warn); }
  `;
  }
  static {
    this.properties = { type: { type: String } };
  }
  render() {
    return html16`<slot></slot>`;
  }
};
customElements.define("deck-badge", DeckBadge);

// src/deck-kicker.ts
import { LitElement as LitElement17, html as html17, css as css18 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckKicker = class extends LitElement17 {
  static {
    this.styles = css18`
    :host {
      display: block;
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: var(--sp-2);
    }
    :host([on-dark]) { color: var(--on-dark-muted); }
  `;
  }
  render() {
    return html17`<slot></slot>`;
  }
};
customElements.define("deck-kicker", DeckKicker);

// src/deck-stack.ts
import { LitElement as LitElement18, html as html18, css as css19 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around"
};
var ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch"
};
var DeckStack = class extends LitElement18 {
  static {
    this.styles = css19`
    :host {
      display: flex;
      flex-direction: var(--_dir, column);
      gap: var(--_gap, var(--sp-3));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; }
  `;
  }
  static {
    this.properties = {
      gap: { type: String },
      direction: { type: String },
      align: { type: String },
      justify: { type: String }
    };
  }
  updated() {
    const n = parseInt(this.gap, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) {
      this.style.setProperty("--_gap", `var(--sp-${n})`);
    } else if (this.gap) {
      this.style.setProperty("--_gap", this.gap);
    }
    this.style.setProperty("--_dir", this.direction === "row" ? "row" : "column");
    if (this.align) this.style.setProperty("--_align", ALIGN[this.align] || this.align);
    if (this.justify) this.style.setProperty("--_justify", JUSTIFY[this.justify] || this.justify);
  }
  render() {
    return html18`<slot></slot>`;
  }
};
customElements.define("deck-stack", DeckStack);

// src/deck-grid.ts
import { LitElement as LitElement19, html as html19, css as css20 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var MAP = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch"
};
function expandTracks(value) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && String(n) === value.trim() && n >= 1 && n <= 12) {
    return `repeat(${n}, minmax(0, 1fr))`;
  }
  return value;
}
function expandGap(value) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--sp-${n})`;
  return value;
}
var DeckGrid = class extends LitElement19 {
  static {
    this.styles = css20`
    :host {
      display: grid;
      grid-template-columns: var(--_cols, 1fr);
      grid-template-rows:    var(--_rows, auto);
      gap:           var(--_gap, var(--sp-3));
      align-items:   var(--_align, stretch);
      justify-items: var(--_justify, stretch);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; height: 100%; }
  `;
  }
  static {
    this.properties = {
      cols: { type: String },
      rows: { type: String },
      gap: { type: String },
      align: { type: String },
      justify: { type: String }
    };
  }
  updated() {
    const cols = expandTracks(this.cols);
    const rows = expandTracks(this.rows);
    const gap = expandGap(this.gap);
    if (cols) this.style.setProperty("--_cols", cols);
    if (rows) this.style.setProperty("--_rows", rows);
    if (gap) this.style.setProperty("--_gap", gap);
    if (this.align) this.style.setProperty("--_align", MAP[this.align] || this.align);
    if (this.justify) this.style.setProperty("--_justify", MAP[this.justify] || this.justify);
  }
  render() {
    return html19`<slot></slot>`;
  }
};
customElements.define("deck-grid", DeckGrid);

// src/deck-punch.ts
import { LitElement as LitElement20, html as html20, css as css21 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var TONES = {
  warn: "var(--orange)",
  danger: "var(--red)",
  ok: "var(--green)",
  info: "var(--yellow)",
  muted: "var(--muted)",
  accent: "var(--yellow)"
};
var SIZES = {
  lead: "var(--fs-lead)",
  big: "var(--fs-big)",
  mega: "var(--fs-mega)",
  stat: "var(--fs-stat)",
  display: "clamp(2.6rem, 6vw, 5rem)"
};
var DeckPunch = class extends LitElement20 {
  static {
    this.styles = css21`
    :host {
      display: block;
      margin: 0;
      font-family: var(--display, var(--sans));
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-size: var(--deck-punch-size, var(--_size, var(--fs-lead)));
      /* "inherit" lets us pick up the on-dark color of cover/hook/section · the
         color is only overridden when a tone is explicitly chosen. */
      color:     var(--deck-punch-color, var(--_color, inherit));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([weight="800"]) { font-weight: 800; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"])  { text-align: right; }
  `;
  }
  static {
    this.properties = {
      tone: { type: String },
      size: { type: String },
      weight: { type: String, reflect: true },
      align: { type: String, reflect: true }
    };
  }
  updated() {
    if (this.tone && TONES[this.tone]) {
      this.style.setProperty("--_color", TONES[this.tone]);
    } else {
      this.style.removeProperty("--_color");
    }
    if (this.size && SIZES[this.size]) {
      this.style.setProperty("--_size", SIZES[this.size]);
    } else {
      this.style.removeProperty("--_size");
    }
  }
  render() {
    return html20`<slot></slot>`;
  }
};
customElements.define("deck-punch", DeckPunch);

// src/deck-stat.ts
import { LitElement as LitElement21, html as html21, css as css22 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var TONES2 = {
  yellow: "var(--yellow)",
  orange: "var(--orange)",
  green: "var(--green)",
  red: "var(--red)",
  purple: "var(--purple)",
  lime: "var(--lime)",
  cyan: "var(--cyan)"
};
var DeckStat = class extends LitElement21 {
  static {
    this.styles = css22`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      padding: var(--sp-4) var(--sp-3);
      border-left: 4px solid var(--_c, var(--yellow));
      min-width: 0;
      font-family: var(--sans);
    }
    .num {
      font-family: var(--display, var(--sans));
      font-size: clamp(3.5rem, 7vw, 6rem);
      font-weight: 900;
      line-height: 0.9;
      color: var(--_c, var(--yellow));
      letter-spacing: -0.04em;
    }
    ::slotted([slot="claim"]) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-strong);
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .body {
      font-size: var(--fs-body);
      color: var(--muted);
      line-height: 1.45;
      margin-top: var(--sp-2);
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); color: var(--text);
      padding: 2px 6px; border-radius: var(--r-sm);
    }
  `;
  }
  static {
    this.properties = {
      num: { type: String },
      tone: { type: String }
    };
  }
  updated() {
    if (this.tone) this.style.setProperty("--_c", TONES2[this.tone] || this.tone);
  }
  render() {
    return html21`
      ${this.num ? html21`<div class="num" part="num">${this.num}</div>` : ""}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
};
customElements.define("deck-stat", DeckStat);

// src/deck-shortcut.ts
import { LitElement as LitElement22, html as html22, css as css23 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckKbd = class extends LitElement22 {
  static {
    this.styles = css23`
    :host {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-bottom: 3px solid var(--surface-tint-strong, rgba(0,0,0,0.10));
      border-radius: 5px;
      padding: 3px 8px;
      font: 700 0.92rem/1 var(--mono);
      color: var(--text);
      min-width: 22px;
      text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
    }
    :host([tone="accent"]) {
      background: var(--yellow);
      color: var(--dark);
      border-color: rgba(0,0,0,0.15);
    }
    :host([tone="ok"]) {
      background: var(--green);
      color: var(--dark);
      border-color: rgba(0,0,0,0.15);
    }
  `;
  }
  render() {
    return html22`<slot></slot>`;
  }
};
customElements.define("deck-kbd", DeckKbd);
var DeckShortcut = class extends LitElement22 {
  static {
    this.styles = css23`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-2) 0;
      font-family: var(--sans);
    }
    .keys { display: inline-flex; gap: 4px; flex-shrink: 0; }
    .keys deck-kbd, .keys .k {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-bottom: 3px solid rgba(0,0,0,0.10);
      border-radius: 5px;
      padding: 3px 8px;
      font: 700 0.92rem/1 var(--mono);
      color: var(--text);
      min-width: 22px; text-align: center;
    }
    .body { flex: 1; min-width: 0; }
    .label {
      font: 700 var(--fs-body)/1.2 var(--sans);
      color: var(--text);
    }
    .note {
      font: 400 var(--fs-small)/1.4 var(--sans);
      color: var(--muted);
      margin-top: 2px;
    }
    :host([tone="accent"]) .keys .k { background: var(--yellow); color: var(--dark); border-color: rgba(0,0,0,0.15); }
    :host([tone="ok"])     .keys .k { background: var(--green);  color: var(--dark); border-color: rgba(0,0,0,0.15); }
  `;
  }
  static {
    this.properties = {
      keys: { type: String },
      label: { type: String },
      note: { type: String },
      tone: { type: String }
    };
  }
  render() {
    const keyTokens = (this.keys || "").trim().split(/\s+/).filter(Boolean);
    return html22`
      <span class="keys" part="keys">
        ${keyTokens.map((k) => html22`<span class="k">${k}</span>`)}
      </span>
      <div class="body" part="body">
        ${this.label ? html22`<div class="label">${this.label}</div>` : ""}
        ${this.note ? html22`<div class="note">${this.note}</div>` : html22`<div class="note"><slot></slot></div>`}
      </div>
    `;
  }
};
customElements.define("deck-shortcut", DeckShortcut);
var DeckShortcutList = class extends LitElement22 {
  static {
    this.styles = css23`
    :host {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 var(--_col-gap, var(--sp-5));
      font-family: var(--sans);
    }
    :host([cols="1"]) { grid-template-columns: 1fr; }
    ::slotted(deck-shortcut) {
      border-bottom: 1px solid var(--border);
    }
  `;
  }
  static {
    this.properties = {
      cols: { type: String },
      colGap: { type: String, attribute: "col-gap" }
    };
  }
  updated() {
    if (this.colGap) {
      const n = parseInt(this.colGap, 10);
      const v = !Number.isNaN(n) && n >= 1 && n <= 6 ? `var(--sp-${n})` : this.colGap;
      this.style.setProperty("--_col-gap", v);
    }
  }
  render() {
    return html22`<slot></slot>`;
  }
};
customElements.define("deck-shortcut-list", DeckShortcutList);
//# sourceMappingURL=index.js.map
