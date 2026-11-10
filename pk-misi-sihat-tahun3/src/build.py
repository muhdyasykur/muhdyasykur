#!/usr/bin/env python3
"""Bina fail HTML tunggal (luar talian) daripada game.src.html.

Membenamkan fon Fredoka (OFL) dan ilustrasi Misi 2 sebagai base64,
supaya fail boleh dibuka terus tanpa internet.
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
FONTS = ROOT.parent / "assets" / "fonts"


def b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


src = (HERE / "game.src.html").read_text(encoding="utf-8")
src = src.replace("__FONT500__", b64(FONTS / "fredoka-latin-500-normal.woff2"))
src = src.replace("__FONT700__", b64(FONTS / "fredoka-latin-700-normal.woff2"))
src = src.replace("__ART__", b64(HERE / "assets" / "misi2-art.webp"))
out = ROOT / "Misi2_Saya_Yakin_Saya_Boleh.html"
out.write_text(src, encoding="utf-8")
print(f"{out.name}: {out.stat().st_size / 1024:.0f} KB")
