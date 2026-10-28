import { expect, test } from '@playwright/test';
import { ELEMENT_PATH_READER, isWithin } from '../bin/lib/element-path.mjs';

// The one path of an element · what a finding names and what a policy's
// `elements` override matches. Computed in the page, so measured in a browser,
// on a shadow tree built by hand: two siblings of the same tag, a nested parent.

test('names each element of a shadow tree apart, and keeps its parents in the path', async ({ page }) => {
  await page.setContent('<main><x-host id="drawing"></x-host></main>');
  const paths = await page.evaluate((reader) => {
    const pathOf = new Function(`return ${reader}`)();
    const root = document.getElementById('drawing')!.attachShadow({ mode: 'open' });
    root.innerHTML = '<svg><text>A</text><text>B</text></svg><div class="inner"><p>deep</p></div><p id="named">named</p>';
    const [first, second] = root.querySelectorAll('text');
    return {
      first: pathOf(first),
      second: pathOf(second),
      inner: pathOf(root.querySelector('.inner')),
      deep: pathOf(root.querySelector('.inner p')),
      named: pathOf(root.getElementById('named')),
    };
  }, ELEMENT_PATH_READER);
  expect(paths.first).not.toBe(paths.second);
  expect(paths.first).toBe('main > x-host#drawing ::shadow svg > text:nth-of-type(1)');
  expect(isWithin(paths.deep, paths.inner)).toBe(true);
  expect(isWithin(paths.second, paths.inner)).toBe(false);
  // An element with an id at the top of the tree still says where the tree starts.
  expect(paths.named).toBe('main > x-host#drawing ::shadow p#named');
});
