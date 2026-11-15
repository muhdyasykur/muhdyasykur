// End-to-end for milestone 4: Teach mode (attendance, clock, pacing coach, resume after reload, tools),
// PBD recording, heatmap, Excel export and the PIN lock. Run against `vite preview`: node scripts/e2e-teach.cjs [out-dir]
const { chromium } = require('playwright');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const names = ['Aina', 'Bala', 'Chong Wei', 'Dhia', 'Elena', 'Faris', 'Gopal', 'Hana', 'Irfan', 'Jia Hui', 'Kavin', 'Lina'];
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  let page = await ctx.newPage();
  const watch = (p) => { p.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/microphone|getUserMedia|NotAllowed|NotFound|Permission/i.test(m.text())) errors.push('console: ' + m.text()); }); };
  watch(page);
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // class with pupils and a keep-apart pair
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Zhong');
  await page.click('form button[aria-pressed]:has-text("SJK")');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  const classId = page.url().split('/').pop();
  await page.fill('#cd-paste', names.join('\n'));
  await page.click('button:has-text("Add 12 pupils")');
  await page.waitForSelector('.pupils li:nth-child(12)');
  await page.locator('.pupils li').first().locator('a:has-text("Profile")').click();
  await page.waitForSelector('.pairs');
  await page.locator('.pr').filter({ hasText: 'Bala' }).locator('button:has-text("Keep apart")').click();
  await page.waitForTimeout(200);
  check((await page.locator('.pr').filter({ hasText: 'Bala' }).locator('button[aria-pressed=true]').count()) === 1, 'keep-apart pair saved on the pupil profile');

  // RPH following SoW Y4 SJK lesson 1, for this class
  await page.goto(base + '#/plan/new');
  await page.waitForSelector('#nr-class');
  await page.selectOption('#nr-class', { label: '4 Zhong · Year 4 SJK' });
  await page.waitForSelector('[data-sow="1"]');
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.waitForTimeout(800);

  // Teach mode with a controllable clock
  await page.close();
  page = await ctx.newPage(); watch(page);
  await page.clock.install({ time: new Date('2026-11-16T09:10:00') });
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('#teach-start');
  check((await page.locator('nav.nav').count()) === 0, 'Teach mode is full screen (no app navigation)');
  check((await page.locator('.att .pp').count()) === 12, 'attendance lists the 12 pupils');
  await page.click('.pp[data-pupil="Dhia"]');
  await page.click('.pp[data-pupil="Kavin"]');
  check((await page.locator('.att').innerText()).length > 0 && (await page.locator('.pp.absent').count()) === 2, 'two pupils marked absent');
  await page.click('#teach-start');
  await page.waitForSelector('.clock');
  const stage1 = await page.locator('.stagename').innerText();
  check(stage1 === 'Pre-lesson', 'lesson starts on the Pre-lesson stage');
  await page.clock.runFor(2 * 60_000);
  check((await page.locator('.clock').innerText()) === '3:00', `countdown shows 3:00 after 2 minutes (${await page.locator('.clock').innerText()})`);
  await page.clock.runFor(6 * 60_000);
  check((await page.locator('.clock').innerText()) === '+3:00' && (await page.locator('.clock.over').count()) === 1, 'overrun shows +3:00 in red');
  check((await page.locator('.coach.behind').innerText()).includes('3 min behind'), 'pacing coach: 3 minutes behind, with a Plan B step to cut');
  await page.click('#teach-next');
  const stage2 = await page.locator('.stagename').innerText();
  check(stage2 !== 'Pre-lesson', `Next moves to stage 2 (${stage2})`);
  await page.clock.runFor(60_000);
  // reload: the session resumes on the same stage
  await page.reload();
  await page.waitForSelector('.clock');
  check((await page.locator('.stagename').innerText()) === stage2, 'after a reload the lesson resumes on the same stage');
  if (out) await page.screenshot({ path: `${out}/teach-live.png` });

  // tools
  await page.click('[data-tool=picker]');
  await page.click('#picker-go');
  await page.clock.runFor(5000);
  const picked = (await page.locator('.name').innerText()).trim();
  check(names.includes(picked) && !['Dhia', 'Kavin'].includes(picked), `name picker chose a present pupil (${picked})`);
  await page.click('.sheet button:has-text("Close")');
  await page.click('[data-tool=groups]');
  await page.fill('#grp-size', '3');
  await page.click('#grp-make');
  const groups = await page.$$eval('.g ul', (uls) => uls.map((u) => [...u.querySelectorAll('li')].map((li) => li.textContent.replace(/^\S+\s*/, '').trim())));
  const all = groups.flat();
  check(groups.length === 3 && all.length === 10 && !all.includes('Dhia') && !all.includes('Kavin'), `groups made from the 10 present pupils (${groups.map((g) => g.length).join('/')})`);
  check(!groups.some((g) => g.includes('Aina') && g.includes('Bala')), 'keep-apart pair (Aina, Bala) is in different groups');
  if (out) await page.screenshot({ path: `${out}/teach-groups.png` });
  await page.click('.sheet button:has-text("Close")');
  await page.click('[data-tool=points]');
  await page.locator('.team').first().locator('button:has-text("+1")').click();
  await page.locator('.team').first().locator('button:has-text("+1")').click();
  check((await page.locator('.team').count()) === 3 && (await page.locator('.team .n').first().innerText()) === '2', 'team points follow the groups');
  await page.click('.sheet button:has-text("Close")');
  await page.click('[data-tool=noise]');
  await page.click('#noise-start');
  await page.waitForSelector('.lamp');
  check((await page.locator('.lamp').count()) === 1, 'noise meter shows a traffic light (manual when no microphone)');
  await page.click('.sheet button:has-text("Close")');
  await page.click('[data-tool=timer]');
  await page.click('.sheet button:has-text("1 min")');
  await page.clock.runFor(30_000);
  check(/^0:(29|30|31)$/.test(await page.locator('.time').innerText()), `activity timer counts down (${await page.locator('.time').innerText()})`);
  await page.click('.sheet button:has-text("Close")');

  // finish the lesson
  while ((await page.locator('#teach-next').count()) > 0) { await page.clock.runFor(4 * 60_000); await page.click('#teach-next'); }
  await page.waitForSelector('.sum');
  const rows = await page.$$eval('.sum tbody tr', (trs) => trs.map((t) => t.textContent));
  check(rows.length === 5 && rows[0].includes('8 min'), `end screen compares planned and actual time (${rows[0]})`);
  await page.click('#teach-pbd');
  await page.waitForSelector('.grid-tp');
  check((await page.locator('.grid-tp li.off').count()) === 2 * (await page.locator('section.ls').count()), 'absent pupils are greyed out in the PBD grid');
  const ls1 = page.locator('section.ls').first();
  await ls1.locator('button:has-text("4")').first().click(); // "set everyone to 4"
  await ls1.locator('li').filter({ hasText: 'Aina' }).locator('button.tp:has-text("2")').click();
  await ls1.locator('li').filter({ hasText: 'Bala' }).locator('button.tp:has-text("6")').click();
  await page.click('#pbd-save');
  await page.waitForSelector('.ok');
  check((await page.locator('.ok').innerText()).startsWith('10 records'), `TP levels saved (${await page.locator('.ok').innerText()})`);
  await page.click('a:has-text("See class progress")');
  await page.waitForSelector('.heat');
  const ainaRow = await page.locator('.heat tr').filter({ hasText: 'Aina' }).innerText();
  check(/Low/.test(ainaRow) && /\b2\b/.test(ainaRow), 'heatmap shows Aina at TP2 and suggests Low');
  if (out) await page.screenshot({ path: `${out}/pbd-heatmap.png` });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#pbd-excel')]);
  check(/^PBD-4-Zhong-.*\.xlsx$/.test(dl.suggestedFilename()), `Excel export: ${dl.suggestedFilename()}`);
  if (out) await dl.saveAs(`${out}/${dl.suggestedFilename()}`);

  // PIN lock
  await page.goto(base + '#/me');
  await page.click('#pin-start');
  await page.fill('#pin-a', '2468'); await page.fill('#pin-b', '2468');
  await page.click('#pin-save');
  await page.waitForSelector('text=PIN set');
  const raw = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('consilia'); r.onsuccess = () => { const q = r.result.transaction('pupils').objectStore('pupils').getAll(); q.onsuccess = () => res(q.result.map((p) => p.name)); }; }));
  check(raw.length === 12 && raw.every((n) => n.startsWith('enc:v1:')), 'pupil names are encrypted in the database');
  await page.click('button:has-text("Lock now")');
  await page.goto(base + '#/classes/' + classId);
  await page.waitForSelector('#unlock-pin');
  await page.fill('#unlock-pin', '1111'); await page.click('button:has-text("Unlock")');
  check((await page.locator('.err').innerText()).includes('not right'), 'a wrong PIN is refused');
  await page.fill('#unlock-pin', '2468'); await page.click('button:has-text("Unlock")');
  await page.waitForSelector('.pupils');
  check((await page.$$eval('.pupils input', (els) => els.map((e) => e.value))).join(',') === names.join(','), 'the right PIN shows the real names again');

  // hold to exit
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('.exit');
  const box = await page.locator('.exit').boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down();
  await page.clock.runFor(1200);
  await page.mouse.up();
  await page.waitForURL(/review$/);
  check(true, 'pressing and holding Exit leaves Teach mode');

  // phone layout
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage(); watch(p2);
  await p2.goto(base); await p2.click('button:has-text("Skip for now")');
  await p2.goto(base + '#/plan/new'); await p2.waitForSelector('[data-sow="1"]'); await p2.click('[data-sow="1"]'); await p2.click('#nr-create'); await p2.waitForURL(/setup$/);
  const lid = p2.url().split('/').slice(-2)[0];
  await p2.waitForTimeout(700);
  await p2.goto(base + '#/teach/' + lid); await p2.click('#teach-start'); await p2.waitForSelector('.clock');
  check(await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'phone: Teach mode has no horizontal scroll');
  if (out) await p2.screenshot({ path: `${out}/teach-phone.png` });

  await browser.close();
  if (errors.length) { console.log('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nTeach end-to-end test passed');
})();
