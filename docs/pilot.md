# Consilia pilot (beta) kit

Two weeks with real trainee teachers before version 1.0 (blueprint: Pilot / UAT). Everything a tester needs is in the
app: the guided tour, six videos and the manual in Me → Help, and the Feedback Garden in Me → About for reporting.

## Before you invite anyone

1. Put the app online (GitHub Pages; see the README "Release" section). Pilot testers need the link only.
2. Open the link on your own phone, install it, and check that Me shows "Ready to work offline".
3. Plant one Feedback Garden flower yourself and check it arrives in your Jotform inbox.

## Who

- The 18 trainees who answered the survey, plus at least two who teach in rural or SJK schools (the survey had none).
- Ask each tester which phone they use. Aim for at least 3 iPhones and 3 Samsung phones; automated testing used Chromium only.

## Invitation (WhatsApp, English)

> Hi! Thank you for answering my survey on lesson planning during Practicum 1. I built **Consilia**, a free app for
> TESL trainees: plan an RPH from the KSSR SoW, check your ABCD/SMART objectives, teach with a classroom timer and
> toolkit, record PBD, and export to Word. It works offline and nothing about your pupils leaves your phone.
>
> Could you try it for two weeks during your practicum and tell me what works and what doesn't? It takes about
> 10 minutes to start.
>
> 1. Open: **(app link)** → Add to Home screen
> 2. Follow the short tour, then plan one real lesson
> 3. Tell me anything in **Me → About → Feedback Garden** (a flower grows for every message 🌻)
>
> Terima kasih! — Yasykur

## Jemputan (WhatsApp, Bahasa Melayu)

> Assalamualaikum dan salam sejahtera! Terima kasih kerana menjawab soal selidik saya tentang perancangan pengajaran
> semasa Praktikum 1. Saya telah membina **Consilia**, aplikasi percuma untuk guru pelatih TESL: rancang RPH daripada
> SoW KSSR, semak objektif ABCD/SMART, mengajar dengan pemasa dan kit alat kelas, rekod PBD, dan eksport ke Word.
> Ia berfungsi di luar talian dan tiada maklumat murid keluar dari telefon anda.
>
> Boleh cuba selama dua minggu semasa praktikum dan beritahu saya apa yang berkesan dan apa yang tidak? Hanya
> 10 minit untuk bermula.
>
> 1. Buka: **(pautan aplikasi)** → Add to Home screen
> 2. Ikut lawatan ringkas, kemudian rancang satu pelajaran sebenar
> 3. Kongsi apa sahaja di **Saya → About → Feedback Garden** (sekuntum bunga tumbuh untuk setiap mesej 🌻)
>
> Terima kasih! — Yasykur

## The two weeks

| Day | Ask testers to | You check |
|---|---|---|
| 1 | Install, take the tour, set up one class (paste names) | Feedback Garden: install problems |
| 2–3 | Plan one real RPH with "Follow the SoW", print or export to Word | Which steps people skip; Word layout in their school template |
| 4–5 | Teach that lesson with Teach mode; record PBD at the end | Teach mode on real projectors; timing |
| 6 | Make a backup and send it to themselves | Backup reminders work |
| 7 | Mid-pilot message: "What is the one thing that annoyed you most?" | Collect top 3 issues, fix the worst |
| 8–12 | Normal use: plan 3+ lessons, add a textbook PDF, try Canva AI prompt | Scanned-book text recognition speed on phones |
| 13 | Write a reflection, log mentor feedback | — |
| 14 | Fill in the end-of-pilot survey (below) | Survey results; decide v1.0 fixes |

## End-of-pilot survey

Use the System Usability Scale so the result is comparable with other studies, plus four open questions.
(Ask me to make this a Jotform form like the original survey.)

**SUS** (1 = strongly disagree … 5 = strongly agree)

1. I think that I would like to use Consilia frequently.
2. I found Consilia unnecessarily complex.
3. I thought Consilia was easy to use.
4. I think that I would need the support of a technical person to be able to use Consilia.
5. I found the various functions in Consilia were well integrated.
6. I thought there was too much inconsistency in Consilia.
7. I would imagine that most people would learn to use Consilia very quickly.
8. I found Consilia very cumbersome to use.
9. I felt very confident using Consilia.
10. I needed to learn a lot of things before I could get going with Consilia.

Score: for odd items subtract 1 from the answer, for even items subtract the answer from 5, add all ten and multiply
by 2.5 (0–100). Above 68 is above average; aim for 75+.

**Open questions**

1. How much time did Consilia save you per RPH, roughly? (none / under 15 min / 15–30 min / over 30 min)
2. Did your mentor or lecturer comment on your RPH or objectives this time? What did they say?
3. Which feature would you miss most if it disappeared?
4. What should be fixed before version 1.0?

## What to watch for (from testing)

- A "Follow the SoW" lesson starts around 69/100 because SoW outlines describe what the teacher does, not what pupils
  do. That is deliberate (the trainee adds it), but check whether the low starting score discourages people.
- Scanned textbooks: text recognition takes 1.5–3.5 s per page on a laptop. Ask phone users how long a whole book took.
- iPhone: installing works from Safari only (Share → Add to Home Screen). Storage can be cleared by iOS after weeks
  without use, so backups matter more there.
- Word export: check the file in Microsoft Word, Google Docs and WPS on a tester's phone.

## Releasing 1.0

1. Fix the top issues from the Feedback Garden and the survey.
2. Change the version in `app/package.json` from `1.0.0-beta.1` to `1.0.0`, and add the fixes to `docs/CHANGELOG.md`.
3. Merge to `main`; GitHub Actions builds and publishes. Testers get the update prompt the next time they open the app.
