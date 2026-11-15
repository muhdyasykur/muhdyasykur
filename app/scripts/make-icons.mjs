// Renders the PNG app icons from icon.svg. Run: node scripts/make-icons.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // dev-only; uses the machine's Playwright
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
async function shot(size, file, pad = 0, square = false) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = square ? svg.replace('rx="36"', 'rx="0"') : svg;
  await page.setContent(`<body style="margin:0;background:${pad ? '#13294B' : 'transparent'}"><div style="width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">${inner}</div>`);
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: !pad });
  await page.close();
}
await shot(192, 'icon-192.png');
await shot(512, 'icon-512.png');
await shot(512, 'icon-maskable-512.png', 56, true);
await shot(180, 'apple-touch-icon.png', 1, true);
await browser.close();
