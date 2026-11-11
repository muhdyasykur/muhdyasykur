# Misi 2: Saya Yakin, Saya Boleh! (Pendidikan Kesihatan Tahun 3)

Tugasan 1 PKES3143 (Pembentangan / Micro Teaching) · Pendekatan **Berpusatkan Bahan** · **BBM digital sepenuhnya**
SK 3.1 · SP 3.1.1 & 3.1.2 · Gaya Mosston B (Latihan) · Kaedah Permainan & Demonstrasi · Teknik Gallery Walk & Padlet Wall

| Fail | Kegunaan |
|---|---|
| `Misi2_Saya_Yakin_Saya_Boleh.html` | BBM digital (satu fail, luar talian). Buka dengan Chrome/Edge. |
| `RPH_Misi2_Saya_Yakin_Saya_Boleh_Tahun3.docx` / `.pdf` | RPH penuh (Arial 11) dengan Bahagian D: Ulasan & Refleksi Pensyarah. |
| `Panduan_Micro_Teaching_Misi2.pdf` | Rujukan peribadi: kajian, objektif K/P/A, konsep “WOW”, skrip, persediaan digital, kontingensi, soalan pensyarah. |

## Tiga mod dalam satu fail
- **🖥️ Mod Guru (projektor):** Mula → Kenal → Pilih → Bertindak → Refleksi → Buka Peti. Kad Tugasan Digital + pemasa, semakan bersama, Kuiz Kilat, Gaya Wira Yakin + Meter Suara, Roda Cabaran, Cermin Ajaib, Dinding Kelas, Peti Wira Yakin, Senarai Semak (C).
- **📱 Mod Kumpulan (tablet setiap kumpulan):** Daftar Ejen → Markas → Misi 1 (peranan, padanan 4 Kunci, Pasport Digital) → Misi 2 (Lampu Isyarat, Ubah Merah ➜ Hijau, Papan Hasil + Gallery Walk) → Misi 3 (Fikir & Pilih, prop digital, Gaya, Sebut) → Misi 4 (Dinding Kumpulan, Meter Keyakinan) → Lencana Digital. 📊 Rekod Kumpulan untuk pentaksiran (CSV).
- **🅰️ Kad Respons Digital:** skrin bertukar menjadi kad A/B/C berwarna untuk diangkat.

Setiap misi di tablet menyemak sendiri jawapan dan memberi satu digit kod. Kod asal ialah `3142` dan kumpulan asal ialah Berani, Jelas, Positif, Cuba Lagi. Jika diubah di **Persediaan Guru**, ubah pada setiap peranti.

**📲 Sambung Peranti:** tampal pautan BBM (cth. itch.io / Google Drive) di Persediaan Guru untuk memaparkan kod QR. Pautan Padlet pilihan juga boleh dipaparkan.

Kawalan Mod Guru: → / Space / PageDown = seterusnya · ← = kembali · F skrin penuh · C senarai semak · M bunyi · T pemasa · H laman utama. Pengklik pembentangan (clicker) boleh digunakan.

## Membina semula
```
python3 src/build.py        # HTML (benam fon Fredoka, ilustrasi, penjana QR)
python3 src/build_rph.py    # RPH .docx  (PDF: soffice --headless --convert-to pdf)
```
`src/guide.src.html` dijana ke PDF melalui Chromium (Playwright).

Fon Fredoka & Andika: SIL Open Font License (`../assets/fonts`). Penjana kod QR: qrcode-generator 1.4.4 oleh Kazuhiko Arase (MIT, `src/vendor`). Ilustrasi Misi 2 daripada BBM asal pelajar.
