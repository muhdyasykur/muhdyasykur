/** The plain-language privacy page (blueprint: Security and privacy, PDPA 2010 mindset), in English and Bahasa Melayu.
 *  docs/privacy.md is generated from this file by scripts/make-docs.mjs, so the two never drift apart. */
export interface Section { h: string; p: string[] }
export interface PrivacyText { title: string; updated: string; lead: string; sections: Section[] }

export const PRIVACY_UPDATED = '2026-11-16';

export const PRIVACY: Record<'en' | 'ms', PrivacyText> = {
  en: {
    title: 'Privacy',
    updated: 'Last updated 16 November 2026',
    lead: 'Consilia has no server, no account and no sign-in. Your lessons and your pupils stay on this device. This page explains exactly what that means.',
    sections: [
      { h: 'What stays on your device', p: [
        'Everything you create: lesson plans, reflections, mentor notes, classes, pupil names, attendance, PBD levels, photos you attach, textbook PDFs you add and their page maps. It is stored in this browser\'s own storage (IndexedDB and the private file system), on this phone, tablet or laptop only.',
        'Consilia does not have a database in the cloud. The developer cannot see your data, and neither can anyone else.'
      ] },
      { h: 'What leaves your device, and only when you choose', p: [
        'Feedback Garden: when you press "Plant it", your mood, message, idea votes, the app version and your name (only if you type one) are sent to the developer\'s feedback form on Jotform. Nothing about your pupils or lessons is sent. If you are offline it waits on your device and is sent later.',
        'Links you tap: Canva, Wordwall, Liveworksheets, Quizizz, Kahoot, YouTube and Google open in a new tab. Those sites have their own privacy policies. Consilia only copies a prompt or a search for you; it never sends your lesson to them by itself.',
        'Files you save or share: Word, PDF, Excel, backup and .consilia files go wherever you send them (Google Drive, WhatsApp, email). A shared .consilia lesson never includes your class or pupil names.'
      ] },
      { h: 'What Consilia never does', p: [
        'No analytics, no trackers, no advertising, no cookies for tracking, no selling or sharing of data.',
        'No AI service reads your lessons. All checking (SMART objectives, alignment, timing) is done by rules inside the app.',
        'The microphone (noise meter in Teach mode) only measures loudness while the meter is open. Nothing is recorded or saved.',
        'Text recognition for scanned textbooks runs on your device. The pages are never uploaded.'
      ] },
      { h: 'Loading the app', p: [
        'Consilia is a website you can install. The first time you open it, and when there is an update, your device downloads the app from GitHub Pages. Like any website host, GitHub briefly receives your IP address to deliver the files. After that, the app works offline.',
        'Fonts, the curriculum data and the music are part of the app, so no other site is contacted to show them.'
      ] },
      { h: 'Protecting pupil data', p: [
        'Set a PIN in Me → PIN lock for pupil data. Pupil names and notes are then encrypted on the device (AES-256), and they stay encrypted inside your backup files. The app locks itself when you leave it for more than 5 minutes.',
        'A forgotten PIN cannot be reset by anyone, including the developer. Keep it somewhere safe.',
        'Use pupils\' first names or initials if your school prefers. Never type identity card numbers or addresses; Consilia does not need them.'
      ] },
      { h: 'Keeping and deleting your data', p: [
        'Your data stays until you delete it. Delete a lesson, a class or a pupil from its own page. Remove a textbook from the Textbook Shelf.',
        'To remove everything, clear this site\'s data in your browser settings or uninstall the app. Make a backup first if you may want it later.',
        'Feedback you sent to Jotform can be removed by the developer on request (see below).'
      ] },
      { h: 'Your rights and questions', p: [
        'This page follows the spirit of the Personal Data Protection Act 2010 (Malaysia): collect as little as possible, keep it secure, and be clear about it.',
        'Questions, or a request to delete feedback you sent: write in the Feedback Garden (choose "Question") and include a way to reach you, or contact the developer, Muhammad Yasykur bin Muhamad Yasim, IPG Kampus Gaya.'
      ] }
    ]
  },
  ms: {
    title: 'Privasi',
    updated: 'Kemas kini terakhir 16 November 2026',
    lead: 'Consilia tiada pelayan, tiada akaun dan tiada log masuk. Rancangan pelajaran dan data murid anda kekal dalam peranti ini. Halaman ini menerangkan maksudnya dengan tepat.',
    sections: [
      { h: 'Apa yang kekal dalam peranti anda', p: [
        'Semua yang anda hasilkan: RPH, refleksi, catatan mentor, kelas, nama murid, kehadiran, tahap PBD, foto yang dilampirkan, PDF buku teks yang anda tambah dan peta halamannya. Semuanya disimpan dalam storan pelayar ini sendiri (IndexedDB dan sistem fail peribadi), pada telefon, tablet atau komputer riba ini sahaja.',
        'Consilia tidak mempunyai pangkalan data di awan. Pembangun tidak dapat melihat data anda, begitu juga orang lain.'
      ] },
      { h: 'Apa yang keluar dari peranti anda, hanya apabila anda memilih', p: [
        'Taman Maklum Balas: apabila anda menekan "Plant it", mood, mesej, undian idea, versi aplikasi dan nama anda (hanya jika anda menaipnya) dihantar ke borang maklum balas pembangun di Jotform. Tiada maklumat tentang murid atau pelajaran anda dihantar. Jika anda di luar talian, ia menunggu dalam peranti dan dihantar kemudian.',
        'Pautan yang anda tekan: Canva, Wordwall, Liveworksheets, Quizizz, Kahoot, YouTube dan Google dibuka dalam tab baharu. Laman-laman itu mempunyai dasar privasi sendiri. Consilia hanya menyalin gesaan atau carian untuk anda; ia tidak menghantar pelajaran anda kepada mereka dengan sendirinya.',
        'Fail yang anda simpan atau kongsi: fail Word, PDF, Excel, sandaran dan .consilia pergi ke mana sahaja anda hantar (Google Drive, WhatsApp, e-mel). Pelajaran .consilia yang dikongsi tidak pernah mengandungi kelas atau nama murid anda.'
      ] },
      { h: 'Apa yang Consilia tidak pernah lakukan', p: [
        'Tiada analitik, tiada penjejak, tiada iklan, tiada kuki penjejakan, tiada penjualan atau perkongsian data.',
        'Tiada perkhidmatan AI membaca pelajaran anda. Semua semakan (objektif SMART, penjajaran, masa) dibuat oleh peraturan dalam aplikasi.',
        'Mikrofon (meter bunyi dalam Mod Mengajar) hanya mengukur kekuatan bunyi semasa meter dibuka. Tiada apa yang dirakam atau disimpan.',
        'Pengecaman teks untuk buku teks imbasan berjalan dalam peranti anda. Halaman tidak pernah dimuat naik.'
      ] },
      { h: 'Memuatkan aplikasi', p: [
        'Consilia ialah laman web yang boleh dipasang. Kali pertama anda membukanya, dan apabila ada kemas kini, peranti anda memuat turun aplikasi daripada GitHub Pages. Seperti mana-mana hos laman web, GitHub menerima alamat IP anda seketika untuk menghantar fail. Selepas itu, aplikasi berfungsi di luar talian.',
        'Fon, data kurikulum dan muzik adalah sebahagian daripada aplikasi, jadi tiada laman lain dihubungi untuk memaparkannya.'
      ] },
      { h: 'Melindungi data murid', p: [
        'Tetapkan PIN di Saya → PIN lock for pupil data. Nama dan catatan murid kemudian disulitkan dalam peranti (AES-256), dan kekal tersulit dalam fail sandaran anda. Aplikasi mengunci sendiri apabila anda meninggalkannya lebih daripada 5 minit.',
        'PIN yang terlupa tidak boleh ditetapkan semula oleh sesiapa, termasuk pembangun. Simpan di tempat yang selamat.',
        'Gunakan nama pertama atau inisial murid jika sekolah anda lebih suka begitu. Jangan sekali-kali menaip nombor kad pengenalan atau alamat; Consilia tidak memerlukannya.'
      ] },
      { h: 'Menyimpan dan memadam data anda', p: [
        'Data anda kekal sehingga anda memadamnya. Padam pelajaran, kelas atau murid dari halamannya sendiri. Keluarkan buku teks dari Rak Buku Teks.',
        'Untuk membuang semuanya, kosongkan data laman ini dalam tetapan pelayar atau nyahpasang aplikasi. Buat sandaran dahulu jika anda mungkin memerlukannya kemudian.',
        'Maklum balas yang dihantar ke Jotform boleh dipadam oleh pembangun atas permintaan (lihat di bawah).'
      ] },
      { h: 'Hak dan pertanyaan anda', p: [
        'Halaman ini mengikut semangat Akta Perlindungan Data Peribadi 2010 (Malaysia): kumpul sesedikit mungkin, simpan dengan selamat, dan jelaskan dengan terang.',
        'Pertanyaan, atau permintaan untuk memadam maklum balas yang dihantar: tulis di Taman Maklum Balas (pilih "Question") dan sertakan cara untuk menghubungi anda, atau hubungi pembangun, Muhammad Yasykur bin Muhamad Yasim, IPG Kampus Gaya.'
      ] }
    ]
  }
};
