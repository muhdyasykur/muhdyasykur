# PunctuAction · *Every mark has a voice!*

**Stop at the dot. Breathe at the comma, Ask with a question? FEEL the exclamation!**

PunctuAction is an offline web app that helps primary pupils (Year 1–6, designed around Year 4) **read dialogues with feeling by following punctuation**. It was built as a digital innovation for English Language Teaching (TSLB3402, Topic 4).

## The problem
During role-play, pupils read dialogue lines in a flat, monotonous "robot" voice. They run through commas and full stops, read questions like statements, and show no feeling at exclamation marks.

## The solution
Each punctuation mark becomes a character that gives the voice an instruction:

| Mark | Character | Voice instruction |
|---|---|---|
| `.` | **Dotty** | STOP: the voice falls and rests |
| `,` | **Koma** | BREATHE: a short pause, then continue |
| `?` | **Quizzy** | ASK: Yes/No questions rise ↗, WH questions start strong and fall ↘ |
| `!` | **Zing** | FEEL: show the feeling (happy, angry, surprised, scared…) |

Pupils help **Bip**, a robot who reads with no feeling, to win four voice chips.

## What's inside
**Pupil app (`student.html`)**
- **Learn**: four animated lessons (Meet → Trace → Hear the difference → Spot → Say it), a voice-rules poster and a chant.
- **Home – Voice Island**: an animated scene (sky, sea, floating marks) where every character speaks its rule when tapped, a welcome jingle and spoken greeting, optional background music, and a **Continue** button that picks each pupil's best next step.
- **Practice**: six activities (Mark Detective, Ears On!, Pause Patrol, Voice Elevator, Feelings Theatre, Fix the Robot), each at 🌱 Easy, 🌿 Medium and 🌳 Hard. Sentences are generated fresh every round from Malaysian-context word banks, so pupils can't memorise answers. Practice adapts to each pupil's weakest skill.
- **Reading Studio**: 12 role-play dialogues plus the teacher's own. Listen to a model (the teacher's recorded voice first, the punctuation-aware computer voice as backup), record, see your **voice melody line**, pauses and the **Robot-o-meter**, self-check, send to the teacher. **Role-play mode** reads the other parts and records the pupil on their turn.
- **Dialogue Scanner**: type, paste, **photograph** or upload any dialogue (e.g. from the textbook). Offline OCR reads the photo, Bip finds speakers, checks every mark (missing end marks, questions ending in “.”, commas after names and *Yes/Oh/Well*, capital letters) with one-tap fixes and reasons, draws a **voice map** of what the voice does at each mark, guesses the feeling for each “!”, reads it aloud in different voices, and turns it into the pupil's own Studio role-play.
- **Video tutorials (PunctuAction TV)**: 10 narrated, animated videos (6 for pupils, 4 for teachers) with real app screens on a tablet, a moving pointer, zoom, highlight, a character presenter and word-by-word subtitles. Each part waits for its narration to finish, so voice and animation always match. Speed, subtitles, narration on/off, chapters and full screen.
- **Voice disguise** (🐭 🐻 👽): changes the pitch but keeps the timing and intonation, so shy pupils can share and still be assessed.
- **Me**: skills, badges, the teacher's stickers and comments. **Feedback**: Smileyometer, Again-Again table, favourite character, tricky areas, ideas.
- **Ask Bip** offline chatbot, **🎬 Watch how** on every page, a Help Centre and About page, a 🔊 read-aloud button on every instruction (or automatic reading for Year 1–2), Bahasa Melayu help, text size and reduced-motion options, splash screen, offline indicator.

**Teacher Hub (`teacher.html`)**, PIN-locked
- Overview dashboard, pupil profiles, rubric assessment (5 criteria × 4 bands with a suggested PBD TP), record your own **model voices**, dialogue builder with live punctuation checking, missions, pre/post-test Reading Check, evaluation analytics, CSV export, backup, class packs, and a demo class.

## Run it
- **Easiest:** host the folder on any static host (e.g. GitHub Pages), open `index.html`, then *Install app* for offline use.
- **Local:** `python3 -m http.server 8000` in this folder, then open http://localhost:8000.
- Opening `index.html` straight from the folder also works for most features (recording and offline install need http/https).

Microphone recording works in current Chrome, Edge and Safari. The computer voice uses the device's built-in text-to-speech voices; voices marked "offline" in Settings need no internet.

## Privacy
There are no accounts and no servers. All data (names, recordings, results) stays in the device's browser storage until the teacher exports it. The chatbot is rule-based and offline, so pupils' words and voices never go to a public AI service.

## Files
```
index.html        front page (animated story, Pupil / Teacher doors)
student.html      pupil app        teacher.html  Teacher Hub      manual.html  user manual
css/              design system    js/core/      speech engine, audio analysis, disguise, content, data model
js/student/       pupil pages      js/teacher/   hub pages        sw.js        offline cache
assets/video/     screens used by the video tutorials     assets/vendor/  offline OCR engine (Tesseract.js)
tools/capture.js  re-captures the tutorial screens + js/core/shotmap.js (node tools/capture.js, app served on :8765)
tools/build_sw.py regenerates sw.js after files change
```

## Credits
All characters, artwork, sound effects, the jingle and the music are original and generated in code. Fonts: Fredoka and Andika (SIL Open Font License, see `assets/fonts/`). Photo reading: Tesseract.js and its English model (Apache License 2.0, see `assets/vendor/tesseract/`).
