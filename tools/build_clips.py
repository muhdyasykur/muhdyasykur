"""Writes js/core/clips.js (the index of natural voice clips) from a timings.json made by voice_align.py.
usage: python3 tools/build_clips.py timings.json"""
import json, sys
T = json.load(open(sys.argv[1]))
idx = {v["key"]: {"f": v["f"], "d": v["d"], "w": v["w"], "m": v["m"], "v": v["v"]} for v in T.values()}
with open("js/core/clips.js", "w") as f:
    f.write("/* Natural voice clips (generated with ElevenLabs v4, bundled in assets/voice/). Built by tools/build_clips.py.\n"
            "   key = lower-case sentence + \"|\" + feeling; f = file, d = seconds, w = word start times, m = mark times, v = voice. */\n"
            "window.PA = window.PA || {};\nPA.CLIP_BASE = \"assets/voice/\";\nPA.CLIPS = " + json.dumps(idx, separators=(",", ":")).replace('},"', '},\n"') + ";\n")
print(len(idx), "clips indexed")
