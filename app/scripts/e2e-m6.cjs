// End-to-end for milestone 6: splash, guided tour, Help, About (photo and message), Feedback Garden (online and
// offline queue), music pausing in Teach mode, backup and restore. Jotform is intercepted, so nothing is really sent.
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const sent = [];
  await ctx.route('https://submit.jotform.com/**', async (r) => { sent.push(r.request().postData() || ''); await r.fulfill({ status: 200, body: 'Thank you!' }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(m.text())) errors.push('console: ' + m.text()); });

  // splash
  await page.goto(base);
  await page.waitForSelector('button.splash');
  check((await page.locator('button.splash .tag').innerText()).includes('wise planning'), 'splash shows the logo and tagline');
  if (out) { await page.waitForTimeout(1600); await page.screenshot({ path: `${out}/m6-splash.png` }); }
  await page.click('button.splash');
  await page.waitForSelector('button.splash', { state: 'detached' });
  await page.reload();
  await page.waitForTimeout(400);
  check((await page.locator('button.splash').count()) === 0, 'splash plays at most once a day');

  // terms of use: must agree before anything else
  await page.waitForSelector('#terms-title');
  check((await page.locator('#pf-name').count()) === 0, 'the terms come before onboarding');
  check(await page.locator('#terms-accept').isDisabled(), 'Agree is disabled until every box is ticked');
  await page.click('button[aria-pressed]:has-text("Bahasa Melayu")');
  check((await page.locator('#terms-title').innerText()) === 'Sebelum anda bermula', 'the terms can be read in Bahasa Melayu');
  await page.click('button[aria-pressed]:has-text("English")');
  for (const i of [0, 1]) await page.check(`[data-agree="${i}"]`);
  check(await page.locator('#terms-accept').isDisabled(), 'two of three boxes are not enough');
  await page.check('[data-agree="2"]');
  await page.click('#terms-accept');
  await page.waitForSelector('#terms-title', { state: 'detached' });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('consilia.terms') || 'null'));
  check(saved && saved.v === 1 && !!saved.at, 'agreement is saved with the terms version and date');
  await page.reload();
  await page.waitForTimeout(400);
  check((await page.locator('#terms-title').count()) === 0, 'the terms are not asked again once agreed');

  // onboarding → tour
  await page.fill('#pf-name', 'Muhammad Yasykur bin Muhamad Yasim');
  await page.fill('#pf-school', 'SK(C) Anglo Chinese Kota Kinabalu');
  await page.click('button:has-text("Start planning")');
  await page.waitForSelector('#tour-title');
  check((await page.locator('#tour-title').innerText()) === 'Welcome to Consilia', 'guided tour starts after onboarding');
  const titles = [];
  for (let i = 0; i < 9; i++) {
    titles.push(await page.locator('#tour-title').innerText());
    if (i === 3) { await page.waitForTimeout(400); check((await page.locator('.tour .hole').count()) === 1, 'tour highlights the New RPH button'); if (out) await page.screenshot({ path: `${out}/m6-tour.png` }); }
    await page.click('#tour-next');
    await page.waitForTimeout(300);
  }
  check(titles.join('|') === 'Welcome to Consilia|Today|Plan|New lesson plan|Classes|Library|Tools|Me|You are ready' && (await page.locator('.tour').count()) === 0, 'tour walks through all nine steps and closes');
  await page.goto(base + '#/me/help');
  await page.click('#help-tour');
  await page.waitForSelector('#tour-title');
  await page.keyboard.press('Escape');
  check((await page.locator('.tour').count()) === 0, 'tour can be replayed from Help and closed with Esc');

  // About + photo
  await page.goto(base + '#/me/about');
  await page.waitForSelector('img.photo');
  await page.waitForFunction(() => document.querySelector('img.photo').naturalWidth > 0);
  check((await page.locator('.letter').innerText()).includes('Teach with heart, and keep going.'), 'About shows the developer\'s message');
  if (out) await page.screenshot({ path: `${out}/m6-about.png` });

  // Feedback Garden: online
  await page.click('[data-mood="good"]');
  await page.fill('#fg-text', 'The pacing coach saved my observation lesson.');
  await page.click('.vote:has-text("Full Canva connection")');
  await page.fill('#fg-name', 'Aina Test');
  await page.click('#fg-send');
  await page.waitForSelector('.flower.bungaraya');
  await page.waitForTimeout(500);
  check(sent.length === 1 && decodeURIComponent(sent[0].replace(/\+/g, ' ')).includes('q4_q4_textarea2=The pacing coach saved my observation lesson.'), 'feedback is posted to the Jotform form fields');
  check((await page.locator('[role=status]').last().innerText()).includes('sent'), 'garden confirms the flower was planted and sent');
  // offline
  await ctx.setOffline(true);
  await page.click('[data-mood="love"]');
  await page.fill('#fg-text', 'Written on the bus with no signal.');
  await page.click('#fg-send');
  await page.waitForSelector('.flower.sunflower');
  check((await page.locator('[role=status]').last().innerText()).includes('offline'), 'offline feedback is planted and queued');
  check(sent.length === 1, 'nothing is sent while offline');
  await ctx.setOffline(false);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  for (let i = 0; i < 20 && sent.length < 2; i++) await page.waitForTimeout(300);
  check(sent.length === 2, 'queued feedback is sent when back online');
  await page.waitForTimeout(1600); /* let the newest flower bloom */
  if (out) { await page.locator('.bed').screenshot({ path: `${out}/m6-garden-bed.png` }); await page.screenshot({ path: `${out}/m6-garden.png`, fullPage: true }); }

  // Music: plays from a tap, pauses in Teach mode
  await page.goto(base + '#/me');
  await page.click('#music-toggle');
  await page.waitForTimeout(600);
  check((await page.getAttribute('#music-toggle', 'aria-pressed')) === 'true', 'music starts from a tap');
  await page.goto(base + '#/plan/new');
  await page.waitForSelector('[data-sow="1"]');
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lid = page.url().split('/').slice(-2)[0];
  await page.goto(base + '#/teach/' + lid);
  await page.waitForSelector('#teach-start');
  await page.goto(base + '#/me');
  await page.waitForSelector('#music-toggle');
  check((await page.getAttribute('#music-toggle', 'aria-pressed')) === 'false', 'music pauses when Teach mode opens');

  // Backup and restore
  await page.goto(base + '#/today');
  await page.waitForSelector('.nudges');
  check((await page.locator('.nudges').innerText()).includes('not backed up'), 'Today reminds the teacher to back up');
  await page.goto(base + '#/me');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bk-save')]);
  const file = path.join(require('os').tmpdir(), dl.suggestedFilename());
  await dl.saveAs(file);
  const backup = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  check(/^Consilia-backup-\d{4}-\d{2}-\d{2}\.consilia-backup$/.test(dl.suggestedFilename()) && backup.counts.lessons === 1 && backup.counts.profile === 1, 'backup file holds the lesson and profile');
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('consilia'); r.onsuccess = () => { const tx = r.result.transaction('lessons', 'readwrite'); tx.objectStore('lessons').clear(); tx.oncomplete = res; }; }));
  await page.setInputFiles('#bk-file', file);
  await page.click('#bk-merge');
  await page.waitForSelector('#bk-msg:has-text("Restored")');
  await page.goto(base + '#/plan');
  await page.waitForSelector('.list li');
  check((await page.locator('.list li').count()) === 1, 'restoring the backup brings the deleted lesson back');

  await browser.close();
  if (errors.length) { console.log('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM6 end-to-end test passed');
})();
