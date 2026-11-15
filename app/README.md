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
| M7 QA, six tutorial videos, user manual, privacy page, OCR for scanned textbooks, pilot, v1.0 | Next |

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

## Layout

- `src/lib/ui` design tokens, base styles, logo, icons
- `src/lib/i18n` English and Bahasa Melayu strings
- `src/lib/db` IndexedDB schema (Dexie). All teacher data stays on the device.
- `src/lib/curriculum` loader and types for the curriculum pack
- `src/features/*` one folder per screen
- `public/curriculum/kssr2017` the curriculum pack (generated, see `tools/curriculum-extract`)

## Privacy and copyright

No server, no accounts, no analytics. The curriculum pack is extracted from the Ministry of Education's public DSKP and Scheme of Work documents. No textbook content is included.
