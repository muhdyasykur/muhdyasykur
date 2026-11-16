// Load-time budget check on an emulated mid-range phone (4× slower CPU, "fast 3G": 1.6 Mbps, 150 ms latency).
// First visit (nothing cached) and a repeat visit (served by the service worker). Run against `vite preview`.
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const visit = async (label) => {
    const t0 = Date.now();
    await page.goto(base, { waitUntil: 'commit' });
    await page.waitForSelector('#ob-title, nav', { timeout: 60000 });
    const ready = Date.now() - t0;
    const m = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const r = performance.getEntriesByType('resource'); return { bytes: Math.round(r.reduce((a, x) => a + (x.transferSize || 0), 0) / 1024) + (n ? Math.round(n.transferSize / 1024) : 0), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0) }; });
    console.log(`${label}: first paint ${m.fcp} ms, usable ${ready} ms, ${m.bytes} KB over the network`);
    return ready;
  };
  const first = await visit('First visit');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || new Promise((r) => setTimeout(r, 3000)), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(8000); // let the service worker finish caching the app
  const repeat = await visit('Repeat visit');
  await browser.close();
  const ok = first < 6000 && repeat < 2500;
  console.log(ok ? 'Within budget (first visit under 6 s, repeat under 2.5 s)' : 'Over budget');
  process.exit(ok ? 0 : 1);
})();
