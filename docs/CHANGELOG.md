# Changelog

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
