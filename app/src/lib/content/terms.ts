/** Terms of use, shown before first use and whenever TERMS_VERSION changes. docs/terms.md is generated from this file. */
import type { Section } from './privacy';

export const TERMS_VERSION = 2;
export interface TermsText { title: string; updated: string; lead: string; sections: Section[]; agree: string[]; button: string; read: string }

export const TERMS: Record<'en' | 'ms', TermsText> = {
  en: {
    title: 'Before you start',
    updated: 'Terms of use, version 2 · 17 November 2026',
    lead: 'Consilia is a free planning tool made by a trainee teacher for trainee teachers. It helps you plan and teach; it does not replace your judgement, your mentor or the official KPM documents. Please read and agree to these points.',
    sections: [
      { h: '1. Consilia is a tool, you are the teacher', p: [
        'Lesson plans, activities, objectives, teaching aids and scores in Consilia are suggestions. You decide what is right for your pupils and your school.',
        'Always check your lesson plan against the latest DSKP, Scheme of Work and your school\'s or institute\'s format, and follow your mentor\'s and lecturer\'s advice where it differs.',
        'The alignment score checks the plan on paper. It cannot tell how a lesson will go in your classroom.'
      ] },
      { h: '2. Check before you use it with pupils', p: [
        'Read every activity, worksheet and link before class. Make sure content is suitable for the age, language level, culture and religion of your pupils.',
        'Outside websites (Canva, Wordwall, YouTube, Quizizz and others) and AI chatbots are run by other companies. Their content and adverts can change, and AI answers can be wrong. Preview them first and never let pupils browse unsupervised.',
        'The AI assistant (Claude by Anthropic, or Gemini by Google) is optional and off until you turn it on with your own key. When you use it, what is sent is handled by that company under its terms, any charges for your key are yours, and you are responsible for the key and for checking every AI answer.',
        'When you make teaching aids, use safe materials and do the cutting yourself for young pupils.'
      ] },
      { h: '3. Your own work and academic honesty', p: [
        'If your lesson plan, assignment or practicum file is assessed, follow your institute\'s rules on using digital and AI tools, and say that you used Consilia if you are asked to.',
        'Adapt the suggestions in your own words and for your own class. Copying a plan without understanding it will not help you in an observation.'
      ] },
      { h: '4. Pupils\' privacy', p: [
        'Your data stays on this device. Record only what you need: pupils\' names (or first names) and learning progress. Never enter IC numbers, addresses, phone numbers, health details or photos of pupils.',
        'Use a PIN if other people use your phone or laptop, and keep a backup somewhere safe. Do not paste pupils\' names into AI chatbots.'
      ] },
      { h: '5. Copyright', p: [
        'Textbooks you add stay on your device for your own teaching. Do not share copies of textbooks or other people\'s materials. Consilia\'s own activities, chants and pictures may be used freely in your classroom.'
      ] },
      { h: '6. No guarantee', p: [
        'Consilia is provided free, as it is, without any guarantee. The developer is not responsible for how lessons or materials are used, or for data lost because a device was reset or a backup was not kept.',
        'These terms can change with a new version. If they do, Consilia will ask you to read and agree again.'
      ] }
    ],
    agree: [
      'I understand that Consilia is a planning tool. I am responsible for my lessons and will check them against the official documents, my school\'s requirements and my mentor\'s advice.',
      'I will check every suggestion, material, website and AI answer before using it with pupils.',
      'I will protect my pupils\' privacy and follow my institute\'s rules on using digital and AI tools.'
    ],
    button: 'I agree, start using Consilia',
    read: 'Read how your data is handled (Privacy)'
  },
  ms: {
    title: 'Sebelum anda bermula',
    updated: 'Terma penggunaan, versi 2 · 17 November 2026',
    lead: 'Consilia ialah alat perancangan percuma yang dibina oleh seorang guru pelatih untuk guru pelatih. Ia membantu anda merancang dan mengajar; ia tidak menggantikan pertimbangan anda, mentor anda atau dokumen rasmi KPM. Sila baca dan bersetuju dengan perkara berikut.',
    sections: [
      { h: '1. Consilia ialah alat, anda ialah gurunya', p: [
        'Rancangan pelajaran, aktiviti, objektif, bahan bantu mengajar (BBM) dan skor dalam Consilia ialah cadangan. Anda yang menentukan apa yang sesuai untuk murid dan sekolah anda.',
        'Sentiasa semak RPH anda dengan DSKP, Skema Pelajaran dan format sekolah atau institut yang terkini, dan ikut nasihat mentor dan pensyarah anda jika berbeza.',
        'Skor penjajaran menyemak rancangan di atas kertas. Ia tidak dapat menentukan bagaimana pelajaran berjalan di dalam kelas anda.'
      ] },
      { h: '2. Semak sebelum digunakan bersama murid', p: [
        'Baca setiap aktiviti, lembaran kerja dan pautan sebelum kelas. Pastikan kandungannya sesuai dengan umur, tahap bahasa, budaya dan agama murid anda.',
        'Laman web luar (Canva, Wordwall, YouTube, Quizizz dan lain-lain) dan chatbot AI dikendalikan oleh syarikat lain. Kandungan dan iklannya boleh berubah, dan jawapan AI boleh salah. Pratonton dahulu dan jangan biarkan murid melayari tanpa pengawasan.',
        'Pembantu AI (Claude oleh Anthropic, atau Gemini oleh Google) adalah pilihan dan dimatikan sehingga anda menghidupkannya dengan kunci anda sendiri. Apabila anda menggunakannya, apa yang dihantar dikendalikan oleh syarikat itu di bawah termanya, sebarang caj bagi kunci anda adalah tanggungan anda, dan anda bertanggungjawab atas kunci itu dan menyemak setiap jawapan AI.',
        'Apabila membuat BBM, gunakan bahan yang selamat dan lakukan kerja memotong sendiri untuk murid kecil.'
      ] },
      { h: '3. Hasil kerja sendiri dan integriti akademik', p: [
        'Jika RPH, tugasan atau fail praktikum anda dinilai, ikut peraturan institut tentang penggunaan alat digital dan AI, dan nyatakan bahawa anda menggunakan Consilia jika diminta.',
        'Sesuaikan cadangan dengan ayat anda sendiri dan untuk kelas anda sendiri. Menyalin rancangan tanpa memahaminya tidak akan membantu anda semasa pencerapan.'
      ] },
      { h: '4. Privasi murid', p: [
        'Data anda kekal dalam peranti ini. Rekod hanya apa yang perlu: nama murid (atau nama pertama) dan kemajuan pembelajaran. Jangan sekali-kali memasukkan nombor kad pengenalan, alamat, nombor telefon, maklumat kesihatan atau foto murid.',
        'Gunakan PIN jika orang lain menggunakan telefon atau komputer riba anda, dan simpan sandaran di tempat yang selamat. Jangan tampal nama murid ke dalam chatbot AI.'
      ] },
      { h: '5. Hak cipta', p: [
        'Buku teks yang anda tambah kekal dalam peranti anda untuk pengajaran anda sendiri. Jangan kongsi salinan buku teks atau bahan orang lain. Aktiviti, chant dan gambar Consilia sendiri boleh digunakan secara bebas di dalam kelas anda.'
      ] },
      { h: '6. Tiada jaminan', p: [
        'Consilia disediakan secara percuma, seadanya, tanpa sebarang jaminan. Pembangun tidak bertanggungjawab atas cara pelajaran atau bahan digunakan, atau atas data yang hilang kerana peranti ditetapkan semula atau sandaran tidak disimpan.',
        'Terma ini boleh berubah dengan versi baharu. Jika berubah, Consilia akan meminta anda membaca dan bersetuju semula.'
      ] }
    ],
    agree: [
      'Saya faham bahawa Consilia ialah alat perancangan. Saya bertanggungjawab atas pelajaran saya dan akan menyemaknya dengan dokumen rasmi, keperluan sekolah dan nasihat mentor saya.',
      'Saya akan menyemak setiap cadangan, bahan, laman web dan jawapan AI sebelum menggunakannya bersama murid.',
      'Saya akan melindungi privasi murid saya dan mematuhi peraturan institut saya tentang penggunaan alat digital dan AI.'
    ],
    button: 'Saya bersetuju, mula guna Consilia',
    read: 'Baca cara data anda dikendalikan (Privasi)'
  }
};
