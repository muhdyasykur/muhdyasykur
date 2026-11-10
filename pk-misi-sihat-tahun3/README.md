# Misi 2: Saya Yakin, Saya Boleh! (Pendidikan Kesihatan Tahun 3)

Tugasan 1 PKES3143 (Pembentangan / Micro Teaching) · Pendekatan **Berpusatkan Bahan**
SK 3.1 · SP 3.1.1 & 3.1.2 · Gaya Mosston B (Latihan) · Kaedah Permainan & Demonstrasi · Teknik Gallery Walk & Padlet Wall

| Fail | Kegunaan |
|---|---|
| `Misi2_Saya_Yakin_Saya_Boleh.html` | BBM digital (satu fail, luar talian). Buka dengan Chrome/Edge, tekan **F** untuk skrin penuh. |
| `Bahan_Cetak_Misi2.pdf` | 14 halaman bahan fizikal A4: Kad Tugasan, Kad Padanan, Tikar Lampu Isyarat, Kad Respons, Kad Cabaran, Pasport, Bintang, Lencana, Kad Digit, Poster, Pas Ejen, Senarai Semak. |
| `RPH_Misi2_Saya_Yakin_Saya_Boleh_Tahun3.docx` / `.pdf` | RPH penuh (boleh disunting) dengan Bahagian D: Ulasan & Refleksi Pensyarah. |
| `Panduan_Micro_Teaching_Misi2.pdf` | Rujukan peribadi: kajian pendekatan, objektif K/P/A, konsep "WOW", skrip minit demi minit, persediaan, kontingensi, soalan pensyarah. |

## Aliran BBM (30 minit)
Mula (3) → Kenal (5) → Pilih (7) → Bertindak (10) → Refleksi (5) → Buka Peti.
Setiap misi memberi satu digit kod. Empat digit membuka Peti Wira Yakin (mangga sebenar + peti digital).

Kod peti asal ialah `3142`. Tukar kod di **Persediaan Guru** supaya sama dengan mangga anda, kemudian cetak semula Kad Digit.

Kawalan: → / Space / PageDown = seterusnya · ← = kembali · F skrin penuh · C senarai semak · M bunyi · T pemasa · H laman utama. Pengklik pembentangan (clicker) boleh digunakan.

## Membina semula
```
python3 src/build.py        # HTML (benam fon Fredoka + ilustrasi)
python3 src/build_rph.py    # RPH .docx  (PDF: soffice --headless --convert-to pdf)
```
`src/guide.src.html` dan halaman Bahan Cetak dijana ke PDF melalui Chromium (Playwright).

Fon Fredoka & Andika: SIL Open Font License (`../assets/fonts`). Ilustrasi Misi 2 daripada BBM asal pelajar.
