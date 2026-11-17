// End-to-end for milestone 9: "lesson plan" wording, attendance for any day (register, month, Excel, from Teach mode),
// My day (timetable periods, own items, reorder, ticks, saved), yearly plans uploaded as Word, Excel and CSV or built
// from the SoW, with yearly, monthly and weekly views linked to the timetable and New lesson plan.
// Run against `vite preview`: node scripts/e2e-m9.cjs [out-dir]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Document, Packer, Table, TableRow, TableCell, Paragraph } = require('docx');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monday = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dmy = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');
  check((await page.locator('a.btn-gold[href="#/plan/new"]').count()) >= 0 && (await page.locator('body').innerText()).indexOf('RPH') === -1, 'the English screens say "lesson plan", not "RPH"');

  // a class with pupils
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  const classId = page.url().split('/').pop();
  await page.fill('#cd-paste', 'Aina\nBala\nChong Wei\nDhia\nElena');
  await page.click('button:has-text("Add 5 pupils")');
  await page.waitForSelector('.pupils li:nth-child(5)');

  // ---- attendance
  await page.click('#cd-attendance');
  await page.waitForSelector('[data-att="Aina"]');
  check((await page.locator('.counts').innerText()).includes('5 not marked'), 'attendance opens on today with nobody marked');
  await page.locator('[data-att="Bala"] [data-mark="A"]').click();
  await page.locator('[data-att="Bala"] .reason').fill('MC');
  await page.locator('[data-att="Bala"] .reason').press('Tab');
  await page.locator('[data-att="Dhia"] [data-mark="L"]').click();
  await page.click('#att-all');
  await page.waitForTimeout(300);
  check((await page.locator('.counts').innerText()).startsWith('4 of 5 present · 1 late · 1 absent'), `one tap marks everyone else present (${await page.locator('.counts').innerText()})`);
  if (out) await page.screenshot({ path: `${out}/m9-attendance.png` });
  await page.reload();
  await page.waitForSelector('[data-att="Bala"]');
  check((await page.locator('[data-att="Bala"] [data-mark="A"]').getAttribute('aria-checked')) === 'true' && (await page.locator('[data-att="Bala"] .reason').inputValue()) === 'MC', 'marks and reasons are saved');
  await page.click('button[aria-label="Previous day"]');
  await page.locator('[data-att="Aina"] [data-mark="P"]').click();
  await page.click('#att-month');
  await page.waitForSelector('table.month');
  const days = await page.locator('table.month thead th').count();
  check(days >= 3, `the month view shows a column per day recorded (${days - 2})`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#att-excel')]);
  check(/^Attendance-4-Bestari-\d{4}-\d{2}\.xlsx$/.test(dl.suggestedFilename()), `attendance exports to Excel (${dl.suggestedFilename()})`);

  // ---- timetable and My day
  await page.goto(base + '#/plan/week');
  await page.waitForSelector('#tt-class');
  const todayDay = ((new Date().getDay() + 6) % 7) + 1;
  await page.selectOption('#tt-day', String(todayDay)); await page.fill('#tt-start', '09:10'); await page.fill('#tt-dur', '60');
  await page.click('#tt-add');
  await page.selectOption('#tt-day', String(todayDay)); await page.fill('#tt-start', '07:40'); await page.fill('#tt-dur', '30');
  await page.click('#tt-add');
  await page.click('[data-plantab="day"]');
  await page.waitForSelector('[data-day-item]');
  const titles = async () => page.locator('[data-day-item] b').allInnerTexts();
  check((await titles()).length === 2 && (await page.locator('[data-day-item]').first().innerText()).includes('07:40'), 'My day lists today\'s periods in time order');
  await page.fill('#day-add', 'Relief class 5 Cemerlang');
  await page.locator('input[type=time][aria-label="Time"]').fill('08:20');
  await page.click('#day-add-btn');
  check((await titles()).includes('Relief class 5 Cemerlang'), 'own items can be added to the day');
  await page.locator('[data-day-item]').nth(2).locator('button[aria-label="Move up"]').click();
  await page.locator('[data-day-item]').nth(0).locator('input[type=checkbox]').check();
  await page.waitForTimeout(300);
  const order = await titles();
  await page.reload();
  await page.waitForSelector('[data-day-item]');
  check(JSON.stringify(await titles()) === JSON.stringify(order) && (await page.locator('[data-day-item]').nth(0).locator('input[type=checkbox]').isChecked()), 'the day\'s order and ticks are kept');
  check((await page.locator('[data-day-item] a:has-text("Attendance")').count()) === 2 && (await page.locator('[data-day-item] a:has-text("Plan this lesson")').count()) === 2, 'each period offers Plan this lesson and Attendance');
  if (out) await page.screenshot({ path: `${out}/m9-day.png` });

  // ---- yearly plan from a Word file
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'consilia-rpt-'));
  const y = monday.getFullYear();
  const rows = [
    ['MINGGU', 'TARIKH', 'TEMA', 'UNIT / TOPIK', 'STANDARD PEMBELAJARAN', 'PELAJARAN', 'CATATAN'],
    ['1', `${dmy(addD(monday, -7))} - ${dmy(addD(monday, -3))}`, 'World of Self', 'Unit 1: Where are you from?', '1.2.2 2.1.5', '1-3', ''],
    ['2', `${dmy(monday)} - ${dmy(addD(monday, 4))}`, 'World of Self', 'Unit 1: Where are you from?', '3.2.2 4.2.4', '4-6', 'Bring a world map'],
    ['CUTI PERTENGAHAN PENGGAL', '', '', '', '', '', ''],
    ['3', `${dmy(addD(monday, 14))} - ${dmy(addD(monday, 18))}`, 'World of Knowledge', 'Unit 2: Days', '1.2.4', '7, 8', '']
  ];
  const t = new Table({ rows: rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph(c)] })) })) });
  const docxFile = path.join(tmp, `RPT English Tahun 4 ${y}.docx`);
  fs.writeFileSync(docxFile, await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph(`RANCANGAN PENGAJARAN TAHUNAN ${y}`), t] }] })));
  await page.click('[data-plantab="year"]');
  await page.setInputFiles('#yp-file', docxFile);
  await page.waitForSelector('#yp-save');
  const rep = await page.locator('.ok-box').innerText();
  check(rep.includes('3 weeks') && rep.includes('3 with dates') && rep.includes('1 holiday'), `the Word yearly plan is read: ${rep.slice(0, 90)}`);
  check((await page.inputValue('#yp-name')).startsWith('RPT English Tahun 4') && (await page.locator('fieldset input[type=checkbox]').first().isChecked()), 'the plan is named from the file and linked to the Year 4 class');
  if (out) await page.screenshot({ path: `${out}/m9-yearly-check.png`, fullPage: true });
  await page.click('#yp-save');
  await page.waitForSelector('table.weeks:not(.edit)');
  check((await page.locator('table.weeks tr.now').count()) === 1 && (await page.locator('table.weeks tr.now').innerText()).includes('Where are you from?'), 'the yearly view highlights this week');
  await page.click('[data-ypview="month"]');
  await page.waitForSelector('.cal');
  check((await page.locator('.calw').count()) >= 1 && (await page.locator('.cald.today').count()) <= 1, 'the monthly view shows the weeks of the month as a calendar');
  if (out) await page.screenshot({ path: `${out}/m9-monthly.png` });
  await page.click('[data-ypview="week"]');
  await page.waitForSelector('#yp-week-title');
  check((await page.locator('#yp-week-title').innerText()).startsWith('Week 2'), 'the weekly view opens on this week');
  check((await page.locator('[data-plan-sow]').count()) === 3, 'this week\'s SoW lessons are listed with Plan it');
  const periods = await page.locator('[data-period-plan]').allInnerTexts();
  check(periods.join('|') === 'Plan lesson 4|Plan lesson 5', `this week's periods are matched to the week's lessons (${periods.join(', ')})`);
  if (out) await page.screenshot({ path: `${out}/m9-weekly.png`, fullPage: true });
  await page.locator('[data-period-plan]').first().click();
  await page.waitForSelector('[data-sow="4"][aria-selected="true"]');
  check((await page.locator('#nr-class').inputValue()) === classId && (await page.inputValue('#nr-start')) === '07:40', 'Plan lesson 4 opens New lesson plan with the lesson, class and time chosen');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  await page.goto(base + '#/plan/day');
  await page.waitForSelector('[data-day-item]');
  check((await page.locator('[data-yearplan]').innerText()).includes('week 2'), 'My day shows what the yearly plan says for this week');
  check((await page.locator('[data-day-item] a:has-text("Teach")').count()) === 1, 'the planned period now offers ▶ Teach');

  // ---- Excel and CSV yearly plans, and building from the SoW
  const csv = path.join(tmp, 'rpt.csv');
  fs.writeFileSync(csv, 'Week;Date;Topic;Lesson\n1;12/1 - 16/1;Unit 1;1-3\n2;19/1 - 23/1;Unit 1;4-6\n');
  await page.goto(base + '#/plan/year');
  await page.setInputFiles('#yp-file', csv);
  await page.waitForSelector('#yp-save');
  check((await page.locator('.ok-box').innerText()).includes('2 weeks'), 'a CSV yearly plan is read');
  await page.click('button:has-text("Cancel")');
  const xl = path.join(tmp, 'rpt.xlsx');
  const { default: writeXlsxFile } = await import('write-excel-file/node');
  await writeXlsxFile([[{ value: 'Minggu' }, { value: 'Tarikh' }, { value: 'Tajuk' }, { value: 'Pelajaran' }], [{ value: 1 }, { value: '5 Jan - 9 Jan' }, { value: 'Unit 1' }, { value: '1-2' }], [{ value: 2 }, { value: '12 Jan - 16 Jan' }, { value: 'Unit 2' }, { value: '3-4' }]]).toFile(xl);
  await page.setInputFiles('#yp-file', xl);
  await page.waitForSelector('#yp-save');
  check((await page.locator('.ok-box').innerText()).includes('2 weeks') && (await page.locator('.ok-box').innerText()).includes('2 with dates'), 'an Excel yearly plan is read');
  await page.click('button:has-text("Cancel")');
  await page.setInputFiles('#yp-file', { name: 'old.doc', mimeType: 'application/msword', buffer: Buffer.from('x') });
  check((await page.locator('.err').innerText()).includes('Save as'), 'an old .doc file gets a plain message about saving as .docx');
  await page.click('#yp-build-open');
  await page.fill('#yp-hol', '2');
  await page.fill('#yp-per', '3');
  await page.click('#yp-build');
  await page.waitForSelector('#yp-save');
  const firstWeeks = await page.locator('table.weeks.edit tbody tr').evaluateAll((trs) => trs.slice(0, 3).map((tr) => tr.querySelectorAll('input')[3].value));
  check(firstWeeks[0] === '1, 2, 3' && firstWeeks[1] === '' && firstWeeks[2] === '4, 5, 6', `building from the SoW lays out 3 lessons a week and skips holiday weeks (${firstWeeks.join(' | ')})`);
  await page.click('#yp-save');
  await page.waitForSelector('table.weeks:not(.edit)');
  await page.goto(base + '#/plan/year');
  check((await page.locator('[data-plan]').count()) === 2, 'both yearly plans are listed');

  // Teach mode fills the register
  await page.goto(base + '#/plan');
  const lessonHref = await page.locator('a[href^="#/plan/edit/"]').first().getAttribute('href');
  const lessonId = lessonHref.split('/')[3];
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('#teach-start');
  await page.click('.pp[data-pupil="Elena"]');
  await page.click('#teach-start');
  while ((await page.locator('#teach-next').count()) > 0) { await page.click('#teach-next'); await page.waitForTimeout(80); }
  await page.waitForSelector('.sum');
  await page.goto(base + `#/classes/${classId}/attendance`);
  await page.waitForSelector('[data-att="Elena"]');
  check((await page.locator('[data-att="Elena"] [data-mark="P"]').getAttribute('aria-checked')) === 'true', 'Teach mode does not overwrite the teacher\'s own attendance marks');

  // ---- dates before 8 am in Malaysia (UTC+8): the local date, never the UTC one
  {
    const kl = await browser.newContext({ timezoneId: 'Asia/Kuala_Lumpur', viewport: { width: 1280, height: 900 }, storageState: await ctx.storageState({ indexedDB: true }) });
    await kl.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });
    const k = await kl.newPage();
    await k.clock.install({ time: new Date('2026-11-17T23:30:00Z') }); // 07:30 on Wednesday 18 November in Kuala Lumpur
    await k.goto(base + `#/classes/${classId}/attendance`);
    await k.waitForSelector('[data-att="Aina"]');
    const d = k.locator('input[type=date]').first();
    const first = await d.inputValue();
    await k.locator('button[aria-label="Next day"]').click(); const next = await d.inputValue();
    await k.locator('button[aria-label="Previous day"]').click(); await k.locator('button[aria-label="Previous day"]').click(); const prev = await d.inputValue();
    check(first === '2026-11-18' && next === '2026-11-19' && prev === '2026-11-17', `at 7:30 am in Kuala Lumpur, attendance opens on today and moves one day at a time (${first}, ${next}, ${prev})`);
    await k.goto(base + '#/plan/new'); await k.waitForSelector('#nr-date');
    await k.goto(base + `#/classes/${classId}/pbd/new`); await k.waitForSelector('#pbd-ls');
    const pbd = await k.locator('input[type=date]').first().inputValue();
    await k.goto(base + '#/plan/new'); await k.waitForSelector('#nr-date');
    check((await k.inputValue('#nr-date')) === '2026-11-18' && pbd === '2026-11-18', 'new lesson plans and PBD records get today\'s local date before 8 am');
    await kl.close();
  }

  // phone
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState({ indexedDB: true }) });
  const p2 = await phone.newPage();
  for (const r of ['#/plan/day', '#/plan/year', `#/classes/${classId}/attendance`]) { await p2.goto(base + r); await p2.waitForTimeout(500); check(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no sideways scrolling on a phone: ${r}`); }
  if (out) await p2.screenshot({ path: `${out}/m9-phone-attendance.png` });
  fs.rmSync(tmp, { recursive: true, force: true });
  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM9 end-to-end test passed');
})();
