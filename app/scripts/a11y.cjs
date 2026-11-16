// Accessibility audit (blueprint test plan): axe-core (WCAG 2.1 A/AA) on every main screen in light and dark themes,
// plus 44 px tap targets and 200% text on a phone. Run against `vite preview`: node scripts/a11y.cjs [--verbose]
const { chromium } = require('playwright');
const axe = require('axe-core');
const base = process.env.BASE_URL || 'http://localhost:4173/';
const verbose = process.argv.includes('--verbose');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, bypassCSP: true }); // axe is injected as an inline script
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');
  // a class with pupils, PBD records and a lesson, so every screen has content
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  const classId = page.url().split('/').pop();
  await page.fill('#cd-paste', 'Aina\nBala\nChong Wei\nDhia');
  await page.click('button:has-text("Add 4 pupils")');
  await page.waitForSelector('.pupils li:nth-child(4)');
  const pupilHref = await page.locator('.pupils li').first().locator('a:has-text("Profile")').getAttribute('href');
  await page.goto(base + '#/plan/new');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.goto(base + `#/classes/${classId}/pbd/new`);
  const opt = await page.locator('#pbd-ls option').nth(1).getAttribute('value');
  await page.selectOption('#pbd-ls', opt);
  await page.locator('section.ls').first().locator('button:has-text("3")').first().click();
  await page.click('#pbd-save');
  await page.waitForSelector('.ok');

  const routes = [
    ['Today', '#/today'], ['Plan', '#/plan'], ['Week planner', '#/plan/week'], ['New RPH', '#/plan/new'],
    ...['setup', 'standards', 'objectives', 'flow', 'materials', 'planb', 'review'].map((s) => [`Builder: ${s}`, `#/plan/edit/${lessonId}/${s}`]),
    ['Reflection', `#/plan/reflect/${lessonId}`],
    ['Classes', '#/classes'], ['Class', `#/classes/${classId}`], ['Pupil profile', pupilHref], ['PBD record', `#/classes/${classId}/pbd/new`], ['PBD progress', `#/classes/${classId}/pbd`],
    ['Library: SoW', '#/library/4/sk/sow'], ['Library: SoW lesson', '#/library/4/sk/sow/1'], ['Library: standards', '#/library/4/sk/standards'], ['Library: levels', '#/library/4/sk/levels'],
    ['Library: tasks', '#/library/4/sk/tasks'], ['Library: textbooks', '#/library/4/sk/books'], ['Library: activity bank', '#/library/4/sk/bank'], ['Library: Method Guide', '#/library/4/sk/guide'],
    ['Me', '#/me'], ['Mentor', '#/me/mentor'], ['Help', '#/me/help'], ['About', '#/me/about'], ['Privacy', '#/me/privacy'],
    ['Teach', `#/teach/${lessonId}`]
  ];
  const results = []; let serious = 0;
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const [name, r] of routes) {
      await page.goto(base + r.replace(/^#?/, '#').replace(/^##/, '#'));
      await page.waitForTimeout(450);
      await page.addScriptTag({ content: axe.source });
      const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      for (const v of res.violations) {
        results.push({ scheme, name, id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, target: v.nodes.slice(0, 3).map((x) => x.target.join(' ')).join(' | ') });
        if (v.impact === 'critical' || v.impact === 'serious') serious++;
      }
    }
  }
  const byRule = {};
  for (const x of results) (byRule[`${x.impact} · ${x.id} · ${x.help}`] ??= []).push(`${x.scheme}/${x.name} (${x.n}): ${x.target}`);
  for (const [k, v] of Object.entries(byRule)) { console.log(`\n${k}\n  ` + (verbose ? v : v.slice(0, 4)).join('\n  ') + (!verbose && v.length > 4 ? `\n  …and ${v.length - 4} more` : '')); }
  console.log(`\naxe: ${routes.length} screens × 2 themes, ${results.length} rule failures (${serious} critical or serious)`);

  // phone: tap targets and 200% text
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, storageState: await ctx.storageState({ indexedDB: true }) });
  await phone.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {} });
  const p = await phone.newPage();
  const small = []; const overflow = [];
  for (const [name, r] of routes) {
    await p.goto(base + r.replace(/^#?/, '#').replace(/^##/, '#'));
    await p.waitForTimeout(350);
    const s = await p.evaluate(() => [...document.querySelectorAll('button, a.btn, [role=button], [role=radio], [role=tab], input[type=checkbox], input[type=radio], select, summary, nav a')]
      .filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && !e.closest('.sr-only') && !e.classList.contains('sr-only'); })
      .filter((e) => { const t = e.matches('input') && e.closest('label') ? e.closest('label') : e; const b = t.getBoundingClientRect(); return b.height < 43.5 && b.width < 43.5 || b.height < 31.5; })
      .map((e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`));
    if (s.length) small.push(`${name}: ${s.length} — ${s.slice(0, 4).join('; ')}`);
    await p.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await p.waitForTimeout(150);
    const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 2) overflow.push(`${name}: ${o}px wider than the screen`);
  }
  console.log(`\nTap targets under 44 px on a phone (or under 32 px tall): ${small.length ? '\n  ' + small.join('\n  ') : 'none'}`);
  console.log(`\n200% text on a phone, horizontal scroll: ${overflow.length ? '\n  ' + overflow.join('\n  ') : 'none'}`);
  await browser.close();
  if (serious) process.exit(1);
})();
