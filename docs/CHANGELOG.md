# Changelog

## 1.0.0-beta.8 · 18 November 2026 (a new look, and AI tools that know the KSSR lesson)

**New look**
- One design language merged from the travel designs the teacher chose: navy and gold kept, with royal blue for
  actions, teal widgets, coral handwritten accents (Caveat Brush, SIL Open Font License), sky gradients on a warm cream
  page, rounder cards, pill buttons and softer shadows, in light and dark.
- Original illustrations drawn for Consilia: a learning journey rising out of an open book on Today and Tools, and a
  scene for each group of tools; clay icon tiles; a paper-plane trail beside section titles.
- On a laptop, a rail of rounded tiles with a gold **Create** button and **Search**. On a phone, a top bar with search
  and a tab bar with a raised round Create button. **Create** opens the ten things teachers start most often.
  **Search** (Ctrl+K or /) finds tools, your lesson plans and classes, every Scheme of Work lesson (Years 1 to 6) and
  the manual.
- **Today** is a dashboard: your next lesson as a featured card, today's periods, the week as a route with five stops,
  what is coming up, a to-do list and your tools. **Tools** opens with a Quick start that opens the right tool already
  filled in, top picks, the full gallery and real numbers (36 tools, 1,489 Scheme of Work lessons). Plan, Classes,
  Library and Me have new headers.
- The guided tour has a step for Create and Search, and the manual's "Find your way around" describes them (English
  and Malay).

**Smarter AI tools**
- **Base it on a KSSR lesson.** In 18 of the 24 AI tools, choose a lesson from the Scheme of Work under Year. The form
  fills itself from the lesson, and the request carries that lesson's real learning standards (codes and wording),
  theme, language focus, textbook pages and the Scheme of Work's own steps, so the answer follows your RPT instead of
  guessing. A tool opened for a lesson plan that follows the Scheme of Work is based on the same lesson already. A
  lesson plan written this way opens in the builder with that lesson's exact standards, theme and topic.
- **An expert brief on every request** (Claude and Gemini): an IPG lecturer's knowledge of KSSR (Semakan 2017), CEFR
  levels by year, the SoW textbooks, PBD (TP1 to TP6), KBAT and the cross-curricular elements, practical for large
  mixed-ability classes, and never inventing standard codes, page numbers or facts.
- **Language pitched at the year**: anything pupils read or hear is written to that year's CEFR level (for example
  Pre-A1 for Year 1: sentences of 3 to 6 words; A2 for Year 6: up to 14 words, with linking words).
- **A quality check on every result**, with or without an AI key: the sections asked for; the numbers (8 questions,
  5 hooks, 12 to 16 phonics words, stages that add up to the lesson's minutes, TP1 to TP6, 3 criteria); measurable
  objectives and "I can" success criteria; learning standards that really exist for the year, or match the Scheme of
  Work lesson; answers and options in quizzes; the spelling pattern in every phonics word; text and story lengths;
  sentences short enough for the year; British spelling; blanks such as [Your name] to fill in. **Fix it** on one
  problem, or **Fix all**, sends the fix and gives a new version; without a key the fix is copied as a prompt.
- Claude takes a little more care over Studio results (medium effort instead of low).

**Fixed**
- Esc closes a panel (Create, Search and the others) even when focus is not inside it, for example right after it
  opens or after a click on blank space in it.
- An AI tool or My creations that cannot be downloaded (offline before Consilia was saved for offline use, or after
  an update) shows a message with Reload instead of a blank area. The lesson plan builder says when the Scheme of Work
  cannot be loaded, and other screens no longer leave such a failure unhandled.
- Firefox reported a blocked script each time the Claude assistant loaded: Zod, used by Anthropic's SDK, tests
  whether `eval` works, and Consilia's Content-Security-Policy blocks it. Zod now runs without that test.

**Testing**
- A new browser suite, `e2e:ai`: all 24 AI tools generate a realistic answer that renders and passes its quality check;
  a lesson plan based on Scheme of Work lesson 2 sends its real standards and textbook pages and opens in the builder
  with them; Fix it and Fix all; the copy-and-paste route; Malay; a phone.
- A new browser suite, `e2e:shell`: the Create panel (laptop and phone, Esc even after a click on blank space),
  Search (Ctrl+K and /, tools, lesson plans, classes, the Scheme of Work, the manual, Enter and Esc), the Tools Quick
  start and the Today dashboard.
- WebKit: the Studio suite never reached its stand-in for Anthropic. WebKit sends requests from a page with a service
  worker through the worker, out of reach of Playwright's interception, so they went to the real API, which refused
  the test key. The suites that stand in for Anthropic now block the service worker, as Playwright advises. The stand-in
  also answers the CORS preflight as the real API does, and the Recently used check no longer depends on timing.

## 1.0.0-beta.7 · 18 November 2026 (milestone 11: Studio, the textbook in the lesson plan)

**New**
- **Studio: 24 AI tools in Tools**, each a simple form with one button and a result you can work with. Plan: Lesson
  plan writer, Lesson hooks, Real-life connections, Activity designer. Create materials: Reading and listening texts,
  Text leveller, Vocabulary builder, Role-play and dialogue, Phonics pack, Grammar explainer. Assess: Quiz maker,
  Questions at every level (KBAT marked), PBD rubric (TP1 to TP6), Exit tickets, Writing feedback. Support every
  pupil: Sentence frames and word banks, Help for one pupil. Fun and creative: Song and rhyme writer, Choose-your-path
  story, Riddles and jokes. Write for me: Message to parents (Malay, English or both), Lesson reflection (What? So what?
  Now what?, Gibbs, Kolb), Professional email, Ask the teaching assistant. Every prompt is written for Malaysian
  primary English (KSSR, CEFR, the year you choose, Malaysian names and settings).
- **With Claude connected the answer appears as it is written**, with a Stop button. Without a key, the button copies
  the prompt for Claude.ai, ChatGPT, Gemini or Copilot, and the answer is pasted back into the same tidy view.
- **Change it in one tap** ("Make it simpler", "Add Malay meanings for the key words", "Make the questions harder" …)
  or in your own words. Every change is a new version you can go back to; you can also edit by hand.
- **Use the result**: copy with headings and tables kept (Word, Google Docs, WhatsApp), print, Word file, read aloud,
  show it large on the projector, play a quiz or riddles as a **Quiz show**, put vocabulary or phonics words on the
  **spin wheel**, add it to the lesson plan's appendix, or open a written lesson plan in the **lesson plan builder** as
  a real Consilia lesson plan (PPP stages, objectives, success criteria; only learning standards that exist in KSSR
  are kept).
- **My creations** keeps every result with all its versions, on the device and in backups (database version 4).
- **The Tools gallery** now has seven groups, search in English or Malay, favourites (the star), recently used tools,
  and AI, Offline and New labels.
- **Pupils' names stay on the device**: before a Studio request is sent, the text is checked against your class
  lists, and Consilia offers to replace any name with "the pupil".
- **The textbook is part of the lesson plan.** Materials has a Textbook section: the book and pages for the lesson,
  filled in from the Scheme of Work, which you can change (add a page or a range, remove one). They are printed on
  both lesson plan layouts and in the Word file ("Textbook: Get Smart Plus 4 · Student's Book p. 56–57") and open in
  Teach mode. With the book on your Textbook Shelf you can also print pictures of the pages after the plan, and they
  go into the Word file too (up to 8 pages, drawn on the device from your own copy).
- **"Teaching aids" instead of "BBM"** in the English interface (the tool, the builder and Consilia Recommends). The
  Malay interface keeps BBM; searching for "BBM" still finds the tool.

**Fixed**
- The developer photo on About had a yellow-green fringe along the cheeks, jaw and ears (left by the background
  edit). The colour of those edge pixels was rebuilt from the skin and background around them; brightness and detail
  are unchanged.

## 1.0.0-beta.6 · 17 November 2026 (audit stage 1, Bahasa Melayu, design system and icons)

**Fixed**
- Before 8 am in Malaysia, new lesson plans, PBD records, mentor notes, attendance and Teach mode attendance used
  yesterday's date, and attendance's next/previous day buttons got stuck or skipped a day (dates were taken in UTC).
- Keyboard: dialogs keep focus inside and give it back when closed; after moving to another screen, focus lands on
  its heading and the browser tab shows the screen's name.
- A screen that fails to draw shows a recovery panel (try again, reload, go to Today, back up my data) instead of a
  blank page.
- Full screen on phones without it (iPhone): the game or slides fill the window, with a note and an exit button.
- When Consilia updates in another tab, this tab asks to reload instead of failing on the next save.

**New**
- **The whole interface in Bahasa Melayu**: every screen, message, the alignment checker, the BBM guide, digital
  tools, classroom management, the Consilia Recommends explanations and the 46-article manual. Dates and day names
  follow the language. What pupils see and the lesson itself stay in English: lesson plans, slides, worksheets,
  projector games and Teach-mode pupil text. The Malay text loads only when chosen.

**Design system**
- One set of shared pieces instead of each screen drawing its own: empty states (`EmptyState`), modal panels
  (`Sheet`), messages (`notify` and one `Toaster`), and common layout and text classes. 139 repeated style rules were
  removed. Team, timing-stage and wheel colours come from one palette, so groups, points and games always match.
  Every colour is a theme token (no hard-coded fallbacks). See `docs/design-system.md`.
- **One icon family.** 34 new line icons drawn for Consilia (47 in all) replace the emoji that served as icons in
  menus, buttons, tool cards, the Teach mode tool bar, Today's shortcuts and headings. They look the same on every
  phone (emoji differ between Android, iPhone and Windows), follow light and dark themes, and match the navigation bar.
  Emoji stay where pupils see them (slides, printed sheets), for the 🌱 🌿 🌳 levels (so the screen matches printed
  tiered worksheets), and as the feeling choices in the Feedback Garden.

**Quality**
- Every browser suite, the accessibility audit and the speed budget now run automatically on each push, in Malaysian
  time; the main journeys also run on Safari's engine (WebKit) and Firefox.
- A test fails if any interface text lacks a Malay translation; data saved by older versions is tested to open.

## 1.0.0-beta.5 · 17 November 2026 (milestone 10: lesson slides and Claude)

**New**
- **Lesson slides.** Any lesson plan becomes a full slide deck for the projector, made on the device and offline:
  topic, "I can" goals, warm-up, key words, the target sentence with examples, one slide per activity (pupil steps,
  pairs or groups, minutes), quick-check questions with answers, a thumbs check, an exit ticket and a closing slide.
  Teacher notes go with every slide; steps written only for the teacher stay in the notes. Three looks. Edit, move,
  duplicate, delete and add slides; the deck is saved with the lesson plan and in backups. Open it from Materials,
  Review, the Plan list or Tools → Lesson slides.
- **Present** full screen with the arrow keys, Space or a presentation clicker (a question shows its answer on the
  next press), F for full screen, N for notes. The 🖼 Slides tool in Teach mode opens at the stage being taught.
- **PowerPoint (.pptx)** download, offline, with speaker notes and an answer slide after each question. Opens in
  PowerPoint, and imports into **Canva** (Create a design → Import file) and **Google Slides**. On a phone it can be sent
  straight to the Canva or Google Slides app.
- **Add more with AI** on the slides: a reading or listening text, a dialogue, questions, word meanings or more
  examples at the pupils' level, placed in the right part of the deck and marked AI. Copy the prompt to any AI chat and
  paste the answer back (Claude.ai is now one of the chat buttons), or:
- **AI assistant: Claude (optional)**, Me → AI assistant: the teacher's own Anthropic API key, called from the device
  with Anthropic's official SDK. Claude Opus 5.5 by default (Sonnet 5.5 or Haiku 5.5 can be chosen), light thinking for
  quick answers, slide content as structured JSON, and Anthropic's automatic fallback model if Claude declines a
  request. **Gemini** (Google, free tier) is the alternative; each keeps its own key. Off by default; turned on only
  with a key and three agreements (what is sent, the company's terms and charges, checking AI answers). "Add with
  Claude" on the slides and "ask Claude here" in the AI prompt builder and Improve with AI. Only lesson content is sent (year, topic, theme, skill, key words, sentence, objectives), never pupils'
  names, class names, marks or the teacher's details, and the teacher can see exactly what is sent. Keys stay in this
  browser only (not in backups or shared lessons) and can be removed in one tap. Plain messages for a wrong key, no
  credit left, a used-up free limit, no internet and a declined request.
- New video: Lesson slides (11 videos).

**Changed**
- Terms of use version 2 (a clause on the AI assistant): teachers are asked to agree again. Privacy page explains the
  AI assistant and slide files. Manual: Lesson slides and AI assistant articles (46 articles). Tools has 12 tools.
- Shared .consilia lessons no longer carry the class name (in the header or on slides), as the privacy page says.
- Security: the Content-Security-Policy allows two more addresses, Anthropic's and Google's APIs, used only when the
  AI assistant is on. New dependencies: `@anthropic-ai/sdk` and `zod` (loaded only when Claude is used), `pptxgenjs`.

## 1.0.0-beta.4 · 17 November 2026 (milestone 9: plans, attendance, my day)

**New**
- **Yearly plan (RPT)**: upload the school's yearly plan as Word, Excel, CSV or PDF (with text). Consilia reads the table
  on the device into weeks, dates, themes and topics, Learning Standards, SoW lesson numbers and holiday or exam weeks,
  with Malay or English headers and dates. Check and correct it, link the classes that follow it, and save. Or build
  one from the Scheme of Work (lessons per week, holiday weeks skipped). Views: Yearly (this week highlighted),
  Monthly (calendar) and Weekly (topic, standards and SoW lessons matched to the week's timetable periods; "Plan lesson
  N" opens New lesson plan with the lesson, class and time chosen). Excel export.
- **My day**: the day's timetable periods and lesson plans with the teacher's own items (relief class, meeting,
  marking), arranged by drag or ↑ ↓, ticked off, with notes; Plan, ▶ Teach and ✓ Attendance from each item; what the
  yearly plan says for the week.
- **Attendance** for any class and day: present, late, absent or excused with a reason, "Everyone else present",
  month view with each pupil's rate, Excel export and a copyable summary. Teach mode adds its absences to the register
  without changing the teacher's marks.
- Plan has four tabs (Lessons, My day, This week, Yearly plan); Today has shortcuts to them.
- **Ten tutorial videos**, re-recorded on the current app with English and Malay captions, including four new ones:
  Let Consilia plan a lesson, The Tools page, Attendance and My day, Your yearly plan.

**Changed**
- The English screens say "lesson plan" instead of "RPH" (the Malay screens keep RPH). Word files are named
  `LessonPlan-…docx`.
- Manual: new articles on attendance, My day and yearly plans (44 articles).

## 1.0.0-beta.3 · 17 November 2026 (easier tools)

- **Say the lesson once.** A lesson bar at the top of every tool (and on the Tools page) holds the year, skill, topic,
  key words and target sentence. Fill it with one tap from your latest RPH, choose any RPH, type it, or "Try an
  example". Every tool fills itself in; the separate year, topic and word boxes are gone.
- **"Add to my lesson"**: put an activity idea into a chosen stage, save an objective as the main or complementary
  objective, or add a chant to the appendices, straight from the tool.
- **Tools for this step** in the RPH builder (Objectives, Lesson flow, Materials, Plan B, Review) open the right tools
  already filled with that lesson.
- Objective writer shows a SMART objective at once; "Improve my lesson plan" fills in the whole RPH by itself.
- Tools page: quick actions for the current lesson, and search by need in English or Malay ("kad imbas", "noisy class").
- Projector games: keyboard and presentation-clicker shortcuts (Space, →).
- Consilia recommends: every question is marked optional; "Use this plan" stays in reach while scrolling; the tools
  switch to the planned lesson automatically. RPHs now keep a target sentence (Materials step) for the tools.
- Fixed: an update loop in the Objective writer.

## 1.0.0-beta.2 · 17 November 2026 (milestone 8: Consilia Recommends and Tools)

**New**
- **Consilia recommends**, a fourth way to start an RPH (also "Let Consilia plan it" on Today). The teacher answers a
  few questions about the class (ability, shy or energetic pupils, weak readers, large class, special needs, projector,
  speakers, internet, devices), the lesson (key words, target sentence) and today's goals (speaking time, fun, calm,
  creativity, assessment, observation, technology) and preparation time. Consilia plans the whole lesson on the device:
  framework with its reason, one or two activities per stage with a step-by-step teacher script, Low / Moderate / High
  versions, teaching aids with pictures and making steps, a digital option that suits the classroom, SMART objectives,
  assessment, 21st-century skills and Plan B. A planning log explains every decision. "Another idea" swaps one stage;
  the preparation checklist keeps within the teacher's time. Every one of the 927 SoW lessons (SK, Years 1–6) with standards plans
  into an RPH scoring 96–100 on the checker. Answers are remembered per class.
- **Tools** tab with 11 tools: Consilia recommends, Activity ideas (86 activities, 16 new signature activities such as
  Fly-swatter slap, Escape envelopes, Living sentences, Running dictation, News reporter, QR stations), Objective
  writer, Differentiation helper, BBM guide (25 teaching aids with original pictures, materials, making steps, use in
  class, cost and safety), Worksheet maker, Chant maker, AI prompt builder, Classroom games, Digital tools and
  Classroom management.
- **Classroom games** for the projector, offline, from the teacher's words: Spin wheel, Unjumble, Mystery word and
  Quiz show with team scores, full screen. Also in Teach mode as the 🎮 Games tool, filled with the lesson's words.
- **Improve with AI**: Consilia writes prompts at the pupils' level (Year and CEFR) and opens ChatGPT, Gemini,
  Copilot or Canva AI. Nothing is sent by Consilia itself; prompts never contain pupils' names.
- **Terms of use** in English and Bahasa Melayu, agreed before first use (three ticks), readable again in Me.

**Changed**
- Privacy page explains the AI prompt buttons. Manual has a new chapter (41 articles). Guided tour has 9 steps.

**Fixed**
- On phones, six navigation tabs now fit on one row (found by the browser tests).

## 1.0.0-beta.1 · 16 November 2026 (milestone 7: QA, videos and pilot)

Ready for the two-week pilot with trainee teachers (see `pilot.md`).

**New**
- Privacy page in English and Bahasa Melayu (Me → Privacy).
- Searchable user manual in Help: 35 articles in 7 chapters, with highlighted results.
- Six captioned video tutorials (English and BM captions): first RPH, objectives, Teach mode, classes and PBD,
  print and Word, backup. Downloaded when first played, then available offline.
- Text recognition for scanned textbooks: Make searchable on the Textbook Shelf reads each page on the device,
  in the background, with pause and continue. Works offline after the first use.
- A plain-language message with a next step for any unexpected error, including a full device.
- Offline notice on the links to Canva, Wordwall and other tools.

**Fixed**
- Textbooks could not be added or opened offline (the PDF reader's worker was not stored for offline use).
- Text contrast: gold labels and grey hints now meet WCAG AA (4.5:1) in light mode.
- The SoW lesson list in New RPH was announced wrongly by screen readers.
- Checkboxes are larger and easier to tap on phones.

**Security and quality**
- Strict Content-Security-Policy: scripts only from the app itself; the only outside address is the feedback form.
- Excel export library upgraded (write-excel-file 4); no known vulnerabilities in the app's dependencies.
- New automated checks: accessibility audit of 31 screens in both themes, load-time budget on a slow phone,
  fault injection (damaged files, newer backups, a full device), offline video and text recognition.
  Results are in `test-plan.md`.

## 0.6.0 · milestone 6: brand experience

Opening animation (once a day, skippable), three original R&B instrumentals made in code, 8-step guided tour,
About page with the developer's story, Feedback Garden linked to Jotform with an offline queue, backup and restore
with a weekly reminder, confetti for a first 100 score.

## Milestone 5: textbooks, materials and library

Textbook Shelf (your own PDFs, stored only on the device), page maps for the KPM textbooks, search by page, unit or
word, projector tools in the viewer; materials studio (flashcards, worksheets, strips, exit tickets, tiered sheets,
rubric); ready-made tool links and a Canva AI prompt; activity bank (about 70); Method Guide; search everything;
guided reflection; mentor feedback with patterns; share and import lessons as .consilia files; QR codes.

## Milestone 4: teaching and PBD

Teach mode (stage clock, pacing coach, resume after reload, hold to exit), classroom toolkit (name picker, groups,
noise light, points, attention signal, timer), attendance, PBD recording TP1–TP6 with descriptors, heatmap,
suggested levels and groups, Excel export, PIN lock that encrypts pupil names.

## Milestone 3: checking and export

Alignment checker (29 rules) with a score and "Fix it" links, mark as fine with a reason, Plan B suggestions,
Word export in both layouts, weekly planner and timetable, Today dashboard, copy a lesson to another class.

## Milestone 2: RPH builder

Onboarding, classes and pupils, the 7-step builder with three starting modes, PPP / PWP / Process Writing /
TBLT / Language Arts frameworks with recommendations, ABCD objectives with live SMART checks, low-moderate-high
tiers, timing, and print in the school template and the Consilia Lesson Blueprint.

## Milestones 0 and 1: foundations and curriculum

Installable offline app shell, light and dark themes, English and Bahasa Melayu, on-device database; the KSSR 2017
curriculum pack for Years 1–6 (SK and SJK): 1,489 SoW lessons, phonics, Learning Standards and TP descriptors.
