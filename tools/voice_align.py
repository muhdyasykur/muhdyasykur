"""Cut an ElevenLabs batch recording into one clip per line using forced alignment (PocketSphinx, offline).

usage: python3 tools/voice_align.py batch.mp3 manifest.json <batch_index> <out_dir> <timings.json>

The aligner is given the exact script, finds where every word starts and ends, cuts each line at the middle
of the silence before the next line, and stores word start times + mark times for karaoke highlighting.
Unknown words (Malay names, food) get an approximate pronunciation from simple spelling rules.
"""
import json, re, subprocess, sys
from pocketsphinx import Decoder

L2P = [("tch", "CH"), ("sch", "S K"), ("ch", "CH"), ("sh", "SH"), ("th", "TH"), ("ng", "NG"), ("ph", "F"), ("ck", "K"), ("qu", "K W"), ("ee", "IY"), ("oo", "UW"),
       ("ai", "AY"), ("ay", "EY"), ("au", "AW"), ("ou", "AW"), ("ei", "EY"), ("ie", "IY"), ("ui", "UW IH"), ("ea", "IY"), ("oa", "OW"),
       ("a", "AA"), ("b", "B"), ("c", "K"), ("d", "D"), ("e", "EH"), ("f", "F"), ("g", "G"), ("h", "HH"), ("i", "IY"), ("j", "JH"), ("k", "K"), ("l", "L"),
       ("m", "M"), ("n", "N"), ("o", "OW"), ("p", "P"), ("q", "K"), ("r", "R"), ("s", "S"), ("t", "T"), ("u", "UW"), ("v", "V"), ("w", "W"), ("x", "K S"), ("y", "Y"), ("z", "Z")]

def guess_phones(w):
    out, i = [], 0
    while i < len(w):
        for g, p in L2P:
            if w.startswith(g, i):
                out.append(p); i += len(g); break
        else:
            i += 1
    return " ".join(out) or "AH"

WORD = re.compile(r"[A-Za-z0-9’'\-]+")

def words_of(text):
    text = re.sub(r"\[[^\]]*\]", " ", text)          # emotion tags
    text = re.sub(r"/[^/]+/", " ", text)              # IPA (should not appear in display text)
    return [m.group() for m in WORD.finditer(text)]

def norm(w):
    w = w.lower().replace("’", "'")
    return {"mak": "mock", "aunty": "auntie", "shh": "shush", "colouring": "coloring", "ok": "okay"}.get(w, w)

def align(raw, text_words, dec):
    ws = []
    for w in text_words:
        n = norm(w).strip("'-")
        if not n: continue
        if re.fullmatch(r"\d+", n): n = {"0": "zero", "1": "one", "2": "two", "5": "five", "6": "six", "9": "nine", "10": "ten"}.get(n, "number")
        for part in n.split("-"):
            if not part: continue
            if dec.lookup_word(part) is None: dec.add_word(part, guess_phones(part), True)
            ws.append(part)
    dec.set_align_text(" ".join(ws))
    dec.start_utt(); dec.process_raw(raw, full_utt=True); dec.end_utt()
    dec.set_alignment(); dec.start_utt(); dec.process_raw(raw, full_utt=True); dec.end_utt()
    out = []
    for w in dec.get_alignment():
        if w.name in ("<s>", "</s>", "<sil>"): continue
        out.append((w.name, w.start / 100.0, (w.start + w.duration) / 100.0))
    return out

def main():
    mp3, man, bi, outdir, tjson = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
    M = json.load(open(man)); batch = M["batches"][bi]; clips = {c["id"]: c for c in M["clips"]}
    items = [clips[i] for i in batch["clips"]]
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    dur = len(raw) / 32000.0
    dec = Decoder(samprate=16000, bestpath=False, loglevel="FATAL")
    per_line = [words_of(c["text"]) for c in items]
    al = align(raw, [w for ws in per_line for w in ws], dec)
    # map aligned words back to lines (hyphenated words may have been split)
    counts = []
    for ws in per_line:
        counts.append(sum(len([p for p in norm(w).strip("'-").split("-") if p]) for w in ws))
    if len(al) != sum(counts):
        print("FAIL: aligned", len(al), "words, expected", sum(counts)); sys.exit(2)
    spans, k = [], 0
    for n in counts:
        spans.append(al[k:k + n]); k += n
    try: T = json.load(open(tjson))
    except Exception: T = {}
    for i, c in enumerate(items):
        sp = spans[i]
        a = sp[0][1]; b = sp[-1][2]
        prev_end = spans[i - 1][-1][2] if i > 0 else 0.0
        next_start = spans[i + 1][0][1] if i + 1 < len(items) else dur
        cut0 = max(0.0, max(prev_end, a - 0.25) if i > 0 else a - 0.12)
        cut0 = max(cut0, (prev_end + a) / 2 if i > 0 else 0)
        cut1 = min(dur, min(next_start, b + 0.35) if i + 1 < len(items) else b + 0.3)
        cut1 = min(cut1, (b + next_start) / 2 if i + 1 < len(items) else dur)
        out = f"{outdir}/{c['id']}.mp3"
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{cut0:.3f}", "-to", f"{cut1:.3f}", "-i", mp3, "-ac", "1", "-ar", "44100", "-b:a", "64k",
                        "-af", "afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse", out], check=True)
        # word start times (relative), merging split hyphen parts back to display words
        tw, j = [], 0
        for w in per_line[i]:
            parts = [p for p in norm(w).strip("'-").split("-") if p]
            tw.append(round(sp[j][1] - cut0, 3)); j += len(parts)
        # mark times: end of the word before each mark
        toks = [(m.start(), m.group()) for m in re.finditer(r"[A-Za-z0-9’'\-]+|[.,?!;:]+", c["text"])]
        ends, marks, wi, j = [], [], -1, 0
        for w in per_line[i]:
            parts = [p for p in norm(w).strip("'-").split("-") if p]
            ends.append(round(sp[j + len(parts) - 1][2] - cut0, 3)); j += len(parts)
        for pos, t in toks:
            if WORD.fullmatch(t): wi += 1
            elif wi >= 0: marks.append(ends[wi])
        d2 = cut1 - cut0
        T[c["id"]] = {"key": c["key"], "f": f"{c['id']}.mp3", "d": round(d2, 2), "w": tw, "m": marks, "v": c["voice"]}
        gap_after = (next_start - b) if i + 1 < len(items) else None
        print(f"{c['id']} {d2:5.2f}s words={len(tw)} gap_after={gap_after and round(gap_after, 2)} | {c['text'][:62]}")
    json.dump(T, open(tjson, "w"), indent=0)
    print("OK")

if __name__ == "__main__":
    main()
