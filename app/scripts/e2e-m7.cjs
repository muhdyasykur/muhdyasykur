// End-to-end for milestone 7: privacy page (EN/BM), searchable manual, tutorial videos (captions, saved for offline),
// on-device text recognition of a scanned textbook (online, then offline for a second book).
// The scanned book is made by this test (our own text drawn on a canvas and saved as an image-only PDF), so no
// textbook is needed. Run against `vite preview`: node scripts/e2e-m7.cjs [out-dir]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';

/** A PDF whose pages are only JPEG pictures, like a scanned book. */
function imagePdf(pages) {
  const chunks = []; const offsets = []; let len = 0;
  const add = (b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'); chunks.push(buf); len += buf.length; };
  const obj = (n, body) => { offsets[n] = len; add(`${n} 0 obj\n`); for (const b of body) add(b); add('\nendobj\n'); };
  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, [`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`]);
  pages.forEach((p, i) => {
    const n = 3 + i * 3; const W = 595, H = Math.round((595 * p.h) / p.w);
    const draw = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(n, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`]);
    obj(n + 1, [`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`]);
    obj(n + 2, [`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`, p.jpeg, '\nendstream']);
  });
  const xref = len; const count = 3 + pages.length * 3;
  add(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let i = 1; i < count; i++) add(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  add(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push('pageerror: ' + e.name + ': ' + e.message); if (process.env.DEBUG) console.log('PAGEERROR', e.name, e.message, (e.stack || '').slice(0, 600)); });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || new Promise((r) => setTimeout(r, 500)));
  await page.reload(); // the service worker now controls the page, so first-use downloads can be kept offline
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });

  // ---- Privacy
  await page.goto(base + '#/me');
  await page.click('a:has-text("Privacy")');
  await page.waitForSelector('h1:has-text("Privacy")');
  const en = await page.locator('article').innerText();
  check(en.includes('no server, no account') && en.includes('Feedback Garden') && en.includes('GitHub'), 'privacy page explains what stays, what leaves, and hosting');
  await page.click('button:has-text("Bahasa Melayu")');
  await page.waitForSelector('h1:has-text("Privasi")');
  check((await page.locator('article').getAttribute('lang')) === 'ms' && (await page.locator('article').innerText()).includes('Akta Perlindungan Data Peribadi 2010'), 'privacy page switches to Bahasa Melayu');
  if (out) await page.screenshot({ path: `${out}/m7-privacy.png` });

  // ---- Manual
  await page.goto(base + '#/me/help');
  await page.fill('#manual-q', 'PBD excel');
  await page.waitForSelector('.hit');
  const first = await page.locator('.hit h3').first().innerText();
  check(/PBD/.test(first) && (await page.locator('.hit mark').count()) > 0, `manual search finds and highlights "PBD excel" (${first})`);
  await page.fill('#manual-q', 'qwertyzz');
  check((await page.locator('text=Nothing matches').count()) === 1, 'manual says when nothing matches');
  await page.fill('#manual-q', '');
  check((await page.locator('details.card').count()) >= 25, 'all manual articles are listed by chapter');
  await page.goto(base + '#/me/help/pin');
  await page.waitForSelector('#a-pin[open]');
  check(true, 'a manual article opens from its link (#/me/help/pin)');

  // ---- Videos
  const videos = await page.locator('[data-video]').count();
  check(videos === 6, `six tutorial videos are listed (${videos})`);
  const haveFiles = fs.existsSync(path.join(__dirname, '../dist/videos/teach.mp4'));
  if (haveFiles) {
    await page.click('[data-video="teach"]');
    await page.waitForSelector('#help-video');
    await page.waitForFunction(() => { const v = document.querySelector('#help-video'); return v && v.readyState >= 1 && v.duration > 30; }, null, { timeout: 20000 });
    const info = await page.evaluate(() => { const v = document.querySelector('#help-video'); return { d: v.duration, tracks: [...v.textTracks].map((t) => t.language) }; });
    check(info.d >= 45 && info.d <= 150, `the Teach mode video is ${Math.round(info.d)} s long (1–2 min)`);
    check(info.tracks.join() === 'en,ms', 'the video has English and Bahasa Melayu captions');
    await page.waitForSelector('[data-video="teach"] .ok', { timeout: 30000 });
    check(true, 'after the first play the video is saved for offline use');
    await page.click('button:has-text("Close video")');
    await ctx.setOffline(true);
    const offlineOk = await page.evaluate(async () => { const r = await fetch('videos/teach.mp4', { headers: { Range: 'bytes=0-99' } }); return r.status === 206 && (await r.arrayBuffer()).byteLength === 100; });
    check(offlineOk, 'offline, the saved video is served from the device with byte ranges (seeking works)');
    await page.click('[data-video="backup"]');
    check((await page.locator('[role=alert]').innerText()).includes('not been saved yet'), 'offline, an unsaved video explains it needs internet once');
    await ctx.setOffline(false);
  } else check(false, 'videos are missing from dist/videos (run npm run videos, then build)');

  // ---- Fault injection: damaged files, a newer backup, a full device, offline links
  const ftmp = fs.mkdtempSync(path.join(os.tmpdir(), 'consilia-bad-'));
  const bad = (name, text) => { const f = path.join(ftmp, name); fs.writeFileSync(f, text); return f; };
  await page.goto(base + '#/me');
  await page.setInputFiles('#bk-file', bad('broken.consilia-backup', '{ this is not json'));
  await page.waitForSelector('section:has(#bk-file) .err[role=alert]', { timeout: 5000 }).catch(() => {});
  check((await page.locator('section:has(#bk-file)').innerText()).includes('not a Consilia backup file'), 'a damaged backup file is refused with a plain message');
  await page.setInputFiles('#bk-file', bad('newer.consilia-backup', JSON.stringify({ format: 'consilia-backup', version: 2, tables: {} })));
  await page.waitForFunction(() => document.querySelector('section:has(#bk-file) .err')?.textContent.includes('newer'), null, { timeout: 5000 }).catch(() => {});
  check((await page.locator('section:has(#bk-file)').innerText()).includes('newer Consilia'), 'a backup from a newer version asks for an update');
  await page.goto(base + '#/plan');
  await page.setInputFiles('#plan-import', bad('broken.consilia', 'PK\u0003\u0004 garbage'));
  await page.waitForSelector('#plan-import ~ * , .err[role=alert]');
  check((await page.locator('.err[role=alert]').count()) === 1, `a damaged shared lesson is refused (${(await page.locator('.err[role=alert]').innerText().catch(() => '')).slice(0, 60)})`);
  // full device: every IndexedDB write fails with QuotaExceededError
  await page.goto(base + '#/classes');
  await page.evaluate(() => {
    const full = () => { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); };
    window.__put = IDBObjectStore.prototype.put; window.__add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.put = full; IDBObjectStore.prototype.add = full;
  });
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Penuh');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('.toast.err', { timeout: 5000 }).catch(() => {});
  const toast = await page.locator('.toast.err').innerText().catch(() => '');
  check(/out of storage/.test(toast) && /Remove a textbook/.test(toast), `a full device shows a plain message and a next step ("${toast.slice(0, 70)}…")`);
  await page.evaluate(() => { IDBObjectStore.prototype.put = window.__put; IDBObjectStore.prototype.add = window.__add; });
  await page.click('.toast.err button');
  for (let i = errors.length - 1; i >= 0; i--) if (/quota/i.test(errors[i])) errors.splice(i, 1); // expected from the injected fault
  // offline: links to outside tools say they need a connection
  // the form stays open after the failed save, so the teacher can simply try again
  check(await page.locator('#cl-name').isVisible(), 'after the failed save the form is still open to try again');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.goto(base + '#/plan/new');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  await ctx.setOffline(true);
  await page.click('.steps a:has-text("Materials")');
  await page.waitForSelector('#canva-prompt');
  check((await page.locator('.offline-note').count()) === 1, 'offline, the tool links say they open once connected');
  await ctx.setOffline(false);
  fs.rmSync(ftmp, { recursive: true, force: true });

  // ---- Text recognition of a scanned book
  const lines = [['Unit 3: Where are you from?', 'Listen and read.', 'Mei Ling is from Malaysia.', 'She lives in Kota Kinabalu, Sabah.', 'Her favourite food is hinava.'],
    ['Unit 3: Lesson 2', 'Read and match.', 'Ravi is from India.', 'He likes playing the sompoton.', 'Look at the map of Borneo.']];
  const jpegs = [];
  for (const ls of lines) {
    const b64 = await page.evaluate((ls) => {
      const c = document.createElement('canvas'); c.width = 1240; c.height = 1754; const x = c.getContext('2d');
      x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#e9d8a6'; x.fillRect(80, 900, 500, 400); // a "picture"
      x.fillStyle = '#222'; x.font = 'bold 56px serif'; x.fillText(ls[0], 100, 200);
      x.font = '42px serif'; ls.slice(1).forEach((l, i) => x.fillText(l, 100, 320 + i * 90));
      return c.toDataURL('image/jpeg', 0.85).split(',')[1];
    }, ls);
    jpegs.push({ jpeg: Buffer.from(b64, 'base64'), w: 1240, h: 1754 });
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'consilia-scan-'));
  const scanA = path.join(tmp, 'scanned-workbook.pdf'); fs.writeFileSync(scanA, imagePdf(jpegs));
  const scanB = path.join(tmp, 'scanned-teachers-book.pdf'); fs.writeFileSync(scanB, imagePdf(jpegs.slice(0, 1)));

  await page.goto(base + '#/library/4/sk/books');
  await page.waitForSelector('[data-slot="getsmartplus4-wb"]');
  await page.setInputFiles('[data-add="getsmartplus4-wb"]', scanA);
  await page.waitForSelector('#cal-page');
  await page.click('button:has-text("No number printed")');
  await page.waitForSelector('[data-slot="getsmartplus4-wb"].filled');
  check((await page.locator('[data-ocr="getsmartplus4-wb"]').innerText()).includes('cannot be searched yet'), 'a scanned book is marked as not searchable yet');
  await page.fill('#shelf-search', 'Kinabalu');
  check((await page.locator('.res').innerText()).includes('Nothing found'), 'before recognition, words in the scan are not found');
  await page.fill('#shelf-search', '');
  await page.click('[data-ocr="getsmartplus4-wb"] .ocr-go');
  await page.waitForFunction(() => !document.querySelector('[data-ocr="getsmartplus4-wb"]'), null, { timeout: 120000 });
  check((await page.locator('[data-slot="getsmartplus4-wb"]').innerText()).includes('searchable (read on this device)'), 'text recognition reads every page on the device');
  await page.fill('#shelf-search', 'Kinabalu');
  await page.waitForSelector('.res .hit');
  check((await page.locator('.res').innerText()).includes('Kota Kinabalu'), 'words from the scanned page are now found by search');
  await page.fill('#shelf-search', 'sompoton');
  await page.waitForSelector('.res .hit');
  check((await page.locator('.res .hit a').first().innerText()).includes('p. 2'), 'search opens the right page of the scan');
  const sentOut = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => !n.startsWith(location.origin)));
  check(sentOut.length === 0, `text recognition loaded nothing from other sites (${sentOut.length})`);

  // offline: a second scanned book uses the files kept from the first time
  if (process.env.DEBUG) console.log(await page.evaluate(async () => { const o = {}; for (const n of await caches.keys()) o[n] = (await (await caches.open(n)).keys()).map((r) => r.url.split('/').pop()).filter((u) => !/index|assets/.test(u)).slice(0, 12); return JSON.stringify(o); }));
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('[data-slot="getsmartplus4-tb"]');
  await page.setInputFiles('[data-add="getsmartplus4-tb"]', scanB);
  await page.waitForSelector('#cal-page');
  await page.click('button:has-text("No number printed")');
  await page.waitForSelector('[data-ocr="getsmartplus4-tb"] .ocr-go');
  await page.click('[data-ocr="getsmartplus4-tb"] .ocr-go');
  if (process.env.DEBUG) { page.on('console', (m) => console.log('console', m.text().slice(0, 300))); ctx.on('requestfailed', (r) => console.log('FAILED', r.url())); setInterval(async () => console.log('status:', await page.locator('[data-ocr="getsmartplus4-tb"]').innerText().catch(() => '-')), 5000).unref(); }
  await page.waitForFunction(() => !document.querySelector('[data-ocr="getsmartplus4-tb"]') || /stopped/.test(document.querySelector('[data-ocr="getsmartplus4-tb"]').innerText), null, { timeout: 120000 });
  check((await page.locator('[data-slot="getsmartplus4-tb"]').innerText()).includes('searchable (read on this device)'), 'offline, text recognition still works after the first download');
  await ctx.setOffline(false);
  if (out) await page.screenshot({ path: `${out}/m7-shelf.png` });

  // reduced motion: no splash, no confetti
  const calm = await browser.newContext({ reducedMotion: 'reduce' });
  await calm.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
  const cp = await calm.newPage();
  await cp.goto(base);
  await cp.waitForTimeout(800);
  check((await cp.locator('.splash').count()) === 0, 'with reduced motion the opening animation does not play');
  await calm.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM7 end-to-end test passed');
})();
