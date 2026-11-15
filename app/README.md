# Consilia

*Consilium: wise planning, meaningful learning.*

An offline-first web app (PWA) that helps TESL teachers in Malaysian primary schools plan KSSR lessons, teach them and track pupils' progress. Built by Muhammad Yasykur bin Muhamad Yasim (PISMP TESL, IPG Kampus Gaya).

## Status

| Milestone | State |
|---|---|
| M0 Foundations: app shell, offline install, themes, EN/BM, database, CI | Done |
| M1 Curriculum data pack: SoW, DSKP, performance levels, task bank (Years 1–6, SK and SJK) | Done, awaiting sample review |
| M2 RPH builder: onboarding, classes, 7-step builder, three modes, frameworks, ABCD/SMART objectives, L/M/H tiers, timing, print (school template and Consilia Lesson Blueprint) | Done |
| M3 Alignment checker and score, Plan B suggestions, Word export, weekly planner | Next |

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

Browser tests of the built app (need Playwright on the machine): `npx vite preview --port 4173 &`, then `npm run smoke` (shell, Library, offline) and `npm run e2e` (builds and prints a full RPH).

## Layout

- `src/lib/ui` design tokens, base styles, logo, icons
- `src/lib/i18n` English and Bahasa Melayu strings
- `src/lib/db` IndexedDB schema (Dexie). All teacher data stays on the device.
- `src/lib/curriculum` loader and types for the curriculum pack
- `src/features/*` one folder per screen
- `public/curriculum/kssr2017` the curriculum pack (generated, see `tools/curriculum-extract`)

## Privacy and copyright

No server, no accounts, no analytics. The curriculum pack is extracted from the Ministry of Education's public DSKP and Scheme of Work documents. No textbook content is included.
