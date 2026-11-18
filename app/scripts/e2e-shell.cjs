// End-to-end for the app shell of the new look: the Create panel (laptop rail and phone tab bar), Search everywhere
// (Ctrl+K and "/", tools, lesson plans, classes, the Scheme of Work and the manual, Enter opens the first result, Esc
// closes), the Tools Quick start opening the right tool already filled in, and the Today dashboard.
// Runs on Chromium, WebKit or Firefox (BROWSER=…). Run against `vite preview`: node scripts/e2e-shell.cjs [out-dir]
const fs = require('fs');
const path = require('path');
const { launch, name: browserName } = require('./browser.cjs');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const LESSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/studio-answers.json'), 'utf8'))['lesson-plan'];

(async () => {
  const browser = await launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|aborted/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // something of the teacher's own to find: a class and a lesson plan (written by AI, pasted, opened in the builder)
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForFunction(() => document.title.startsWith('4 Bestari'));
  await page.goto(base + '#/tools/lesson-plan');
  await page.waitForSelector('#st-go');
  await page.click('#st-example');
  await page.click('#st-go');
  await page.waitForSelector('#st-paste-card');
  await page.fill('#st-paste', LESSON);
  await page.click('#st-paste-use');
  await page.click('#st-builder');
  await page.waitForURL(/\/review$/, { timeout: 15000 });

  // ---- Create (laptop: the gold tile on the rail)
  await page.goto(base + '#/today');
  await page.click('[data-open="create"]');
  await page.waitForSelector('[role="dialog"] [data-create]');
  const items = await page.$$eval('[data-create]', (els) => els.map((e) => e.dataset.create));
  check(items.length === 10 && items[0] === 'new' && items.includes('quiz') && items.includes('attendance'), `Create offers the ten most-started things (${items.join(', ')})`);
  await page.click('[data-create="quiz"]');
  await page.waitForURL(/#\/tools\/quiz$/);
  await page.waitForSelector('#st-go');
  check((await page.locator('[role="dialog"]').count()) === 0, 'choosing one opens it and closes the panel');
  await page.click('[data-open="create"]');
  await page.waitForSelector('[data-create]');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('[data-create]'));
  check(true, 'Esc closes the Create panel');
  await page.click('[data-open="create"]');
  await page.waitForSelector('[data-create]');
  await page.click('[role="dialog"] h2');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('[data-create]'));
  check(true, '…even after a click on blank space in the panel');

  // ---- Search
  await page.goto(base + '#/today');
  await page.waitForSelector('h1');
  await page.keyboard.press('/');
  await page.waitForSelector('#g-search');
  check(await page.evaluate(() => document.activeElement?.id === 'g-search'), '"/" opens Search with the cursor in the box');
  await page.fill('#g-search', 'rubric');
  await page.waitForSelector('[data-hit="Tools"]');
  check((await page.locator('[data-hit="Tools"]').first().innerText()).includes('PBD rubric'), 'it finds tools, with the one named "rubric" first');
  await page.fill('#g-search', 'Bestari');
  await page.waitForSelector('[data-hit="My classes"]');
  check((await page.locator('[data-hit="My classes"]').count()) === 1, 'it finds my classes');
  await page.fill('#g-search', 'Friends Around');
  await page.waitForSelector('[data-hit="My lesson plans"]');
  check((await page.locator('[data-hit="My lesson plans"]').first().innerText()).includes('Friends Around the World'), 'it finds my lesson plans');
  await page.fill('#g-search', 'Where are you from');
  await page.waitForSelector('[data-hit="Scheme of Work"]', { timeout: 15000 });
  const sow = await page.locator('[data-hit="Scheme of Work"]').first().innerText();
  check(/Where are you from/i.test(sow), 'it finds lessons in the Scheme of Work');
  await page.fill('#g-search', 'backup');
  await page.waitForSelector('[data-hit="Help"]');
  check((await page.locator('[data-hit="Help"]').count()) >= 1, 'it finds help in the manual');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#g-search'));
  check(true, 'Esc closes Search');
  // Ctrl+K works even while typing in a box; Enter opens the first result
  await page.goto(base + '#/tools');
  await page.click('#tools-q');
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#g-search');
  await page.fill('#g-search', 'quiz maker');
  await page.waitForSelector('[data-hit="Tools"]');
  await page.keyboard.press('Enter');
  await page.waitForURL(/#\/tools\/quiz$/);
  check((await page.locator('#g-search').count()) === 0, 'Ctrl+K opens Search from anywhere, and Enter opens the first result');

  // ---- Tools: Quick start opens the right tool, already filled in
  await page.goto(base + '#/tools');
  await page.click('[data-qs="assess"]');
  await page.selectOption('#qs-year', '3');
  await page.fill('#qs-topic', 'My family');
  await page.selectOption('#qs-assess', 'rubric');
  await page.click('#qs-go');
  await page.waitForURL(/#\/tools\/rubric$/);
  await page.waitForSelector('#st-go');
  check((await page.locator('.years button[aria-pressed="true"]').innerText()) === '3', 'Quick start (Assess → PBD rubric) opens the rubric tool for Year 3');
  await page.goto(base + '#/tools');
  await page.click('[data-qs="plan"]');
  await page.fill('#qs-topic', 'Saving water');
  await page.selectOption('#qs-skill', 'Writing');
  await page.click('#qs-go');
  await page.waitForURL(/#\/tools\/lesson-plan$/);
  await page.waitForSelector('#sf-topic');
  check((await page.inputValue('#sf-topic')) === 'Saving water' && (await page.inputValue('#sf-skill')) === 'Writing', 'Quick start (Plan) opens the Lesson plan writer with the topic and skill');
  await page.goto(base + '#/tools');
  await page.click('[data-qs="teach"]');
  await page.fill('#qs-words', 'cat, dog, fish');
  await page.selectOption('#qs-game', 'unjumble');
  await page.click('#qs-go');
  await page.waitForURL(/#\/tools\/games\/unjumble$/);
  check(true, 'Quick start (Teach) opens the projector game');
  await page.goto(base + '#/tools');
  check(await page.waitForFunction(() => /1,?489/.test(document.querySelector('main')?.innerText || ''), null, { timeout: 15000 }).then(() => true, () => false), 'Tools shows the real number of Scheme of Work lessons (1,489)');

  // ---- Today
  await page.goto(base + '#/today');
  await page.waitForSelector('.weekmap');
  check((await page.locator('.weekmap a.stop').count()) === 5, 'Today shows the week as a route with five school days');
  const stop = await page.locator('.weekmap a.stop').first().getAttribute('href');
  check(/#\/plan\/day\/\d{4}-\d{2}-\d{2}$/.test(stop), 'each stop opens that day in My day');
  check((await page.locator('h1').innerText()).length > 0 && (await page.locator('.toolsrow a, .toolsrow button').count()) >= 3, 'Today greets the teacher and shows their tools');
  if (out) await page.screenshot({ path: `${out}/shell-today.png` });

  // ---- phone: the round Create button in the tab bar, and search from the top bar
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState({ indexedDB: true }) });
  const pp = await phone.newPage();
  await pp.goto(base + '#/today');
  await pp.waitForSelector('[data-open="create"]');
  const fab = await pp.locator('[data-open="create"]').boundingBox();
  check(!!fab && fab.y > 700 && fab.width >= 44 && fab.height >= 44, 'phone: the Create button sits in the tab bar and is easy to tap');
  await pp.tap('[data-open="create"]');
  await pp.waitForSelector('[data-create]');
  check(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: the Create panel fits the screen');
  await pp.tap('[data-create="text"]');
  await pp.waitForURL(/#\/tools\/text$/);
  await pp.tap('[data-open="search-phone"]');
  await pp.waitForSelector('#g-search');
  check(true, 'phone: search opens from the top bar');
  if (out) await pp.screenshot({ path: `${out}/shell-phone-search.png` });
  await phone.close();

  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log(`\nShell end-to-end test passed (${browserName})`);
})();
