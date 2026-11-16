# Consilia

*Consilium: wise planning, meaningful learning.*

An offline-first web app (PWA) that helps TESL teachers in Malaysian primary schools plan KSSR lessons, teach them and track pupils' progress. Built by Muhammad Yasykur bin Muhamad Yasim (PISMP TESL, IPG Kampus Gaya).

## Status

| Milestone | State |
|---|---|
| M0 Foundations: app shell, offline install, themes, EN/BM, database, CI | Done |
| M1 Curriculum data pack: SoW, DSKP, performance levels, task bank (Years 1–6, SK and SJK) | Done, awaiting sample review |
| M2 RPH builder: onboarding, classes, 7-step builder, three modes, frameworks, ABCD/SMART objectives, L/M/H tiers, timing, print (school template and Consilia Lesson Blueprint) | Done |
| M3 Alignment checker (29 rules) and score, Plan B suggestions, Word export (both layouts), weekly planner and timetable, Today dashboard, copy a lesson to another class | Done |
| M4 Teach mode (stage clock, pacing coach, resume after reload, wake lock), classroom toolkit (name picker, group maker with keep-apart pairs, noise meter, team points, attention signal, timer), attendance, PBD recording, heatmap and suggested levels, Excel export, PIN lock with encrypted pupil names | Done |
| M5 Textbook Shelf (own PDFs on the device, page maps, search, viewer with projector tools, in Teach mode), materials studio, tool links and Canva AI prompt, activity bank (70), Method Guide, search everything, guided reflection, mentor notes, share/import .consilia, QR codes on printed links | Done |
| M6 Brand experience: splash (once a day, tap to skip), three original R&B instrumentals composed in code (off by default, pause in Teach mode), 8-step guided tour, About page, Feedback Garden to Jotform with an offline queue, backup and restore with a weekly reminder, confetti for a first 100 score | Done |
| M7 QA (accessibility, security, performance, fault injection), six captioned tutorial videos, searchable manual, privacy page (EN/BM), on-device text recognition for scanned textbooks, pilot kit | Done: 1.0.0-beta.1 |
| M8 Consilia Recommends (whole-lesson planning engine), Tools tab with 11 tools, projector games, BBM guide with pictures, AI prompt builder, terms of use | Done: 1.0.0-beta.2 |
| M9 Yearly plan (upload RPT or build from SoW; yearly, monthly, weekly views), My day, attendance register, "lesson plan" wording, ten re-recorded videos | Done: 1.0.0-beta.4 |
| M10 Lesson slides from any lesson plan (editor, three looks, presenter with clicker keys, in Teach mode, PowerPoint for Canva and Google Slides), optional Cloud AI with the teacher's own Google Gemini key (slide texts, dialogues, questions; "ask Gemini here"), 11 videos | Done: 1.0.0-beta.5 |
| Pilot: two weeks with trainee teachers (see `docs/pilot.md`), then 1.0.0 | Next |

## Run it

```bash
cd app
npm install
npm run dev        # development server
npm run build      # production build in dist/
npm test           # unit tests
npm run check      # type check
npm run validate:curriculum   # integrity check of the curriculum pack
```

Browser tests of the built app (need Playwright on the machine): `npx vite preview --port 4173 &`, then `npm run smoke` (shell, Library, offline) `npm run e2e` (builds and prints a full RPH) and `npm run e2e:teach` (Teach mode, PBD and the PIN lock) and `npm run e2e:m5` (Textbook Shelf, materials, sharing, reflection; needs textbook PDFs in `UPLOAD_DIR`, never committed) and `npm run e2e:m6` (splash, tour, About, Feedback Garden online and offline, music, backup and restore; the Jotform post is intercepted, nothing is sent).

Milestone 7 checks (same preview server):

```bash
npm run e2e:m9    # yearly plans (Word, Excel, CSV, build from SoW), My day, attendance
npm run e2e:m10   # lesson slides, PowerPoint, Teach mode, AI paste, Cloud AI (Google intercepted)
npm run e2e:m8    # Consilia Recommends, Tools hub, every tool, games, terms page
npm run e2e:m7    # privacy, manual, videos offline, text recognition online and offline, fault injection, reduced motion
npm run a11y      # axe-core on 31 screens in light and dark, 44 px tap targets and 200% text on a phone
npm run perf      # load-time budget on an emulated slow phone (first and repeat visit)
npm run videos    # re-record the ten Help videos and their EN/BM captions into public/videos (needs ffmpeg)
npm run docs      # regenerate docs/manual.md, docs/privacy.md and docs/terms.md from the in-app text
```

The full test plan and the latest results are in `docs/test-plan.md`.

## Release

The app is a static site. `.github/workflows/deploy.yml` builds and publishes it to GitHub Pages on every push to `main`
(at `https://muhdyasykur.github.io/muhdyasykur/`). One-time setup: create the `main` branch from this branch, then in
the repository's Settings → Pages choose "GitHub Actions" as the source. Bump `version` in `package.json` and add a
line to `docs/CHANGELOG.md` for each release; installed apps show an update prompt on their next start.

## Layout

- `src/lib/ui` design tokens, base styles, logo, icons
- `src/lib/i18n` English and Bahasa Melayu strings
- `src/lib/db` IndexedDB schema (Dexie). All teacher data stays on the device.
- `src/lib/curriculum` loader and types for the curriculum pack
- `src/features/*` one folder per screen
- `public/curriculum/kssr2017` the curriculum pack (generated, see `tools/curriculum-extract`)

## Privacy and copyright

No server, no accounts, no analytics (see `docs/privacy.md`, also in the app under Me → Privacy). Text recognition for scanned books runs on the device with tesseract.js (Apache-2.0), served by the app itself. The curriculum pack is extracted from the Ministry of Education's public DSKP and Scheme of Work documents. No textbook content is included.
