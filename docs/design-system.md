# Consilia design system

The look stays Consilia's own: navy and gold, Bricolage Grotesque headings, Plus Jakarta Sans text, Andika for
anything pupils read. Since 1.0.0-beta.8 it also carries the language merged from the travel designs the teacher
chose: royal blue for actions, teal widgets, coral handwritten accents, sky gradients on a warm cream page, rounder
cards and pill buttons. This page lists what to reuse instead of rebuilding it in a screen.

## Tokens (`app/src/lib/ui/tokens.css`)

Every colour is a token, defined for light and again for dark: `--navy`, `--gold`, `--gold-strong`, `--paper`,
`--card`, `--sunken`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--ok`, `--warn`, `--bad`, `--main`/`--comp` (skill
pills), `--low`/`--mod`/`--high` (tiers). Type scale `--t-xs` … `--t-3xl`; spacing `--s-1` … `--s-16` (4-point);
radii `--r-card` (20 px), `--r-ctl` (12 px), `--r-pill`, `--r-xl` (28 px, heroes); `--tap` (44 px minimum target);
durations `--dur-fast`, `--dur`, `--dur-slow`. Do not write a colour in a component; add a token if one is missing.

The merged palette: `--blue`/`--blue-2`/`--on-blue`/`--blue-soft` (actions: `.btn-primary`, links that act),
`--teal`/`--teal-2`/`--on-teal`/`--teal-soft` (widgets such as today's periods), `--coral`/`--coral-soft` (the
handwritten accent and problems found by the quality check), `--sky-1`/`--sky-2` (hero and panel gradients),
`--shadow-float` (raised cards and the Create button). Handwritten words use `--f-script` ("Consilia Script", a basic
Latin subset of Caveat Brush under the SIL Open Font License) through the `.script` class, at a large size so they
count as large text for contrast.

Tool categories use tinted tiles: gold (plan), `--main` (create), `--comp` (assess) and `--tint-green`, `--tint-rose`, `--tint-purple` with their `-ink` colours, each defined for light and dark.

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
| `Icon` | The one icon family: original line icons (24 px grid, 1.8 stroke, round ends) drawn in `icons.ts`, `<Icon name="slides" size={18} />` |
| `PageHero` | The header of a main screen: title, eyebrow, a handwritten word (`script`), one sentence, actions and a scene, in a tone (`sky`, `mint`, `lilac`, `peach`) |
| `art/HeroScene`, `art/Scene` | Original illustrations: the learning journey (Today, Tools) and a scene for each tool group (`plan`, `create`, `assess`, `support`, `classroom`, `fun`, `write`). Decorative unless given a label |
| `ClayIcon` | An icon on a soft clay tile (`name`, `tone`, `size`) for feature rows and quick starts |
| `PlaneTrail` | The dashed paper-plane trail beside a section title (decorative) |
| `Carousel` | A row of cards that scrolls sideways, with back and forward buttons and a label |
| `ScoreRing`, `Logo`, `Qr`, `BbmPic`, `Unlock`, `ProfileForm`, `PinSettings` | As named |

Behaviour helpers: `trapFocus` (dialogs), `afterNavigation` (page titles and focus), `tr()` and `uiDate()` (text and
dates in the chosen language), `shell.svelte.ts` (`openPanel('create' | 'search')`, `closePanel()` and the Ctrl+K and
/ shortcuts for the Create and Search panels in `features/shell`).

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

## Showing AI text

Results from an AI are drawn by `features/studio/Markdown.svelte` from the data that `lib/studio/markdown.ts` reads:
text nodes only, never `{@html}`. Headings, lists, tables, bold and italics are supported; links show as text with their
address. Use the same pair for any new place that shows AI text.

Check AI text with `lib/studio/quality.ts` (`checkResult(tool, text, values, { sowCodes, yearCodes })`): each check is
`ok`, `fix` (with an English instruction to send back to the AI) or `note`. On the tool page the Quality check panel
lists them, opens by itself when something needs fixing or a blank needs filling, and "Fix it" / "Fix all"
(`fixAll(checks)`) make a new version. Ground a prompt in the curriculum with `lib/studio/grounding.ts`
(`sowBrief(lesson, standards, year, school)`), never with facts typed into the prompt by hand.
