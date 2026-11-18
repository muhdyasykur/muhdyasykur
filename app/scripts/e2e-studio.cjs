// End-to-end for the Studio (milestone 11): the Tools gallery (categories, search, favourites, recently used), AI tools
// with the copy-and-paste route and with Claude streaming the answer (Anthropic intercepted, nothing leaves the
// machine), changing a result into new versions, editing, copying, Word, the projector view, stopping, the pupil-name
// check, My creations, and results turned into a Quiz show, a spin wheel and a real lesson plan. Malay and phone too.
// Runs on Chromium, WebKit or Firefox (BROWSER=…). Run against `vite preview`: node scripts/e2e-studio.cjs [out-dir]
const fs = require('fs');
const JSZip = require('jszip');
const { launch, name: browserName } = require('./browser.cjs');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';

const LESSON = [
  '## Lesson overview', 'Friends Around the World', 'Pupils ask and answer about where people are from.',
  '## Learning standards', '- 2.1.5 Describe people and objects using suitable statements', '- 1.2.5 Understand longer simple texts',
  '## Learning objectives', '- By the end of the lesson, pupils will be able to ask and answer about 4 countries correctly.',
  '## Success criteria', '- I can say where someone is from.', '- I can ask "Where is he from?"',
  '## Key vocabulary and target language', 'Malaysia, Japan, India, Thailand', 'Target sentence: Where is she from? She is from …',
  '## Teaching aids', '- World map', '- Flag cards',
  '## Pre-lesson (5 minutes)', '- Teacher: shows mystery flags one by one.', '- Pupils: guess the countries.', '- Teaching aids: flag cards',
  '## Presentation (15 minutes)', '- Teacher: models "Where is he from?" with photos.', '- Pupils: repeat and answer.',
  '## Practice (15 minutes)', '- Teacher: gives role cards.', '- Pupils: ask and answer in pairs.',
  '## Production (20 minutes)', '- Teacher: sets up a passport interview.', '- Pupils: interview five friends and fill in passports.',
  '## Post-lesson (5 minutes)', '- Teacher: gives an exit ticket.', '- Pupils: write one sentence.',
  '## Differentiation', '- Low: sentence frames', '- Moderate: role cards', '- High: add a reason',
  '## Assessment', 'Observation checklist during the interviews.',
  '## Cross-curricular elements and 21st-century skills', '- Cross-curricular elements: Global sustainability', '- 21st-century skills: Communication',
  '## Reflection prompts', '- Did every pupil speak?'
].join('\n');
const QUIZ = '## Quiz: Countries\n\n1. Where is Kenji from?\nA) Japan\nB) India\nC) Thailand\nAnswer: A\n\n2. What is the capital of Malaysia?\nA) Ipoh\nB) Kuala Lumpur\nAnswer: B\n\n3. Is Thailand next to Malaysia?\nAnswer: Yes, it is.';
const VOCAB = '## Word list\n\n| Word | Meaning | Example sentence | Bahasa Melayu | Picture idea |\n|---|---|---|---|---|\n| kitchen | where we cook | Mum cooks in the kitchen. | dapur | a stove |\n| bedroom | where we sleep | My bedroom is small. | bilik tidur | a bed |\n| garden | plants grow here | We play in the garden. | taman | flowers |\n\n## Three quick games\n1. Point and say';
const TEXT = '## A Day at Taman Negara\n\nDear Diary,\nToday we took a boat on the river.\nI saw a monkey in the jungle!\n\n## Word help\n\n| Word | Meaning |\n|---|---|\n| jungle | a thick forest |\n\n## Questions\n\n1. Where did they go?\nAnswer: Taman Negara.';
const FEEDBACK = '## Two stars\n- Good use of "with my family".\n\n## A wish\n- Use past tense verbs.\n\n## Corrected version\nYesterday we **went** to the beach.';
function answerFor(prompt) {
  if (/Change it: Make it shorter/.test(prompt) && /daily lesson plan/.test(prompt)) return LESSON.replace('Friends Around the World', 'Friends Around the World (short)');
  if (/daily lesson plan \(RPH\)/.test(prompt)) return LESSON;
  if (/Write a quiz/.test(prompt)) return QUIZ;
  if (/vocabulary list/.test(prompt)) return VOCAB;
  if (/for reading or listening/.test(prompt)) return TEXT;
  if (/Give feedback on this piece of writing/.test(prompt)) return FEEDBACK;
  return 'Done.';
}
function sse(text) {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  return ev('message_start', { type: 'message_start', message: { id: 'msg_e2e', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } })
    + ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
    + (text.match(/[\s\S]{1,48}/g) || []).map((c) => ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: c } })).join('')
    + ev('content_block_stop', { type: 'content_block_stop', index: 0 })
    + ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 99 } })
    + ev('message_stop', { type: 'message_stop' });
}

(async () => {
  const browser = await launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const chromium = browserName === 'chromium';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...(chromium ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}) });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });

  // Anthropic, intercepted: streamed answers chosen by the prompt; every request kept for checks
  const sent = []; let slow = false;
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request();
    // like Anthropic's own API, the preflight names the headers it allows: a bare * never covers Authorization, and
    // WebKit (unlike Playwright's Chromium and Firefox) sends the preflight here and holds the browser to that rule
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization, content-type', 'access-control-allow-methods': 'GET, POST', 'access-control-max-age': '600' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (req.method() === 'GET') return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ data: [{ id: 'claude-opus-5-5', type: 'model', display_name: 'Claude Opus 5.5', created_at: '2026-01-01T00:00:00Z' }], has_more: false, first_id: 'claude-opus-5-5', last_id: 'claude-opus-5-5' }) });
    const body = JSON.parse(req.postData() || '{}');
    const prompt = body.messages?.[0]?.content || '';
    sent.push({ headers: req.headers(), body, prompt });
    if (slow) { await new Promise((r) => setTimeout(r, 4000)); return route.abort().catch(() => {}); }
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/event-stream', 'request-id': 'req_e2e' }, body: sse(answerFor(prompt)) });
  });

  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|aborted/i.test(m.text())) errors.push('console: ' + m.text()); });
  // what the browser did with the AI requests, printed if a streamed answer never arrives
  const trace = [];
  page.on('console', (m) => trace.push(`console.${m.type()}: ${m.text().slice(0, 300)}`));
  page.on('request', (r) => { if (/anthropic/.test(r.url())) trace.push(`request ${r.method()} ${r.url()}`); });
  page.on('requestfailed', (r) => trace.push(`requestfailed ${r.method()} ${r.url()}: ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (/anthropic/.test(r.url())) trace.push(`response ${r.status()} ${r.url()}`); });
  const waitForAnswer = async (sel) => {
    try { await page.waitForSelector(sel, { timeout: 15000 }); }
    catch (e) {
      console.error(`\nNo answer (${sel}). Requests the stand-in received: ${sent.length}. Page error text: ${await page.locator('#st-err').innerText().catch(() => '(none)')}`);
      console.error('Result area: ' + (await page.locator('#st-result').innerText().catch(() => '')).slice(0, 400));
      console.error('Trace:\n  ' + trace.slice(-40).join('\n  '));
      throw e;
    }
  };
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // a class with pupils, so the name check has names to look for
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.waitForFunction(() => document.title.startsWith('4 Bestari'));
  for (let i = 0; i < 3; i++) {
    await page.fill('#cd-paste', 'Aina Sofea\nBala\nChong Wei\nDhia');
    if (await page.waitForSelector('button:has-text("Add 4 pupils"):not([disabled])', { timeout: 3000 }).then(() => true, () => false)) break;
  }
  await page.click('button:has-text("Add 4 pupils")');
  await page.waitForSelector('.pupils li:nth-child(4)');

  // ---- the gallery
  await page.goto(base + '#/tools');
  await page.waitForSelector('[data-tool-card]');
  const total = await page.locator('[data-tool-card]').count();
  check(total === 36, `the Tools gallery lists all 36 tools (${total})`);
  check((await page.locator('[data-tool-card] .badge.ai').count()) === 24 && (await page.locator('[data-tool-card] .badge.new').count()) === 24, '24 AI tools are marked AI and New; the others say they work offline');
  await page.click('[data-cat="assess"]');
  const assess = await page.$$eval('[data-tool-card]', (els) => els.map((e) => e.dataset.toolCard));
  check(assess.length === 5 && assess.includes('rubric') && assess.includes('quiz'), `the Assess category shows its five tools (${assess.join(', ')})`);
  await page.click('[data-cat="all"]');
  await page.fill('#tools-q', 'rubrik pbd');
  check((await page.locator('[data-tool-card="rubric"]').count()) === 1, 'search understands Malay words (rubrik pbd → PBD rubric)');
  await page.fill('#tools-q', '');
  await page.click('[data-tool-card="quiz"] .fav');
  await page.click('[data-cat="fav"]');
  check((await page.locator('[data-tool-card]').count()) === 1 && (await page.locator('[data-tool-card="quiz"]').count()) === 1, 'a starred tool appears under Favourites');
  await page.reload();
  await page.waitForSelector('[data-tool-card]');
  await page.click('[data-cat="fav"]');
  check((await page.locator('[data-tool-card="quiz"] .fav[aria-pressed="true"]').count()) === 1, 'favourites are remembered after a reload');
  await page.click('[data-cat="all"]');

  // ---- no AI connected: copy the prompt, paste the answer
  await page.click('[data-tool-card="quiz"] .name');
  await page.waitForSelector('#st-go');
  check((await page.locator('#st-go').innerText()).includes('Copy the prompt'), 'without the AI assistant, the main button copies the prompt');
  await page.click('#st-example');
  await page.click('#st-go');
  await page.waitForSelector('#st-paste-card');
  if (chromium) {
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    check(clip.includes('Year 4 (about 10 years old, CEFR') && clip.includes('Countries and nationalities in Southeast Asia') && clip.includes('Answer:'), 'the prompt copied has the year, CEFR level, topic and the answer format');
  }
  check((await page.locator('#st-paste-card a:has-text("Claude")').count()) === 1, 'it offers Claude, ChatGPT, Gemini and Copilot to paste into');
  await page.fill('#st-paste', QUIZ);
  await page.click('#st-paste-use');
  await page.waitForSelector('#st-doc h3');
  check((await page.locator('#st-doc h3').first().innerText()) === 'Quiz: Countries' && (await page.locator('#st-doc').innerText()).includes('Kuala Lumpur'), 'the pasted answer is shown tidily, with headings');
  check((await page.locator('#st-quiz').innerText()).includes('3 questions'), 'it finds the three questions with answers');
  if (out) await page.screenshot({ path: `${out}/studio-quiz-pasted.png` });
  await page.click('#st-quiz');
  await page.waitForURL(/games\/quiz$/);
  await page.waitForTimeout(400);
  const quizText = await page.locator('main').innerText();
  check(/Where is Kenji from\?/.test(quizText), 'Play as a Quiz show opens the Quiz show with these questions');

  // ---- My creations keeps it
  await page.goto(base + '#/tools/creations');
  await page.waitForSelector('[data-creation]');
  check((await page.locator('[data-creation]').count()) === 1 && (await page.locator('[data-creation]').innerText()).includes('Countries'), 'My creations keeps the quiz');
  await page.click('[data-creation] a');
  await page.waitForSelector('#st-doc');
  check((await page.locator('#st-doc').innerText()).includes('Where is Kenji from?') && (await page.inputValue('#sf-topic')).includes('Southeast Asia'), 'opening it brings back the result and what was typed');

  // ---- connect Claude (settings as Me → AI assistant saves them)
  await page.evaluate(() => localStorage.setItem('consilia.ai', JSON.stringify({ on: true, provider: 'claude', agreed: Date.now(), claude: { key: 'sk-ant-e2e-key', model: 'claude-opus-5-5' }, gemini: { key: '', model: '' } })));
  await page.goto(base + '#/tools/lesson-plan');
  await page.reload();
  await page.waitForSelector('#st-go');
  check((await page.locator('#st-go').innerText()).includes('Generate with Claude'), 'with Claude connected, the button generates right here');
  await page.click('#st-example');
  await page.click('#st-go');
  trace.length = 0;
  await waitForAnswer('#st-doc h3:has-text("Learning objectives")');
  const lp = await page.locator('#st-doc').innerText();
  check(lp.includes('Friends Around the World') && lp.includes('Post-lesson (5 minutes)'), 'Claude\'s answer streams into a full lesson plan');
  const req = sent[sent.length - 1];
  check(req.body.stream === true && req.headers['authorization'] === 'Bearer sk-ant-e2e-key' && req.body.model === 'claude-opus-5-5', 'the request streams, from this device, with the teacher\'s own key');
  check(/Year 4/.test(req.prompt) && !/Aina|Bala|Chong|Dhia|4 Bestari/.test(req.prompt), 'the prompt has the lesson details and no pupil or class names');
  check((await page.locator('#st-builder').count()) === 1, 'a lesson plan can be opened in the builder');
  if (out) await page.screenshot({ path: `${out}/studio-lesson-plan.png` });

  // change it: a new version, then go back and forth
  await page.click('[data-chip="Make it shorter"]');
  await page.waitForSelector('#st-version:has-text("Version 2 of 2")', { timeout: 15000 });
  check((await page.locator('#st-doc').innerText()).includes('(short)') && sent[sent.length - 1].prompt.includes('This is the current version:'), '"Make it shorter" sends the current version and gives version 2');
  await page.click('button[aria-label="Previous version"]');
  check((await page.locator('#st-version').innerText()).includes('Version 1 of 2') && !(await page.locator('#st-doc').innerText()).includes('(short)'), 'earlier versions stay one tap away');
  await page.click('button[aria-label="Next version"]');
  // edit by hand: version 3
  await page.click('#st-edit-btn');
  await page.fill('#st-edit', (await page.inputValue('#st-edit')).replace('Friends Around the World (short)', 'Friends From Many Lands'));
  await page.click('#st-edit-save');
  await page.waitForSelector('#st-version:has-text("Version 3 of 3")');
  check((await page.locator('#st-doc').innerText()).includes('Friends From Many Lands'), 'an edit by hand becomes version 3');
  // Word
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#st-word')]);
  const xml = await (await JSZip.loadAsync(fs.readFileSync(await dl.path()))).file('word/document.xml').async('string');
  check(dl.suggestedFilename() === 'Friends-From-Many-Lands.docx' && xml.includes('Friends From Many Lands') && xml.includes('Learning objectives'), `Word download keeps the headings and text (${dl.suggestedFilename()})`);
  // into the builder
  await page.click('#st-builder');
  await page.waitForURL(/\/review$/, { timeout: 15000 });
  await page.waitForSelector('article.paper');
  const paper = await page.locator('article.paper').innerText();
  check(/FRIENDS FROM MANY LANDS/i.test(paper) && paper.includes('2.1.5') && paper.includes('ask and answer about 4 countries'), 'the builder opens a real lesson plan with the topic, a real KSSR standard and the objective');
  await page.click('.steps a:has-text("Lesson flow")');
  await page.waitForSelector('section.stage');
  const acts = await page.$$eval('section.stage textarea', (els) => els.map((e) => e.value).join(' '));
  check((await page.locator('section.stage').count()) === 5 && acts.includes('passport interview'), 'its five PPP stages hold the activities');

  // ---- stop while Claude is writing
  await page.goto(base + '#/tools/text');
  await page.waitForSelector('#st-go');
  await page.click('#st-example');
  slow = true;
  await page.click('#st-go');
  await page.waitForSelector('#st-stop');
  await page.click('#st-stop');
  await page.waitForFunction(() => !document.querySelector('#st-stop'), null, { timeout: 8000 }).catch(() => {});
  check((await page.locator('#st-stop').count()) === 0 && (await page.locator('#st-err').count()) === 0 && !(await page.locator('#st-go').isDisabled()), 'Stop ends the request quietly and the form is ready again');
  slow = false;
  await page.click('#st-go');
  await page.waitForSelector('#st-doc h3:has-text("A Day at Taman Negara")', { timeout: 15000 });
  check((await page.locator('#st-present').count()) === 1, 'a reading text can be shown on the projector');
  await page.click('#st-present');
  await page.waitForSelector('.present[role="dialog"]');
  check((await page.locator('.present').innerText()).includes('Dear Diary'), 'the projector view shows the text large');
  await page.keyboard.press('Escape');
  check((await page.locator('.present').count()) === 0, 'Esc closes the projector view');

  // ---- pupils' names are never sent
  await page.goto(base + '#/tools/feedback');
  await page.waitForSelector('#st-go');
  await page.fill('#sf-writing', 'Aina Sofea and Bala went to the beach. We swim and eat ice cream.');
  const before = sent.length;
  await page.click('#st-go');
  await page.waitForSelector('#st-names');
  check((await page.locator('#st-names').innerText()).includes('Aina Sofea') && sent.length === before, 'names from the class list stop the request before anything is sent');
  await page.click('#st-names-fix');
  await page.waitForFunction(() => !document.querySelector('#sf-writing').value.includes('Aina'), null, { timeout: 5000 }).catch(() => {});
  check(!(await page.inputValue('#sf-writing')).includes('Aina') && (await page.inputValue('#sf-writing')).includes('the pupil'), '"Remove the names for me" replaces them');
  await page.click('#st-go');
  await page.waitForSelector('#st-doc h3:has-text("Two stars")', { timeout: 15000 });
  check(!/Aina|Bala/.test(sent[sent.length - 1].prompt), 'the request that was sent has no pupil names');

  // ---- vocabulary → spin wheel
  await page.goto(base + '#/tools/vocab');
  await page.waitForSelector('#st-go');
  await page.click('#st-example');
  await page.click('#st-go');
  await page.waitForSelector('#st-doc table', { timeout: 15000 });
  check((await page.locator('#st-doc th').count()) === 5 && (await page.locator('#st-doc').innerText()).includes('bilik tidur'), 'the vocabulary list is a table with Malay meanings');
  await page.click('#st-wheel');
  await page.waitForURL(/games\/wheel$/);
  await page.waitForSelector('#g-spin');
  check((await page.evaluate(() => JSON.parse(localStorage.getItem('consilia.toolctx')).words)) === 'kitchen, bedroom, garden', 'Spin wheel takes the three words from the table');
  // opening the wheel counts as using Classroom games
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('consilia.toolrecent') || '[]')[0]) === 'games');

  // ---- recently used, My creations, Malay
  await page.goto(base + '#/tools');
  await page.waitForSelector('[data-recent]');
  const recentIds = await page.$$eval('[data-recent]', (els) => els.map((e) => e.dataset.recent));
  check(recentIds[0] === 'games' && recentIds[1] === 'vocab', `Recently used starts with the last tools (${recentIds.slice(0, 2).join(', ')})`);
  await page.goto(base + '#/tools/creations');
  await page.waitForSelector('[data-creation]');
  check((await page.locator('[data-creation]').count()) === 5, `My creations lists every result (${await page.locator('[data-creation]').count()})`);
  await page.locator('[data-creation]').first().locator('button[aria-label^="Delete"]').click();
  await page.locator('[data-creation]').first().locator('button:has-text("Delete it")').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-creation]').length === 4);
  check(true, 'a creation can be deleted');
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("Bahasa Melayu")');
  await page.waitForTimeout(300);
  await page.goto(base + '#/tools/quiz');
  await page.waitForSelector('#st-go');
  const ms = await page.locator('main').innerText();
  check(/Tahun/.test(ms) && !/Number of questions/.test(ms), 'the Studio is in Malay');
  await page.goto(base + '#/me');
  await page.click('.seg button:has-text("English")');

  // ---- phone
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState({ indexedDB: true }) });
  const pp = await phone.newPage();
  await pp.goto(base + '#/tools');
  await pp.waitForSelector('[data-tool-card]');
  check(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: the gallery has no sideways scroll');
  await pp.goto(base + '#/tools/creations');
  await pp.waitForSelector('[data-creation] a');
  await pp.locator('[data-creation] a').first().click();
  await pp.waitForSelector('#st-doc');
  check(await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: a tool with its result has no sideways scroll');
  if (out) await pp.screenshot({ path: `${out}/studio-phone.png`, fullPage: true });
  await phone.close();

  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log(`\nStudio end-to-end test passed (${browserName})`);
})();
