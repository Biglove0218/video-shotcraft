// usage: node shoot.cjs <url-path> <out.png> <w> <h> [scale]
const { chromium } = require('playwright');
(async () => {
  const [,, path, out, w, h, scale] = process.argv;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(scale || 1) });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto('http://localhost:4321/' + path, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: out, omitBackground: true });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
