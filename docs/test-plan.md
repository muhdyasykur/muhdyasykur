# Consilia test plan and results

Version tested: **1.0.0-beta.8** · 18 November 2026 · Chromium, WebKit and Firefox in CI (Playwright 1.63) on Linux, against the production build
(`vite preview`). Commands are run from `app/`; see the README.

## Summary

| Area | Method | Pass criterion | Result |
|---|---|---|---|
| Type safety | `npm run check` (svelte-check, 1,005 files) | 0 errors, 0 warnings | ✅ 0 / 0 |
| Rules and logic | `npm test` (Vitest): objectives, alignment checker, frameworks, Plan B, PBD, timetable, backup, sharing, feedback, music, manual search, OCR clean-up, error messages, the Recommends engine (every SoW lesson planned and checked), attendance register, My day, yearly plan extraction (Malay/English dates, holidays, a real .docx), lesson slides and PowerPoint (opened and checked), AI assistant (Claude: Opus 5.5 by default, request shape, JSON schema, fallback, key only in a header, plain errors; Gemini: model choice, errors; nothing personal sent, answers checked), Malay coverage of every string, database upgrades, Studio (Markdown never becomes HTML, every tool's prompt, quizzes, spin-wheel words and written lesson plans turned into Consilia lesson plans with real KSSR standards only, pupil-name check), quality checks (a realistic answer from each of the 24 tools passes; broken lesson plans, quizzes, texts, rubrics, dialogues, phonics packs, stories, messages and reflections are caught with the right fix; American spelling; blanks), KSSR grounding (the Scheme of Work lesson's real standards, textbook pages and steps in the prompt and kept when changing a result; the year's CEFR level for pupils' texts; a lesson plan keeps the SoW lesson's standards and topic) | All pass | ✅ 189 tests in 41 files |
| Curriculum data | `npm run validate:curriculum` | Every SoW reference resolves | ✅ 1,489 lessons, all valid |
| Core journeys | 13 browser suites, 429 checks (below), run in CI on every push in Malaysian time; six of them also on WebKit and Firefox | All pass, no console errors | ✅ 429 / 429 on Chromium (`e2e:m5` needs the KPM PDFs, which are not in the repository) |
| Accessibility | `npm run a11y`: axe-core WCAG 2.1 A/AA on 58 screens × light and dark | 0 critical or serious issues | ✅ 0 issues (after fixes, see below) |
| Tap targets | Same script, 390 × 844 phone | Every control ≥ 44 px (or its label) | ✅ none smaller |
| Text size | Same script, root font at 200% on a phone | No horizontal scrolling | ✅ none |
| Reduced motion | `e2e:m7` with `prefers-reduced-motion: reduce` | No splash, no confetti | ✅ |
| Performance | `npm run perf`: emulated phone, 4× slower CPU, fast 3G (1.6 Mbps, 150 ms) | First visit usable < 6 s; repeat < 2.5 s | ✅ 2.6 s (358 KB, with the new look's handwriting font), repeat 0.3 s (0 KB) |
| Offline | `smoke`, `e2e:m5`, `e2e:m7` with the network switched off | Every core feature works offline | ✅ incl. textbooks, saved videos (with seeking) and text recognition |
| Security: CSP | Built `index.html` carries a strict policy (outside addresses: the feedback form and, only with the AI assistant on, Anthropic's or Google's API); all suites run with it enforced | No blocked resources in any journey | ✅ |
| Security: escaping | Code review: Svelte escapes all text; the only raw HTML is the QR code SVG made by the `qrcode` library from a URL | No user text rendered as HTML | ✅ |
| Security: imports | Unit tests + `e2e:m7`: damaged backup, newer-version backup, damaged .consilia | Refused with a plain message, nothing changed | ✅ |
| Security: encryption | `e2e:teach`: PIN set → names stored as `enc:v1:…`; wrong PIN refused; right PIN restores names | Round trip works | ✅ |
| Dependencies | `npm audit --omit=dev` | No known vulnerabilities in shipped code | ✅ 0 |
| Error handling | `e2e:m7` fault injection: every database write fails (full device) | Plain message + next step, no data loss, form stays open | ✅ |
| Privacy | `e2e:m7` checks text recognition loads nothing from other sites; Feedback Garden posts only the listed fields (`e2e:m6`); `e2e:m10` checks nothing goes to Anthropic or Google until the AI assistant is on, requests hold no pupil or class names, keys travel in a header and are never in backups | Nothing else leaves the device | ✅ |

## Browser suites

| Suite | Checks | Covers |
|---|---|---|
| `smoke` | 18 | On a phone and a laptop: Today, Library lesson detail and performance levels, no sideways scroll, Bahasa Melayu, dark theme, reload offline, curriculum offline |
| `e2e` | 49 | Onboarding, class with pasted names, a full RPH from scratch (standards, ABCD/SMART objectives, PPP, tiers, timing errors, materials, textbook pages, Plan B, autosave), checker to 100, mark as fine, both print layouts and Word downloads (with the textbook line), weekly planner |
| `e2e:teach` | 26 | Teach mode (attendance, clock, overrun and pacing coach, resume after reload), toolkit (name picker, groups with keep-apart, points, noise light without microphone, timer), PBD grid, heatmap, Excel export, PIN lock |
| `e2e:m5` | 36 | Textbook Shelf with real PDFs (recognised editions, calibration, private file storage), search, viewer and projector tools, textbook pages in the lesson plan and printed as pictures (print and Word), materials studio, activity bank, Canva AI prompt, sharing and import, reflection, mentor notes |
| `e2e:m6` | 23 | Terms of use gate (EN/BM, three ticks, remembered), splash once a day, 10-step tour (with Create and Search), Help replay, About, Feedback Garden online and offline queue, music start and pause in Teach mode, backup and restore |
| `e2e:m7` | 26 | Privacy page EN/BM, manual search and links, six videos (length, EN/BM captions, saved for offline, byte ranges offline, unsaved video offline message), text recognition of a scanned PDF (online, then offline), fault injection, offline tool notice, reduced motion |

| `e2e:m9` | 31 | "Lesson plan" wording; attendance (marks, reasons, everyone else present, saved, month view, Excel, Teach mode keeps the teacher's marks); My day (periods in time order, own items, reorder, ticks kept, Plan/Attendance per period); yearly plans from Word, Excel and CSV, old .doc message, build from SoW with holiday weeks; yearly, monthly and weekly views; periods matched to SoW lessons opening New lesson plan with lesson, class and time; phone layouts |
| `e2e:quality` | 21 | Focus kept in dialogs and returned, page titles and focus after navigation, full screen without the Fullscreen API (filled window, note, exit), recovery panel for a damaged lesson (menu still works, backup from the panel), update in another tab asks to reload, the interface in Bahasa Melayu with the printed lesson plan still in English, Malay dates. Also runs on WebKit and Firefox |
| `e2e:studio` | 40 | Tools gallery (36 tools, groups, Malay search, favourites kept after a reload, recently used); AI tools without a key (prompt copied with year and CEFR, paste the answer back); Claude streaming with the teacher's key (intercepted), no pupil or class names in prompts; change with a chip → version 2, back and forth, edit → version 3; Word; open a written lesson plan in the builder (real KSSR standard kept, PPP stages); Stop; projector view and Esc; pupil-name check stops the request and removes the names; vocabulary → spin wheel; quiz → Quiz show; My creations (open, delete); Malay; phone layout |
| `e2e:ai` | 23 | All 24 AI tools generate a realistic answer (Anthropic intercepted) that renders and passes its quality check; every request carries the expert brief; pupils' texts pitched at the year's CEFR level; blanks such as [Your name] shown as notes; a lesson plan based on Scheme of Work lesson 2 (form filled from the lesson, real standards and textbook pages sent, standards confirmed by the check, opened in the builder with that lesson's standards and topic); a tool opened for that lesson plan based on the same lesson; a broken quiz and lesson plan caught, Fix it and Fix all making a passing version 2; the copy-and-paste route with the same checks; Malay; phone. Also runs on WebKit and Firefox |
| `e2e:shell` | 22 | Create panel (ten items, opens the tool and closes, Esc, also after a click on blank space), Search (/ and Ctrl+K, tools, my classes, my lesson plans, the Scheme of Work, the manual, Enter opens the first result, Esc), Tools Quick start (Assess, Plan and Teach open the right tool already filled in), real numbers on Tools, Today's week route and tools, phone tab bar Create button and top-bar search. Also runs on WebKit and Firefox |
| `e2e:m10` | 63 | Lesson slides from a Consilia-planned lesson (three looks, full deck, teacher's words, no pupil names), edit, add a question, move, delete, saved after reload; presenting (arrows, answer reveal, notes, Esc); PowerPoint opened and checked (every slide, speaker notes); Canva/Google Slides steps; AI by copy and paste (no pupil or class names, add and remove AI slides); AI assistant with Claude (preselected, nothing sent before it is on, agreements naming Anthropic, key test and model choice, key only in a header, Claude Opus 5.5 asked for JSON with a fallback, no pupil or class names, no-credit message, ask Claude here, Claude.ai button) and with Gemini (switching needs agreeing again, own key, free-limit message); keys not in backups; beta.5 settings carried over; Tools entry and search; Teach mode slides with the clicker; offline download; SoW teacher steps kept off the slides; phone layouts |
| `e2e:m8` | 51 | Lesson bar shared by all tools (latest RPH, choose an RPH, Try an example), Add to my lesson (activity, objective, chant), Tools for this step in the builder, search by need and Malay words, game keyboard shortcuts, "Improve my lesson plan" filled from the RPH; Consilia Recommends (class questions, planning log, scripts with the teacher's words, 100 score, teaching aid making steps, Another idea on one stage only, preparation checklist, AI prompt without pupil names, saved RPH, class answers remembered, offline-only suggestions without internet), Tools hub, all 11 tools, four projector games, Games in Teach mode, terms page, phone layouts |

## Found and fixed during beta.8 testing

- Firefox logged a blocked script each time the Claude assistant loaded: Zod (inside Anthropic's SDK) tests whether
  `eval` works, and the Content-Security-Policy blocks it. Zod now runs in jitless mode and never tries.
- WebKit: the Studio suite's stand-in for Anthropic received no requests. WebKit sends a page's requests through its
  service worker, out of reach of Playwright's interception, so they reached the real API, which refused the test key
  (401). The suites that intercept Anthropic now block the service worker, as Playwright advises. An earlier guess
  (the CORS preflight) was wrong; the stand-in still answers the preflight as the real API does.
- The Recently used check passed on Chromium only by winning a race: opening the spin wheel rightly counts as using
  Classroom games. The test now waits for the wheel and expects games, then the vocabulary tool.
- Quality check calibration with a realistic answer for every tool: a quiz question with no answer was counted twice
  (missing answer and bad options); messages such as "1 answers are not True or False" now read "Answers that are not
  True or False: 1"; the panel now opens by itself when there is a blank to fill in, and a link at the top of the
  result jumps to it.
- Search listed tools in catalogue order, so "rubric" showed the Worksheet maker first (its description mentions
  rubrics) and Enter opened it. Tools whose name matches now come first, then search words, then descriptions (found
  by the new `e2e:shell` suite).
- The "Quality check: 2 to fix" link used the coral accent, too light for small text on white (axe, light theme). It
  now uses the darker problem colour.
- The guided tour did not show the new Create and Search; it has a step for them now (ten steps).
- Esc did not close a panel when focus was outside it: in CI the test pressed Esc before focus had moved into the
  Create panel, and a teacher who clicked blank space in a panel had the same problem. Panels now also listen for Esc on
  the page.
- WebKit reported errors when a test reloaded the page while a tool was still downloading: the Studio page's lazy load
  had no error branch and the builder's curriculum load no handler. A part that cannot load now shows a message with
  Reload, the builder says when the Scheme of Work cannot be loaded, and three background loads (yearly plan, textbook
  shelf, new lesson plan) handle failure. The AI suite now opens each tool with one fresh page load.
- The changelog first said 22 tools offer "Base it on a KSSR lesson"; the code says 18 (not the Text leveller, Writing
  feedback or the four tools that write to adults). Corrected before release.

## Found and fixed during M10 testing

- The Anthropic SDK also reads credentials from the computer's environment; Consilia now passes only the teacher's key
  (found by the unit test that checks the request headers).

- A slide edit made just before leaving the slides page was saved with no lesson id (the page had closed), which showed
  an error message. The save now keeps the lesson id and also finishes when the page is hidden.
- Five or more key words overflowed the slide on screen (found by recording the tutorial video). Slide text now fits by
  number of lines as well as length, and long word lists use two columns; the PowerPoint uses the same rule.
- AI content added parts the teacher had not ticked; only the ticked parts are added now.

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
| The AI assistant is tested against intercepted copies of Anthropic's and Google's APIs, not the live services | No real keys in automated tests | Before the pilot: one real Claude request with a personal key (slides and ask Claude here); pilot: compare text quality and cost |
| PowerPoint checked by unzipping and in LibreOffice, not in PowerPoint, Canva or Google Slides | Those apps are not in the test machine | Pilot: import one deck into Canva and Google Slides |
| Bahasa Melayu wording reviewed by the developer only | Machine-checked for completeness, not for style | Pilot: ask BM users to flag awkward wording in the Feedback Garden |
| Real devices (iPhone Safari, Samsung Internet) not tested | Automated tests run in Chromium only | Pilot: at least 3 iPhones and 3 Samsung phones (`pilot.md`) |
| Screen-reader passes (TalkBack, VoiceOver) | Need a person and a device | Pilot volunteer with TalkBack; axe covers structure and names |
| Word file in Google Docs and WPS | Checked in code and by unzipping, not in each app | Pilot day 2–3 |
| Text recognition speed on phones | 1.5–3.5 s per page on a laptop; phones are slower | Pilot: ask how long a whole book took |
| Dev-only advisories in `vitest` 3 (test runner) | Upgrading to vitest 4 hits an npm 10 bug (`edgesOut`) when resolving its optional peers | Not shipped to users; upgrade when npm is fixed |
| `style-src 'unsafe-inline'` in the CSP | Svelte sets inline `style` attributes | Scripts stay strict; no user text becomes style |
| No `frame-ancestors` | GitHub Pages cannot send HTTP headers and the meta tag cannot set it | Low risk: data is per-origin and every destructive action asks to confirm |
| A "Follow the SoW" lesson starts around 69/100 | SoW outlines describe the teacher's steps, not what pupils do; the trainee adds that | Pilot: check whether the starting score discourages |
