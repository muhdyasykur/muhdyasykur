"""Split one ElevenLabs batch recording into one clip per line, and time every word.

usage: python3 tools/voice_split.py batch.mp3 manifest.json <batch_index> <out_dir> <timings.json>

Lines in a batch are separated by blank lines in the prompt, so the voice leaves a pause between them.
The script finds every pause, then picks the n-1 pauses that best match where each line should end
(by its share of the characters), cuts the clips, and estimates when each word and mark is spoken
(from the shorter pauses inside each clip). It prints a check for every clip.
"""
import json, re, subprocess, sys

def silences(path, noise="-38dB", d=0.12):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", f"silencedetect=noise={noise}:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    dur = float(re.findall(r"Duration: (\d+):(\d+):([\d.]+)", out)[0][2]) + 60 * int(re.findall(r"Duration: (\d+):(\d+):", out)[0][1])
    gaps = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else dur
        gaps.append((s, e))
    return gaps, dur

def speech_span(gaps, dur):
    s0 = gaps[0][1] if gaps and gaps[0][0] < 0.05 else 0.0
    s1 = gaps[-1][0] if gaps and gaps[-1][1] >= dur - 0.05 else dur
    inner = [g for g in gaps if g[0] > s0 + 0.01 and g[1] < s1 - 0.01]
    return s0, s1, inner

def plain(t):
    return re.sub(r"\[[^\]]*\]", "", t).strip()

def choose(inner, s0, s1, weights):
    n = len(weights)
    if n == 1: return []
    tot = sum(weights); cum = 0; exp = []
    for w in weights[:-1]:
        cum += w; exp.append(s0 + (s1 - s0) * cum / tot)
    m = len(inner); span = s1 - s0
    INF = 1e18
    # dp[k][j]: best cost choosing boundary k at gap j
    cost = lambda k, j: ((((inner[j][0] + inner[j][1]) / 2 - exp[k]) / span) ** 2) * 60 - 2.2 * min(1.5, inner[j][1] - inner[j][0])
    dp = [[INF] * m for _ in range(n - 1)]; bk = [[-1] * m for _ in range(n - 1)]
    for j in range(m): dp[0][j] = cost(0, j)
    for k in range(1, n - 1):
        best, bj = INF, -1
        for j in range(m):
            if j - 1 >= 0 and dp[k - 1][j - 1] < best: best, bj = dp[k - 1][j - 1], j - 1
            if best < INF: dp[k][j] = best + cost(k, j); bk[k][j] = bj
    j = min(range(m), key=lambda x: dp[n - 2][x]) if m else -1
    if j < 0 or dp[n - 2][j] >= INF: return None
    pick = [j]
    for k in range(n - 2, 0, -1):
        j = bk[k][j]; pick.append(j)
    return [inner[x] for x in reversed(pick)]

WORD = re.compile(r"[A-Za-z0-9’'\-]+")
MARK = re.compile(r"[.,?!;:]+")

def timings(text, runs, length):
    """runs: speech runs inside the clip (start,end). Returns word start times and mark times."""
    toks = [(m.start(), "w" if WORD.fullmatch(m.group()) else "m", m.group()) for m in re.finditer(r"[A-Za-z0-9’'\-]+|[.,?!;:]+", text)]
    clauses = [[]]
    for t in toks:
        clauses[-1].append(t)
        if t[1] == "m" and t is not toks[-1]: clauses.append([])
    clauses = [c for c in clauses if any(x[1] == "w" for x in c)]
    if len(runs) != len(clauses):  # fall back: one run over the whole speech
        runs = [(runs[0][0], runs[-1][1])] * 1 if runs else [(0, length)]
        clauses = [[t for c in clauses for t in c]]
    matched = len(clauses) > 1 or len(runs) == 1
    words, marks, seq = [], [], []
    for (a, b), c in zip(runs, clauses):
        ws = [t for t in c if t[1] == "w"]
        total = sum(len(t[2]) + 1 for t in ws) or 1
        acc = 0
        for t in c:
            if t[1] == "w":
                tm = round(a + (b - a) * acc / total, 3); words.append(tm); seq.append(("w", tm)); acc += len(t[2]) + 1
            else: seq.append(("m", round(a + (b - a) * acc / total, 3) if not matched else round(b, 3)))
    # a mark inside a clause (no pause found) is placed just before the next word
    for i, (k, tm) in enumerate(seq):
        if k == "m":
            nxt = next((t for kk, t in seq[i + 1:] if kk == "w"), None)
            marks.append(round(max(0, nxt - 0.05), 3) if (nxt is not None and tm > nxt) else tm)
    return words, marks

def main():
    mp3, man, bi, outdir, tjson = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
    M = json.load(open(man)); batch = M["batches"][bi]; clips = {c["id"]: c for c in M["clips"]}
    items = [clips[i] for i in batch["clips"]]
    gaps, dur = silences(mp3)
    s0, s1, inner = speech_span(gaps, dur)
    picks = choose(inner, s0, s1, [len(plain(c["say"])) + 6 for c in items])
    if picks is None: print("FAIL: not enough pauses", len(inner), "for", len(items)); sys.exit(2)
    bounds = [s0] + [x for g in picks for x in g] + [s1]
    try: T = json.load(open(tjson))
    except Exception: T = {}
    ok = True
    for i, c in enumerate(items):
        a, b = bounds[2 * i], bounds[2 * i + 1]
        a2, b2 = max(0, a - 0.06), min(dur, b + 0.12)
        out = f"{outdir}/{c['id']}.mp3"
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{a2:.3f}", "-to", f"{b2:.3f}", "-i", mp3, "-ac", "1", "-ar", "44100", "-b:a", "64k", out], check=True)
        g2, d2 = silences(out, d=0.08)
        r0, r1, inn = speech_span(g2, d2)
        runs, cur = [], r0
        for g in inn:
            if g[1] - g[0] >= 0.09: runs.append((cur, g[0])); cur = g[1]
        runs.append((cur, r1))
        w, mk = timings(c["text"], runs, d2)
        rate = (b - a) / max(1, len(plain(c["say"])))
        flag = "" if 0.035 <= rate <= 0.17 else "  <-- CHECK LENGTH"
        sep = picks[i][1] - picks[i][0] if i < len(picks) else None
        if flag: ok = False
        print(f"{c['id']} {b - a:5.2f}s {rate:.3f}s/ch sep={sep and round(sep,2)} runs={len(runs)} | {c['text'][:60]}{flag}")
        T[c["id"]] = {"key": c["key"], "f": f"{c['id']}.mp3", "d": round(d2, 2), "w": w, "m": mk, "v": c["voice"]}
    json.dump(T, open(tjson, "w"), indent=0)
    print("OK" if ok else "SOME CLIPS NEED A LOOK")

if __name__ == "__main__":
    main()
