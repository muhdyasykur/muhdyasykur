# Curriculum extraction (development only)

Turns the official KPM PDFs into the JSON pack the app ships in `app/public/curriculum/kssr2017`.
The PDFs are not in the repository. Point `CONSILIA_SRC` at a folder that holds them (see `sources.py` for the layout and page ranges).

```bash
for d in f1 f2 y3sk y3sjk; do pdftotext -bbox-layout $CONSILIA_SRC/$d/file $CONSILIA_SRC/$d/bbox.html; python3 edges.py $CONSILIA_SRC/$d; done
python3 sow.py && python3 phonics.py && python3 dskp.py && python3 tasks.py   # raw extraction -> out/raw
python3 build.py                                                              # cross-check + write the pack + docs/curriculum-validation.md
```

How it works: word positions come from poppler (`pdftotext -bbox-layout`) and table ruling lines from pdfplumber. Each lesson table is read column by column between its ruling lines, so text from neighbouring columns never mixes. `build.py` then checks every lesson against the DSKP and writes the validation report.

Requires: Python 3, `pdfplumber`, poppler-utils.
