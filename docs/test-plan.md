# Consilia test plan and results

Version tested: **1.0.0-beta.4** · 17 November 2026 · Chromium (Playwright 1.63) on Linux, against the production build
(`vite preview`). Commands are run from `app/`; see the README.

## Summary

| Area | Method | Pass criterion | Result |
|---|---|---|---|
| Type safety | `npm run check` (svelte-check, 569 files) | 0 errors, 0 warnings | ✅ 0 / 0 |
| Rules and logic | `npm test` (Vitest): objectives, alignment checker, frameworks, Plan B, PBD, timetable, backup, sharing, feedback, music, manual search, OCR clean-up, error messages, the Recommends engine (every SoW lesson planned and checked), attendance register, My day, yearly plan extraction (Malay/English dates, holidays, a real .docx) | All pass | ✅ 127 tests in 30 files |
| Curriculum data | `npm run validate:curriculum` | Every SoW reference resolves | ✅ 1,489 lessons, all valid |
| Core journeys | 8 browser suites, 246 checks (below) | All pass, no console errors | ✅ 246 / 246 |
| Accessibility | `npm run a11y`: axe-core WCAG 2.1 A/AA on 47 screens × light and dark | 0 critical or serious issues | ✅ 0 issues (after fixes, see below) |
| Tap targets | Same script, 390 × 844 phone | Every control ≥ 44 px (or its label) | ✅ none smaller |
| Text size | Same script, root font at 200% on a phone | No horizontal scrolling | ✅ none |
| Reduced motion | `e2e:m7` with `prefers-reduced-motion: reduce` | No splash, no confetti | ✅ |
| Performance | `npm run perf`: emulated phone, 4× slower CPU, fast 3G (1.6 Mbps, 150 ms) | First visit usable < 6 s; repeat < 2.5 s | ✅ 2.1 s (259 KB), repeat 0.3 s (0 KB) |
| Offline | `smoke`, `e2e:m5`, `e2e:m7` with the network switched off | Every core feature works offline | ✅ incl. textbooks, saved videos (with seeking) and text recognition |
| Security: CSP | Built `index.html` carries a strict policy; all suites run with it enforced | No blocked resources in any journey | ✅ |
| Security: escaping | Code review: Svelte escapes all text; the only raw HTML is the QR code SVG made by the `qrcode` library from a URL | No user text rendered as HTML | ✅ |
| Security: imports | Unit tests + `e2e:m7`: damaged backup, newer-version backup, damaged .consilia | Refused with a plain message, nothing changed | ✅ |
| Security: encryption | `e2e:teach`: PIN set → names stored as `enc:v1:…`; wrong PIN refused; right PIN restores names | Round trip works | ✅ |
| Dependencies | `npm audit --omit=dev` | No known vulnerabilities in shipped code | ✅ 0 |
| Error handling | `e2e:m7` fault injection: every database write fails (full device) | Plain message + next step, no data loss, form stays open | ✅ |
| Privacy | `e2e:m7` checks text recognition loads nothing from other sites; Feedback Garden posts only the listed fields (`e2e:m6`) | Nothing else leaves the device | ✅ |

## Browser suites

| Suite | Checks | Covers |
|---|---|---|
| `smoke` | 18 | On a phone and a laptop: Today, Library lesson detail and performance levels, no sideways scroll, Bahasa Melayu, dark theme, reload offline, curriculum offline |
| `e2e` | 42 | Onboarding, class with pasted names, a full RPH from scratch (standards, ABCD/SMART objectives, PPP, tiers, timing errors, materials, Plan B, autosave), checker to 100, mark as fine, both print layouts, Word downloads, weekly planner |
| `e2e:teach` | 26 | Teach mode (attendance, clock, overrun and pacing coach, resume after reload), toolkit (name picker, groups with keep-apart, points, noise light without microphone, timer), PBD grid, heatmap, Excel export, PIN lock |
| `e2e:m5` | 31 | Textbook Shelf with real PDFs (recognised editions, calibration, private file storage), search, viewer and projector tools, materials studio, activity bank, Canva AI prompt, sharing and import, reflection, mentor notes |
| `e2e:m6` | 23 | Terms of use gate (EN/BM, three ticks, remembered), splash once a day, 9-step tour, Help replay, About, Feedback Garden online and offline queue, music start and pause in Teach mode, backup and restore |
| `e2e:m7` | 26 | Privacy page EN/BM, manual search and links, six videos (length, EN/BM captions, saved for offline, byte ranges offline, unsaved video offline message), text recognition of a scanned PDF (online, then offline), fault injection, offline tool notice, reduced motion |

| `e2e:m9` | 29 | "Lesson plan" wording; attendance (marks, reasons, everyone else present, saved, month view, Excel, Teach mode keeps the teacher's marks); My day (periods in time order, own items, reorder, ticks kept, Plan/Attendance per period); yearly plans from Word, Excel and CSV, old .doc message, build from SoW with holiday weeks; yearly, monthly and weekly views; periods matched to SoW lessons opening New lesson plan with lesson, class and time; phone layouts |
| `e2e:m8` | 51 | Lesson bar shared by all tools (latest RPH, choose an RPH, Try an example), Add to my lesson (activity, objective, chant), Tools for this step in the builder, search by need and Malay words, game keyboard shortcuts, "Improve my lesson plan" filled from the RPH; Consilia Recommends (class questions, planning log, scripts with the teacher's words, 100 score, teaching aid making steps, Another idea on one stage only, preparation checklist, AI prompt without pupil names, saved RPH, class answers remembered, offline-only suggestions without internet), Tools hub, all 11 tools, four projector games, Games in Teach mode, terms page, phone layouts |

## Found and fixed during M8 testing

- The Objective writer's live suggestion re-ran itself in a loop (Svelte effect read and wrote the same state); found by the browser test's page-error check.
- RPHs did not keep a target sentence, so the tools lost it when switching lessons; RPHs now store it.

- With six navigation tabs, the phone tab bar wrapped onto two rows and covered buttons. Fixed to one row of six.
- The BBM guide has 25 teaching aids, not 24 as first written.

## Found and fixed during M7 testing

1. **Textbooks did not work offline.** The PDF reader's worker (`.mjs`) was not in the offline cache, so adding or
   opening a textbook without signal failed. Fixed by caching `.mjs` files; covered by `e2e:m7`.
2. **Contrast (serious, 19 screens).** Gold eyebrow labels (2.98:1) and grey hints (4.26:1) were below 4.5:1 in light
   mode. New values: gold text `#86660F` (5.0:1), grey `#5E6980` (5.15:1).
3. **Screen readers (critical).** The SoW lesson picker put `<li>` between the list box and its options. Fixed with
   `role="none"` on the list items.
4. **Missing label (critical).** The Canva AI prompt box had no accessible name. Added.
5. **Small checkboxes.** 13 px checkboxes on the Lesson flow and Review steps. Now 20 px inside full-size labels.
6. **Unexpected errors were silent.** A failed save outside the RPH builder (for example a full device while adding a
   class) showed nothing. A global handler now shows a plain message and a next step.
7. **Dependency advisories.** `write-excel-file` 2 pulled in `archiver` (6 moderate advisories, Node-only code).
   Upgraded to version 4, which removes it; Excel export re-tested and opened in openpyxl.

## Known limitations and accepted risks

| Item | Why | Plan |
|---|---|---|
| Real devices (iPhone Safari, Samsung Internet) not tested | Automated tests run in Chromium only | Pilot: at least 3 iPhones and 3 Samsung phones (`pilot.md`) |
| Screen-reader passes (TalkBack, VoiceOver) | Need a person and a device | Pilot volunteer with TalkBack; axe covers structure and names |
| Word file in Google Docs and WPS | Checked in code and by unzipping, not in each app | Pilot day 2–3 |
| Text recognition speed on phones | 1.5–3.5 s per page on a laptop; phones are slower | Pilot: ask how long a whole book took |
| Dev-only advisories in `vitest` 3 (test runner) | Upgrading to vitest 4 hits an npm 10 bug (`edgesOut`) when resolving its optional peers | Not shipped to users; upgrade when npm is fixed |
| `style-src 'unsafe-inline'` in the CSP | Svelte sets inline `style` attributes | Scripts stay strict; no user text becomes style |
| No `frame-ancestors` | GitHub Pages cannot send HTTP headers and the meta tag cannot set it | Low risk: data is per-origin and every destructive action asks to confirm |
| A "Follow the SoW" lesson starts around 69/100 | SoW outlines describe the teacher's steps, not what pupils do; the trainee adds that | Pilot: check whether the starting score discourages |
