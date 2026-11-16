# Changelog

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
