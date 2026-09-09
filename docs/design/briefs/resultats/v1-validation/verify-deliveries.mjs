import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Consumer-side validation: only public HTML, DOM, screenshots and navigation.
// Usage: node verify-deliveries.mjs 01/path-to-bundle.html [...]
const browser = await chromium.launch({headless: true});
for (const arg of process.argv.slice(2)) {
  const file = resolve(arg), out = `${file}.verification`;
  await mkdir(out, {recursive: true});
  const context = await browser.newContext({viewport: {width:1920,height:1080}, offline:true});
  const page = await context.newPage();
  const requests = [], errors = [];
  page.on('request', r => {if (/^https?:/.test(r.url())) requests.push(r.url());});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => !!customElements.get('deck-root'));
  await page.evaluate(() => document.fonts.ready);
  const structure = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    slides: [...document.querySelector('deck-root').children].map((e,i)=>({index:i+1,id:e.id,tag:e.localName,title:e.querySelector('h1')?.textContent.trim(),notes:e.querySelector('deck-notes')?.textContent.trim() || '',steps:e.getAttribute('steps')})),
    coverText: document.querySelector('deck-cover')?.shadowRoot?.textContent,
  }));
  if (structure.lang !== 'fr') throw new Error(`${file}: document language is not fr`);
  if (structure.slides.length === 0) throw new Error(`${file}: no slides found`);
  if (errors.length) throw new Error(`${file}: page errors: ${errors.join('; ')}`);
  if (requests.length) throw new Error(`${file}: external requests: ${requests.join(', ')}`);
  for (const s of structure.slides) {
    await page.evaluate(i => {location.hash=String(i)},s.index);
    await page.waitForTimeout(500);
    await page.screenshot({path:`${out}/${String(s.index).padStart(2,'0')}-${s.id}.png`});
  }
  await page.keyboard.press('Home');
  const popupPromise = context.waitForEvent('page', {timeout:15000});
  await page.keyboard.press('p');
  let presenter;
  try {
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await popup.waitForTimeout(1500);
    const before = await popup.locator('body').innerText();
    await popup.screenshot({path:`${out}/presenter.png`});
    await page.keyboard.press('ArrowRight');
    await popup.waitForTimeout(700);
    const after = await popup.locator('body').innerText();
    presenter={opened:true,before,after,changed:before!==after};
  } catch(e) {presenter={opened:false,error:e.message};}
  await writeFile(`${out}/report.json`,JSON.stringify({file,offline:true,requests,errors,...structure,presenter},null,2));
  if (!presenter.opened || !presenter.changed) throw new Error(`${file}: presenter did not open and advance`);
  console.log(JSON.stringify({file,slides:structure.slides.length,lang:structure.lang,networkRequests:requests.length,errors,presenterOpened:presenter.opened,presenterChanged:presenter.changed}));
  await context.close();
}
await browser.close();
