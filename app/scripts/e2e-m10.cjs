// End-to-end for milestone 10: lesson slides made from a lesson plan (editor, themes, reorder, add, delete, saved),
// presenting with keys and answer reveal, PowerPoint download (opened and checked), slides in Teach mode, the Tools
// entry; AI content by copy-and-paste; optional Cloud AI (Gemini) settings, consent, key test, model choice, slide
// content and "ask Gemini here", errors, what is sent, the key kept out of backups; offline; phone layout.
// Google is intercepted: nothing is really sent. Run against `vite preview`: node scripts/e2e-m10.cjs [out-dir]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const JSZip = require('jszip');
const out = process.argv[2];
const base = process.env.BASE_URL || 'http://localhost:4173/';
const KEY = 'AIzaSyTEST-not-a-real-key-0123456789';

(async () => {
  const browser = await chromium.launch();
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

  // ---- AI by copy and paste (Cloud AI off)
  check((await page.locator('#ai-setup').count()) === 1 && (await page.locator('#ai-run').count()) === 0, 'with Cloud AI off, slides offer the copy-and-paste route');
  await page.click('.aibox .ai-copy');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Year 4') && clip.includes('He is from') && !clip.includes('Aina') && !clip.includes('4 Bestari'), 'the slide prompt has the lesson but no pupil or class names');
  await page.fill('#ai-paste', '```json\n{"text":{"title":"At the airport","body":"Mei is from China.\\nRaj is from India."},"dialogue":["A: Where is she from?","B: She is from China."],"questions":[]}\n```');
  await page.click('#ai-paste-use');
  await page.waitForSelector('#ai-msg');
  check((await page.locator('.tn:has-text("AI")').count()) === 2, 'a pasted AI answer adds a text and a dialogue slide, marked AI');
  await page.click('#ai-remove');
  check((await page.locator('.tn:has-text("AI")').count()) === 0, 'AI slides can be removed in one tap');

  // ---- Cloud AI settings
  await page.goto(base + '#/me');
  check((await page.locator('#me-ai').innerText()).includes('off'), 'Me shows Cloud AI, off by default');
  await page.click('#me-ai');
  await page.waitForSelector('#ai-key');
  check(sent.length === 0, 'nothing is sent to Google before the teacher turns it on');
  await page.fill('#ai-key', KEY);
  check(await page.locator('#ai-on').isDisabled(), 'Cloud AI cannot be turned on before agreeing');
  await page.click('#ai-test');
  await page.waitForSelector('#ai-status');
  check((await page.locator('#ai-status').innerText()).includes('gemini-3.8-flash') && (await page.locator('#ai-model option').count()) === 3, 'Test the key finds the models and picks the newest Flash');
  for (const i of [1, 2, 3]) await page.check(`#ai-agree${i}`);
  await page.click('#ai-on');
  await page.waitForSelector('#ai-off');
  check((await page.locator('#ai-state').innerText()).includes('on'), 'Cloud AI turns on after the key and three agreements');
  await page.click('#ai-sample');
  await page.waitForSelector('#ai-status:has-text("Gemini says")');
  check(true, 'Try it gets an answer');
  check(sent.every((s) => s.key === KEY && !s.url.includes(KEY)), 'the key is sent in a header, never in the address');

  // ---- Gemini for slides
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.waitForSelector('#ai-run');
  await page.click('.aibox summary:has-text("What is sent")');
  const shown = await page.locator('.aibox pre.sent').innerText();
  check(shown.includes('Key words: Malaysia') && !shown.includes('4 Bestari'), 'the teacher can see exactly what is sent');
  const before = await page.locator('[data-thumb]').count();
  sent.length = 0;
  await page.click('#ai-run');
  await page.waitForSelector('#ai-msg');
  const added = (await page.locator('[data-thumb]').count()) - before;
  const reqBody = sent.map((s) => s.body).join(' ');
  check(added === 4, `Gemini adds a text, dialogue and question slides (${added})`);
  check(sent.length === 1 && !/Aina|Bala|Chong|Dhia|4 Bestari/.test(reqBody) && reqBody.includes('responseSchema'), 'one request, with no pupil or class names, asking for JSON');
  check((await page.locator('.thumbs').innerText()).includes('Kenji is from Japan.'), 'the AI text is on a slide');
  mode = 'quota';
  await page.click('#ai-run');
  await page.waitForSelector('#ai-err');
  check((await page.locator('#ai-err').innerText()).includes('free limit') && (await page.locator('[data-thumb]').count()) === before + added, 'a used-up free limit gives a plain message and keeps the slides');
  mode = 'ok';

  // ---- ask Gemini here (AI prompt builder)
  await page.goto(base + '#/tools/ai');
  await page.waitForSelector('.ai-run');
  await page.click('.ai-run');
  await page.waitForSelector('.answer .out');
  check((await page.locator('.answer .out').innerText()).includes('short text'), 'the AI prompt builder can ask Gemini inside the app');

  // ---- the key never leaves in a backup
  await page.goto(base + '#/me');
  const [bk] = await Promise.all([page.waitForEvent('download'), page.click('#bk-save')]);
  const bkFile = path.join(os.tmpdir(), bk.suggestedFilename()); await bk.saveAs(bkFile);
  const bkText = fs.readFileSync(bkFile, 'utf8');
  check(!bkText.includes(KEY) && bkText.includes('"slides"'), 'backups keep the slides but never the API key');

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
  await page.goto(base + '#/me/ai');
  await page.click('#ai-off');
  await page.goto(base + `#/plan/slides/${lessonId}`);
  await page.waitForSelector('#ai-setup');
  check((await page.locator('#ai-run').count()) === 0, 'with Cloud AI off, no Gemini buttons are shown');
  await page.goto(base + '#/me/ai');
  await page.click('#ai-forget');
  check((await page.evaluate(() => localStorage.getItem('consilia.ai'))) === null, 'Remove the key deletes it from the device');

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
