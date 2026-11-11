#!/usr/bin/env python3
"""Jana RPH (DOCX) Misi 2: Saya Yakin, Saya Boleh! – Pendidikan Kesihatan Tahun 3.

Jalankan:  python3 src/build_rph.py   (kemudian LibreOffice menukar ke PDF)
"""
import pathlib
import re

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SHOTS = HERE / "assets" / "shots"
OUT = ROOT / "RPH_Misi2_Saya_Yakin_Saya_Boleh_Tahun3.docx"

NAVY = RGBColor(0x17, 0x2B, 0x78)
FONT = "Arial"

doc = Document()
st = doc.styles["Normal"]
st.font.name = FONT
st.font.size = Pt(11)
st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
st.paragraph_format.space_after = Pt(6)
st.paragraph_format.line_spacing = 1.5

sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
for s in (sec,):
    s.left_margin = s.right_margin = Cm(2)
    s.top_margin = s.bottom_margin = Cm(1.8)


# ------------------------------------------------------------------ helpers
def shade(cell, hex_fill):
    tcPr = cell._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear")
    sh.set(qn("w:color"), "auto")
    sh.set(qn("w:fill"), hex_fill)
    tcPr.append(sh)


def add_runs(p, text, size=None, color=None, bold_all=False, italic=False):
    """**tebal** dan _condong_ ringkas."""
    parts = re.split(r"(\*\*.+?\*\*|__.+?__)", text, flags=re.S)
    for part in parts:
        if not part:
            continue
        b = bold_all
        it = italic
        if part.startswith("**") and part.endswith("**"):
            part, b = part[2:-2], True
        elif part.startswith("__") and part.endswith("__"):
            part, it = part[2:-2], True
        r = p.add_run(part)
        r.bold = b
        r.italic = it
        if size:
            r.font.size = Pt(size)
        if color:
            r.font.color.rgb = color
    return p


def para(text="", size=None, bold=False, align=None, after=6, before=0, color=None, italic=False, style=None):
    p = doc.add_paragraph(style=style)
    add_runs(p, text, size=size, color=color, bold_all=bold, italic=italic)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    if align == "c":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "j":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return p


def heading(text, lvl=1):
    size = {0: 16, 1: 13, 2: 11.5}[lvl]
    p = para(text, size=size, bold=True, color=NAVY, before=16 if lvl else 0, after=8,
             align="c" if lvl == 0 else None)
    p.paragraph_format.keep_with_next = True
    if lvl == 1:
        pPr = p._p.get_or_add_pPr()
        bdr = OxmlElement("w:pBdr")
        bt = OxmlElement("w:bottom")
        for k, v in (("w:val", "single"), ("w:sz", "10"), ("w:space", "1"), ("w:color", "172B78")):
            bt.set(qn(k), v)
        bdr.append(bt)
        pPr.append(bdr)
    return p


def fill_cell(cell, content, size=11, bold=False):
    """content: str atau senarai baris. Baris bermula '• ' / '1. ' dikekalkan."""
    cell.text = ""
    lines = content if isinstance(content, list) else [content]
    first = True
    for ln in lines:
        p = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.2
        m = re.match(r"^(\s*)([•\-–]|\d+\.|[a-z]\.|\(\w+\))\s+(.*)$", ln)
        if m:
            indent = 0.35 + 0.35 * (len(m.group(1)) // 2)
            p.paragraph_format.left_indent = Cm(indent)
            p.paragraph_format.first_line_indent = Cm(-0.35)
            add_runs(p, m.group(2) + " " + m.group(3), size=size, bold_all=bold)
        else:
            add_runs(p, ln, size=size, bold_all=bold)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP


def set_widths(table, widths):
    table.autofit = False
    tbl = table._tbl
    grid = tbl.tblGrid
    for i, gc in enumerate(grid.findall(qn("w:gridCol"))):
        if i < len(widths):
            gc.set(qn("w:w"), str(int(widths[i] * 567)))
    tblPr = tbl.tblPr
    tw = tblPr.find(qn("w:tblW"))
    if tw is None:
        tw = OxmlElement("w:tblW")
        tblPr.append(tw)
    tw.set(qn("w:w"), str(int(sum(widths) * 567)))
    tw.set(qn("w:type"), "dxa")
    mar = OxmlElement("w:tblCellMar")
    for side, v in (("top", 85), ("bottom", 85), ("left", 115), ("right", 115)):
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:w"), str(v))
        e.set(qn("w:type"), "dxa")
        mar.append(e)
    tblPr.append(mar)
    lay = OxmlElement("w:tblLayout")
    lay.set(qn("w:type"), "fixed")
    tblPr.append(lay)
    for row in table.rows:
        for i, w in enumerate(widths):
            row.cells[i].width = Cm(w)


def repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trPr.append(el)


def table(header, rows, widths, size=11, head_fill="DCE3F7", first_col_fill=None, header_repeat=True):
    ncol = len(header) if header else len(rows[0])
    t = doc.add_table(rows=1, cols=ncol)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    if header:
        for i, h in enumerate(header):
            fill_cell(t.rows[0].cells[i], h, size=size, bold=True)
            shade(t.rows[0].cells[i], head_fill)
        if header_repeat:
            repeat_header(t.rows[0])
    for r in rows:
        cells = t.add_row().cells
        for i, v in enumerate(r):
            fill_cell(cells[i], v, size=size)
            if first_col_fill and i == 0:
                shade(cells[i], first_col_fill)
                for p in cells[i].paragraphs:
                    for run in p.runs:
                        run.bold = True
    if not header:
        t._tbl.remove(t.rows[0]._tr)
    set_widths(t, widths)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    return t


def kv(rows, widths=(4.2, 12.8), size=11):
    return table(None, rows, widths, size=size, first_col_fill="EEF1FB")


def page_break():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def new_section(landscape):
    s = doc.add_section()
    if landscape:
        s.orientation = WD_ORIENT.LANDSCAPE
        s.page_width, s.page_height = Cm(29.7), Cm(21)
    else:
        s.orientation = WD_ORIENT.PORTRAIT
        s.page_width, s.page_height = Cm(21), Cm(29.7)
    s.left_margin = s.right_margin = Cm(1.6 if landscape else 2)
    s.top_margin = s.bottom_margin = Cm(1.3 if landscape else 1.8)
    return s


X, O = "☒", "☐"

# ================================================================== KULIT
doc.add_picture(str(HERE / "assets" / "logo-ipg.png"), width=Cm(3.2))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
para("INSTITUT PENDIDIKAN GURU KAMPUS GAYA,\nKOTA KINABALU, SABAH", size=12, bold=True, align="c", after=10)
para("__PROGRAM IJAZAH SARJANA MUDA PERGURUAN DENGAN KEPUJIAN__", size=12, bold=True, align="c", after=0)
para("__PENGAJARAN BAHASA INGGERIS SEBAGAI BAHASA KEDUA (TESL)__", size=11, bold=True, align="c", after=8)
para("PENTAKSIRAN BERTERUSAN", size=13, bold=True, align="c", after=6)
para("KURSUS: KAEDAH PENGAJARAN PENDIDIKAN KESIHATAN", size=13, bold=True, align="c", after=2)
para("KOD KURSUS: PKES3143", size=13, bold=True, align="c", after=10)
para("**KANDUNGAN:**  i. Tugasan 1: Pembentangan (Individu) – Rancangan Pengajaran Harian & Micro Teaching", align="c", after=0)
para("ii. Tugasan 2: Projek – BBB (Kumpulan)", align="c", after=10)
kv([
    ["NAMA PELAJAR", "MUHAMMAD YASYKUR BIN MUHAMAD YASIM"],
    ["NOMBOR INDEKS", "2022072440140"],
    ["KUMPULAN", "TESL SJKC 2"],
    ["AMBILAN", "OGOS 2023 KELUARAN 2027"],
    ["SEMESTER/TAHUN", "SEMESTER 1 / TAHUN 4"],
    ["NOMBOR TELEFON", "018-2011748"],
    ["ALAMAT EMEL", "g-igp22070536@moe-dl.edu.my"],
    ["NAMA PENSYARAH", "ENCIK IRWAN BIN ISDUP"],
], widths=(5, 12), size=11)
para("**GRED:** ____________", after=6)
table(None, [
    ["**A. Perakuan Pelajar** (untuk diisi selepas penghantaran tugasan)\nDengan ini saya mengaku bahawa saya telah menerima maklum balas daripada pensyarah kerja kursus ini dan saya telah merujuk dan memahaminya.",
     "\n\n...................................\nTandatangan Pelajar\nTarikh: ____________"],
    ["**B. Pengesahan Pelajar Menerima Maklum Balas**\n(untuk dilengkapkan selepas menerima gred dan maklum balas daripada pensyarah)",
     "\n\n...................................\nTandatangan Pelajar\nTarikh: ____________"],
], (11.5, 5.5), size=11)

# ================================================================== HALAMAN TAJUK RPH
page_break()
heading("RANCANGAN PENGAJARAN HARIAN (RPH)", 0)
para("Pendidikan Kesihatan Tahun 3 · Misi 2: **Saya Yakin, Saya Boleh!**", align="c", size=11.5, after=2)
para("Disediakan oleh: **Muhammad Yasykur bin Muhamad Yasim**  ·  Pendekatan: **Berpusatkan Bahan (Material-Centred)**", align="c", after=2)
para("BBM: **Kit Misi Wira Yakin** = BBM digital __Misi2_Saya_Yakin_Saya_Boleh.html__ + bahan fizikal (Beg Misi, Sampul 1 & 2, Kad Respons, Kotak Cabaran, Pasport, Peti Wira Yakin)", align="c", after=8)

heading("BAHAGIAN A: MAKLUMAT ASAS")
kv([
    ["Mata Pelajaran", "Pendidikan Kesihatan (KSSR Semakan 2017, Pendidikan Jasmani dan Pendidikan Kesihatan)"],
    ["Tarikh / Hari", "6 Oktober 2026 / Selasa"],
    ["Masa", "9:00 pagi – 9:30 pagi (30 minit)"],
    ["Kelas / Tahun", "3 Indigo"],
    ["Kehadiran", "Enrolmen: 30  |  Hadir: 30 (L: 13, P: 17)  |  Tidak hadir: 0"],
    ["Bidang", [f"{O} Kesihatan Diri dan Reproduktif", f"{O} Penyalahgunaan Bahan",
                f"{X} **Kesihatan Mental, Emosi dan Sosial**", f"{O} Kekeluargaan", f"{O} Perhubungan",
                f"{O} Pemakanan", f"{O} Penyakit", f"{O} Keselamatan", f"{O} Pertolongan Cemas"]],
    ["Tajuk", "Pengurusan Mental dan Emosi: **Saya Yakin, Saya Boleh!** (Keyakinan Diri)"],
    ["Standard Kandungan", "**3.0 Pengurusan Mental dan Emosi**\n**3.1** Kemahiran mengurus mental dan emosi dalam kehidupan harian (cara meningkatkan: keyakinan diri)"],
    ["Standard Pembelajaran", ["Murid boleh:", "**3.1.1** Menjelaskan maksud keyakinan diri.",
                               "**3.1.2** Mengaplikasikan cara meningkatkan keyakinan diri dalam kehidupan harian."]],
    ["Pengetahuan sedia ada", "Murid pernah diminta menjawab soalan guru, membaca di hadapan kelas dan mencuba aktiviti baharu. Ada murid yang berasa malu atau takut jawapan mereka salah. Murid biasa menjawab secara lisan dan memilih jawapan menggunakan kad."],
    ["Susunan kelas", ["• 4 kumpulan (7–8 murid) dinamakan sempena 4 Kunci Keyakinan: **Berani, Jelas, Positif, Cuba Lagi**.",
                       "• Setiap meja kumpulan: **Beg Misi** (Sampul 1, Sampul 2, Tikar Lampu Isyarat).",
                       "• Ruang lapang di hadapan = **Pentas Wira Yakin** (demonstrasi). Dinding belakang = **Dinding Saya Boleh**.",
                       "• Meja guru: **Peti Wira Yakin** berkunci (mangga 4 digit), **Kotak Cabaran**, boneka Mei, projektor/TV."]],
    ["Nota isu sensitif", "Topik melibatkan emosi. Guru peka terhadap murid pemalu: tiada murid dipaksa bercakap seorang diri; perkongsian secara sukarela; demonstrasi dibuat bersama kumpulan; kesilapan tidak ditertawakan; murid tidak dibandingkan. Kamera Cermin Ajaib hanya memaparkan imej secara langsung (tiada rakaman disimpan) dan boleh diganti dengan cermin biasa."],
])

# ================================================================== OBJEKTIF
heading("OBJEKTIF PEMBELAJARAN DAN KRITERIA KEJAYAAN")
para("Pada akhir PdP selama 30 minit, murid dapat:", after=4)
table(["Domain & aras", "Objektif pembelajaran", "Kriteria kejayaan (Saya boleh…)"], [
    ["**KOGNITIF**\n(Anderson & Krathwohl, 2001)\n(i) Memahami\n(ii) Mengaplikasi\n\nSP 3.1.1, 3.1.2\nTP1–TP4",
     ["**(i)** Menjelaskan maksud keyakinan diri dengan **melengkapkan ayat definisi** dalam bahagian 1 **Pasport Wira Yakin** secara bertulis dengan betul. __(Langkah 2)__",
      "**(ii)** **Memilih** tindakan yang menunjukkan keyakinan diri dengan betul bagi **sekurang-kurangnya 3 daripada 4** situasi **Kad Cabaran** menggunakan **Kad Respons A, B, C**. __(Langkah 4)__"],
     ["**(i)** Saya boleh menulis perkataan yang betul untuk melengkapkan maksud keyakinan diri.",
      "**(ii)** Saya boleh memilih jawapan yang menunjukkan keyakinan diri bagi sekurang-kurangnya 3 daripada 4 cabaran."]],
    ["**PSIKOMOTOR**\n(Simpson, 1972)\nRespons Berpandu (Guided Response)\n\nSP 3.1.2\nTP4",
     "**Mendemonstrasikan Gaya Wira Yakin** bersama kumpulan di **Pentas Wira Yakin** dengan menggunakan **prop Kad Cabaran** (mikrofon mainan / Kad Bacaan / cawan kertas / hasil kerja), dengan memenuhi **sekurang-kurangnya 3 daripada 4 elemen**: (a) berdiri tegak, (b) memandang ke hadapan, (c) bercakap dengan suara yang jelas (Meter Suara zon hijau), (d) melakukan tindakan yakin dengan prop. __(Langkah 4)__",
     "Saya boleh berdiri tegak, memandang ke hadapan, bercakap dengan suara yang jelas dan menggunakan prop untuk menunjukkan tindakan yakin semasa cabaran kumpulan saya."],
    ["**AFEKTIF**\n(Krathwohl, Bloom & Masia, 1964)\nBertindak balas → Menghargai\n\nNilai: berani, yakin diri",
     ["Menunjukkan **sikap berani mencuba** melalui tingkah laku sukarela, iaitu:",
      "(a) **menawarkan diri secara sukarela** untuk sekurang-kurangnya **satu peranan** dalam aktiviti kumpulan atau cabaran (pembaca, penyusun, pemegang prop, pembentang atau berdiri di hadapan Cermin Ajaib) tanpa dipaksa; dan",
      "(b) **menulis satu azam “Saya boleh…”** pada **Bintang Saya Boleh** dan menampalnya di **Dinding Saya Boleh**. __(Langkah 2–5)__"],
     "Saya berani menawarkan diri untuk satu tugas dan saya boleh menulis satu azam “Saya boleh…” tentang diri saya."],
], (3.4, 8.4, 5.2), size=11)

heading("Analisis Penulisan Objektif (Format ABCD: Mager, 1997)", 2)
table(["", "A (Audience)", "B (Behaviour: kata kerja boleh diperhati)", "C (Condition: bahan / situasi)", "D (Degree: kriteria)"], [
    ["K(i)", "Murid Tahun 3", "melengkapkan (menjelaskan) ayat definisi", "Pasport Wira Yakin, selepas sebutan bersama", "betul (1 perkataan kunci “yakin”)"],
    ["K(ii)", "Murid Tahun 3", "memilih tindakan yakin", "4 situasi Kad Cabaran, Kad Respons A/B/C", "≥ 3 daripada 4 betul"],
    ["P", "Murid Tahun 3 (dalam kumpulan)", "mendemonstrasikan Gaya Wira Yakin", "Pentas Wira Yakin, prop Kad Cabaran, Meter Suara", "≥ 3 daripada 4 elemen dalam senarai semak"],
    ["A", "Murid Tahun 3", "menawarkan diri secara sukarela; menulis azam", "aktiviti kumpulan & Bintang Saya Boleh", "≥ 1 peranan sukarela + 1 azam ditampal"],
], (1.5, 2.6, 4.3, 4.8, 3.8), size=11)
para("__Rasional pemilihan kata kerja:__ **Kognitif** menggunakan kata kerja proses berfikir yang dapat dinilai betul/salah (melengkapkan, memilih). **Psikomotor** menggunakan kata kerja pergerakan fizikal yang boleh diperhati dan dinilai melalui senarai semak (mendemonstrasikan postur, pandangan mata, suara dan tindakan dengan prop); ia ialah **kemahiran kesihatan yang diaplikasikan (SP 3.1.2)**, bukan sekadar memegang bahan. **Afektif** tidak dinilai betul/salah; sikap dibuktikan melalui **tingkah laku sukarela** (menawarkan diri, menyatakan komitmen) mengikut aras Krathwohl __Bertindak balas__ (mengambil bahagian dengan rela) dan __Menghargai__ (menyatakan komitmen peribadi).", size=11, align="j")

heading("Jadual Penjajaran Konstruktif (Objektif ↔ Aktiviti ↔ Bahan ↔ Pentaksiran)", 2)
table(["Objektif", "Aktiviti (Langkah)", "Bahan yang memandu", "Instrumen pentaksiran", "TP"], [
    ["K(i)", "L2 Kenal: sebut definisi bersama, lengkapkan Pasport; L5 rumusan", "Skrin Kenal (karaoke + TTS), Pasport bhg 1", "Pasport (bertulis), soal jawab", "TP1, TP3"],
    ["K(ii)", "L3 Tikar Lampu Isyarat & Kuiz Kilat (latihan); L4 Fikir & Pilih bagi 4 cabaran (pentaksiran)", "Sampul 2, Tikar, Kad Respons A/B/C, Roda Cabaran", "Kad Respons (semua murid), senarai semak K", "TP2, TP4"],
    ["P", "L4 Gaya Wira Yakin (demonstrasi guru → tiru) dan Tunjukkan (kumpulan beraksi)", "Poster Gaya, prop Kotak Cabaran, Meter Suara", "Senarai semak Gaya Wira Yakin (4 elemen)", "TP4"],
    ["A", "L2–L4 peranan sukarela; L5 Cermin Ajaib & Dinding Saya Boleh", "Kad Tugasan (peranan), Cermin Ajaib, Bintang, Dinding", "Senarai semak A1/A2, Bintang, Meter Keyakinan (persepsi kendiri)", "–"],
], (2.2, 4.8, 3.9, 4.0, 2.1), size=11)

# ================================================================== ELEMEN MERENTAS
heading("ELEMEN MERENTAS KURIKULUM DAN BAHAN")
table(["Elemen", "Pilihan", "Bukti dalam aktiviti (Langkah)"], [
    ["KBAT", [f"{O} Mengingat", f"{X} Memahami", f"{X} Mengaplikasi", f"{O} Menganalisis", f"{X} Menilai", f"{O} Mencipta"],
     ["**Memahami:** L2 (menjelaskan maksud), L3 (mengelaskan tingkah laku).", "**Mengaplikasi:** L4 (memilih & mendemonstrasikan tindakan yakin).", "**Menilai:** L1 (menilai tindakan Mei), L3 Gallery Walk (menilai tikar kumpulan lain)."]],
    ["EMK", [f"{X} Bahasa", f"{X} Nilai Murni", f"{X} Kreativiti & Inovasi", f"{X} TMK", f"{O} Patriotisme", f"{O} Keusahawanan"],
     ["**Bahasa:** L2, L4, L5 (menyebut, membaca, menulis azam).", "**Nilai Murni:** L1–L5.", "**Kreativiti:** L4 (cara beraksi dengan prop).", "**TMK:** L1–L5 (BBM digital)."]],
    ["Nilai murni", "Berani, yakin diri, kerjasama, hormat-menghormati (tidak mentertawakan kesilapan rakan)", "L2–L4 (kerja kumpulan), L4 (menghargai aksi rakan dengan isyarat 👍), L5"],
    ["Kemahiran hidup (PK)", [f"{X} Membuat keputusan", f"{X} Komunikasi berkesan", f"{X} Mengurus emosi", f"{X} Menetapkan matlamat", f"{O} Asertif", f"{O} Menyelesaikan masalah"],
     ["**Membuat keputusan:** L3, L4.", "**Komunikasi berkesan:** L4 (suara jelas).", "**Mengurus emosi:** L1, L4 (takut salah → cuba lagi).", "**Menetapkan matlamat:** L5 (azam “Saya boleh…”)."]],
    ["PAK21", [f"{X} Komunikasi", f"{X} Kolaborasi", f"{X} Pemikiran kritis", f"{X} Kreativiti", f"{X} Nilai & etika"],
     ["**Kolaborasi:** L2, L3 (Sampul berkumpulan).", "**Pemikiran kritis:** L3, L4.", "**Komunikasi:** L4, L5.", "**Nilai & etika:** L3–L5."]],
    ["Kecerdasan pelbagai", "Kinestetik, interpersonal, intrapersonal, linguistik, visual-ruang", "L4 (kinestetik), L2–L3 (interpersonal), L5 (intrapersonal)"],
    ["Kaedah / teknik", [f"{X} Permainan (misi bilik rahsia, roda, peti)", f"{X} Demonstrasi", f"{X} Gallery Walk", f"{X} Padlet Wall (Dinding Saya Boleh)", f"{O} Main peranan", f"{O} Think-Pair-Share"],
     ["**Permainan:** L1–L5 (4 kod → buka peti).", "**Demonstrasi:** L4.", "**Gallery Walk:** L3.", "**Padlet Wall:** L5."]],
], (3.0, 6.0, 8.0), size=11)

heading("Senarai Bahan (BBM)", 2)
table(["Bil", "Bahan", "Kuantiti", "Fungsi dalam pendekatan berpusatkan bahan", "Langkah"], [
    ["1", "**BBM digital Misi 2** (HTML luar talian, projektor/TV)", "1", "Memandu urutan PdP, memaparkan Kad Tugasan, pemasa, maklum balas serta-merta, Meter Suara, Roda Cabaran, kunci peti", "1–5"],
    ["2", "**Beg Misi** kumpulan", "4", "Pek bahan kendiri setiap kumpulan", "2–3"],
    ["3", "**Sampul 1:** 4 kad gambar + 4 kad Kunci (simbol ★ ● ▲ ■)", "4 set", "Padanan; simbol membolehkan murid **menyemak sendiri** (kawalan kesilapan)", "2"],
    ["4", "**Sampul 2:** Tikar Lampu Isyarat + 8 kad tingkah laku", "4 set", "Manipulasi & pengelasan; bahan menjadi bahan semakan Gallery Walk", "3"],
    ["5", "**Kad Respons A, B, C**", "30 set", "Respons serentak semua murid (pentaksiran K)", "1, 3, 4"],
    ["6", "**Pasport Wira Yakin**", "30", "Instrumen individu (K, P kendiri, A); dicop selepas setiap misi", "2–5"],
    ["7", "**Kotak Cabaran:** 4 Kad Cabaran + prop (mikrofon mainan, Kad Bacaan, 3 cawan kertas, lukisan)", "1", "Bahan konkrit untuk demonstrasi psikomotor", "4"],
    ["8", "**Poster Gaya Wira Yakin** (4 elemen)", "1", "Model visual psikomotor", "4"],
    ["9", "**Boneka Mei**", "1", "Watak rangsangan (set induksi)", "1"],
    ["10", "**Cermin Ajaib** (kamera komputer riba / cermin prop)", "1", "Peneguhan kendiri afektif", "5"],
    ["11", "**Bintang “Saya boleh…”** + **Dinding Saya Boleh** (kertas mahjung)", "30 + 1", "Padlet Wall fizikal (bukti A)", "5"],
    ["12", "**Peti Wira Yakin** + mangga 4 digit + **4 Kad Digit** + **Lencana Wira Yakin Diri**", "1 + 4 + 30", "Matlamat permainan; ganjaran; penutup sosial", "1, 5"],
    ["13", "**Pas Ejen**, pelekat ⭐, senarai semak pemerhatian", "30, 1", "Penglibatan & rekod pentaksiran", "1–5"],
], (1.2, 5.0, 2.1, 6.6, 2.4), size=11)
para("Semua bahan fizikal tersedia dalam __Bahan_Cetak_Misi2.pdf__ (14 halaman A4) dan boleh dicetak terus daripada menu **Bahan Cetak** dalam BBM digital.", size=11, italic=True)

# ================================================================== KESEPADANAN PENDEKATAN
heading("KESEPADANAN PENDEKATAN DENGAN JADUAL INDUK PENGAJARAN")
table(["Aspek", "Pilihan dalam RPH", "Justifikasi"], [
    ["Pendekatan", "**Berpusatkan Bahan (Material-Centred)**", "Bahan, bukan syarahan guru, menjadi sumber isi, arahan dan maklum balas. Murid belajar dengan memegang, menyusun, menulis dan mendemonstrasikan menggunakan bahan. Guru merancang dan menyediakan bahan, kemudian menjadi fasilitator."],
    ["Gaya Mosston & Ashworth", "**B. Practice Style (Gaya Latihan)**", "Guru membuat semua keputusan pra-impak (isi, bahan, Kad Tugasan). Semasa impak, murid membuat keputusan sendiri: susunan tugasan, kadar, peranan dan masa mula/berhenti dalam Sampul 1 & 2. Guru bergerak memberi maklum balas individu secara peribadi."],
    ["Strategi", "**Pembelajaran Berasaskan Teknologi** + bahan konkrit", "BBM digital memandu aliran, memaparkan Kad Tugasan, memberi maklum balas serta-merta dan merekod senarai semak. Bahan fizikal memastikan pembelajaran konkrit (Bruner: enaktif → ikonik → simbolik)."],
    ["Kaedah", "**Permainan** dan **Demonstrasi**", "Misi bilik rahsia: 4 kod membuka Peti Wira Yakin. Demonstrasi Gaya Wira Yakin oleh guru dan kumpulan (L4)."],
    ["Teknik", "**Gallery Walk** dan **Padlet Wall**", "Gallery Walk menyemak tikar kumpulan lain (L3). Dinding Saya Boleh sebagai Padlet Wall fizikal + digital (L5)."],
], (3.2, 4.4, 9.4), size=11)

heading("Ciri Pendekatan Berpusatkan Bahan dan Buktinya dalam RPH", 2)
table(["Ciri pendekatan berpusatkan bahan", "Bukti dalam RPH ini"], [
    ["Bahan menjadi **sumber utama isi pelajaran**", "Maksud, 4 Kunci Keyakinan dan situasi disampaikan melalui skrin, Sampul dan Kad Cabaran (L2–L4)."],
    ["Bahan **memberi arahan** (murid boleh bekerja tanpa syarahan)", "Kad Tugasan bergambar pada setiap sampul + skrin Kad Tugasan dengan pemasa (L2, L3)."],
    ["Murid **memanipulasi bahan** secara aktif (hands-on)", "Memadankan kad, mengasingkan kad pada tikar, beraksi dengan prop, menulis Pasport, menampal bintang (L2–L5)."],
    ["Bahan **menyemak sendiri** (self-correcting / kawalan kesilapan)", "Simbol padanan (L2); maklum balas serta-merta skrin (L3, L4); peti hanya terbuka dengan kod betul (L5)."],
    ["Pembelajaran **mengikut kadar dan keputusan murid**", "Gaya B: kumpulan menentukan peranan, susunan dan kadar dalam Sampul 1 & 2."],
    ["Guru sebagai **perancang dan fasilitator**", "Guru menyediakan Kit Misi (pra-impak), bergerak memberi maklum balas, merekod senarai semak (impak & pasca-impak)."],
    ["Bahan **pelbagai deria** (Dale, 1969)", "Visual (skrin, poster), auditori (TTS, Meter Suara), kinestetik (kad, prop, pergerakan), sentuhan (sampul, peti)."],
], (6.0, 11.0), size=11)

# ================================================================== BAHAGIAN B (LANDSCAPE)
new_section(True)
heading("BAHAGIAN B: LANGKAH PdP DAN PENTAKSIRAN")
para("**Peta aliran BBM:** Mula → Kenal → Pilih → Bertindak → Refleksi → Buka Peti  ·  **Masa:** 3 + 5 + 7 + 10 + 5 = 30 minit  ·  Setiap misi selesai = 1 Kad Digit Kod (🔑) untuk membuka Peti Wira Yakin.", size=11)
para("**Pra-impak (sebelum 9:00):** susun 4 meja kumpulan; letak Beg Misi di setiap meja; edar Kad Respons, Pasport dan Pas Ejen; kunci Peti dengan kod yang sama dengan tetapan BBM (Persediaan Guru); tampal Poster Gaya dan Dinding Saya Boleh; buka BBM dalam skrin penuh; uji mikrofon/kamera.", size=11, after=5)

H = ["Langkah / Masa", "Isi pelajaran", "Aktiviti pengajaran dan pembelajaran (Guru ↔ Murid)", "Bahan yang memandu", "Catatan (Domain / KBAT / EMK / Nilai / PAK21 / Pentaksiran)"]
W = (2.6, 4.1, 10.4, 3.6, 5.8)
table(H, [
    ["**Langkah 1:\nSet Induksi\n(MULA)**\n\n3 minit\n9:00–9:03",
     ["**Rangsangan:** situasi Mei.", "Mei tahu jawapan soalan guru tetapi takut jawapannya salah.", "", "**Soalan:** “Patutkah Mei mencuba menjawab? Mengapa?”", "", "**Jangkaan jawapan:** “Patut, kerana mencuba ialah cara terbaik untuk belajar.”"],
     ["1. Guru masuk dalam watak **Ketua Ejen**, meletakkan **Peti Wira Yakin** berkunci di hadapan. Murid memakai Pas Ejen.",
      "2. Guru klik **Mesej Rahsia**. Skrin memaparkan Mei dan Meter Keyakinan Mei yang rendah; guru menggerakkan **boneka Mei** semasa TTS membaca situasi.",
      "3. Murid berfikir 5 saat. Guru menekan **Kira 3-2-1**; semua murid mengangkat **Kad A (Ya)** atau **B (Tidak)** serentak.",
      "4. Guru menekan **Semak Jawapan**: bahan memaparkan jawapan A dan maklum balas, dan Mei berubah menjadi yakin. Guru meminta 2 murid memberi sebab.",
      "5. Skrin **Misi Hari Ini**: guru menerangkan misi (4 kod → buka peti) dan membaca kriteria kejayaan “Hari ini saya boleh…”.",
      "6. Guru memperkenalkan panggilan kelas: Guru “**Wira Yakin?**” → Murid “**Saya boleh!**”."],
     ["• BBM digital: skrin Mula (Mesej, Soalan, Misi)", "• Boneka Mei", "• Peti Wira Yakin", "• Kad Respons A/B", "• Pas Ejen"],
     ["**Afektif (menerima):** menarik minat dan perhatian.", "**KBAT:** Menilai (tindakan Mei).", "**PAK21:** Komunikasi.", "**Nilai:** Berani.", "**Pentaksiran:** pemerhatian Kad Respons (diagnostik), soal jawab lisan."]],
    ["**Langkah 2:\nPerkembangan 1\n(KENAL)**\n\n5 minit\n9:03–9:08\n\nObjektif: K(i), A(a)",
     ["**Maksud keyakinan diri:** berasa yakin dengan kemampuan diri untuk melakukan sesuatu.", "", "**4 Kunci (cara meningkatkan keyakinan diri):**", "1. Berani mencuba", "2. Bercakap dengan jelas", "3. Kata-kata positif", "4. Terima kesilapan, cuba lagi", "", "**Kepentingan:** berani mencuba, tidak takut membuat kesilapan, lebih mudah belajar."],
     ["1. Skrin memaparkan definisi. Guru menekan **Sebut bersama**: murid menyebut maksud 2 kali mengikut sorotan perkataan (karaoke + TTS).",
      "2. Murid menulis perkataan yang hilang pada **bahagian 1 Pasport** (individu, 30 saat).",
      "3. Guru membalikkan kad **contoh yakin / kurang yakin** di skrin dan bersoal jawab.",
      "4. **Misi 1 (Sampul 1), 2 minit, Gaya B:** murid memilih peranan secara sukarela (pembaca, penyusun, penyemak, pembentang), membaca **Kad Tugasan**, memadankan 4 kad gambar dengan 4 kad Kunci dan **menyemak sendiri** menggunakan simbol di sudut kad. Guru bergerak memberi maklum balas individu.",
      "5. Wakil satu kumpulan memadankan kad di skrin; bahan memaparkan 4 Kunci bersama penerangan.",
      "6. Soal jawab: “Mengapa keyakinan diri penting?” Guru memaparkan jangkaan jawapan.",
      "7. **Kod ke-1** dipaparkan; guru memberi **Kad Digit 1**; Pasport dicop."],
     ["• BBM digital: skrin Kenal (definisi, flip card, Kad Tugasan 1 + pemasa, padanan)", "• Sampul 1", "• Pasport bhg 1", "• Kad Digit 1"],
     ["**Kognitif K(i):** melengkapkan definisi (TP1); contoh cara (TP2); kepentingan (TP3).", "**Afektif A(a):** peranan sukarela.", "**KBAT:** Memahami.", "**EMK:** Bahasa.", "**PAK21:** Kolaborasi.", "**Pentaksiran:** Pasport bhg 1 (bertulis), pemerhatian, soal jawab."]],
    ["**Langkah 3:\nPerkembangan 2\n(PILIH)**\n\n7 minit\n9:08–9:15\n\nObjektif: K(ii) – latihan",
     ["**Mengenal pasti tingkah laku yakin dan belum yakin.**", "", "**Yakin:** angkat tangan; suara jelas; “Saya boleh cuba!”; betulkan kesilapan & cuba lagi.", "", "**Belum yakin:** menyorok; terlalu perlahan; “Saya tidak pandai”; enggan mencuba.", "", "**Mengubah** tingkah laku belum yakin menjadi yakin."],
     ["1. **Misi 2 (Sampul 2), 2½ minit, Gaya B:** kumpulan membentangkan **Tikar Lampu Isyarat**, membaca 8 kad tingkah laku dan mengasingkannya ke 🟢 YAKIN / 🔴 BELUM YAKIN. Kumpulan memilih satu kad merah dan berbincang cara mengubahnya menjadi hijau.",
      "2. **Gallery Walk (1 minit):** kumpulan bergerak ikut arah jam ke meja sebelah, menyemak tikar kumpulan lain, dan menampal ⭐ (betul) atau 🔄 (perlu dialih).",
      "3. **Semak bersama (1½ minit):** wakil memindahkan kad ke lampu di skrin. Bahan memberi maklum balas dan cadangan perubahan (cth. “Tukar kepada ‘Saya boleh belajar!’”). Kumpulan membetulkan tikar sendiri.",
      "4. **Kuiz Kilat (1½ minit):** 2 situasi; selepas Kira 3-2-1, semua murid mengangkat Kad Respons A/B/C; guru mengira bilangan jawapan betul.",
      "5. Murid menanda ✓ pada **bahagian 2 Pasport**. **Kod ke-2** + Kad Digit 2."],
     ["• BBM digital: skrin Pilih (Kad Tugasan 2, Gallery Walk + pemasa, pengasingan, Kuiz Kilat)", "• Sampul 2 + Tikar", "• Pelekat ⭐ / 🔄", "• Kad Respons A/B/C", "• Pasport bhg 2"],
     ["**Kognitif K(ii):** latihan memilih (TP2, TP4).", "**KBAT:** Memahami (mengelas), Menilai (Gallery Walk).", "**PK:** Membuat keputusan.", "**Teknik:** Gallery Walk.", "**Nilai:** Kerjasama, hormat.", "**Pentaksiran:** senarai semak K (skor tikar /8), Kad Respons."]],
    ["**Langkah 4:\nAplikasi\n(BERTINDAK)**\n\n10 minit\n9:15–9:25\n\nObjektif: K(ii), P, A(a)\n\n(Pentaksiran utama)",
     ["**Mengaplikasikan cara meningkatkan keyakinan diri dalam situasi harian:**", "", "C1 Berkongsi idea dengan kelas", "C2 Tersilap ketika membaca", "C3 Aktiviti baharu yang sukar", "C4 Menunjukkan hasil kerja", "", "**Gaya Wira Yakin:**", "🧍 berdiri tegak", "👀 pandang ke hadapan", "🗣️ suara jelas", "✋ tindakan yakin"],
     ["**A. Demonstrasi Gaya Wira Yakin (1½ minit):** guru menunjukkan 4 elemen menggunakan **Poster Gaya** dan skrin; semua murid **bangun dan meniru**. Kelas menyebut “Saya yakin, saya boleh!”; **Meter Suara** (mikrofon) menunjukkan zon jelas.",
      "**B. Roda Cabaran (8 minit, ±2 minit setiap kumpulan):** guru/murid memutar roda. Kumpulan yang dipilih mengambil Kad Cabaran dan prop daripada **Kotak Cabaran**.",
      "  a. **Fikir & Pilih (semua murid):** situasi dibaca; selepas Kira 3-2-1, murid mengangkat Kad A/B/C; bahan memaparkan jawapan dan maklum balas.",
      "  b. **Tunjukkan (kumpulan beraksi, 45 saat):** kumpulan mendemonstrasikan tindakan yakin dengan prop di Pentas Wira Yakin. Guru menanda **senarai semak Gaya Wira Yakin** bagi ±8 murid; murid lain memberi isyarat 👍.",
      "  c. **Sebut (Kesediaan):** seluruh kelas melafazkan ayat positif kad; Meter Suara mengisi bintang. Guru menanda A(a) bagi murid yang menawarkan diri.",
      "**C.** Selepas 4 cabaran: **Kod ke-3** + Kad Digit 3; murid mewarnakan **bahagian 3 Pasport**."],
     ["• BBM digital: Gaya Wira Yakin, Meter Suara, Roda Cabaran, skrin cabaran 3 bahagian", "• Poster Gaya", "• Kotak Cabaran: 4 Kad Cabaran + prop", "• Kad Respons", "• Senarai semak", "• Pasport bhg 3"],
     ["**Psikomotor P:** ≥ 3/4 elemen Gaya Wira Yakin (TP4).", "**Kognitif K(ii):** ≥ 3/4 situasi betul.", "**Afektif A(a):** peranan sukarela.", "**KBAT:** Mengaplikasi.", "**Kaedah:** Permainan, Demonstrasi.", "**PK:** Komunikasi berkesan, mengurus emosi.", "**Nilai:** Berani, menghormati rakan (tidak mentertawakan).", "**Pentaksiran:** senarai semak P, Kad Respons, pemerhatian."]],
    ["**Langkah 5:\nRefleksi & Penutup\n(REFLEKSI → BUKA PETI)**\n\n5 minit\n9:25–9:30\n\nObjektif: A(b), K(i)",
     ["**Rumusan:** keyakinan diri ialah berasa **yakin** dengan kemampuan diri untuk melakukan sesuatu.", "", "Cara meningkatkannya: berani mencuba, bercakap dengan jelas, kata-kata positif, terima kesilapan dan cuba lagi.", "", "**Azam:** “Saya boleh…”"],
     ["1. **Cermin Ajaib (1 minit):** 2 murid sukarela berdiri di hadapan Cermin Ajaib (kamera/cermin prop) dan menyebut “Saya yakin, saya boleh! Saya boleh …”.",
      "2. **Dinding Saya Boleh (1½ minit):** setiap murid menulis satu azam pada **Bintang** dan menampalnya di Dinding (Padlet Wall). Guru menaip 2–3 azam ke dinding digital.",
      "3. **Meter Keyakinan Saya (30 saat):** murid mewarnakan **bahagian 4 Pasport** dan mengangkat tangan; guru mengira (persepsi kendiri).",
      "4. **Penutup kognitif (1 minit):** murid melengkapkan definisi bersama (perkataan tersembunyi didedahkan) dan menyatakan kunci yang digunakan hari ini. **Kod ke-4**.",
      "5. **Penutup sosial (1 minit):** wakil memasukkan 4 Kad Digit pada papan kekunci skrin; Peti digital terbuka, guru membuka mangga Peti sebenar. Ketua kumpulan mengedarkan **Lencana Wira Yakin Diri**; kelas melafazkan **Ikrar Wira Yakin**. Guru memberi **Cabaran Minggu Ini**: cuba satu perkara baharu dengan yakin."],
     ["• BBM digital: Cermin Ajaib, Dinding, Meter Keyakinan, Rumusan, Buka Peti, Tahniah", "• Bintang + Dinding Saya Boleh", "• Pasport bhg 4", "• Peti + mangga + Kad Digit", "• Lencana"],
     ["**Afektif A(b):** azam ditampal (Menghargai).", "**Kognitif K(i):** pengukuhan.", "**Teknik:** Padlet Wall.", "**PK:** Menetapkan matlamat.", "**EMK:** Bahasa.", "**Pentaksiran:** Bintang, Pasport, Meter Keyakinan.", "**Penutup:** peneguhan positif, ganjaran, ikrar."]],
], W, size=11)

# ================================================================== KEMBALI KE POTRET
new_section(False)
heading("PENTAKSIRAN")
kv([
    ["Kaedah", f"{X} Pemerhatian   {X} Lisan / soal jawab   {X} Lembaran kerja (Pasport)   {X} Hasil kerja (Tikar, Bintang)   {X} Kuiz (Kad Respons)   {O} Main peranan"],
    ["Instrumen", f"{X} Senarai semak pemerhatian (K, P, A)   {X} Pasport Wira Yakin   {X} Rubrik / Standard Prestasi DSKP   {X} Rekod digital (Senarai Semak dalam BBM, eksport CSV)"],
    ["TP disasarkan", f"{X} TP1  {X} TP2  {X} TP3  {X} TP4  {O} TP5  {O} TP6   (TP5–TP6 melalui pengayaan)"],
    ["Pencapaian murid", "TP1: ___  TP2: ___  TP3: ___  TP4: ___  TP5: ___  TP6: ___"],
])
table(["Domain", "Bukti", "Instrumen", "Kriteria “mencapai”"], [
    ["K(i)", "Pasport bhg 1", "Pasport + senarai semak K1", "Perkataan “yakin” ditulis dengan betul"],
    ["K(ii)", "Kad Respons dalam 4 cabaran", "Senarai semak K2 / kiraan dalam BBM", "≥ 3 daripada 4 betul"],
    ["P", "Aksi di Pentas Wira Yakin", "Senarai semak Gaya Wira Yakin (🧍 👀 🗣️ ✋)", "≥ 3 daripada 4 elemen"],
    ["A", "Peranan sukarela, Bintang di dinding", "Senarai semak A1, A2; Meter Keyakinan (tidak dinilai)", "≥ 1 peranan sukarela + 1 azam"],
], (2.0, 4.5, 6.0, 4.5), size=11)
kv([
    ["Pengayaan\n(murid yang menguasai)", ["**TP5:** murid mengesyorkan satu cara meningkatkan keyakinan diri melalui amalan positif kepada rakan yang takut menjawab (menjadi “Mentor Wira” dalam kumpulan).", "**TP6:** murid berdiri di hadapan Cermin Ajaib dan berkomunikasi dengan yakin tentang keistimewaan diri: “Saya istimewa kerana…”."]],
    ["Pemulihan\n(murid yang belum menguasai)", ["Guru mengulang maksud keyakinan diri dengan Kad Gambar Sampul 1 dan boneka Mei.", "Murid berpasangan dengan rakan sebaya (buddy) untuk mengulang Tikar Lampu Isyarat (4 kad sahaja).", "Murid menyebut “Saya boleh cuba!” bersama guru dan berdemonstrasi dalam kumpulan kecil (tidak seorang diri)."]],
    ["Pembezaan", ["Arahan bergambar dan TTS untuk murid lemah membaca; peranan dalam kumpulan dipilih mengikut keselesaan.", "Murid pemalu boleh menunjukkan keyakinan melalui peranan pemegang prop dahulu, kemudian pembaca."]],
    ["Pengurusan bilik darjah", ["Panggilan “Wira Yakin? – Saya boleh!” untuk mendapatkan perhatian; Kira 3-2-1 untuk respons serentak.", "Pemasa pada skrin bagi setiap tugasan; Gallery Walk ikut arah jam; prop selamat (tiada objek tajam)."]],
    ["Pelan kontingensi", ["Jika projektor/komputer gagal: semua bahan fizikal tetap berfungsi (Kad Tugasan bercetak, Tikar, Kad Cabaran, Peti); guru membaca situasi daripada kad.", "Jika mikrofon/kamera tidak dibenarkan: gunakan butang “Isi manual” dan cermin prop. BBM berfungsi tanpa internet."]],
])
heading("Standard Prestasi (DSKP, SK 3.1) yang Dirujuk", 2)
table(["TP", "Pernyataan", "Bukti dalam PdP"], [
    ["TP1", "Menyatakan maksud keyakinan diri.", "L2 sebut bersama; Pasport bhg 1"],
    ["TP2", "Memberi contoh cara meningkatkan keyakinan diri.", "L2 padanan 4 Kunci; L3 Tikar"],
    ["TP3", "Menjelaskan dengan contoh kepentingan keyakinan diri dalam kehidupan harian.", "L2 soal jawab kepentingan"],
    ["TP4", "Memilih cara meningkatkan keyakinan diri melalui amalan positif.", "L3 Kuiz Kilat; L4 Fikir & Pilih + Tunjukkan"],
    ["TP5", "Mengesyorkan cara meningkatkan keyakinan diri melalui amalan positif.", "Pengayaan: Mentor Wira"],
    ["TP6", "Berkomunikasi dengan yakin tentang keistimewaan diri.", "Pengayaan: “Saya istimewa kerana…”"],
], (1.4, 9.0, 6.6), size=11)

# ================================================================== BAHAGIAN C
page_break()
heading("BAHAGIAN C: REFLEKSI GURU (diisi selepas PdP)")
kv([
    ["Objektif tercapai?", [f"Kognitif K(i): {O} Ya  {O} Sebahagian  {O} Tidak   ___ / 30 murid", f"Kognitif K(ii): {O} Ya  {O} Sebahagian  {O} Tidak   ___ / 30 murid",
                            f"Psikomotor P: {O} Ya  {O} Sebahagian  {O} Tidak   ___ / 30 murid", f"Afektif A: {O} Ya  {O} Sebahagian  {O} Tidak   ___ / 30 murid"]],
    ["Kekuatan PdP", "\n\n"],
    ["Kelemahan / masalah", "\n\n"],
    ["Tindakan penambahbaikan", "\n\n"],
    ["PdP ditunda (jika ada) dan sebab", "\n"],
])

table(["Disediakan oleh", "Disemak oleh"], [
    ["Nama: Muhammad Yasykur bin Muhamad Yasim", "Nama: Encik Irwan bin Isdup"],
    ["Tandatangan:", "Tandatangan:"],
    ["Tarikh:", "Tarikh:"],
], (8.5, 8.5), size=11)
page_break()
heading("BAHAGIAN D: ULASAN DAN REFLEKSI PENSYARAH (Micro Teaching)")
table(["Aspek dinilai", "Sangat baik", "Baik", "Sederhana", "Perlu dibaiki"], [
    ["Objektif kognitif, psikomotor & afektif jelas, boleh diukur dan selari dengan SP", O, O, O, O],
    ["Pelaksanaan pendekatan berpusatkan bahan (bahan memandu PdP, murid memanipulasi bahan)", O, O, O, O],
    ["Kesesuaian Gaya B (Latihan), kaedah Permainan/Demonstrasi, teknik Gallery Walk/Padlet Wall", O, O, O, O],
    ["Kualiti & keberkesanan BBM (digital + fizikal)", O, O, O, O],
    ["Set induksi, perkembangan dan penutup (kognitif & sosial)", O, O, O, O],
    ["Penyoalan, maklum balas dan pengurusan bilik darjah", O, O, O, O],
    ["Pentaksiran (instrumen K, P, A) dan pembezaan", O, O, O, O],
    ["Komunikasi, suara dan keyakinan guru pelatih", O, O, O, O],
], (9.0, 2.0, 2.0, 2.0, 2.0), size=11)
kv([
    ["Ulasan keseluruhan pensyarah", "\n\n"],
    ["Kekuatan", "\n"],
    ["Cadangan penambahbaikan", "\n"],
    ["Markah / Gred", "\n"],
    ["Tandatangan & cop pensyarah", "\nNama: ENCIK IRWAN BIN ISDUP\nTarikh: ______________"],
], widths=(5.0, 12.0))

# ================================================================== LAMPIRAN
page_break()
heading("LAMPIRAN 1: JADUAL INDUK (MASTER MATRIX) PENGAJARAN: PENDEKATAN BAHAN")
table(["Bil", "Pendekatan", "Gaya Mosston & Ashworth", "Strategi", "Kaedah", "Teknik"], [
    ["1", "Berpusatkan Guru", "A. Command Style", "Ekspositori / Penerangan Sistematik", "Syarahan / Kuliah, Demonstrasi, Latih Tubi", "Soal Jawab Berperingkat, Step-by-Step Demonstration"],
    ["2", "Berpusatkan Murid", "C. Reciprocal, E. Inclusion", "Inkuiri-Penemuan, Pembelajaran Koperatif", "Perbincangan, Aktiviti Kumpulan, Sumbang Saran", "Think-Pair-Share, Round Robin, KWL Chart"],
    ["**3**", "**Berpusatkan Bahan (Material-Centred)**", "**B. Practice Style**", "**Pembelajaran Berasaskan Teknologi**", "**Demonstrasi, Permainan, Projek**", "**Padlet Wall, Gallery Walk**"],
    ["4", "Kontekstual", "G. Convergent Discovery, H. Divergent Discovery", "Pembelajaran Reflektif, Pembelajaran Berasaskan Pengalaman", "Simulasi / Main Peranan, Kajian Kes", "Freeze Frame, Hot Seat, Buzz Group"],
    ["5", "Integratif / Merentas Kurikulum", "I. Learner-Designed Individual Program", "Pembelajaran Berasaskan Projek", "Projek, Lawatan / Simulasi Lapangan", "Gallery Walk, Jigsaw"],
    ["6", "Konstruktivisme", "F. Guided Discovery, H. Divergent Discovery", "Inkuiri-Penemuan, PBL", "Kajian Kes, Eksperimen, Projek", "KWL Chart, Jigsaw, Exit Ticket"],
    ["7", "Behavioris", "A. Command, B. Practice", "Direct Instruction / Latihan Berstruktur (Mastery Learning)", "Latih Tubi, Demonstrasi", "Step-by-Step Demonstration, Pengulangan Berstruktur"],
    ["8", "Humanistik", "J. Learner-Initiated, K. Self-Teaching", "Pembelajaran Reflektif", "Perbincangan, Sumbang Saran", "Exit Ticket, Buzz Group, Circle Time"],
], (1.2, 2.9, 3.0, 3.3, 3.2, 3.4), size=11)
para("Baris 3 ialah pendekatan yang digunakan dalam RPH ini. Kesemua elemennya (Gaya B, strategi teknologi, kaedah Demonstrasi & Permainan, teknik Padlet Wall & Gallery Walk) dilaksanakan.", size=11, italic=True)

heading("LAMPIRAN 2: KESEPADANAN RPH DENGAN BORANG PR1 (KOMPONEN A: PERANCANGAN)")
table(["Aspek PR1", "Bukti dalam RPH ini"], [
    ["A1a. Hasil pembelajaran", "Objektif K, P, A ditulis dalam format ABCD dengan kata kerja boleh diukur dan kriteria “Saya boleh…”; selari dengan SP 3.1.1 dan 3.1.2 (Jadual Penjajaran Konstruktif)."],
    ["A1a. Isi pelajaran", "Disusun mengikut urutan: situasi (Mula) → maksud & 4 Kunci (Kenal) → pengelasan tingkah laku (Pilih) → aplikasi dalam situasi harian (Bertindak) → rumusan & azam (Refleksi)."],
    ["A1b. Set induksi", "Mesej rahsia Mei + boneka + Peti berkunci; berkait dengan pengalaman murid dan mencetuskan rasa ingin tahu."],
    ["A1c. Strategi", "Pembelajaran Berasaskan Teknologi + bahan konkrit (Jadual Induk, Pendekatan Berpusatkan Bahan)."],
    ["A1c. Kesesuaian aktiviti dengan strategi", "Setiap langkah dipandu Kad Tugasan & BBM digital; murid memanipulasi bahan; maklum balas daripada bahan."],
    ["A1c. Sumber PdP", "Kit Misi Wira Yakin: BBM digital, Beg Misi, Sampul 1 & 2, Kad Respons, Kotak Cabaran, Pasport, Bintang, Peti, lencana."],
    ["A1c. KBAT", "Memahami (L2, L3), Mengaplikasi (L4), Menilai (L1, L3)."],
    ["A1c. EMK", "Bahasa, Nilai Murni, Kreativiti & Inovasi, TMK."],
    ["A1d. Penutup", "Penutup kognitif (rumusan definisi & 4 Kunci) dan sosial (buka peti, lencana, ikrar, cabaran minggu ini)."],
    ["A2a. Kaedah / teknik pedagogi", "Permainan dan Demonstrasi; Gallery Walk dan Padlet Wall; selari dengan Gaya B (Latihan)."],
    ["A3a. Kemahiran insaniah", "Kemahiran Digital (BBM, Meter Suara), Komunikasi (suara jelas, membentang), Kognitif (membuat keputusan), Kepimpinan & kerja berpasukan (peranan sukarela)."],
], (4.5, 12.5), size=11)

heading("LAMPIRAN 3: GAMBAR KANDUNGAN BBM DIGITAL – MISI 2: SAYA YAKIN, SAYA BOLEH!")
para("Fail: __Misi2_Saya_Yakin_Saya_Boleh.html__ (luar talian; buka dengan Chrome/Edge, tekan F untuk skrin penuh).", size=11)
SHOT_CAPS = [
    ("00-laman-utama", "Laman utama"), ("01-mula-mesej", "L1 Mula: Mesej Rahsia Mei"), ("02-mula-soalan", "L1 Mula: Kad Respons A/B"), ("03-mula-misi", "L1 Mula: Misi Hari Ini (Peti berkunci)"),
    ("04-kenal-maksud", "L2 Kenal: maksud keyakinan diri"), ("05-kenal-sampul1", "L2 Kenal: Kad Tugasan Sampul 1 + pemasa"), ("06-kenal-padan", "L2 Kenal: semakan padanan 4 Kunci"), ("07-kod", "Kod ke-1 diperoleh"),
    ("08-pilih-sampul2", "L3 Pilih: Kad Tugasan Sampul 2"), ("09-pilih-gallery", "L3 Pilih: Gallery Walk"), ("10-pilih-sisih", "L3 Pilih: Yakin / Belum Yakin"), ("11-pilih-kuiz", "L3 Pilih: Kuiz Kilat Kad Respons"),
    ("12-bertindak-gaya", "L4 Bertindak: Gaya Wira Yakin + Meter Suara"), ("13-bertindak-roda", "L4 Bertindak: Roda Cabaran"), ("14-cabaran-pilih", "L4 Cabaran: Fikir & Pilih"), ("15-cabaran-tunjuk", "L4 Cabaran: Tunjukkan (senarai semak P)"),
    ("16-cabaran-sebut", "L4 Cabaran: Sebut (afektif)"), ("17-refleksi-cermin", "L5 Refleksi: Cermin Ajaib"), ("18-refleksi-dinding", "L5 Refleksi: Dinding Saya Boleh"), ("19-refleksi-meter", "L5 Refleksi: Meter Keyakinan Saya"),
    ("20-refleksi-rumusan", "L5 Rumusan"), ("21-peti-buka", "Penutup: Peti Wira Yakin dibuka"), ("22-tahniah", "Penutup: Ikrar & Tahniah"), ("23-senarai-semak", "Senarai Semak Pemerhatian guru"),
]
t = doc.add_table(rows=0, cols=2)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
IMG2 = t
for i in range(0, len(SHOT_CAPS), 2):
    cells = t.add_row().cells
    for j in range(2):
        if i + j >= len(SHOT_CAPS):
            continue
        fn, cap = SHOT_CAPS[i + j]
        p = cells[j].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(SHOTS / f"{fn}.jpg"), width=Cm(8.1))
        c = cells[j].add_paragraph()
        c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = c.add_run(f"Rajah {i + j + 1}: {cap}")
        r.font.size = Pt(10)
        r.italic = True

set_widths(IMG2, (8.5, 8.5))
heading("LAMPIRAN 4: BAHAN FIZIKAL (BAHAN CETAK)")
para("Fail: __Bahan_Cetak_Misi2.pdf__. Kad Tugasan, Kad Padanan, Tikar Lampu Isyarat, 8 Kad Tingkah Laku, Kad Respons, Kad Cabaran, Kad Bacaan, Pasport, Bintang, Lencana, Kad Digit, Poster Gaya, Pas Ejen dan Senarai Semak.", size=11)
t = doc.add_table(rows=0, cols=4)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
bcs = sorted(SHOTS.glob("bc-*.jpg"))
for i in range(0, len(bcs), 4):
    cells = t.add_row().cells
    for j in range(4):
        if i + j < len(bcs):
            p = cells[j].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(str(bcs[i + j]), width=Cm(3.6))
set_widths(t, (4.25, 4.25, 4.25, 4.25))

heading("RUJUKAN")
refs = [
    "Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). __A taxonomy for learning, teaching, and assessing: A revision of Bloom’s taxonomy of educational objectives__. Longman.",
    "Bahagian Pembangunan Kurikulum. (2019). __Panduan pelaksanaan pentaksiran bilik darjah__ (Edisi ke-2). Kementerian Pendidikan Malaysia.",
    "Bandura, A. (1997). __Self-efficacy: The exercise of control__. W. H. Freeman.",
    "Bruner, J. S. (1966). __Toward a theory of instruction__. Harvard University Press.",
    "Dale, E. (1969). __Audiovisual methods in teaching__ (3rd ed.). Dryden Press.",
    "Kementerian Pendidikan Malaysia. (2018). __Dokumen Standard Kurikulum dan Pentaksiran (DSKP) KSSR (Semakan 2017) Pendidikan Jasmani dan Pendidikan Kesihatan Tahun 3__. Bahagian Pembangunan Kurikulum.",
    "Kementerian Pendidikan Malaysia. (2019). __Buku teks Pendidikan Jasmani dan Pendidikan Kesihatan Tahun 3__ (Unit Pengurusan Mental dan Emosi: Keyakinan Diri, hlm. 73–74). Dewan Bahasa dan Pustaka.",
    "Krathwohl, D. R., Bloom, B. S., & Masia, B. B. (1964). __Taxonomy of educational objectives, Handbook II: Affective domain__. David McKay.",
    "Lillard, A. S. (2017). __Montessori: The science behind the genius__ (3rd ed.). Oxford University Press.",
    "Mager, R. F. (1997). __Preparing instructional objectives__ (3rd ed.). Center for Effective Performance.",
    "Mosston, M., & Ashworth, S. (2008). __Teaching physical education__ (1st online ed.). Spectrum Institute for Teaching and Learning.",
    "Simpson, E. J. (1972). __The classification of educational objectives in the psychomotor domain__. Gryphon House.",
    "Smaldino, S. E., Lowther, D. L., Mims, C., & Russell, J. D. (2019). __Instructional technology and media for learning__ (12th ed.). Pearson.",
]
for r in refs:
    p = para(r, size=11, after=3)
    p.paragraph_format.left_indent = Cm(1)
    p.paragraph_format.first_line_indent = Cm(-1)

# nombor halaman pada kaki setiap seksyen
for s in doc.sections[:1]:
    fp = s.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("RPH PKES3143 · Misi 2: Saya Yakin, Saya Boleh! · Muhammad Yasykur  ·  ")
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    for kind, txt in (("begin", None), (None, "PAGE"), ("end", None)):
        run = fp.add_run()
        run.font.size = Pt(9)
        if kind:
            fc = OxmlElement("w:fldChar")
            fc.set(qn("w:fldCharType"), kind)
            run._r.append(fc)
        else:
            it = OxmlElement("w:instrText")
            it.set(qn("xml:space"), "preserve")
            it.text = txt
            run._r.append(it)

doc.save(OUT)
print("OK", OUT.name)
