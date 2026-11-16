// Records the Help videos from the real app (blueprint F25) with a visible cursor, a title card and captions in
// English and Bahasa Melayu (WebVTT, timed from the recording itself). Output: public/videos/<id>.mp4 + .en.vtt + .ms.vtt
// Needs ffmpeg and `vite preview --port 4173` running a fresh build.   Usage: npm run videos [-- id ...]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const base = process.env.BASE_URL || 'http://localhost:4173/';
const OUT = path.join(__dirname, '../public/videos');
const W = 1280, H = 720;
const PUPILS = ['Aina', 'Bala', 'Chong Wei', 'Dhia', 'Elena', 'Faris', 'Gopal', 'Hana', 'Irfan', 'Jia Hui', 'Kavin', 'Lina'];

const prep = () => {
  try { localStorage.setItem('consilia.tourDone', '1'); localStorage.setItem('consilia.terms', JSON.stringify({ v: 99, at: '2026-11-16T00:00:00Z' })); localStorage.setItem('consilia.splash', new Date().toDateString()); } catch (e) {}
  const add = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 2l7.5 19 2.6-7.6L21 10.8z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))';
    document.documentElement.appendChild(c);
    const pos = JSON.parse(sessionStorage.getItem('__cur') || '[640,360]');
    c.style.transform = `translate(${pos[0] - 3}px,${pos[1] - 2}px)`;
    addEventListener('mousemove', (e) => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; sessionStorage.setItem('__cur', JSON.stringify([e.clientX, e.clientY])); }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;border:3px solid #E0A526;z-index:2147483646;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out`;
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.6)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 500);
    }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
};

/** One recording session: actions plus timed captions. */
function director(page, t0) {
  const cues = [];
  const now = () => (Date.now() - t0) / 1000;
  const wait = (ms) => page.waitForTimeout(ms);
  return {
    cues, now, wait,
    async say(en, ms, min = 2600) {
      if (cues.length && cues[cues.length - 1].end == null) cues[cues.length - 1].end = now();
      cues.push({ start: now(), en, ms });
      await wait(Math.max(min, en.split(/\s+/).length * 330));
    },
    hush() { if (cues.length && cues[cues.length - 1].end == null) cues[cues.length - 1].end = now(); },
    async show(sel) {
      const el = page.locator(sel).first();
      await el.waitFor({ state: 'visible', timeout: 15000 });
      await el.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await wait(550);
      return el;
    },
    async point(sel) {
      const el = await this.show(sel);
      const b = await el.boundingBox();
      await page.mouse.move(b.x + Math.min(b.width / 2, 120), b.y + b.height / 2, { steps: 22 });
      await wait(250);
      return el;
    },
    async click(sel, after = 700) { const el = await this.point(sel); await el.click(); await wait(after); },
    async type(sel, text, delay = 28) { const el = await this.point(sel); await el.click(); await el.fill(''); await page.keyboard.type(text, { delay }); await page.keyboard.press('Escape'); await wait(400); },
    async card(title, sub, ms = 3000) {
      await page.evaluate(([title, sub]) => {
        const d = document.createElement('div'); d.id = '__card';
        d.style.cssText = 'position:fixed;inset:0;z-index:2147483640;display:grid;place-content:center;gap:14px;text-align:center;background:radial-gradient(circle at 50% 40%,#203A66,#0F213D);color:#fff;font-family:"Bricolage Grotesque Variable",system-ui,sans-serif;transition:opacity .6s';
        d.innerHTML = `<div style="font-size:22px;letter-spacing:.3em;color:#E0A526;font-weight:700">CONSILIA</div><div style="font-size:52px;font-weight:800">${title}</div><div style="font-size:22px;opacity:.85;font-family:'Plus Jakarta Sans Variable',sans-serif">${sub}</div>`;
        document.body.appendChild(d);
      }, [title, sub]);
      await wait(ms);
      await page.evaluate(() => { const d = document.getElementById('__card'); d.style.opacity = '0'; setTimeout(() => d.remove(), 650); });
      await wait(700);
    }
  };
}

const vtt = (cues, lang, shift, endAt) => 'WEBVTT\n\n' + cues.map((c, i) => {
  const t = (s) => { s = Math.max(0, s - shift); const h = String(Math.floor(s / 3600)).padStart(2, '0'); const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0'); return `${h}:${m}:${(s % 60).toFixed(3).padStart(6, '0')}`; };
  return `${i + 1}\n${t(c.start)} --> ${t(Math.min(c.end ?? endAt, endAt))}\n${c[lang]}\n`;
}).join('\n');

// ---------------------------------------------------------------- shared starting state (not recorded)
async function seed(browser) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  await ctx.addInitScript(prep);
  const page = await ctx.newPage();
  await page.goto(base);
  await page.fill('#pf-name', 'Aina Sulaiman');
  await page.fill('#pf-school', 'SK Bandaraya Kota Kinabalu');
  await page.fill('#pf-prog', 'PISMP TESL');
  await page.click('button:has-text("Start planning")');
  await page.waitForSelector('#ob-title', { state: 'detached' });
  await page.goto(base + '#/classes');
  await page.click('button:has-text("Add a Year 4 class")');
  await page.fill('#cl-name', '4 Bestari');
  await page.fill('#cl-level', 'Average');
  await page.click('button:has-text("Add class")');
  await page.waitForSelector('#cd-paste');
  const classId = page.url().split('/').pop();
  await page.fill('#cd-paste', PUPILS.join('\n'));
  await page.click(`button:has-text("Add ${PUPILS.length} pupils")`);
  await page.waitForSelector(`.pupils li:nth-child(${PUPILS.length})`);
  await page.goto(base + '#/plan/new');
  await page.waitForSelector('#nr-class');
  await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' });
  await page.fill('#nr-start', '09:10');
  await page.waitForSelector('[data-sow="1"]');
  await page.click('[data-sow="1"]');
  await page.click('#nr-create');
  await page.waitForURL(/setup$/);
  const lessonId = page.url().split('/').slice(-2)[0];
  await page.goto(base + `#/plan/edit/${lessonId}/objectives`);
  const o = page.locator('section.obj').first();
  await o.locator('[data-field=verb]').fill('identify');
  await o.locator('[data-field=content]').fill('the countries 4 children come from in a short audio text');
  await o.locator('[data-field=condition]').fill('based on a world map');
  await o.locator('[data-field=degree]').fill('with at least 3 correct answers');
  const c = page.locator('section.obj').nth(1);
  if (await c.count()) {
    await c.locator('[data-field=verb]').fill('answer');
    await c.locator('[data-field=content]').fill('3 questions about where their friends come from');
    await c.locator('[data-field=degree]').fill('with at least 2 correct answers');
  }
  await page.goto(base + `#/plan/edit/${lessonId}/planb`);
  await page.click('#pb-fill');
  await page.goto(base + `#/plan/edit/${lessonId}/materials`);
  await page.fill('#mt-vocab', 'Malaysia, Japan, China, India, Thailand');
  await page.fill('#mt-sentence', 'He is from …');
  await page.waitForTimeout(900);
  // a timetable for today, so My day and the weekly plan have periods
  const todayDay = String(((new Date().getDay() + 6) % 7) + 1);
  await page.goto(base + '#/plan/week');
  await page.waitForSelector('#tt-class');
  for (const [st, du] of [['07:40', '30'], ['09:10', '60']]) { await page.selectOption('#tt-day', todayDay); await page.fill('#tt-start', st); await page.fill('#tt-dur', du); await page.click('#tt-add'); }
  await page.waitForTimeout(500);
  const state = await ctx.storageState({ indexedDB: true });
  await ctx.close();
  return { state, classId, lessonId };
}

/** A school yearly plan (RPT) in Word with this term's dates, for the yearly-plan video. */
async function makeRpt() {
  const { Document, Packer, Table, TableRow, TableCell, Paragraph } = require('docx');
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const at = (n) => { const x = new Date(mon); x.setDate(x.getDate() + n); return `${x.getDate()}.${x.getMonth() + 1}.${x.getFullYear()}`; };
  const rows = [['MINGGU', 'TARIKH', 'TEMA', 'UNIT / TOPIK', 'STANDARD PEMBELAJARAN', 'PELAJARAN', 'CATATAN'],
    ['1', `${at(-7)} - ${at(-3)}`, 'World of Self, Family and Friends', 'Unit 1: Where are you from?', '1.2.2 2.1.5 3.2.2', '1-3', ''],
    ['2', `${at(0)} - ${at(4)}`, 'World of Self, Family and Friends', 'Unit 1: Where are you from?', '4.2.4 5.3.1 1.2.4', '4-6', 'Bring a world map'],
    ['3', `${at(7)} - ${at(11)}`, 'World of Knowledge', 'Unit 2: Days', '2.1.1 3.2.1', '7-9', ''],
    ['CUTI PERTENGAHAN PENGGAL', '', '', '', '', '', ''],
    ['4', `${at(21)} - ${at(25)}`, 'World of Knowledge', 'Unit 2: Days', '4.2.1 5.2.1', '10-12', '']];
  const t = new Table({ rows: rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph(c)] })) })) });
  const file = path.join(os.tmpdir(), `RPT English Tahun 4 ${mon.getFullYear()}.docx`);
  fs.writeFileSync(file, await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph(`RANCANGAN PENGAJARAN TAHUNAN BAHASA INGGERIS TAHUN 4 ${mon.getFullYear()}`), t] }] })));
  return file;
}

// ---------------------------------------------------------------- the videos
const VIDEOS = {
  'first-rph': { title: 'Your first lesson plan', ms: 'RPH pertama anda', async run(d, page, s) {
    await d.say('Let\'s plan a lesson from the Scheme of Work. Open Plan.', 'Mari rancang pelajaran daripada Skema Pelajaran. Buka Rancang.');
    await d.click('nav a[href="#/plan"]', 1000);
    await d.say('Press the gold New lesson plan button.', 'Tekan butang emas New lesson plan.', 1200);
    await d.click('.row.top a.btn-gold[href="#/plan/new"]', 1200);
    await d.say('Step 1: choose your class, the date and the time.', 'Langkah 1: pilih kelas, tarikh dan masa.');
    await d.point('#nr-class'); await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' }); await d.wait(600);
    await d.point('#nr-start'); await page.fill('#nr-start', '10:40'); await d.wait(700);
    await d.say('Step 2: how do you want to start? Follow the SoW fills in everything from the SoW lesson.', 'Langkah 2: bagaimana anda mahu bermula? Follow the SoW mengisi semuanya daripada pelajaran SoW.');
    await d.point('[role=radio]:has-text("Follow the SoW")');
    await d.say('You can also keep the SoW standards and design your own activities, or start from scratch.', 'Anda juga boleh kekalkan standard SoW dan reka aktiviti sendiri, atau mula dari kosong.');
    await d.point('[role=radio]:has-text("SoW standards, my activities")'); await d.wait(600);
    await d.click('[role=radio]:has-text("Follow the SoW")');
    await d.say('Step 3: choose the SoW lesson. Consilia shows the topic, skill and textbook pages.', 'Langkah 3: pilih pelajaran SoW. Consilia menunjukkan topik, kemahiran dan halaman buku teks.');
    await d.click('[data-sow="2"]');
    await d.click('#nr-create', 1500);
    await d.say('The builder has seven steps. Everything saves as you type.', 'Pembina rancangan pelajaran ada tujuh langkah. Semuanya disimpan semasa anda menaip.');
    await d.point('.steps');
    await d.say('Setup is filled from your class and the SoW: theme, topic, values and more.', 'Setup diisi daripada kelas dan SoW anda: tema, topik, nilai dan lain-lain.');
    await page.mouse.wheel(0, 500); await d.wait(900); await page.mouse.wheel(0, -500); await d.wait(500);
    await d.click('.steps a:has-text("Standards")', 1000);
    await d.say('Standards come straight from the SoW, so they always match the DSKP.', 'Standard datang terus daripada SoW, jadi sentiasa sepadan dengan DSKP.');
    await d.click('.steps a:has-text("Objectives")', 1000);
    await d.say('Write objectives with the ABCD boxes. The SMART squares turn green when they are measurable.', 'Tulis objektif dengan kotak ABCD. Petak SMART bertukar hijau apabila objektif boleh diukur.');
    const o = 'section.obj >> nth=0';
    await d.type(`${o} >> [data-field=verb]`, 'ask');
    await d.type(`${o} >> [data-field=content]`, 'and answer 4 questions about where friends come from');
    await d.type(`${o} >> [data-field=degree]`, 'with at least 3 correct answers');
    await d.point(`${o} >> .smart`); await d.wait(1200);
    await d.say('Below every step, "Tools for this step" opens helpers already filled with this lesson.', 'Di bawah setiap langkah, "Tools for this step" membuka alat bantu yang sudah diisi dengan pelajaran ini.');
    await d.point('.steptools'); await d.wait(800);
    await d.click('.steps a:has-text("Lesson flow")', 1200);
    await d.say('Lesson flow suggests a framework for the skill and explains why. Here it is PPP for a speaking lesson.', 'Aliran pelajaran mencadangkan rangka untuk kemahiran itu dan sebabnya. Di sini PPP untuk pelajaran bertutur.');
    await d.point('.chip:has-text("Recommended")'); await d.wait(800);
    await page.mouse.wheel(0, 700); await d.wait(1500); await page.mouse.wheel(0, -700); await d.wait(500);
    await d.click('.head .score', 1500);
    await d.say('The score ring shows what still needs attention. Each item jumps to the fix.', 'Cincin skor menunjukkan apa yang perlu diperbaiki. Setiap item membawa anda terus ke pembetulan.');
    await d.point('#check li.fail >> nth=0'); await d.wait(800);
    await d.say('That\'s your first lesson plan. Next: watch "Let Consilia plan a lesson".', 'Itulah rancangan pelajaran pertama anda. Seterusnya: tonton "Biar Consilia rancang pelajaran".', 3000);
  } },

  'objectives': { title: 'Objectives that pass SMART', ms: 'Objektif yang lulus SMART', async run(d, page, s) {
    await page.goto(base + `#/plan/edit/${s.lessonId}/objectives`); await d.wait(800);
    await d.say('Every objective has four parts: Audience, Behaviour, Condition and Degree.', 'Setiap objektif ada empat bahagian: Audience, Behaviour, Condition dan Degree.');
    const o = 'section.obj >> nth=0';
    await d.point(`${o} >> [data-field=verb]`);
    await d.say('Let\'s try a common trainee objective: "understand", "with minimal support".', 'Mari cuba objektif biasa guru pelatih: "understand", "with minimal support".');
    await d.type(`${o} >> [data-field=verb]`, 'understand');
    await d.type(`${o} >> [data-field=degree]`, 'with minimal support');
    await d.point(`${o} >> .smart`);
    await d.say('Red squares show what is missing. "Understand" cannot be seen, and "minimal support" cannot be measured.', 'Petak merah menunjukkan apa yang kurang. "Understand" tidak dapat dilihat, dan "minimal support" tidak dapat diukur.', 3600);
    await d.point(`${o} >> .fix >> nth=0`); await d.wait(1500);
    await d.say('Use a verb you can observe for the skill. For listening: identify, point to, match or tick.', 'Gunakan kata kerja yang boleh diperhatikan untuk kemahiran itu. Untuk mendengar: identify, point to, match atau tick.');
    await d.type(`${o} >> [data-field=verb]`, 'identify');
    await d.say('Then give the Degree a number.', 'Kemudian beri Degree satu nombor.');
    await d.type(`${o} >> [data-field=degree]`, 'with at least 3 correct answers');
    await page.keyboard.press('Escape');
    await d.point(`${o} >> .smart`);
    await d.say('All five squares are green: Specific, Measurable, Achievable, Relevant and Time-bound.', 'Kelima-lima petak hijau: Specific, Measurable, Achievable, Relevant dan Time-bound.', 3200);
    await d.show('.sc input');
    await d.point('.sc input');
    await d.say('Success criteria for pupils are written for you, as "I can…" statements.', 'Kriteria kejayaan untuk murid ditulis untuk anda, sebagai pernyataan "I can…".');
    await d.point(`${o} >> .sentence`);
    await d.say('The sentence below shows the whole objective exactly as it will appear in your lesson plan.', 'Ayat di bawah menunjukkan objektif penuh seperti yang akan dipaparkan dalam RPH anda.');
    await d.point(`${o} >> button:has-text("Type it myself")`);
    await d.say('Prefer to write it in your own words? Press Type it myself. Consilia still checks it.', 'Lebih suka menulis dengan ayat sendiri? Tekan Type it myself. Consilia tetap menyemaknya.');
    await d.say('Add a complementary objective the same way. Next: watch "The Tools page".', 'Tambah objektif sampingan dengan cara yang sama. Seterusnya: tonton "Halaman Alat".', 3000);
  } },

  'teach': { title: 'Teach mode', ms: 'Mod Mengajar', async run(d, page, s) {
    await page.goto(base + `#/plan/edit/${s.lessonId}/review`); await d.wait(900);
    await d.say('Open any lesson and press Teach. It goes full screen, ready for the projector.', 'Buka mana-mana pelajaran dan tekan Teach. Ia menjadi skrin penuh, sedia untuk projektor.');
    await d.click('a.teachbtn', 1500);
    await d.say('First, attendance. Tap the pupils who are absent.', 'Mula-mula, kehadiran. Ketik murid yang tidak hadir.');
    await d.click('.pp[data-pupil="Dhia"]', 500); await d.click('.pp[data-pupil="Kavin"]', 800);
    await d.say('Start the lesson. The clock counts down each stage and the pacing coach warns you if you run over.', 'Mulakan pelajaran. Jam mengira detik setiap peringkat dan jurulatih masa memberi amaran jika terlebih masa.');
    await d.click('#teach-start', 1500);
    await d.point('.clock'); await d.wait(1200);
    await d.say('The toolkit is always at hand. The name picker only picks pupils who are here.', 'Kit alat sentiasa tersedia. Pemilih nama hanya memilih murid yang hadir.');
    await d.click('[data-tool=picker]', 600); await d.click('#picker-go', 2600);
    await d.click('.sheet button:has-text("Close")', 600);
    await d.say('Groups can be mixed ability or by level, and keep apart the pupils you choose.', 'Kumpulan boleh bercampur kebolehan atau ikut tahap, dan mengasingkan murid yang anda pilih.');
    await d.click('[data-tool=groups]', 600); await d.point('#grp-size'); await page.fill('#grp-size', '4'); await d.wait(500); await d.click('#grp-make', 2200);
    await d.click('.sheet button:has-text("Close")', 600);
    await d.say('There is also a noise light, team points, an attention signal and a timer.', 'Ada juga lampu bunyi, mata pasukan, isyarat perhatian dan pemasa.');
    await d.click('[data-tool=timer]', 600); await d.click('.sheet button:has-text("1 min")', 2000);
    await d.click('.sheet button:has-text("Close")', 600);
    await d.say('Games puts a spin wheel, unjumble and quiz on the projector, made from the lesson\'s words.', 'Games memaparkan roda putar, susun ayat dan kuiz pada projektor, daripada perkataan pelajaran.');
    await d.click('[data-tool=games]', 600); await d.click('#g-spin', 4600);
    await d.click('.sheet button:has-text("Close")', 600);
    await d.say('Press Next to move to the next stage.', 'Tekan Next untuk ke peringkat seterusnya.');
    await d.click('#teach-next', 1200); await d.click('#teach-next', 1000);
    await d.say('If the phone locks or the page reloads, Teach mode carries on from the same stage.', 'Jika telefon terkunci atau halaman dimuat semula, Mod Mengajar bersambung dari peringkat yang sama.');
    while ((await page.locator('#teach-next').count()) > 0) { await page.click('#teach-next'); await d.wait(350); }
    await d.wait(800);
    await d.say('At the end, compare planned and actual time, then record PBD or write your reflection.', 'Di akhir, bandingkan masa dirancang dan sebenar, kemudian rekod PBD atau tulis refleksi anda.', 3600);
    await d.point('#teach-pbd'); await d.wait(800);
    await d.say('Next: watch "Attendance and My day".', 'Seterusnya: tonton "Kehadiran dan Hari Saya".', 2400);
  } },

  'classes-pbd': { title: 'Classes and PBD', ms: 'Kelas dan PBD', async run(d, page, s) {
    await page.goto(base + '#/classes'); await d.wait(800);
    await d.say('Classes are grouped from Year 1 to Year 6. Add a class with its name and school type.', 'Kelas disusun dari Tahun 1 hingga Tahun 6. Tambah kelas dengan nama dan jenis sekolah.');
    await d.click('button:has-text("Year 5")', 700);
    await d.click('button:has-text("Add a Year 5 class")', 700);
    await d.type('#cl-name', '5 Cemerlang');
    await d.click('button:has-text("Add class")', 1200);
    await d.say('Paste the names straight from Excel, Google Sheets or WhatsApp. Numbers and bullets are removed.', 'Tampal nama terus dari Excel, Google Sheets atau WhatsApp. Nombor dan bulet dibuang.');
    await d.point('#cd-paste');
    await page.fill('#cd-paste', '1. Adam\n2. Batrisya\n3. Chloe\n4. Danish\n5. Ezra\n6. Farah\n7. Gavin\n8. Haziq'); await d.wait(1200);
    await d.click('button:has-text("Add 8 pupils")', 1200);
    await d.say('Now record PBD. Choose the date and the Learning Standard you assessed.', 'Sekarang rekod PBD. Pilih tarikh dan Standard Pembelajaran yang dinilai.');
    await d.click('a:has-text("Record TP levels")', 1200);
    await d.point('#pbd-ls');
    const opt = await page.locator('#pbd-ls option').nth(1).getAttribute('value');
    await page.selectOption('#pbd-ls', opt); await d.wait(1200);
    await d.say('Set everyone to the usual level, then change the few who differ. Tap a TP to see what it means.', 'Tetapkan semua murid pada tahap biasa, kemudian ubah yang berbeza. Ketik TP untuk melihat maksudnya.');
    const ls = 'section.ls >> nth=0';
    await d.click(`${ls} >> button:has-text("3") >> nth=0`, 900);
    await d.click(`${ls} >> li:has-text("Batrisya") >> button.tp:has-text("5")`, 600);
    await d.click(`${ls} >> li:has-text("Danish") >> button.tp:has-text("2")`, 600);
    await d.click(`${ls} >> li:has-text("Haziq") >> button.tp:has-text("4")`, 800);
    await d.click('#pbd-save', 1200);
    await d.say('PBD progress shows a heatmap for the class, a suggested level and suggested groups.', 'Kemajuan PBD menunjukkan peta haba kelas, cadangan tahap dan cadangan kumpulan.');
    await d.click('a:has-text("See class progress")', 1500);
    await d.point('.heat'); await d.wait(1500);
    await d.say('Export to Excel for your school records.', 'Eksport ke Excel untuk rekod sekolah anda.');
    await Promise.all([page.waitForEvent('download'), d.click('#pbd-excel', 1500)]);
    await d.say('Next: watch "Print, PDF and Word".', 'Seterusnya: tonton "Cetak, PDF dan Word".', 2400);
  } },

  'export': { title: 'Print, PDF and Word', ms: 'Cetak, PDF dan Word', async run(d, page, s) {
    await page.goto(base + `#/plan/edit/${s.lessonId}/review`); await d.wait(1000);
    await d.say('Review checks that objectives, activities, assessment and timing all line up.', 'Semakan memastikan objektif, aktiviti, pentaksiran dan masa semuanya selari.');
    await d.point('#check'); await d.wait(600);
    const fail = page.locator('#check li.fail');
    if (await fail.count()) {
      await d.say('Each item says what is wrong. Fix it takes you to the right step.', 'Setiap item menyatakan apa yang salah. Fix it membawa anda ke langkah yang betul.');
      await d.point('#check li.fail >> nth=0 >> a:has-text("Fix it")'); await d.wait(800);
      await d.say('If something is right for your class, press Mark as fine and give a reason.', 'Jika sesuatu itu sesuai untuk kelas anda, tekan Mark as fine dan beri sebab.');
      await d.point('#check li.fail >> nth=0 >> button:has-text("Mark as fine")'); await d.wait(800);
    }
    await d.say('Choose a layout: the standard school template, or the one-page Consilia Lesson Blueprint.', 'Pilih susun atur: templat sekolah biasa, atau Consilia Lesson Blueprint satu halaman.');
    await d.click('button:has-text("School template")', 900);
    await d.show('article.paper'); await page.mouse.wheel(0, 900); await d.wait(1600); await page.mouse.wheel(0, -900); await d.wait(600);
    await d.click('button:has-text("Consilia Lesson Blueprint")', 900);
    await d.show('article.paper'); await page.mouse.wheel(0, 900); await d.wait(1600); await page.mouse.wheel(0, -900); await d.wait(600);
    await d.say('Print or save as PDF straight from here.', 'Cetak atau simpan sebagai PDF terus dari sini.');
    await d.point('button:has-text("Print or save as PDF")'); await d.wait(700);
    await d.say('Or download a Word file to edit in Word, Google Docs or WPS.', 'Atau muat turun fail Word untuk disunting dalam Word, Google Docs atau WPS.');
    await Promise.all([page.waitForEvent('download'), d.click('#rv-word', 1500)]);
    await d.say('Links you add get QR codes on the printed lesson plan. Next: watch "Back up and restore".', 'Pautan yang anda tambah mendapat kod QR pada RPH bercetak. Seterusnya: tonton "Sandaran dan pemulihan".', 3200);
  } },

  'recommend': { title: 'Let Consilia plan a lesson', ms: 'Biar Consilia rancang pelajaran', async run(d, page, s) {
    await d.say('Consilia can plan a whole lesson for your class. On Today, press "Let Consilia plan it".', 'Consilia boleh merancang seluruh pelajaran untuk kelas anda. Di Hari Ini, tekan "Let Consilia plan it".');
    await d.click('a:has-text("Let Consilia plan it")', 1200);
    await d.point('#nr-class'); await page.selectOption('#nr-class', { label: '4 Bestari · Year 4 SK' }); await d.wait(500);
    await d.say('Choose the SoW lesson.', 'Pilih pelajaran SoW.', 1500);
    await d.click('[data-sow="2"]', 700);
    await d.say('Tell Consilia about your class. Every question is optional, and it remembers your answers for this class.', 'Beritahu Consilia tentang kelas anda. Semua soalan pilihan, dan jawapan diingat untuk kelas ini.');
    await d.click('[data-trait="shy"]', 400); await d.click('[data-trait="large-class"]', 400);
    await d.type('#rc-words', 'Malaysia, Japan, China, India, Thailand', 18);
    await d.type('#rc-sentence', 'He is from …', 40);
    await d.say('What matters today? Here: more speaking, and an observation lesson.', 'Apa yang penting hari ini? Di sini: lebih banyak bertutur, dan pelajaran pencerapan.');
    await d.click('[data-goal="speaking"]', 400); await d.click('[data-goal="observation"]', 600);
    await d.click('#nr-create', 1200);
    await d.say('Consilia shows how it decided: the framework, the class, and why each activity fits.', 'Consilia menunjukkan cara ia memutuskan: kerangka, kelas, dan sebab setiap aktiviti sesuai.', 4200);
    await page.waitForSelector('#rc-use');
    await d.point('.proposal .head'); await d.wait(800);
    await d.say('Every stage has a step-by-step script, with Low, Moderate and High versions.', 'Setiap peringkat ada skrip langkah demi langkah, dengan versi Rendah, Sederhana dan Tinggi.');
    await d.point('[data-stage] .script >> nth=1'); await d.wait(1000);
    await d.say('Tap a teaching aid to see how to make it, step by step.', 'Ketik BBM untuk melihat cara membuatnya, langkah demi langkah.');
    await d.click('.proposal details.bbm >> nth=0 >> summary', 2200);
    await d.say('Not keen on an activity? Press "Another idea" — only that stage changes.', 'Kurang suka satu aktiviti? Tekan "Another idea" — hanya peringkat itu berubah.');
    await d.click('[data-stage] >> nth=2 >> .another', 1600);
    await d.say('Press Use this plan. It opens in the builder, scored and ready to edit.', 'Tekan Use this plan. Ia dibuka dalam pembina, sudah diberi skor dan sedia disunting.');
    await d.click('#rc-use', 2200);
    await d.say('Next: watch "Objectives that pass SMART".', 'Seterusnya: tonton "Objektif yang lulus SMART".', 2400);
  } },

  'tools': { title: 'The Tools page', ms: 'Halaman Alat', async run(d, page, s) {
    await d.say('Tools has everything besides the lesson plan builder. Open the Tools tab.', 'Alat mengandungi semua selain pembina rancangan pelajaran. Buka tab Alat.');
    await d.click('nav a[href="#/tools"]', 1000);
    await d.say('Say your lesson once: "Use my latest lesson plan". Every tool fills itself in.', 'Sebut pelajaran anda sekali: "Use my latest lesson plan". Setiap alat terisi sendiri.');
    if (await page.locator('#ctx-latest').count()) await d.click('#ctx-latest', 1200); else { await d.click('#ctx-change', 600); await page.selectOption('#ctx-lesson', s.lessonId); await d.wait(800); }
    await d.say('Search by what you need, in English or Malay: "kad imbas" finds the BBM guide.', 'Cari ikut keperluan, dalam BI atau BM: "kad imbas" menjumpai panduan BBM.');
    await d.type('#tools-q', 'kad imbas', 70); await d.wait(800); await page.fill('#tools-q', '');
    await d.say('Classroom games are made from your words, for the projector, even offline.', 'Permainan kelas dibuat daripada perkataan anda, untuk projektor, walaupun luar talian.');
    await d.click('[data-quick="games"]', 1200); await d.click('#g-spin', 4800);
    await d.say('Activity ideas: filter by stage and time, then "Add to my lesson" puts one straight into your plan.', 'Idea aktiviti: tapis ikut peringkat dan masa, kemudian "Add to my lesson" memasukkannya terus ke rancangan.');
    await page.goto(base + '#/tools/ideas'); await d.wait(900);
    await d.click('[data-idea] >> nth=0 >> summary', 1500);
    await d.click('[data-idea] >> nth=0 >> .add-btn', 1500);
    await d.say('The BBM guide shows 25 teaching aids with pictures and how to make them.', 'Panduan BBM menunjukkan 25 BBM dengan gambar dan cara membuatnya.');
    await page.goto(base + '#/tools/bbm'); await d.wait(900);
    await d.click('[data-bbm="spinner"] summary', 2400);
    await d.say('And "Improve with AI" writes a careful prompt for ChatGPT, Gemini or Canva AI, with no pupil names.', 'Dan "Improve with AI" menulis gesaan yang teliti untuk ChatGPT, Gemini atau Canva AI, tanpa nama murid.');
    await page.goto(base + '#/tools/ai'); await d.wait(900); await d.point('.ai-copy'); await d.wait(800);
    await d.say('Next: watch "Teach mode".', 'Seterusnya: tonton "Mod Mengajar".', 2400);
  } },

  'attendance-day': { title: 'Attendance and My day', ms: 'Kehadiran dan Hari Saya', async run(d, page, s) {
    await d.say('Take attendance for any class, on any day. Open the class and press Take attendance.', 'Ambil kehadiran mana-mana kelas, pada bila-bila hari. Buka kelas dan tekan Take attendance.');
    await page.goto(base + `#/classes/${s.classId}`); await d.wait(900);
    await d.click('#cd-attendance', 1200);
    await d.say('Tap A for absent, L for late, or E for excused, and add a reason if you like.', 'Ketik A untuk tidak hadir, L untuk lewat, atau E untuk dikecualikan, dan tambah sebab jika mahu.');
    await d.click('[data-att="Dhia"] [data-mark="A"]', 600);
    await d.type('[data-att="Dhia"] .reason', 'MC', 80);
    await d.click('[data-att="Kavin"] [data-mark="L"]', 700);
    await d.say('Then one tap marks everyone else present. It saves as you go.', 'Kemudian satu ketikan menandakan semua yang lain hadir. Ia disimpan serta-merta.');
    await d.click('#att-all', 1500);
    await d.say('Month shows every day, each pupil\'s rate, and exports to Excel.', 'Bulan menunjukkan setiap hari, kadar setiap murid, dan boleh dieksport ke Excel.');
    await d.click('#att-month', 2000);
    await d.say('Now arrange your day. Open Plan, then My day.', 'Sekarang susun hari anda. Buka Rancang, kemudian Hari Saya.');
    await page.goto(base + '#/plan/day'); await d.wait(1200);
    await d.say('Your periods come from your timetable. Add anything else: a relief class, a meeting, marking.', 'Waktu anda datang daripada jadual. Tambah apa sahaja: kelas ganti, mesyuarat, menanda.');
    await d.point('input[aria-label="Time"]'); await page.fill('input[aria-label="Time"]', '08:20'); await d.wait(400);
    await d.type('#day-add', 'Relief class 5 Cemerlang', 30); await d.click('#day-add-btn', 1200);
    await d.say('Use the arrows or drag to put the day in your order, and tick items off as you go.', 'Guna anak panah atau seret untuk menyusun hari anda, dan tandakan item yang selesai.');
    await d.click('[data-day-item] >> nth=2 >> button[aria-label="Move up"]', 900);
    await d.click('[data-day-item] >> nth=0 >> input[type=checkbox]', 900);
    await d.say('Each period has Plan, Teach and Attendance one tap away. Next: watch "Your yearly plan".', 'Setiap waktu ada Rancang, Ajar dan Kehadiran dengan satu ketikan. Seterusnya: tonton "Rancangan tahunan anda".', 3200);
  } },

  'yearly-plan': { title: 'Your yearly plan', ms: 'Rancangan tahunan anda', async run(d, page, s) {
    await d.say('Your school\'s yearly plan, the RPT, shows what to teach each week. Open Plan, then Yearly plan.', 'Rancangan Pengajaran Tahunan sekolah menunjukkan apa yang diajar setiap minggu. Buka Rancang, kemudian Rancangan tahunan.');
    await page.goto(base + '#/plan/year'); await d.wait(1200);
    await d.say('Upload it as Word, Excel, CSV or PDF. Consilia reads the table on your phone. Nothing is uploaded.', 'Muat naiknya sebagai Word, Excel, CSV atau PDF. Consilia membaca jadual dalam telefon anda. Tiada apa dimuat naik.');
    await d.point('label:has-text("Choose file")');
    await page.setInputFiles('#yp-file', s.rptFile); await page.waitForSelector('#yp-save'); await d.wait(800);
    await d.say('It finds the weeks, dates, topics, Learning Standards, SoW lessons and holidays, in Malay or English.', 'Ia menjumpai minggu, tarikh, topik, Standard Pembelajaran, pelajaran SoW dan cuti, dalam BM atau BI.');
    await d.point('.ok-box'); await d.wait(1200);
    await d.say('Check it, fix anything, and choose the classes that follow it. Then save.', 'Semak, betulkan apa-apa, dan pilih kelas yang mengikutinya. Kemudian simpan.');
    await page.mouse.wheel(0, 500); await d.wait(1000);
    await d.click('#yp-save', 1500);
    await d.say('Yearly shows every week, with this week highlighted.', 'Tahunan menunjukkan setiap minggu, dengan minggu ini diserlahkan.');
    await d.point('table.weeks tr.now'); await d.wait(800);
    await d.say('Monthly shows the weeks as a calendar.', 'Bulanan menunjukkan minggu sebagai kalendar.');
    await d.click('[data-ypview="month"]', 2000);
    await d.say('Weekly shows the topic and SoW lessons, matched to your periods this week.', 'Mingguan menunjukkan topik dan pelajaran SoW, dipadankan dengan waktu anda minggu ini.');
    await d.click('[data-ypview="week"]', 1500);
    await d.point('[data-period-plan] >> nth=0'); await d.wait(900);
    await d.say('"Plan lesson 4" opens New lesson plan with the lesson, class and time already chosen.', '"Plan lesson 4" membuka rancangan baharu dengan pelajaran, kelas dan masa sudah dipilih.');
    await d.click('[data-period-plan] >> nth=0', 2200);
    await d.say('No file? "Build it from the Scheme of Work" lays out the lessons week by week. Next: watch "Classes and PBD".', 'Tiada fail? "Build it from the Scheme of Work" menyusun pelajaran minggu demi minggu. Seterusnya: tonton "Kelas dan PBD".', 3400);
  } },

  'slides': { title: 'Lesson slides', ms: 'Slaid pelajaran',
    async setup(page, s) { // a lesson planned by Consilia, so the slides have full activities (not recorded)
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
      s.slidesLesson = page.url().split('/').slice(-2)[0];
      await page.goto(base + '#/today'); await page.waitForTimeout(600);
    },
    async run(d, page, s) {
    await page.goto(base + `#/plan/edit/${s.slidesLesson}/materials`); await d.wait(900);
    await d.say('Any lesson plan can become slides for the projector. In Materials, tap Make lesson slides.', 'Mana-mana rancangan pelajaran boleh menjadi slaid untuk projektor. Dalam Materials, tekan Make lesson slides.');
    await d.click('#mt-slides', 1200);
    await d.say('Choose a look. You can change it later.', 'Pilih rupa. Anda boleh menukarnya kemudian.');
    await d.click('[data-make="bright"]', 1500);
    await d.say('Consilia makes the whole deck from your plan: goals, key words, the target sentence, every activity, questions and an exit ticket.', 'Consilia membuat seluruh slaid daripada rancangan anda: matlamat, perkataan utama, ayat sasaran, setiap aktiviti, soalan dan tiket keluar.', 3600);
    await d.point('[data-thumb="3"]'); await page.mouse.wheel(0, 400); await d.wait(900); await page.mouse.wheel(0, -400); await d.wait(400);
    await d.say('Tap a slide to change its words. Your teacher notes go with every slide.', 'Ketik slaid untuk menukar perkataannya. Nota guru anda ada pada setiap slaid.');
    await d.click('[data-thumb="5"]', 900);
    await d.point('#sl-notes'); await d.wait(1200);
    await d.say('Press Present. Use the arrow keys or a clicker. A question shows its answer on the next press.', 'Tekan Present. Gunakan kekunci anak panah atau klik. Soalan menunjukkan jawapannya pada tekanan seterusnya.');
    await d.click('[data-thumb="0"]', 500);
    await d.click('#sl-present', 1500);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await d.wait(1300); }
    const q = await page.locator('.show [data-slide-jump] option').evaluateAll((os) => os.findIndex((o) => o.textContent.includes('Quick check')));
    if (q > 0) { await page.selectOption('.show [data-slide-jump]', String(q)); await d.wait(1500); await page.keyboard.press('ArrowRight'); await d.wait(1800); }
    await page.keyboard.press('Escape'); await d.wait(700);
    await d.say('In Teach mode, the Slides tool opens them at the stage you are teaching.', 'Dalam Mod Mengajar, alat Slides membukanya pada peringkat yang sedang anda ajar.');
    await d.say('Download PowerPoint to open it in PowerPoint, or import it into Canva or Google Slides to add pictures.', 'Muat turun PowerPoint untuk membukanya dalam PowerPoint, atau import ke Canva atau Google Slides untuk menambah gambar.', 3200);
    await Promise.all([page.waitForEvent('download'), d.click('#sl-pptx', 1200)]);
    await d.click('details.help summary', 1800);
    await d.say('Want a reading text, a dialogue or more questions? Copy the prompt to any AI, or connect Claude in Me, AI assistant, with your own key.', 'Mahu teks bacaan, dialog atau lebih banyak soalan? Salin gesaan ke mana-mana AI, atau sambungkan Claude dalam Saya, AI assistant, dengan kunci anda sendiri.', 3800);
    await d.point('.aibox'); await d.wait(1200);
    await d.say('AI slides are marked AI, so you check them before class. Next: watch "Classes and PBD".', 'Slaid AI ditanda AI, supaya anda menyemaknya sebelum kelas. Seterusnya: tonton "Kelas dan PBD".', 3000);
  } },

  'backup': { title: 'Back up and restore', ms: 'Sandaran dan pemulihan', async run(d, page, s) {
    await page.goto(base + '#/today'); await d.wait(900);
    await d.say('Everything lives on your device, so keep a backup. Today reminds you every week.', 'Semuanya disimpan dalam peranti anda, jadi simpan sandaran. Hari Ini mengingatkan anda setiap minggu.');
    await d.point('.nudges'); await d.wait(600);
    await d.click('.nudges a:has-text("Back up")', 1200);
    await d.say('Press Back up now. One file holds your lessons, classes, pupils, PBD and settings.', 'Tekan Back up now. Satu fail menyimpan pelajaran, kelas, murid, PBD dan tetapan anda.');
    const [dl] = await Promise.all([page.waitForEvent('download'), d.click('#bk-save', 1200)]);
    const file = path.join(os.tmpdir(), dl.suggestedFilename()); await dl.saveAs(file);
    await d.say('Save it to Google Drive, WhatsApp it to yourself, or keep it on your laptop.', 'Simpan dalam Google Drive, hantar ke WhatsApp sendiri, atau simpan dalam komputer riba.');
    await d.say('Now imagine the lesson was lost.', 'Sekarang bayangkan pelajaran itu hilang.', 1800);
    await page.goto(base + '#/plan'); await d.wait(900);
    await d.click('button:text-is("Delete…") >> nth=0', 700); await d.click('button.btn-outline.del >> nth=0', 1200);
    await d.say('On any device, open Me, Backup, Restore from a file and choose the backup.', 'Pada mana-mana peranti, buka Saya, Backup, Restore from a file dan pilih fail sandaran.');
    await page.goto(base + '#/me'); await d.wait(900);
    await d.point('label:has-text("Restore from a file")');
    await page.setInputFiles('#bk-file', file); await d.wait(1200);
    await d.say('Add to what is here keeps this device\'s work. Replace everything makes it match the backup.', 'Add to what is here mengekalkan kerja dalam peranti ini. Replace everything menjadikannya sama seperti sandaran.', 3400);
    await d.click('#bk-merge', 1500);
    await page.goto(base + '#/plan'); await d.wait(1200);
    await d.say('The lesson is back. Textbook PDFs are not in backups, so add them again on a new phone.', 'Pelajaran itu kembali. PDF buku teks tiada dalam sandaran, jadi tambah semula pada telefon baharu.', 3400);
    await d.say('That\'s all. Find more in the manual under Me, Help.', 'Itu sahaja. Lebih banyak dalam manual di Saya, Bantuan.', 2600);
    fs.rmSync(file, { force: true });
  } }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  const s = await seed(browser);
  s.rptFile = await makeRpt();
  for (const [id, v] of Object.entries(VIDEOS)) {
    if (only.length && !only.includes(id)) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consilia-rec-'));
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, storageState: s.state, recordVideo: { dir, size: { width: W, height: H } }, acceptDownloads: true });
    await ctx.addInitScript(prep);
    const page = await ctx.newPage();
    if (v.setup) await v.setup(page, s); // trimmed from the video
    const t0 = Date.now();
    await page.goto(base + '#/today');
    await page.waitForSelector('nav');
    await page.evaluate(() => document.fonts.ready);
    const d = director(page, t0);
    const startAt = d.now();
    await d.card(v.title, v.ms);
    try { await v.run(d, page, s); } catch (e) { console.error(`${id}: ${e.message.split('\n')[0]}`); await page.screenshot({ path: path.join(os.tmpdir(), `rec-fail-${id}.png`) }); }
    d.hush();
    await d.wait(600);
    const endAt = d.now();
    const raw = await page.video().path();
    await ctx.close();
    const mp4 = path.join(OUT, `${id}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(startAt), '-i', raw, '-t', String(endAt - startAt), '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-tune', 'stillimage', '-movflags', '+faststart', '-an', mp4]);
    for (const lang of ['en', 'ms']) fs.writeFileSync(path.join(OUT, `${id}.${lang}.vtt`), vtt(d.cues, lang, startAt, endAt));
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`${id}: ${(endAt - startAt).toFixed(0)} s, ${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB, ${d.cues.length} captions`);
  }
  await browser.close();
})();
