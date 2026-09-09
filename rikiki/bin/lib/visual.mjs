// ════════════════════════════════════════════════════════════════
// What a slide looks like, measured on the pixels rather than on the DOM.
//
// The DOM says a box is 400px tall. It does not say the slide reads as
// top-heavy, or that the ink sits in one corner. Those are pixel facts, and
// they are the ones a room reacts to first.
//
// The signals here follow the low-level design cues that correlate with human
// judgement of slide quality (Inui et al., 2025): ink density and spatial
// balance carry most of it. We measure only what is objective and act only on
// the imbalance · empty space on its own is a choice, never a defect.
// ════════════════════════════════════════════════════════════════

/** Runs in the page: decode a screenshot and measure where the ink sits. */
const MEASURE_INK = `async (dataUrl) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  // Downscale · the layout facts survive, and a 240-wide grid is 100x cheaper
  // to walk than the full canvas.
  const w = 240;
  const h = Math.max(1, Math.round((img.height / img.width) * w));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  // The background is the most common colour · a deck paints its own ground.
  const tally = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const key = at(x, y).map((c) => c >> 4).join(',');
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  const ground = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]
    .split(',').map((c) => (Number(c) << 4) + 8);

  const far = (p) =>
    Math.abs(p[0] - ground[0]) + Math.abs(p[1] - ground[1]) + Math.abs(p[2] - ground[2]) > 40;

  let inked = 0;
  let sumY = 0;
  let sumX = 0;
  let top = h;
  let bottom = -1;
  let left = w;
  let right = -1;
  const rowInk = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!far(at(x, y))) continue;
      inked++;
      rowInk[y]++;
      sumY += y;
      sumX += x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (inked === 0) return { inkRatio: 0, empty: true };

  return {
    empty: false,
    inkRatio: inked / (w * h),
    // 0 = ink centred on the slide, negative = pulled up, positive = pulled down.
    verticalBias: (sumY / inked) / h - 0.5,
    horizontalBias: (sumX / inked) / w - 0.5,
    // The band under the last content row, as a share of the slide height.
    tailBand: 1 - (bottom + 1) / h,
    headBand: top / h,
    box: { top: top / h, bottom: bottom / h, left: left / w, right: right / w },
  };
}`;

/** The engine's own furniture · counted as ink, it makes every slide look
 *  bottom-anchored. Hidden for the measurement, restored after. */
const HIDE_CHROME = `() => {
  const root = document.querySelector('deck-root');
  if (!root?.shadowRoot) return;
  const style = document.createElement('style');
  style.id = 'rik-measure-chrome';
  style.textContent =
    '#progress,#counter,#step-dots,#nav-arrows,#kb-hint,#live{display:none !important}';
  root.shadowRoot.appendChild(style);
}`;

const SHOW_CHROME = `() => {
  document.querySelector('deck-root')?.shadowRoot?.getElementById('rik-measure-chrome')?.remove();
}`;

/**
 * Photograph each slide and measure where its ink sits.
 * `goTo(index)` must leave the page on that slide, settled.
 */
export async function measureSlides(page, count, goTo) {
  await page.evaluate((fn) => new Function('return ' + fn)()(), HIDE_CHROME);
  const out = [];
  for (let index = 1; index <= count; index++) {
    await goTo(index);
    const shot = await page.screenshot({ type: 'png' });
    const dataUrl = 'data:image/png;base64,' + shot.toString('base64');
    const ink = await page.evaluate(
      ({ fn, url }) => new Function('return ' + fn)()(url),
      { fn: MEASURE_INK, url: dataUrl },
    );
    out.push({ index, ...ink });
  }
  await page.evaluate((fn) => new Function('return ' + fn)()(), SHOW_CHROME);
  return out;
}
