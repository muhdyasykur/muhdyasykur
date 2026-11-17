// End-to-end for milestone 10: lesson slides made from a lesson plan (editor, themes, reorder, add, delete, saved),
// presenting with keys and answer reveal, PowerPoint download (opened and checked), slides in Teach mode, the Tools
// entry; AI content by copy-and-paste; the optional AI assistant: Claude by default (settings, consent, key test, model
// choice, slide content, "ask Claude here", errors, what is sent) and Gemini as the alternative; keys kept out of
// backups; settings from beta.5 carried over; offline; phone layout. Anthropic and Google are intercepted: nothing is
// really sent. Run against `vite preview`: node scripts/e2e-m10.cjs [out-dir]
const { launch } = require('./browser.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const JSZip = require('jszip');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const KEY = 'AIzaSyTEST-not-a-real-key-0123456789';
const CKEY = 'sk-ant-api03-TEST-not-a-real-key-0123456789';

(async () => {
  const browser = await launch();
  const errors = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) errors.push(msg); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.splash', new Date().toDateString()); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); } catch (e) {} });

  // Google's API, intercepted
  const sent = []; let mode = 'ok';
  await ctx.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const req = route.request();
    sent.push({ url: req.url(), key: req.headers()['x-goog-api-key'], body: req.postData() || '' });
    if (mode === 'quota') return route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":{"code":429}}' });
    if (req.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [
      { name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] }, { name: 'models/text-embedding-5', supportedGenerationMethods: ['embedContent'] }] }) });
    const body = JSON.parse(req.postData());
    const json = body.generationConfig.responseMimeType === 'application/json';
    const text = json ? JSON.stringify({ vocabulary: [{ word: 'Japan', meaning: 'a country in East Asia' }], examples: ['He is from Japan.', 'She is from India.'],
      text: { title: 'New friends', body: 'Ali has three new friends.\nKenji is from Japan.\nPriya is from India.' }, dialogue: ['A: Where is he from?', 'B: He is from Japan.'],
      questions: [{ q: 'Where is Kenji from?', a: 'Japan.' }, { q: 'How many new friends does Ali have?', a: 'Three.' }] }) : 'Here is a short text about friends from many countries.';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });

  // Anthropic's API, intercepted
  const csent = []; let cmode = 'ok';
  const cjson = { vocabulary: [{ word: 'Thailand', meaning: 'a country next to Malaysia' }], examples: ['He is from Thailand.'],
    text: { title: 'Pen pals', body: 'Aiman has a pen pal.\nHis pen pal is from Thailand.\nHer name is Nok.' }, dialogue: ['A: Where is your pen pal from?', 'B: She is from Thailand.'],
    questions: [{ q: 'Where is Nok from?', a: 'Thailand.' }, { q: 'Who has a pen pal?', a: 'Aiman.' }] };
  await ctx.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST' } });
    csent.push({ url: req.url(), headers: req.headers(), body: req.postData() || '' });
    const h = { 'access-control-allow-origin': '*', 'content-type': 'application/json', 'retry-after': '0', 'request-id': 'req_e2e' };
    if (cmode === 'credit') return route.fulfill({ status: 400, headers: h, body: JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }) });
    if (req.method() === 'GET') return route.fulfill({ status: 200, headers: h, body: JSON.stringify({ data: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-4-8'].map((id) => ({ id, type: 'model', display_name: id, created_at: '2026-10-01T00:00:00Z' })), has_more: false, first_id: 'a', last_id: 'b' }) });
    const body = JSON.parse(req.postData());
    const text = body.output_config && body.output_config.format ? JSON.stringify(cjson) : 'Here is a short reading text about pen pals from many countries.';
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify({ id: 'msg_e2e', type: 'message', role: 'assistant', model: body.model, stop_reason: 'end_turn', stop_sequence: null, content: [{ type: 'text', text }], usage: { input_tokens: 100, output_tokens: 100 } }) });
  });

  const page = await ctx.newPage();
  await page.addInitScript(() => { addEventListener('unhandledrejection', (e) => console.log('REJECT ' + (e.reason && (e.reason.stack || e.reason.message || e.reason)))); addEventListener('error', (e) => console.log('ERR ' + (e.error && e.error.stack || e.message))); });
  page.on('console', (m) => { if (/^(REJECT|ERR) /.test(m.text())) console.log(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/429|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(base);
  await page.click('button:has-text("Skip for now")');

  // a class and a lesson planned by Consilia
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  await page.fill('#cd-paste', 'Aina\nBala\nChong Wei\nDhia');
  await page.click('button:has-text("Add 4 pupils")');
  await page.waitForSelector('.pupils li:nth-child(4)');
  await page.goto(base + '#/plan/new/recommend');
  await page.waitForSelector('#rc-words');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="2"]');
  await page.fill('#rc-words', 'Malaysia, Japan, China, India, Thailand');
  await page.fill('#rc-sentence', 'He is from …');
  await page.click('#nr-create');
  await page.waitForSelector('#rc-use', { timeout: 20000 });
  await page.click('#rc-use');
  await page.waitForURL(/review$/);
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.waitForSelector('#rv-slides', { timeout: 5000 }).catch(() => {});
  check((await page.locator('#rv-slides').count()) === 1, 'the Review step has a Lesson slides button');
  await page.goto(base + `#/plan/edit/${lessonId}/materials`);
  await page.waitForSelector('#mt-slides');
  check((await page.locator('#mt-slides').innerText()).includes('Make lesson slides'), 'the Materials step offers to make lesson slides');

  // ---- make the deck
  await page.click('#mt-slides');
  await page.waitForSelector('[data-make="consilia"]');
  check((await page.locator('[data-make]').count()) === 3, 'three looks to choose from');
  await page.click('[data-make="bright"]');
  await page.waitForSelector('[data-thumb]');
  const n = await page.locator('[data-thumb]').count();
  const kinds = await page.locator('.thumbs .slide').evaluateAll((els) => els.map((e) => e.dataset.kind));
  check(n >= 12, `a full deck is made from the plan (${n} slides)`);
  check(['title', 'goals', 'warmup', 'words', 'pattern', 'activity', 'question', 'criteria', 'exit', 'end'].every((k) => kinds.includes(k)), 'it has title, goals, warm-up, key words, sentence, activities, questions, thumbs check, exit ticket and end');
  const all = await page.locator('.thumbs').innerText();
  check(all.includes('He is from Japan.') && all.includes('Malaysia'), 'slides use the teacher\'s words and target sentence');
  check(!all.includes('Aina') && !all.includes('{'), 'no pupil names and no placeholders on the slides');
  if (out) await page.screenshot({ path: `${out}/m10-editor.png`, fullPage: true });

  // edit, add, reorder, delete
  await page.click('[data-thumb="1"]');
  await page.fill('#sl-title', 'Our goals today');
  await page.fill('#sl-notes', 'Point at each goal.');
  await page.click('[data-thumb="0"]');
  await page.selectOption('#sl-addkind', 'question');
  await page.click('#sl-add');
  check((await page.locator('#sl-answer').count()) === 1 && (await page.locator('[data-thumb]').count()) === n + 1, 'a question slide with an answer can be added');
  await page.fill('#sl-lines', 'What is the capital of Japan?');
  await page.fill('#sl-answer', 'Tokyo');
  await page.click('button:has-text("↓ Later")');
  check((await page.locator('[data-thumb="2"]').getAttribute('aria-label')).includes('Quick check'), 'slides can be moved');
  await page.click('#sl-delete');
  check((await page.locator('[data-thumb]').count()) === n, 'slides can be deleted');
  await page.selectOption('#sl-theme', 'calm');
  await page.waitForTimeout(700);
  await page.reload();
  await page.waitForSelector('[data-thumb]');
  check((await page.locator('[data-thumb="1"]').getAttribute('aria-label')).includes('Our goals today') && (await page.inputValue('#sl-theme')) === 'calm', 'edits and the look are saved with the lesson plan');

  // ---- present
  await page.click('[data-thumb="0"]');
  await page.click('#sl-present');
  await page.waitForSelector('.show:not(.embedded)');
  const cur = async () => (await page.locator('.show [data-slide-jump]').inputValue());
  await page.keyboard.press('ArrowRight');
  check((await cur()) === '1', 'Arrow right / clicker goes to the next slide');
  await page.keyboard.press('ArrowLeft');
  check((await cur()) === '0', 'Arrow left goes back');
  const q = kinds.indexOf('question');
  await page.selectOption('.show [data-slide-jump]', String(q));
  check((await page.locator('.show .answer').innerText()).includes('tap'), 'a question hides its answer first');
  await page.keyboard.press('ArrowRight');
  check((await page.locator('.show .answer').innerText()).startsWith('Answer:') && (await cur()) === String(q), 'the next press shows the answer, on the same slide');
  await page.keyboard.press('n');
  check((await page.locator('.show .notes').count()) === 1, 'N shows the teacher notes');
  if (out) await page.screenshot({ path: `${out}/m10-present.png` });
  await page.keyboard.press('Escape');
  check((await page.locator('.show').count()) === 0, 'Esc stops presenting');

  // ---- PowerPoint
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#sl-pptx')]);
  const file = path.join(os.tmpdir(), dl.suggestedFilename());
  await dl.saveAs(file);
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length;
  const notes = (await Promise.all(Object.keys(zip.files).filter((f) => /notesSlide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('string')))).join(' ');
  const s1 = await zip.file('ppt/slides/slide1.xml').async('string');
  check(/^Slides-.+-\d{4}-\d{2}-\d{2}\.pptx$/.test(dl.suggestedFilename()), `PowerPoint file downloaded (${dl.suggestedFilename()})`);
  check(slides >= n && s1.includes('Where'), `the PowerPoint has every slide (${slides}, with answer reveals)`);
  check(notes.includes('Point at each goal.'), 'the teacher notes are in PowerPoint\'s speaker notes');
  check((await page.locator('details.help').textContent()).includes('Import file'), 'Canva and Google Slides import steps are explained');
  fs.copyFileSync(file, path.join(out || os.tmpdir(), 'm10-sample.pptx'));

  // ---- AI by copy and paste (AI assistant off)
  check((await page.locator('#ai-setup').count()) === 1 && (await page.locator('#ai-run').count()) === 0, 'with the AI assistant off, slides offer the copy-and-paste route');
  await page.click('.aibox .ai-copy');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Year 4') && clip.includes('He is from') && !clip.includes('Aina') && !clip.includes('4 Bestari'), 'the slide prompt has the lesson but no pupil or class names');
  await page.fill('#ai-paste', '```json\n{"text":{"title":"At the airport","body":"Mei is from China.\\nRaj is from India."},"dialogue":["A: Where is she from?","B: She is from China."],"questions":[]}\n```');
  await page.click('#ai-paste-use');
  await page.waitForSelector('#ai-msg');
  check((await page.locator('.tn:has-text("AI")').count()) === 2, 'a pasted AI answer adds a text and a dialogue slide, marked AI');
  await page.click('#ai-remove');
  check((await page.locator('.tn:has-text("AI")').count()) === 0, 'AI slides can be removed in one tap');

  // ---- AI assistant: Claude by default
  await page.goto(base + '#/me');
  check((await page.locator('#me-ai').innerText()).includes('off'), 'Me shows the AI assistant, off by default');
  await page.click('#me-ai');
  await page.waitForSelector('#ai-key');
  check((await page.locator('#ai-p-claude').getAttribute('aria-checked')) === 'true', 'Claude is the recommended, preselected AI');
  check(csent.length === 0 && sent.length === 0, 'nothing is sent to Anthropic or Google before the teacher turns it on');
  await page.fill('#ai-key', CKEY);
  check(await page.locator('#ai-on').isDisabled(), 'the AI assistant cannot be turned on before agreeing');
  await page.click('#ai-test');
  await page.waitForSelector('#ai-status');
  check((await page.locator('#ai-status').innerText()).includes('Claude Opus 5.5') && (await page.locator('#ai-model option').count()) === 3, 'Test the key finds the Claude models and picks Claude Opus 5.5');
  check((await page.locator('#ai-agree2').locator('xpath=..').innerText()).includes('Anthropic'), 'the agreement names Anthropic');
  for (const i of [1, 2, 3]) await page.check(`#ai-agree${i}`);
  await page.click('#ai-on');
  await page.waitForSelector('#ai-off');
  check((await page.locator('#ai-state').innerText()).includes('Claude is on'), 'Claude turns on after the key and three agreements');
  await page.click('#ai-sample');
  await page.waitForSelector('#ai-status:has-text("Claude says")');
  check(true, 'Try it gets an answer from Claude');
  const authOk = csent.every((r) => r.headers['authorization'] === `Bearer ${CKEY}` && !r.url.includes(CKEY));
  check(authOk && csent.every((r) => r.headers['anthropic-dangerous-direct-browser-access'] === 'true'), 'the Claude key travels in a header from this device, never in the address');

  // ---- Claude for slides
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.waitForSelector('#ai-run');
  check((await page.locator('#ai-run').innerText()) === 'Add with Claude', 'the slides offer "Add with Claude"');
  await page.click('.aibox summary:has-text("What is sent to Anthropic")');
  const shown = await page.locator('.aibox pre.sent').innerText();
  check(shown.includes('Key words: Malaysia') && !shown.includes('4 Bestari'), 'the teacher can see exactly what is sent');
  const before = await page.locator('[data-thumb]').count();
  csent.length = 0;
  await page.click('#ai-run');
  await page.waitForSelector('#ai-msg');
  const added = (await page.locator('[data-thumb]').count()) - before;
  const creq = JSON.parse(csent[0].body);
  check(added === 4, `Claude adds a text, dialogue and question slides (${added})`);
  check(csent.length === 1 && !/Aina|Bala|Chong|Dhia|4 Bestari/.test(csent[0].body), 'one request, with no pupil or class names');
  check(creq.model === 'claude-opus-5-5' && creq.output_config.format.type === 'json_schema' && creq.fallbacks === 'default', 'it asks Claude Opus 5.5 for JSON in a fixed shape, with a fallback model if Claude declines');
  check((await page.locator('.thumbs').innerText()).includes('His pen pal is from Thailand.'), 'Claude\'s text is on a slide');
  cmode = 'credit';
  await page.click('#ai-run');
  await page.waitForSelector('#ai-err');
  check((await page.locator('#ai-err').innerText()).includes('no credit left') && (await page.locator('[data-thumb]').count()) === before + added, 'no credit left gives a plain message and keeps the slides');
  cmode = 'ok';

  // ---- ask Claude here (AI prompt builder), and Claude.ai in the chat buttons
  await page.goto(base + '#/tools/ai');
  await page.waitForSelector('.ai-run');
  check((await page.locator('.ai-run').innerText()).includes('ask Claude here') && (await page.locator('.ai a.btn:has-text("Claude")').count()) === 1, 'the AI prompt builder has "ask Claude here" and a Claude.ai button');
  await page.click('.ai-run');
  await page.waitForSelector('.answer .out');
  check((await page.locator('.answer .out').innerText()).includes('pen pals') && /claude/i.test(await page.locator('.answer .eyebrow').innerText()), 'the AI prompt builder shows Claude\'s answer inside the app');

  // ---- or Gemini (free)
  await page.goto(base + '#/me/ai');
  await page.click('#ai-p-gemini');
  check((await page.locator('#ai-state').innerText()).includes('off') && await page.locator('#ai-on').isDisabled(), 'switching to Gemini turns the assistant off until the teacher agrees again');
  await page.fill('#ai-key', KEY);
  await page.click('#ai-test');
  await page.waitForSelector('#ai-status');
  check((await page.locator('#ai-status').innerText()).includes('gemini-3.8-flash'), 'Gemini: Test the key picks the newest Flash');
  for (const i of [1, 2, 3]) await page.check(`#ai-agree${i}`);
  await page.click('#ai-on');
  await page.waitForSelector('#ai-off');
  check(sent.every((r) => r.key === KEY && !r.url.includes(KEY)), 'the Gemini key is sent in a header, never in the address');
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.waitForSelector('#ai-run');
  sent.length = 0;
  await page.click('#ai-run');
  await page.waitForSelector('#ai-msg');
  check(sent.length === 1 && (await page.locator('.thumbs').innerText()).includes('Kenji is from Japan.') && !/Aina|4 Bestari/.test(sent[0].body), 'Gemini replaces the AI slides, with no pupil or class names sent');
  mode = 'quota';
  await page.click('#ai-run');
  await page.waitForSelector('#ai-err');
  check((await page.locator('#ai-err').innerText()).includes('free limit'), 'a used-up Gemini free limit gives a plain message');
  mode = 'ok';
  await page.goto(base + '#/me/ai');
  await page.click('#ai-p-claude');
  check((await page.inputValue('#ai-key')) === CKEY, 'each AI keeps its own key');

  // ---- the key never leaves in a backup
  await page.goto(base + '#/me');
  const [bk] = await Promise.all([page.waitForEvent('download'), page.click('#bk-save')]);
  const bkFile = path.join(os.tmpdir(), bk.suggestedFilename()); await bk.saveAs(bkFile);
  const bkText = fs.readFileSync(bkFile, 'utf8');
  check(!bkText.includes(KEY) && !bkText.includes(CKEY) && bkText.includes('"slides"'), 'backups keep the slides but never an API key');

  // ---- Tools and Teach mode
  await page.goto(base + '#/tools');
  await page.waitForSelector('[data-tool-card]');
  check((await page.locator('[data-tool-card]').count()) === 12 && (await page.locator('[data-tool-card="slides"]').count()) === 1, 'the Tools hub lists Lesson slides (12 tools)');
  await page.fill('#tools-q', 'powerpoint');
  check((await page.locator('[data-tool-card]').count()) === 1, 'searching "powerpoint" finds Lesson slides');
  await page.goto(base + '#/tools/slides');
  await page.waitForSelector(`[data-pick="${lessonId}"]`);
  check((await page.locator(`[data-pick="${lessonId}"]`).innerText()).includes('slides'), 'Tools → Lesson slides lists lesson plans with their slides');
  await page.goto(base + '#/teach/' + lessonId);
  await page.waitForSelector('[data-tool="slides"]');
  await page.waitForTimeout(500);
  check((await page.locator('.toast.err').count()) === 0, 'no error messages on the way');
  await page.click('[data-tool="slides"]');
  await page.waitForSelector('.show.embedded');
  const at0 = await page.locator('.show [data-slide-jump]').inputValue();
  await page.keyboard.press('ArrowRight');
  check((await page.locator('.show [data-slide-jump]').inputValue()) !== at0, 'Teach mode shows the slides, and the clicker moves them');
  if (out) await page.screenshot({ path: `${out}/m10-teach.png` });

  // ---- turning off, forgetting
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.waitForSelector('#ai-setup');
  check((await page.locator('#ai-run').count()) === 0, 'with the AI assistant off, no Claude or Gemini buttons are shown');
  await page.goto(base + '#/me/ai');
  await page.click('#ai-forget');
  check((await page.evaluate(() => localStorage.getItem('consilia.ai'))) === null, 'Remove all keys deletes them from the device');
  // settings saved by beta.5 (Gemini only) carry over
  await page.evaluate((k) => localStorage.setItem('consilia.ai', JSON.stringify({ on: true, key: k, model: 'gemini-3.8-flash', agreed: 1 })), KEY);
  await page.reload();
  await page.waitForSelector('#ai-state');
  check((await page.locator('#ai-state').innerText()).includes('Gemini is on') && (await page.inputValue('#ai-key')) === KEY, 'a Gemini key saved by the previous version still works');
  await page.click('#ai-forget');

  // ---- offline
  await ctx.setOffline(true);
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.reload();
  await page.waitForSelector('[data-thumb]');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#sl-pptx')]);
  check(/\.pptx$/.test(dl2.suggestedFilename()), 'slides open and download as PowerPoint offline');
  await ctx.setOffline(false);

  // ---- a lesson copied from the SoW: teacher-only steps stay in the notes
  await page.goto(base + '#/plan/new');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const sowId = page.url().split('/').slice(-2)[0];
  await page.goto(base + `#/plan/slides/${sowId}`);
  await page.click('[data-make="consilia"]');
  await page.waitForSelector('[data-thumb]');
  check(!(await page.locator('.thumbs').innerText()).includes('Teacher’s Book'), 'teacher-only SoW steps are not shown to pupils');

  // ---- phone
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState({ indexedDB: true }) });
  const p2 = await phone.newPage();
  for (const r of [`#/plan/slides/${lessonId}`, '#/me/ai', '#/tools/slides']) { await p2.goto(base + r); await p2.waitForTimeout(500); check(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no sideways scrolling on a phone: ${r}`); }
  if (out) await p2.screenshot({ path: `${out}/m10-phone-slides.png` });
  await phone.close();
  await browser.close();
  if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
  console.log('\nM10 end-to-end test passed');
})();
