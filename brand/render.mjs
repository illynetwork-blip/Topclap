// Rend chaque déclinaison de brand/brand.html en PNG (brand/png/). Prérequis : npm i --no-save playwright
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 2700, height: 1600 } });
await page.goto(pathToFileURL(path.join(dir, 'brand.html')).href);
await page.evaluate(() => document.fonts.ready);
for (const el of await page.$$('.a')) {
  const id = await el.getAttribute('id');
  const transparent = await el.evaluate(e => e.classList.contains('tr'));
  await el.screenshot({ path: path.join(dir, 'png', id + '.png'), omitBackground: transparent });
  console.log('✓', id);
}
await browser.close();
