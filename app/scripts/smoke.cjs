// Smoke test of the built app: loads, navigates, switches language and theme, then works offline.
// Run: npm run build && npx vite preview --port 4173 &  then  node scripts/smoke.cjs [screenshot-dir]
const { chromium } = require('playwright');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  for (const [name, vp] of [['phone', { width: 390, height: 800 }], ['laptop', { width: 1366, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    await page.goto(base);
    await page.click('button:has-text("Skip for now")');
    await page.waitForSelector('h1');
    check((await page.locator('nav a[aria-current="page"]').innerText()).includes('Today'), `${name}: starts on Today`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name}: no horizontal scroll`);
    if (out) await page.screenshot({ path: `${out}/${name}-today.png` });
    await page.click('nav a[href="#/library"]');
    await page.waitForSelector('h1:has-text("Library")');
    await page.waitForTimeout(600);
    await page.waitForSelector('[data-lesson]');
    if (out) await page.screenshot({ path: `${out}/${name}-library.png` });
    await page.fill('#lesson-search', 'flags');
    await page.fill('#lesson-search', '');
    await page.click('[data-lesson="1"]');
    await page.waitForSelector('article h1');
    check((await page.locator('article .code').count()) >= 2, `${name}: lesson detail shows its standards`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name}: lesson detail has no horizontal scroll`);
    if (out) await page.screenshot({ path: `${out}/${name}-lesson.png`, fullPage: true });
    await page.goto(base + '#/library/3/sjk/levels');
    await page.waitForSelector('.tp');
    check((await page.locator('.tp').count()) === 6, `${name}: six performance levels shown`);
    if (out) await page.screenshot({ path: `${out}/${name}-levels.png` });
    await page.click('nav a[href="#/me"]');
    await page.click('button:has-text("Bahasa Melayu")');
    check((await page.locator('h1').innerText()) === 'Saya', `${name}: switches to Bahasa Melayu`);
    await page.click('.seg button:has-text("Gelap")');
    check((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', `${name}: dark theme applies`);
    if (out) await page.screenshot({ path: `${out}/${name}-me-dark-ms.png` });
    // offline: wait for the service worker to take control, then reload with the network cut
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await ctx.setOffline(true);
    await page.goto(base + '#/library');
    await page.reload();
    const h1 = await page.locator('h1').first().innerText().catch(() => '');
    check(h1 === 'Pustaka', `${name}: loads offline after refresh (and remembers language)`);
    await page.waitForSelector('[data-lesson]', { timeout: 8000 }).catch(() => {});
    const lessons = await page.locator('[data-lesson]').count().catch(() => 0);
    check(lessons > 0, `${name}: curriculum lessons available offline (${lessons} shown)`);
    if (out) await page.screenshot({ path: `${out}/${name}-offline-library.png` });
    await ctx.close();
  }
  await browser.close();
  if (errors.length) { console.log('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nSmoke test passed');
})();
