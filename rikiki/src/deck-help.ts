// ════════════════════════════════════════════════════════════════
// deck-help · keyboard shortcuts overlay · lazy-loaded by deck-root
//
// Not a Lit component on purpose · fetched on demand the first time the
// user presses `?` or `H`. It owns its CSS (injected into the host's
// shadow root) and the help modal markup.
//
// Public API:
//   toggleHelp(host) · open if closed, close if open.
//   closeHelp(host)  · close if open.
// ════════════════════════════════════════════════════════════════

const STYLE_TAG = 'data-deck-help';

const STYLES = `
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
    background: var(--rik-surface-raised); color: var(--rik-text-default);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-lg);
    padding: 2.2rem 2.5rem;
    box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    width: min(560px, 90vw);
    font-family: var(--rik-font-sans);
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
    border-bottom: 1px solid var(--rik-border-default);
  }
  .kb-card h3 {
    font: 700 1.05rem/1.2 var(--rik-font-sans);
    letter-spacing: -0.01em;
    color: var(--rik-text-default);
  }
  .kb-group-label {
    font: 700 0.62rem/1 var(--rik-font-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rik-text-default--faint);
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
    background: linear-gradient(180deg, #fff 0%, var(--rik-surface-page) 100%);
    border: 1px solid var(--rik-border-default);
    border-bottom: 2px solid #c4c4be;
    border-radius: 5px;
    padding: 3px 9px;
    font: 600 0.78rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    min-width: 22px; text-align: center;
    box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
  }
  .kb-row .desc { color: var(--rik-text-default--muted); }
`;

const MARKUP = `
  <div id="kb-overlay">
    <div class="kb-card">
      <div class="kb-card-header">
        <h3>Keyboard shortcuts</h3>
        <span class="esc"><kbd>Esc</kbd> to close</span>
      </div>
      <div class="kb-group-label">Navigation</div>
      <div class="kb-row"><span class="desc">Next slide (linear)</span><span class="keys"><kbd>Space</kbd><kbd>PgDn</kbd></span></div>
      <div class="kb-row"><span class="desc">Previous slide</span><span class="keys"><kbd>PgUp</kbd></span></div>
      <div class="kb-row"><span class="desc">Previous / Next chapter</span><span class="keys"><kbd>&larr;</kbd><kbd>&rarr;</kbd></span></div>
      <div class="kb-row"><span class="desc">Up / Down inside a chapter</span><span class="keys"><kbd>&uarr;</kbd><kbd>&darr;</kbd></span></div>
      <div class="kb-row"><span class="desc">First / Last slide</span><span class="keys"><kbd>Home</kbd><kbd>End</kbd></span></div>
      <div class="kb-group-label">View</div>
      <div class="kb-row"><span class="desc">Toggle overview</span><span class="keys"><kbd>O</kbd></span></div>
      <div class="kb-row"><span class="desc">Show this help</span><span class="keys"><kbd>?</kbd><kbd>H</kbd></span></div>
    </div>
  </div>
`;

function ensureMounted(shadow: ShadowRoot): HTMLDivElement {
  let overlay = shadow.querySelector<HTMLDivElement>('#kb-overlay');
  if (overlay) return overlay;

  if (!shadow.querySelector(`style[${STYLE_TAG}]`)) {
    const style = document.createElement('style');
    style.setAttribute(STYLE_TAG, '1');
    style.textContent = STYLES;
    shadow.appendChild(style);
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = MARKUP;
  overlay = wrapper.firstElementChild as HTMLDivElement;
  shadow.appendChild(overlay);

  // Click outside the card closes
  overlay.addEventListener('click', () => closeHelp(shadow.host as HTMLElement));
  const card = overlay.querySelector('.kb-card');
  card?.addEventListener('click', (e) => e.stopPropagation());

  return overlay;
}

export function toggleHelp(host: HTMLElement): void {
  if (!host.shadowRoot) return;
  const overlay = ensureMounted(host.shadowRoot);
  overlay.classList.toggle('open');
}

export function closeHelp(host: HTMLElement): void {
  const overlay = host.shadowRoot?.querySelector<HTMLDivElement>('#kb-overlay');
  overlay?.classList.remove('open');
}
