// End-to-end: first-run profile, a class, then the "What's the Matter" RPH (Year 4 SJK, Writing) built in
// From-scratch mode, printed in both layouts. Run against `vite preview`: node scripts/e2e-rph.cjs [out-dir]
const { chromium } = require('playwright');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base);

  // 1. onboarding
  await page.waitForSelector('#ob-title');
  check(true, 'onboarding shows on first run');
  await page.fill('#pf-name', 'Muhammad Yasykur bin Muhamad Yasim');
  await page.fill('#pf-school', 'SK(C) Anglo Chinese Kota Kinabalu');
  await page.click('button:has-text("SJK (national-type)")');
  await page.fill('#pf-prog', 'PISMP TESL');
  await page.fill('#pf-campus', 'IPG Kampus Gaya');
  await page.click('button:has-text("Start planning")');
  await page.waitForSelector('#ob-title', { state: 'detached' });
  check(true, 'profile saved and onboarding closes');

  // 2. a class with pupils
  await page.click('nav a[href="#/classes"]');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Zhong');
  await page.fill('#cl-level', 'Average');
  await page.click('form button[aria-pressed]:has-text("SJK")');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.fill('#cd-paste', '1. Aina\n2. Bala\n3. Chong Wei\n4. Dhia\n5. Ali\n6. Ali');
  await page.click('button:has-text("Add 6 pupils")');
  await page.waitForSelector('.pupils li:nth-child(6)');
  const names = await page.$$eval('.pupils input', (els) => els.map((e) => e.value));
  check(names.join('|') === 'Aina|Bala|Chong Wei|Dhia|Ali A.|Ali B.', `pasted list cleaned and duplicates marked (${names.join(', ')})`);

  // 3. new RPH from scratch
  await page.click('nav a[href="#/plan"]');
  await page.click('a:has-text("New RPH")');
  await page.waitForSelector('#nr-class');
  await page.selectOption('#nr-class', { label: '4 Zhong · Year 4 SJK' });
  await page.fill('#nr-date', '2025-11-03');
  await page.fill('#nr-start', '09:10');
  await page.click('[role=radio]:has-text("From scratch")');
  await page.click('#nr-create');
  await page.waitForURL(/#\/plan\/edit\/.+\/standards/);
  check(true, 'scratch RPH created and opens on Standards');

  // 4. standards
  await page.click('.skills button:has-text("Writing")');
  await page.check('[data-ls="4.2.3"]');
  await page.click('button:has-text("C · Complementary skill")');
  await page.check('[data-ls="4.2.5"]');
  const stdText = await page.locator('.std').allInnerTexts();
  check(stdText[0].includes('LS 4.2.3') && stdText[0].includes('CS 4.2') && stdText[1].includes('LS 4.2.5'), 'main 4.2.3 and complementary 4.2.5 chosen with their content standard');

  // 5. setup
  await page.click('.steps a:has-text("Setup")');
  await page.fill('#st-topic', "What's the Matter");
  await page.fill('#st-theme', 'World of Self, Family and Friends');
  await page.fill('#st-focus', "Modal verbs should / shouldn't");
  await page.fill('#st-cce', 'Language');
  await page.fill('#st-21', 'Collaboration, Critical Thinking');
  await page.fill('#st-values', 'Health awareness');
  await page.fill('#st-ped', 'Contextual learning');
  await page.fill('#st-prior', 'Daily routines vocabulary; present simple.');
  check((await page.inputValue('#st-pupils')) === '6', 'pupil count comes from the class');

  // 6. objectives
  await page.click('.steps a:has-text("Objectives")');
  const objs = page.locator('section.obj');
  await objs.nth(0).locator('[data-field=verb]').fill('write');
  await objs.nth(0).locator('[data-field=content]').fill("5 sentences using should and shouldn't to describe healthy and unhealthy routines");
  await objs.nth(0).locator('[data-field=condition]').fill('based on a picture worksheet');
  await objs.nth(0).locator('[data-field=degree]').fill('with at least 4 correct');
  await objs.nth(1).locator('[data-field=verb]').fill('connect');
  await objs.nth(1).locator('[data-field=content]').fill('their sentences into a short paragraph using basic coordinating conjunctions (and, but, because)');
  await objs.nth(1).locator('[data-field=degree]').fill('with minimal support');
  const okM = await objs.nth(0).locator('.smart li.ok').count();
  const okC = await objs.nth(1).locator('.smart li.ok').count();
  const fixC = await objs.nth(1).locator('.fix').allInnerTexts();
  check(okM === 5, `main objective passes all five SMART letters (${okM}/5)`);
  check(okC === 4 && fixC.join(' ').includes('minimal'), 'template wording "with minimal support" is flagged as unmeasurable');
  await objs.nth(1).locator('[data-field=degree]').fill('with at least 2 correctly used conjunctions');
  check((await objs.nth(1).locator('.smart li.ok').count()) === 5, 'complementary objective passes once the degree has a number');
  const sc = await page.$$eval('.sc input', (els) => els.map((e) => e.value));
  check(sc[0] === "I can write 5 sentences using should and shouldn't to describe healthy and unhealthy routines." && sc[1].startsWith('I can connect my sentences'), 'success criteria generated in pupil language');

  // 7. lesson flow: recommendation is Process Writing; the teacher chooses PPP with a reason
  await page.click('.steps a:has-text("Lesson flow")');
  check((await page.locator('.chip:has-text("Recommended")').innerText()).includes('Process'), 'Process Writing recommended for a Year 4 writing lesson');
  await page.click('[data-fw="ppp"]');
  await page.fill('#fw-reason', "The lesson centres on one sentence pattern: should / shouldn't.");
  const stageTitles = await page.$$eval('section.stage h3', (els) => els.map((e) => e.textContent));
  check(stageTitles.join('|') === 'Pre-lesson|Presentation|Practice|Production|Post-lesson', 'PPP stages within the SoW shell');
  const acts = [
    ['Shows 4 pictures (brushing teeth, eating junk food, playing outside, watching TV late) and asks: "Is this good or bad for your health?"', 'Vote with thumbs up or down and give one reason.', 'Pictures', 'Health awareness'],
    ["Displays a model paragraph and highlights should / shouldn't and the conjunctions and, because. Asks concept-check questions.", 'Find more examples of should / shouldn\'t in the paragraph.', 'Presentation slides', ''],
    ['Gives the picture worksheet and monitors with a checklist.', "Write one sentence with should or shouldn't for each picture, then check answers with a partner.", 'Worksheet', 'Peer discussion'],
    ['Conferences with the Low group first.', 'Plan and write a 5–6 sentence paragraph about staying healthy, then peer-check with the success criteria.', 'Writing paper', 'Peer discussion'],
    ['Asks three pupils to read their paragraphs aloud.', 'Self-assess with thumbs against the "I can" statements.', 'Exit ticket', '']
  ];
  for (let i = 0; i < 5; i++) {
    const a = page.locator('section.stage').nth(i).locator('.act').first();
    await a.locator('[data-act=teacher]').fill(acts[i][0]);
    await a.locator('[data-act=pupils]').fill(acts[i][1]);
    await a.locator('input[placeholder="e.g. Worksheet"]').fill(acts[i][2]);
    if (acts[i][3]) await a.locator('input[placeholder="e.g. Peer discussion"]').fill(acts[i][3]);
  }
  const prod = page.locator('section.stage').nth(3).locator('.act').first();
  await prod.locator('button:has-text("Low")').click(); await prod.locator('[data-tier=low]').fill('Sentence frame "I should ___ because ___." Picture and word bank. 3 sentences.');
  await prod.locator('button:has-text("Moderate")').click(); await prod.locator('[data-tier=mod]').fill('Paragraph starter given. 5 sentences, 2 conjunctions.');
  await prod.locator('button:has-text("High")').click(); await prod.locator('[data-tier=high]').fill('No starter. 6 sentences with reasons and advice for a friend.');
  // link the complementary objective to Presentation and Production
  for (const i of [1, 3]) await page.locator('section.stage').nth(i).locator('.act').first().locator('label.pick:has-text("C1") input').check();
  check((await page.locator('.bad').count()) === 0, 'timing adds up to 60 minutes');
  await page.locator('[data-stage-min="production"]').fill('25');
  check((await page.locator('p.bad').first().innerText()).includes('over by 5'), 'timing error shown when stages exceed the lesson');
  await page.locator('[data-stage-min="production"]').fill('20');

  // 8. materials and Plan B
  await page.click('.steps a:has-text("Materials")');
  await page.fill('#mt-aids', 'Picture flashcards, smartboard, worksheet, writing paper');
  await page.fill('#mt-evidence', 'Paragraph (M), conjunction count (C)');
  await page.fill('#mt-method', 'Checklist while monitoring; exit ticket');
  await page.fill('#mt-app', "Healthy or Not? Worksheet\nLook at the pictures. Write a sentence using should or shouldn't for each picture.");
  await page.click('.steps a:has-text("Plan B")');
  await page.fill('[data-planb=early]', 'High-tier extension: write advice to a friend.');
  await page.fill('[data-planb=late]', 'Cut the read-aloud; finish the paragraph as homework.');

  // 9. persistence: reload and come back
  await page.waitForTimeout(900);
  await page.reload();
  await page.waitForSelector('[data-planb=early]');
  check((await page.inputValue('[data-planb=early]')).startsWith('High-tier'), 'autosave keeps work after a reload');

  // 10. review and print
  await page.click('.steps a:has-text("Review")');
  await page.waitForSelector('article.paper');
  const scoreOf = async () => Number((await page.locator('#check svg.ring text').textContent()).trim());
  const s1 = await scoreOf();
  const failing = await page.$$eval('#check li.fail', (els) => els.map((e) => e.dataset.rule));
  check(s1 < 100 && failing.join() === 'plan-b', `score ${s1}: only Plan B needs attention (${failing.join(', ')})`);
  await page.click('#check li.fail[data-rule="plan-b"] a:has-text("Fix it")');
  await page.waitForSelector('#pb-fill');
  await page.click('#pb-fill');
  check((await page.inputValue('[data-planb=early]')).startsWith('High-tier'), 'suggestions keep the teacher\'s own Plan B text');
  check((await page.inputValue('[data-planb=offline]')).toLowerCase().includes('slides'), 'offline plan names the slides and their board version');
  await page.click('.steps a:has-text("Review")');
  await page.waitForSelector('article.paper');
  check((await scoreOf()) === 100, 'score reaches 100 once Plan B is complete');
  check((await page.locator('.head .score').innerText()).includes('Aligned'), 'builder header shows the lesson as aligned');
  // mark-as-fine round trip on a fresh failure
  await page.click('.steps a:has-text("Setup")');
  await page.fill('#st-21', '');
  await page.click('.steps a:has-text("Review")');
  await page.click('#check li.fail[data-rule="cce-21"] button:has-text("Mark as fine")');
  await page.fill('#check input.reason', 'Mentor asked to leave 21st-century skills to the school template.');
  await page.click('#check button:has-text("Save")');
  check((await scoreOf()) === 100 && (await page.locator('#check li.accepted').count()) === 1, 'a rule marked as fine counts, with its reason shown');
  await page.click('#check li.accepted button:has-text("Undo")');
  await page.click('.steps a:has-text("Setup")');
  await page.fill('#st-21', 'Collaboration, Critical Thinking');
  await page.click('.steps a:has-text("Review")');
  await page.waitForSelector('article.paper');
  const school = await page.locator('article.paper').innerText();
  check(school.includes('SK(C) ANGLO CHINESE KOTA KINABALU') && school.includes('4 Zhong (Average Level, 6 Students)') && school.includes('09:10 – 10:10') && school.includes('Monday'), 'school template header filled from profile, class and time');
  check(school.includes('4.2.3 Describe basic everyday routines') && school.includes('Activity 3 (Production) (20 minutes)'), 'school template lists standards and PPP activities');
  if (out) {
    await page.screenshot({ path: `${out}/rph-review-school.png`, fullPage: false });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: `${out}/rph-school.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
  }
  await page.click('button:has-text("Consilia Lesson Blueprint")');
  const bp = await page.locator('article.paper').innerText();
  check(/alignment map/i.test(bp) && (bp.match(/✔ Aligned/g) || []).length === 2, 'blueprint alignment map shows both standards aligned');
  check(bp.includes('Sentence frame') && bp.includes('I can write 5 sentences'), 'blueprint shows differentiation and success criteria');
  if (out) {
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: `${out}/rph-blueprint.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
  }
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll on review');
  for (const layout of ['Consilia Lesson Blueprint', 'School template']) {
    await page.click(`button:has-text("${layout}")`);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rv-word')]);
    const name = dl.suggestedFilename();
    if (out) await dl.saveAs(`${out}/${name}`);
    check(/^RPH-2025-11-03-4-Zhong-Whats-the-Matter(-Blueprint)?\.docx$/.test(name), `Word download for ${layout}: ${name}`);
  }

  // 10b. weekly planner and Today
  await page.goto(base + '#/plan/week/2025-11-03');
  await page.waitForSelector('#tt-class');
  await page.selectOption('#tt-day', '1'); await page.fill('#tt-start', '09:10'); await page.fill('#tt-dur', '60');
  await page.click('#tt-add');
  await page.selectOption('#tt-day', '3'); await page.fill('#tt-start', '07:40'); await page.fill('#tt-dur', '30');
  await page.click('#tt-add');
  await page.selectOption('#tt-day', '1'); await page.fill('#tt-start', '09:40'); await page.fill('#tt-dur', '30');
  await page.click('#tt-add');
  check((await page.locator('p.warn').count()) === 1, 'overlapping timetable slots are flagged');
  await page.locator('.slots li').filter({ hasText: '09:40' }).locator('button').click();
  await page.click('button:has-text("Done editing timetable")');
  const mon = page.locator('.day').first();
  check((await mon.innerText()).includes("What's the Matter"), 'Monday slot shows the planned RPH');
  const wed = page.locator('.day').nth(2);
  await wed.locator('button:has-text("No class this day")').click();
  await wed.locator('input').fill('Sports day');
  await wed.locator('button:has-text("Mark no class")').click();
  check((await wed.innerText()).includes('Sports day'), 'a slot can be marked as no class with a reason');
  await page.click('a[href="#/plan/week/2025-11-10"]');
  await page.locator('.day').first().locator('a:has-text("Plan this lesson")').click();
  await page.waitForSelector('#nr-class');
  check((await page.inputValue('#nr-date')) === '2025-11-10' && (await page.inputValue('#nr-start')) === '09:10' && (await page.locator('#nr-class option:checked').innerText()).startsWith('4 Zhong'), 'planning from the week fills class, date and time');
  await page.click('nav a[href="#/today"]');
  await page.waitForSelector('.next, .empty');
  check((await page.locator('.next').innerText()).includes('4 Zhong'), 'Today shows the next timetabled lesson');
  check((await page.locator('h1').first().innerText()) === 'Hello, Muhammad', 'Today greets the teacher by name');
  if (out) await page.screenshot({ path: `${out}/today.png` });
  await page.goto(base + '#/plan');
  await page.waitForSelector('.list li');
  check((await page.locator('.list li svg.ring text').first().textContent()) === '100', 'lesson list shows the score');

  // 11. phone width: builder steps usable
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  p2.on('pageerror', (e) => errors.push('phone pageerror: ' + e.message));
  await p2.goto(base);
  await p2.click('button:has-text("Skip for now")');
  await p2.goto(base + '#/plan/new');
  await p2.waitForSelector('[data-sow="1"]');
  await p2.click('[data-sow="1"]');
  await p2.click('#nr-create');
  await p2.waitForURL(/setup$/);
  for (const s of ['setup', 'standards', 'objectives', 'flow', 'materials', 'planb', 'review']) {
    await p2.goto(p2.url().replace(/[^/]+$/, s));
    await p2.waitForTimeout(250);
    const w = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(w <= 0, `phone: ${s} step has no horizontal page scroll`);
    if (out && s === 'flow') await p2.screenshot({ path: `${out}/phone-flow.png` });
  }
  await browser.close();
  if (errors.length) { console.log('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nRPH end-to-end test passed');
})();
