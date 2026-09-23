import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withDeck, goToSlide } from '../../rikiki/bin/lib/browser.mjs';
const names = ['quidditch', 'acme', 'three-pigs'];
const output = new URL('../public/stories/thumbs/', import.meta.url);
mkdirSync(output, { recursive: true });
for (const name of names) {
  const source = fileURLToPath(new URL('../../examples/stories/' + name + '.html', import.meta.url));
  await withDeck(source, async ({ page, settled, missing, errors }) => {
    if (!settled || missing.length || errors.length) throw new Error(name + ': deck did not load cleanly');
    await goToSlide(page, 1);
    await page.screenshot({ path: fileURLToPath(new URL(name + '.png', output)) });
    console.log('thumbnail · ' + name);
  }, { viewport: { width: 960, height: 540 } });
}
