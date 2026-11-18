// End-to-end for the AI tools' answers: every one of the 24 Studio tools generates a realistic answer (Anthropic
// intercepted: nothing leaves the machine) that renders and passes its quality check; a lesson plan based on a KSSR
// Scheme of Work lesson sends the real curriculum facts and opens in the builder with that lesson's standards; the
// quality check finds problems and "Fix it" / "Fix all" send them back as a new version; the copy-and-paste route
// gets the same checks; a tool opened for a Scheme of Work lesson plan is based on the same lesson.
// Runs on Chromium, WebKit or Firefox (BROWSER=…). Run against `vite preview`: node scripts/e2e-ai.cjs [out-dir]
const fs = require('fs');
const path = require('path');
const { launch, name: browserName } = require('./browser.cjs');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const ANSWERS = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/studio-answers.json'), 'utf8'));
// the 24 AI tools, in gallery order
const TOOLS = Object.keys(ANSWERS);
// answers with problems the quality check must find
const BROKEN = {
  quiz: ANSWERS.quiz.replace(/\n\n8\.[\s\S]*$/, '').replace('Answer: B) Kuala Lumpur', ''),
  'lesson-plan': ANSWERS['lesson-plan'].replace('## Production (20 minutes)', '## Production (15 minutes)').replace('- I can say where a friend is from.', '- Pupils say where a friend is from.')
};

(async () => {
  const browser = await launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  // Service workers are blocked so the stand-in for Anthropic sees every request: in WebKit a request from a page
  // with a service worker goes through it, out of reach of Playwright's interception (it reached the real API).
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });

  // Anthropic, intercepted. The answer is chosen by the tool being tested; a change request gets the good answer.
  const sent = []; let tool = ''; let broken = false;
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization, content-type', 'access-control-allow-methods': 'GET, POST', 'access-control-max-age': '600' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const body = JSON.parse(req.postData() || '{}');
    const prompt = body.messages?.[0]?.content || '';
    sent.push({ tool, prompt, system: JSON.stringify(body.system || '') });
    const text = !/\nChange it: /.test(prompt) && broken && BROKEN[tool] ? BROKEN[tool] : ANSWERS[tool] || 'Done.';
    const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    const sse = ev('message_start', { type: 'message_start', message: { id: 'msg_e2e', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } })
      + ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
      + (text.match(/[\s\S]{1,64}/g) || []).map((c) => ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: c } })).join('')
      + ev('content_block_stop', { type: 'content_block_stop', index: 0 })
      + ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 99 } })
      + ev('message_stop', { type: 'message_stop' });
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/event-stream', 'request-id': 'req_e2e' }, body: sse });
  });

  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|aborted/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');
  await page.evaluate(() => localStorage.setItem('consilia.ai', JSON.stringify({ on: true, provider: 'claude', agreed: Date.now(), claude: { key: 'sk-ant-e2e-key', model: 'claude-opus-5-5' }, gemini: { key: '', model: '' } })));

  const summary = () => page.locator('#st-qc-sum').innerText();
  async function generate(id, opts = {}) {
    tool = id; broken = !!opts.broken;
    await page.goto(base + '#/tools/' + id);
    await page.reload();
    await page.waitForSelector('#st-go');
    await page.click('#st-example');
    if (opts.before) await opts.before();
    await page.click('#st-go');
    await page.waitForSelector('#st-qc', { timeout: 15000 });
  }

  // ---- every AI tool: a good answer renders and passes its quality check
  const failed = [];
  for (const id of TOOLS) {
    await generate(id);
    const doc = await page.locator('#st-doc').innerText();
    const first = (ANSWERS[id].match(/^##\s+(.+)$/m)?.[1] ?? ANSWERS[id].split('\n')[0]).replace(/\*\*/g, '').trim();
    const sum = await summary();
    const bad = await page.$$eval('#st-qc li[data-state="fix"]', (els) => els.map((e) => e.innerText.trim()));
    if (!doc.includes(first) || bad.length || !/passed/.test(sum)) failed.push(`${id} (${sum}${bad.length ? ': ' + bad.join(' | ') : ''})`);
  }
  check(!failed.length, `all ${TOOLS.length} AI tools give an answer that renders and passes its quality check${failed.length ? ': ' + failed.join('; ') : ''}`);
  check(sent.length >= TOOLS.length && sent.every((s) => /experienced English language teacher educator/.test(s.system)), 'every request carries the expert brief for Malaysian primary English');
  check(/Pitch it at Pre-A1/.test(sent.find((s) => s.tool === 'phonics').prompt) && /Pitch it at A2/.test(sent.find((s) => s.tool === 'questions').prompt), 'pupils\' texts are pitched at their year\'s CEFR level (Year 1 Pre-A1, Year 6 A2)');
  await generate('email');
  check((await summary()).includes('to look at') && await page.locator('#st-qc li[data-state="note"]').isVisible() && (await page.locator('#st-qc li[data-state="note"]').innerText()).includes('[Your name]'), 'blanks the teacher must fill in ([Your name]) are shown, not counted as faults');

  // ---- based on a KSSR lesson: the real curriculum facts go with the request
  await generate('lesson-plan', {
    before: async () => {
      await page.click('#st-sow > summary');
      await page.waitForSelector('#st-sow-pick option[value="2"]', { state: 'attached', timeout: 15000 });
      await page.selectOption('#st-sow-pick', '2');
      await page.waitForSelector('#st-sow-card');
      check((await page.inputValue('#sf-topic')) === 'Where are you from?' && (await page.locator('#st-sow-sum').innerText()).includes('Based on KSSR lesson 2: Where are you from?'), 'choosing Scheme of Work lesson 2 fills the form from it');
      check((await page.locator('#st-sow-card').innerText()).includes('2.1.5'), 'the lesson\'s learning standards are shown');
      if (out) await page.locator('form.form').screenshot({ path: `${out}/ai-kssr-picker.png` });
    }
  });
  const g = sent[sent.length - 1].prompt;
  check(g.includes('Curriculum facts from the KSSR Scheme of Work (Year 4 SK, lesson 2') && g.includes('Main learning standard: 2.1.5') && g.includes('Complementary learning standard: 1.2.4') && /Student’s Book page 5/.test(g), 'the request carries the lesson\'s real standards and textbook pages');
  check(g.includes('give exactly the standards in the curriculum facts above'), 'the AI is told to keep those standards exactly');
  check((await page.locator('#st-qc li[data-check="standards"]').textContent()).includes('match the Scheme of Work'), 'the quality check confirms the standards match the Scheme of Work');
  await page.click('#st-builder');
  await page.waitForURL(/\/review$/, { timeout: 15000 });
  await page.waitForSelector('article.paper');
  const paper = await page.locator('article.paper').innerText();
  check(paper.includes('2.1.5') && paper.includes('1.2.4') && /Where are you from\?/i.test(paper), 'the builder\'s lesson plan has the Scheme of Work lesson\'s standards and topic');

  // a tool opened for that lesson plan is based on the same lesson
  await page.goto(base + '#/tools/quiz');
  await page.reload();
  await page.waitForSelector('#st-sow-sum');
  await page.waitForFunction(() => /lesson 2/.test(document.querySelector('#st-sow-sum')?.textContent || ''));
  check(true, 'a tool opened for a Scheme of Work lesson plan is based on the same lesson');
  tool = 'quiz'; broken = false;
  await page.click('#st-go');
  await page.waitForSelector('#st-qc', { timeout: 15000 });
  check(sent[sent.length - 1].prompt.includes('lesson 2'), '…and its request carries that lesson\'s facts');

  // ---- the quality check finds problems, and Fix it sends them back
  await generate('quiz', { broken: true });
  check((await summary()) === '2 to fix' && (await page.locator('#st-qc li[data-check="count"]').innerText()).includes('Questions: 7 instead of 8'), 'a quiz with a missing question and a missing answer is caught (2 to fix)');
  check((await page.locator('#st-qc-jump').innerText()).includes('2 to fix'), 'the result says at the top that the quality check found 2 things to fix');
  await page.click('#st-qc-jump');
  await page.waitForFunction(() => { const r = document.querySelector('#st-qc').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
  if (out) await page.locator('#st-qc').screenshot({ path: `${out}/ai-quality-check.png` });
  await page.click('[data-fix="count"]');
  await page.waitForSelector('#st-version:has-text("Version 2 of 2")', { timeout: 15000 });
  const fixPrompt = sent[sent.length - 1].prompt;
  check(fixPrompt.includes('This is the current version:') && fixPrompt.includes('Change it: Make it exactly 8 numbered questions'), 'Fix it sends the current version with the fix to make');
  check((await page.locator('.vnote').innerText()).includes('Fixed after the quality check') && /passed/.test(await summary()), 'the fixed version is version 2 and passes');

  await generate('lesson-plan', { broken: true });
  check((await summary()) === '2 to fix', 'a lesson plan whose minutes do not add up and whose criteria are not "I can" is caught');
  await page.click('#st-fix-all');
  await page.waitForSelector('#st-version:has-text("Version 2 of 2")', { timeout: 15000 });
  const all = sent[sent.length - 1].prompt;
  check(all.includes('Change it: Make all of these changes: (1)') && all.includes('exactly 60 minutes') && all.includes('"I can'), 'Fix all sends every fix in one request');
  check(/passed/.test(await summary()), 'the fixed lesson plan passes');

  // ---- without the AI assistant: the same checks on a pasted answer, and Fix it copies the new prompt
  await page.evaluate(() => localStorage.removeItem('consilia.ai'));
  await page.goto(base + '#/tools/quiz');
  await page.reload();
  await page.waitForSelector('#st-go');
  await page.click('#st-example');
  await page.click('#st-go');
  await page.waitForSelector('#st-paste-card');
  await page.fill('#st-paste', BROKEN.quiz);
  await page.click('#st-paste-use');
  await page.waitForSelector('#st-qc');
  check((await summary()) === '2 to fix', 'a pasted answer gets the same quality check');
  await page.click('[data-fix="answers"]');
  await page.waitForSelector('#st-paste-card');
  check((await page.locator('#st-paste-card pre.prompt').textContent()).includes('Change it: After every question, add a line starting "Answer:"'), 'Fix it without a key copies a prompt with the fix, to paste into any AI chat');

  // ---- Malay, and a phone
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("Bahasa Melayu")');
  await page.goto(base + '#/tools/creations');
  await page.waitForSelector('[data-creation] a');
  await page.locator('[data-creation] a').first().click();
  await page.waitForSelector('#st-qc');
  check((await page.locator('#st-qc summary').innerText()).includes('Semakan kualiti'), 'the quality check is in Malay');
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("English")');
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState({ indexedDB: true }) });
  const pp = await phone.newPage();
  await pp.goto(base + '#/tools/creations');
  await pp.waitForSelector('[data-creation] a');
  await pp.locator('[data-creation] a').first().click();
  await pp.waitForSelector('#st-qc');
  await pp.evaluate(() => document.querySelector('#st-qc').setAttribute('open', ''));
  check(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: the quality check fits with no sideways scroll');
  if (out) await pp.screenshot({ path: `${out}/ai-quality-phone.png`, fullPage: true });
  await phone.close();

  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log(`\nAI tools end-to-end test passed (${browserName})`);
})();
