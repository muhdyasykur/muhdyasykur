// End-to-end for milestone 8: Consilia Recommends (class profile, planning log, step-by-step stages, BBM, Another idea,
// preparation checklist, Use this plan), the Tools hub and every tool, projector games, Games in Teach mode, terms page.
// Run against `vite preview`: node scripts/e2e-m8.cjs [out-dir]
const { chromium } = require('playwright');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // a class to plan for
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.fill('#cd-paste', 'Aina\nBala\nChong Wei\nDhia\nElena\nFaris');
  await page.click('button:has-text("Add 6 pupils")');
  await page.waitForSelector('.pupils li:nth-child(6)');

  // ---- Consilia Recommends
  await page.goto(base + '#/today');
  await page.click('a:has-text("Let Consilia plan it")');
  await page.waitForSelector('#rc-words');
  check((await page.locator('[role=radio][aria-checked=true]').innerText()).includes('Consilia recommends'), 'Today opens New RPH with Consilia recommends chosen');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="2"]');
  await page.click('[data-trait="shy"]');
  await page.click('[data-trait="large-class"]');
  await page.click('[data-goal="speaking"]'); await page.click('[data-goal="observation"]'); await page.click('[data-goal="fun"]');
  check(await page.locator('[data-goal="calm"]').isDisabled(), 'at most three goals can be chosen');
  await page.fill('#rc-words', 'Malaysia, Japan, China, India, Thailand');
  await page.fill('#rc-sentence', 'He is from …');
  if (out) await page.screenshot({ path: `${out}/m8-form.png`, fullPage: true });
  await page.click('#nr-create');
  await page.waitForSelector('#rc-use', { timeout: 20000 });
  const log = await page.locator('.log li').allTextContents();
    check(log.length >= 8 && log[1].startsWith('Chose PPP') && log.some((l) => l.includes('shy speakers')), `the planning log explains each decision (${log.length} steps)`);
  const stages = await page.locator('[data-stage]').count();
  check(stages === 5, `every PPP stage is planned (${stages})`);
  const steps = await page.locator('[data-stage] .script').evaluateAll((els) => els.map((e) => e.querySelectorAll('li').length));
  check(steps.every((n) => n >= 4), `each activity has a step-by-step script (${steps.join(', ')} steps)`);
  const text = await page.locator('.proposal').innerText();
  check(text.includes('Malaysia') && text.includes('He is from'), 'the steps use the teacher\'s own words and sentence');
  check(!/\{(topic|words|first|sentence|text)\}/.test(text), 'no unfilled placeholders');
  check((await page.locator('.proposal svg.ring text').first().textContent()).trim() === '100', 'the proposed plan scores 100');
  const bbm = page.locator('.proposal details.bbm').first();
  await bbm.locator('summary').click();
  check((await bbm.locator('ol li').count()) >= 2 && (await bbm.locator('svg[role=img]').count()) === 1, 'a teaching aid shows its picture and how to make it');
  if (out) await bbm.screenshot({ path: `${out}/m8-bbm.png` });
  const third = page.locator('[data-stage]').nth(2);
  const before = await third.locator('[data-recipe]').first().getAttribute('data-recipe');
  const others = await page.locator('[data-stage]').evaluateAll((els) => els.map((e) => e.querySelector('[data-recipe]').dataset.recipe));
  await third.locator('.another').click();
  await page.waitForTimeout(200);
  const after = await page.locator('[data-stage]').nth(2).locator('[data-recipe]').first().getAttribute('data-recipe');
  const others2 = await page.locator('[data-stage]').evaluateAll((els) => els.map((e) => e.querySelector('[data-recipe]').dataset.recipe));
  check(after !== before && [0, 1, 3, 4].every((i) => others[i] === others2[i]), `"Another idea" swaps only that stage (${before} → ${after})`);
  const mins = async () => Number((await page.locator('.prep h3 .mins').innerText()).match(/\d+/)[0]);
  const m1 = await mins();
  await page.locator('.prep input[type=checkbox]').first().check();
  check((await mins()) < m1, 'ticking an aid you already have reduces the preparation time');
  await page.click('.proposal .ai-copy');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Year 4') && clip.includes('CEFR') && !clip.includes('Aina'), 'Improve with AI copies a prompt with the lesson and no pupil names');
  if (out) await page.screenshot({ path: `${out}/m8-proposal.png`, fullPage: true });
  await page.click('#rc-use');
  await page.waitForURL(/review$/);
  await page.waitForSelector('#check svg.ring');
  check((await page.locator('#check svg.ring text').textContent()).trim() === '100', 'Use this plan saves an RPH that scores 100 in the builder');
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.click('.steps a:has-text("Lesson flow")');
  check((await page.locator('[data-act=teacher]').first().inputValue()).length > 10, 'the builder holds the recommended activities, ready to edit');

  // the class profile is remembered
  await page.goto(base + '#/plan/new/recommend');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.waitForTimeout(300);
  check((await page.locator('[data-trait="shy"]').getAttribute('aria-pressed')) === 'true', 'Consilia remembers the class answers for next time');
  // no internet, no devices: nothing online is suggested
  await page.click('[data-sow="3"]');
  if ((await page.locator('[data-res="internet"]').getAttribute('aria-pressed')) === 'true') await page.click('[data-res="internet"]');
  await page.click('#nr-create');
  await page.waitForSelector('#rc-use');
  const needs = await page.locator('.dig .muted').allInnerTexts();
  check(needs.every((n) => !n.includes('internet')), 'without internet, only offline digital options are suggested');

  // ---- Tools hub
  await page.click('nav a[href="#/tools"]');
  await page.waitForSelector('[data-tool-card]');
  check((await page.locator('[data-tool-card]').count()) === 11, 'the Tools hub lists 11 tools');
  await page.fill('#tools-q', 'chant');
  check((await page.locator('[data-tool-card]').count()) === 1, 'tools can be searched');
  await page.fill('#tools-q', '');

  // games
  await page.goto(base + '#/tools/games/wheel');
  await page.fill('#g-words', 'Malaysia, Japan, China, India');
  await page.click('#g-spin');
  await page.waitForFunction(() => document.querySelector('.result')?.textContent.trim().length > 1, null, { timeout: 8000 });
  check(['Malaysia', 'Japan', 'China', 'India'].includes((await page.locator('.result').innerText()).trim()), 'the spin wheel lands on one of the teacher\'s words');
  if (out) await page.screenshot({ path: `${out}/m8-wheel.png` });
  await page.click('[data-game="unjumble"]');
  await page.fill('#g-sent', 'He is from Japan.\nShe lives in Kota Kinabalu.');
  await page.waitForSelector('.tile');
  await page.click('#g-reveal');
  check((await page.locator('.answer').innerText()).includes('He is from Japan.'), 'Unjumble mixes the sentence and reveals it');
  await page.click('[data-game="mystery"]');
  await page.click('#g-letter');
  check((await page.locator('.letter').evaluateAll((els) => els.filter((e) => e.textContent.trim()).length)) === 1, 'Mystery word reveals one letter at a time');
  await page.click('[data-game="quiz"]');
  await page.fill('#g-quiz', 'Where is Mount Kinabalu? | Sabah');
  await page.click('#g-answer');
  await page.click('button[aria-label="Team 2 plus one"]');
  check((await page.locator('.answer').innerText()) === 'Sabah' && (await page.locator('.team .n').nth(1).innerText()) === '1', 'Quiz show reveals answers and keeps team scores');

  // the other tools
  await page.goto(base + '#/tools/bbm');
  check((await page.locator('[data-bbm]').count()) === 25, 'the BBM guide shows all 25 teaching aids');
  await page.click('button.pick:has-text("Phonics")');
  check((await page.locator('[data-bbm]').count()) < 25, 'teaching aids can be filtered by use');
  await page.goto(base + '#/tools/ideas');
  const n1 = await page.locator('[data-idea]').count();
  await page.selectOption('#id-skill', 'Reading');
  check(n1 > 0 && (await page.locator('[data-idea]').count()) < n1, 'activity ideas filter by skill');
  await page.locator('[data-idea]').first().locator('summary').click();
  check((await page.locator('[data-idea] ol li').count()) >= 4, 'an activity idea opens with its steps');
  await page.goto(base + '#/tools/objectives');
  await page.fill('#ow-topic', 'My family');
  await page.click('#ow-suggest');
  check((await page.locator('.smart li.ok').count()) === 5, 'the objective writer suggests an objective that passes all five SMART checks');
  await page.goto(base + '#/tools/chant');
  await page.fill('#ch-words', 'Japan, China, India'); await page.fill('#ch-frame', 'He is from …');
  check((await page.locator('[data-chant="echo"] .lines').innerText()).includes('He is from Japan'), 'the chant maker writes chants with the teacher\'s words');
  await page.goto(base + '#/tools/differentiate');
  await page.fill('#df-act', 'Pupils interview a partner about hobbies');
  check((await page.locator('.tiers ul').count()) === 3, 'the differentiation helper gives Low, Moderate and High versions');
  await page.goto(base + '#/tools/ai');
  await page.click('[data-kind="questions"]');
  await page.fill('#ai-topic', 'Healthy habits');
  await page.click('.ai-copy');
  check((await page.evaluate(() => navigator.clipboard.readText())).includes('comprehension questions'), 'the AI prompt builder copies a prompt for the chosen task');
  await page.goto(base + '#/tools/digital');
  await page.fill('#dt-topic', 'animals');
  check((await page.locator('[data-digital="wordwall"] a').getAttribute('href')).includes('animals'), 'digital tools link to ready-made activities for the topic');
  await page.goto(base + '#/tools/manage');
  await page.click('[data-need="shy"]');
  check((await page.locator('section h3').allInnerTexts()).includes('For shy pupils'), 'classroom management suggests routines for the class');
  await page.goto(base + '#/tools/worksheets');
  check((await page.locator('#ms-type').count()) === 1, 'the worksheet maker works without a lesson');

  // games inside Teach mode, terms page
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('[data-tool="games"]');
  await page.click('[data-tool="games"]');
  check((await page.locator('#g-words').inputValue()).includes('Japan'), 'Teach mode has Games filled with the lesson\'s key words');
  await page.goto(base + '#/me/terms');
  check((await page.locator('h1').innerText()) === 'Terms of use' && (await page.locator('article').innerText()).includes('You agreed on'), 'the terms can be read again in Me');

  // phone layout
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState({ indexedDB: true }) });
  const p2 = await phone.newPage();
  for (const r of ['#/tools', '#/tools/games/wheel', '#/plan/new/recommend', '#/tools/bbm']) {
    await p2.goto(base + r); await p2.waitForTimeout(400);
    check(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no sideways scrolling on a phone: ${r}`);
  }
  if (out) await p2.screenshot({ path: `${out}/m8-phone-tools.png` });
  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM8 end-to-end test passed');
})();
