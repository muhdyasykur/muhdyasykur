# Consilia design system

The look stays Consilia's own: navy and gold, Bricolage Grotesque headings, Plus Jakarta Sans text, Andika for
anything pupils read. This page lists what to reuse instead of rebuilding it in a screen.

## Tokens (`app/src/lib/ui/tokens.css`)

Every colour is a token, defined for light and again for dark: `--navy`, `--gold`, `--gold-strong`, `--paper`,
`--card`, `--sunken`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--ok`, `--warn`, `--bad`, `--main`/`--comp` (skill
pills), `--low`/`--mod`/`--high` (tiers). Type scale `--t-xs` … `--t-3xl`; spacing `--s-1` … `--s-16` (4-point);
radii `--r-card`, `--r-ctl`, `--r-pill`; `--tap` (44 px minimum target); durations `--dur-fast`, `--dur`,
`--dur-slow`. Do not write a colour in a component; add a token if one is missing.

Colours that must not follow the theme (paper, projector) live in `app/src/lib/ui/palette.ts`: `STAGE_COLOURS`
(timing bar and printed ribbon), `TEAM_COLOURS` (groups, points and game teams share them), `WHEEL_COLOURS`.

## Classes (`app/src/lib/ui/base.css`)

| Purpose | Classes |
|---|---|
| Layout | `.stack` (vertical, 16 px), `.row` (wrapping row, 8 px), `.tight` (8 px gap), `.between`, `.chips` |
| Surfaces | `.card`, `.card.raised` |
| Buttons | `.btn` + `.btn-gold` (main action), `.btn-primary`, `.btn-outline`, `.btn-text` |
| Forms | `.field` (label + control), `.input`, `.select`, `.ta` (text area), `.seg` (segmented choice) |
| Text | `.eyebrow`, `.muted`, `.small`, `.pre`, `.code`, `.ok`, `.err`, `.del`, `.sr-only` |
| Labels | `.chip`, `.pill-m`, `.pill-c` |
| Pupils | `.pupil-font`, and `lang="en"` on anything pupils read (it also stays English in Bahasa Melayu) |

## Components (`app/src/lib/ui/`)

| Component | Use for |
|---|---|
| `EmptyState` | Nothing to show yet: optional icon, title, one sentence, the action that fixes it. `compact` inside a card |
| `Sheet` | A modal panel (bottom sheet on a phone, dialog on a laptop) with focus kept inside and Esc to close |
| `Toaster` + `notify(text, { kind, action })` | Short messages; errors and messages with an action stay until closed |
| `Recovery` | Shown automatically when a screen fails to draw |
| `FullExit` + `toggleFull()` | Full screen with a filled-window fallback |
| `Icon` | The one icon family: 47 original line icons (24 px grid, 1.8 stroke, round ends), `<Icon name="slides" size={18} />` |
| `ScoreRing`, `Logo`, `Qr`, `BbmPic`, `Unlock`, `ProfileForm`, `PinSettings` | As named |

Behaviour helpers: `trapFocus` (dialogs), `afterNavigation` (page titles and focus), `tr()` and `uiDate()` (text and
dates in the chosen language).

Buttons and fields stay CSS classes rather than components: a wrapper would add nothing a class does not already
give, and native elements keep working with every browser feature (forms, autofill, keyboards).

## Icons

Use `Icon` for anything that acts as an icon: buttons, menus, tool cards, headings, status marks. Do not use emoji
there: they look different on every phone and ignore the theme. Inside `.btn` and `.chip` the gap is already set;
in running text the `.icon` class lines the icon up with the words. Icons are decorative (`aria-hidden`), so the
button or link must still say what it does in words, or carry an `aria-label`.

Emoji are kept on purpose in three places: what pupils see (slides, printed sheets, "Eyes on me! 👀"), the 🌱 🌿 🌳
level marks (they match printed tiered worksheets), and the Feedback Garden's feeling choices.

To add an icon, draw it on the 24 px grid in `Icon.svelte` with one path, stroke only, and keep it simple enough to
read at 16 px.
