// End-to-end for milestone 5: Textbook Shelf (recognised and calibrated PDFs, search, viewer and projector tools),
// materials studio, activity bank, Canva AI prompt, sharing and import, reflection, mentor notes and Library search.
// Needs textbook PDFs in UPLOAD_DIR (never committed). Run against `vite preview`: node scripts/e2e-m5.cjs [out-dir]
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const up = process.env.UPLOAD_DIR || '/tmp/claude-0/-home-user-muhdyasykur/617b4bbb-4c5a-5548-9b45-3a392768285b/scratchpad/upload';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // ---- Textbook Shelf
  await page.goto(base + '#/library/4/sk/books');
  await page.waitForSelector('[data-slot="getsmartplus4-sb"]');
  await page.setInputFiles('[data-add="getsmartplus4-sb"]', path.join(up, 'Y4- GET SMART PLUS4.pdf'));
  await page.waitForSelector('[data-slot="getsmartplus4-sb"].filled', { timeout: 120000 });
  check((await page.locator('[data-slot="getsmartplus4-sb"]').innerText()).includes('recognised edition'), 'Get Smart Plus 4 is recognised and saved on the device');
  await page.setInputFiles('[data-add="smartgrammar4-tb"]', path.join(up, "Smart_Grammar_4-Teacher's Book.pdf"));
  await page.waitForSelector('[data-slot="smartgrammar4-tb"].filled', { timeout: 120000 });
  check((await page.locator('[data-slot="smartgrammar4-tb"]').innerText()).includes('searchable text'), 'Smart Grammar 4 is indexed for word search');
  await page.setInputFiles('[data-add="getsmartplus4-wb"]', path.join(up, 'My workbook scan.pdf'));
  await page.waitForSelector('#cal-page');
  check((await page.locator('.calib').innerText()).includes('page number printed'), 'an unknown PDF asks for one printed page number');
  await page.fill('#cal-page', '1');
  await page.click('#cal-save');
  await page.waitForSelector('[data-slot="getsmartplus4-wb"].filled');
  check((await page.locator('[data-slot="getsmartplus4-wb"]').innerText()).includes('page offset 1'), 'calibration stores the page offset');
  const stored = await page.evaluate(async () => { const d = await navigator.storage.getDirectory(); const t = await d.getDirectoryHandle('textbooks'); const n = []; for await (const k of t.keys()) n.push(k); return n.sort(); });
  check(stored.join(',') === 'getsmartplus4-sb.pdf,getsmartplus4-wb.pdf,smartgrammar4-tb.pdf', `PDFs kept in the browser's private file storage (${stored.join(', ')})`);

  await page.fill('#shelf-search', 'Where are you from');
  const unitHit = page.locator('.res .hit').first();
  check((await unitHit.innerText()).includes("Student's Book p. 5"), 'topic search finds Unit 1 at Student\'s Book page 5');
  await page.fill('#shelf-search', 'pronouns');
  await page.waitForSelector('.res .hit a');
  check((await page.locator('.res').innerText()).includes('Smart Grammar 4'), 'word search finds pages in the text-layer book');
  await page.fill('#shelf-search', '18');
  await page.click('.res a:has-text("Open Get Smart Plus 4")');
  await page.waitForURL(/read\/getsmartplus4-sb\/18/);
  await page.waitForFunction(() => { const c = document.querySelector('.sheet canvas'); return c && c.width > 100; }, null, { timeout: 30000 });
  const ink = await page.evaluate(() => { const c = document.querySelector('.sheet canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dark = 0; for (let i = 0; i < d.length; i += 400) if (d[i] < 200) dark++; return dark; });
  check(ink > 50, 'page 18 is drawn from the PDF');
  check((await page.locator('.viewer .muted.small').innerText()).includes('printed page 18 (PDF page 18'), 'printed page 18 maps to PDF page 18 (offset 0)');
  await page.click('button[aria-label="Next page"]');
  check((await page.inputValue('[data-page]')) === '19', 'page turning works');
  await page.click('[data-tool=spot]');
  check((await page.locator('.spot').count()) === 1, 'spotlight appears');
  await page.click('[data-tool=cover]');
  check((await page.locator('.cover').count()) === 1, 'answer cover appears');
  await page.waitForTimeout(1500);
  if (out) await page.screenshot({ path: `${out}/m5-viewer.png` });

  // ---- RPH: materials, bank, Canva prompt
  await page.goto(base + '#/plan/new');
  await page.waitForSelector('[data-sow="1"]');
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.click('.steps a:has-text("Lesson flow")');
  await page.selectOption('[data-bank-stage="pre-lesson"]', 'P1');
  check((await page.locator('section.stage').first().innerText()).includes('Activity bank: Mystery bag'), 'an activity bank item is inserted with its source');
  await page.click('.steps a:has-text("Materials")');
  await page.waitForSelector('#ms-type');
  check((await page.locator('.chip:has-text("Teacher\'s Book p. 18")').count()) === 1, 'SoW page reference shown (Teacher\'s Book not on the shelf yet)');
  await page.fill('#mt-vocab', 'Malaysia, Japan, China, India, Australia, Britain');
  await page.selectOption('#ms-type', 'tiered');
  await page.fill('#ms-words', 'Malaysia, Japan, China, India, Australia, Britain');
  await page.fill('#ms-frame', 'I am from ___. I speak ___.');
  await page.click('#ms-make');
  await page.waitForSelector('article.printable');
  const ws = await page.locator('article.printable').innerText();
  check(ws.includes('Word bank') && ws.includes('🌳 High') && ws.includes('I am from ___'), 'tiered worksheet made in three levels');
  await page.selectOption('#ms-type', 'gapfill');
  await page.fill('#ms-sent', 'I am from Malaysia.\nShe is from Japan.\nThey are from India.');
  await page.click('#ms-make');
  check((await page.locator('article.printable').last().innerText()).includes('I am from __________.'), 'gap-fill blanks the key words');
  await page.click('#canva-copy');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Year 4') && clip.includes('Malaysia, Japan'), 'Canva AI prompt copied with year and vocabulary');
  check((await page.locator('a:has-text("YouTube")').getAttribute('href')).startsWith('https://www.youtube.com/results?search_query='), 'tool links open searches');
  await page.click('.steps a:has-text("Review")');
  await page.waitForSelector('.apx');
  check((await page.locator('.apx').count()) === 2, 'both printables follow the RPH as appendices');
  if (out) await page.screenshot({ path: `${out}/m5-review.png`, fullPage: false });

  // ---- share and import
  await page.goto(base + '#/plan');
  await page.waitForSelector(`[data-share="${lessonId}"]`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-share="${lessonId}"]`)]);
  const file = path.join(up, '..', dl.suggestedFilename());
  await dl.saveAs(file);
  const json = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  check(dl.suggestedFilename() === 'Where-are-you-from-Y4.consilia' && json.lesson.classId === null && json.lesson.printables.length === 2, 'shared file carries the lesson and its printables, no class data');
  await page.setInputFiles('#plan-import', file);
  await page.waitForURL(/setup$/);
  check(page.url().split('/').slice(-2)[0] !== lessonId, 'importing creates a new lesson');
  await page.goto(base + '#/plan');
  await page.waitForSelector('.list li:nth-child(2)');
  check((await page.locator('.list li').count()) === 2, 'both lessons in the list');

  // ---- teach with the book, then reflect
  await page.goto(base + '#/teach/' + lessonId);
  await page.click('#teach-start');
  await page.click('[data-tool=book]');
  await page.waitForFunction(() => { const c = document.querySelector('.sheet canvas'); return c && c.width > 100; }, null, { timeout: 30000 });
  check(true, 'the Student\'s Book opens inside Teach mode');
  await page.click('.sheet-in button:has-text("Close")');
  while ((await page.locator('#teach-next').count()) > 0) await page.click('#teach-next');
  await page.click('a:has-text("Write my reflection")');
  await page.waitForSelector('#rf-worked');
  check((await page.locator('.facts').innerText()).includes('Alignment score'), 'reflection starts from real facts');
  await page.fill('#rf-worked', 'Pupils enjoyed the flag game and most could say where they are from.');
  await page.fill('#rf-didnt', 'The listening activity ran short because the song was too easy for this class.');
  await page.fill('#rf-next', 'Use the Moderate worksheet as the main task and keep the song for the pre-lesson.');
  await page.click('#rf-save');
  check((await page.locator('.ok').innerText()).startsWith('Saved'), 'reflection saved');
  // a new lesson on the same standard shows the "next time" note
  await page.goto(base + '#/plan/new');
  await page.waitForSelector('[data-sow="6"]');
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  await page.waitForSelector('.tips');
  check((await page.locator('.tips').innerText()).includes('Moderate worksheet'), 'reflection note shown when planning the same standard again');
  await page.goto(base + '#/plan/edit/' + lessonId + '/review');
  await page.click('button:has-text("Consilia Lesson Blueprint")');
  check((await page.locator('article.bp').innerText()).includes('Use the Moderate worksheet'), 'reflection prints in the blueprint');

  // ---- mentor notes
  await page.goto(base + '#/me/mentor');
  await page.waitForSelector('#mn-text');
  await page.waitForTimeout(400);
  for (const [txt, tags] of [['Stage 2 ran long.', ['Time management']], ['Objectives were clear but timing slipped again.', ['Objectives', 'Time management']]]) {
    await page.fill('#mn-text', txt);
    for (const t of tags) await page.click(`.tag:has-text("${t}")`);
    await page.click('#mn-add');
    await page.waitForTimeout(300);
  }
  check((await page.locator('.pat').innerText()).includes('Time management mentioned 2×'), 'mentor feedback shows the repeated theme');

  // ---- Library
  await page.goto(base + '#/library/4/sk/guide');
  check((await page.locator('.guide section').count()) >= 9, 'Method Guide sections shown');
  await page.goto(base + '#/library/4/sk/bank');
  check((await page.locator('[data-bank]').count()) > 40, 'activity bank lists Year 4 activities');
  await page.fill('#lib-everything', 'flashcards');
  await page.waitForSelector('.found');
  const found = await page.locator('.found').innerText();
  check(/sow lessons/i.test(found) && /activity bank/i.test(found), 'search everything covers lessons and the activity bank');

  await browser.close();
  if (errors.length) { console.log('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM5 end-to-end test passed');
})();
