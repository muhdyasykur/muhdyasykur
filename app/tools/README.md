# Bahasa Melayu tools

The interface is written in English in the source and shown in Bahasa Melayu from `src/lib/i18n/ms-ui.json`
(English text → Malay text). Lesson plans, slides, worksheets, games on the projector and anything else for pupils
stay in English, because English lessons are planned and taught in English: such text is marked `lang="en"` or
`class="pupil-font"`, or lives in `features/plan/print/` and `SlideView.svelte`.

- `i18n-wrap.mjs` wraps text in Svelte markup in `tr('…')`; `i18n-wrap-code.mjs` wraps text written in code;
  `i18n-wrap-ts.mjs` wraps messages in logic modules; `i18n-wrap-list.mjs` wraps listed strings. All are safe to rerun.
- `i18n-scan.mjs` lists English text in code that is still not wrapped, for review.
- `I18N_DUMP=1 npx vitest run src/lib/i18n` writes untranslated strings to `i18n-todo.json`; `i18n-chunk.py N` shows
  part N as `index|English`; `i18n-apply.py file` merges `index|Malay` lines into `ms-ui.json`.
- The test `src/lib/i18n/i18n.test.ts` fails if any string lacks a translation, a translation adds a placeholder,
  a translation is left over, or a manual article is untranslated (`src/lib/content/manual.ms.ts`).
