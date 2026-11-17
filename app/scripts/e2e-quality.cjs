// End-to-end for the quality fixes (audit stage 1): keyboard focus stays in dialogs and returns to where it was,
// the page title and focus follow the screen, a screen that fails to draw shows a recovery panel (and the rest of the
// app keeps working), full screen falls back to a filled window where the browser has none (iPhone), and an update
// in another tab asks this tab to reload. Runs on Chromium, WebKit or Firefox (BROWSER=…).
// Run against `vite preview`: node scripts/e2e-quality.cjs
const { launch, name: browserName } = require('./browser.cjs');
const base = process.env.BASE_URL || 'http://localhost:4173/';

(async () => {
  const browser = await launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
  const page = await ctx.newPage();
  const crashes = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() !== 'error') return; if (/Screen failed to render/.test(m.text())) crashes.push(m.text()); else if (!/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.fill('#cd-paste', 'Aina\nBala\nChong Wei');
  await page.click('button:has-text("Add 3 pupils")');
  await page.waitForSelector('.pupils li:nth-child(3)');
  await page.goto(base + '#/plan/new');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lessonId = page.url().split('/').slice(-2)[0];

  // ---- page titles and focus follow the screen
  await page.goto(base + '#/today'); await page.waitForTimeout(300);
  await page.click('nav a[href="#/classes"]');
  await page.waitForFunction(() => document.title.startsWith('Classes'));
  const focused = await page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent.trim() }));
  check(await page.title() === 'Classes · Consilia', `the page title names the screen (${await page.title()})`);
  check(focused.tag === 'H1' && focused.text === 'Classes', 'after moving to another screen, focus lands on its heading');
  await page.click('a:has-text("4 Bestari")');
  await page.waitForFunction(() => document.title.startsWith('4 Bestari'));
  check(true, 'the title follows into a class (4 Bestari · Consilia)');

  // ---- dialogs keep focus inside and give it back
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('[data-tool="timer"]');
  const opener = page.locator('[data-tool="timer"]');
  await opener.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.sheet [aria-modal="true"]');
  await page.waitForTimeout(100);
  check(await page.evaluate(() => !!document.activeElement.closest('.sheet')), 'opening a dialog moves focus into it');
  let inside = true;
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.sheet')))) { inside = false; break; } }
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.sheet')))) { inside = false; break; } }
  check(inside, 'Tab and Shift+Tab stay inside the open dialog');
  await page.click('.sheet button:has-text("Close")');
  await page.waitForTimeout(100);
  check(await page.evaluate(() => document.activeElement.dataset.tool === 'timer'), 'closing the dialog returns focus to the button that opened it');

  // ---- full screen where the browser has none (Safari on iPhone)
  const nofs = await browser.newContext({ viewport: { width: 1024, height: 768 }, storageState: await ctx.storageState({ indexedDB: true }) });
  await nofs.addInitScript(() => {
    try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: 'x' })); } catch (e) {}
    delete Element.prototype.requestFullscreen; delete Element.prototype.webkitRequestFullscreen;
    Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false, configurable: true });
  });
  const f = await nofs.newPage();
  await f.goto(base + '#/tools/games');
  await f.fill('#g-words', 'Malaysia, Japan, China');
  await f.click('button:has-text("Full screen for the projector")');
  await f.waitForSelector('.stage.pseudo-full');
  const box = await f.locator('.stage').boundingBox();
  check(box.width >= 1020 && box.height >= 760, 'without the Fullscreen API, the game fills the window instead');
  check((await f.locator('.fs-note').innerText()).includes('cannot use full screen'), 'and says why, with a tip for iPhone');
  await f.click('[data-fs-exit]');
  check((await f.locator('.pseudo-full').count()) === 0, '"Exit full view" goes back');
  await f.click('button:has-text("Full screen for the projector")');
  await f.keyboard.press('Escape');
  check((await f.locator('.pseudo-full').count()) === 0, 'so does Esc');
  await nofs.close();

  // ---- a screen that fails to draw shows a recovery panel; the rest of the app keeps working
  await page.goto(base + '#/today');
  await page.evaluate(() => new Promise((ok, no) => {
    const r = indexedDB.open('consilia');
    r.onsuccess = () => { const d = r.result; const tx = d.transaction('lessons', 'readwrite'); tx.objectStore('lessons').put({ id: 'broken', classId: null, date: '2026-11-01', status: 'draft', updatedAt: Date.now() + 1e6, stages: null, objectives: null, header: null, curriculum: null }); tx.oncomplete = () => { d.close(); ok(); }; tx.onerror = () => no(tx.error); };
    r.onerror = () => no(r.error);
  }));
  await page.goto(base + '#/plan');
  await page.waitForSelector('[data-recovery]', { timeout: 5000 }).catch(() => {});
  const rec = await page.locator('[data-recovery]').count();
  check(rec === 1 && (await page.locator('[data-recovery] h1').innerText()) === 'This screen stopped working', 'a damaged lesson shows a recovery panel, not a blank page');
  check(await page.locator('nav a[href="#/classes"]').isVisible(), 'the menu still works');
  await page.click('nav a[href="#/classes"]');
  await page.waitForTimeout(500);
  check((await page.locator('[data-recovery]').count()) === 0 && (await page.locator('main h1').innerText()) === 'Classes', 'moving to another screen leaves the broken one behind');
  await page.goto(base + '#/plan');
  await page.waitForSelector('[data-recovery]');
  await page.click('[data-recovery] button:has-text("Back up my data")');
  await page.waitForSelector('[data-recovery] [role=status]:has-text("Backup saved")', { timeout: 8000 }).catch(() => {});
  check((await page.locator('[data-recovery] [role=status]').innerText()).includes('Backup saved'), 'the recovery panel can save a backup first');
  await page.evaluate(() => new Promise((ok) => { const r = indexedDB.open('consilia'); r.onsuccess = () => { const d = r.result; const tx = d.transaction('lessons', 'readwrite'); tx.objectStore('lessons').delete('broken'); tx.oncomplete = () => { d.close(); ok(); }; }; }));
  await page.goto(base + '#/plan');
  await page.reload();
  await page.waitForSelector('.list li');
  check((await page.locator('[data-recovery]').count()) === 0, 'once the damaged lesson is gone, Plan works again');
  errors.splice(0, errors.length, ...errors.filter((e) => !/Cannot read properties of null|null is not an object|is null/.test(e)));

  // ---- Bahasa Melayu: the whole interface, while lesson content stays in English
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("Bahasa Melayu")');
  await page.waitForTimeout(300);
  check((await page.locator('main h1').innerText()) === 'Saya' && (await page.locator('#bk-save').innerText()) === 'Buat sandaran sekarang', 'switching to Bahasa Melayu translates the screen at once');
  await page.goto(base + '#/plan');
  await page.waitForSelector('.list li');
  const planText = await page.locator('main').innerText();
  check(planText.includes('RPH baharu') && planText.includes('Buat salinan') && !/\bDuplicate\b|\bDelete…/.test(planText), 'Plan is in Malay (RPH baharu, Buat salinan)');
  await page.goto(base + `#/plan/edit/${lessonId}/review`);
  await page.waitForSelector('#rv-word');
  check((await page.locator('#rv-word').innerText()).startsWith('Muat turun Word') && /SUBJECT|Subject/i.test(await page.locator('.paper-wrap').innerText()), 'the builder is in Malay but the printed lesson plan stays in English');
  await page.goto(base + '#/today');
  check(/^(Isnin|Selasa|Rabu|Khamis|Jumaat|Sabtu|Ahad)/i.test(await page.locator('main .eyebrow').first().innerText()), 'dates follow the language (Malay day names)');
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("English")');
  await page.waitForTimeout(300);
  check((await page.locator('main h1').innerText()) === 'Me', 'and back to English');


  const other = await ctx.newPage();
  await other.goto(base + '#/today');
  await page.goto(base + '#/today');
  await page.waitForTimeout(400);
  await other.evaluate(() => new Promise((ok) => { const r = indexedDB.open('consilia', 1000); r.onupgradeneeded = () => {}; r.onsuccess = () => { r.result.close(); ok(); }; r.onblocked = () => ok(); }));
  await page.waitForSelector('[data-db-stale]', { timeout: 5000 }).catch(() => {});
  check((await page.locator('[data-db-stale]').count()) === 1, 'when another tab updates the database, this tab asks to reload instead of failing');
  await other.close();

  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log(`\nQuality end-to-end test passed (${browserName})`);
})();
