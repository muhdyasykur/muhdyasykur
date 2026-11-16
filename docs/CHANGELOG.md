# Changelog

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
