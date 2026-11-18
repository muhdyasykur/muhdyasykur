import type { IconName } from '../ui/icons';

/**
 * Every tool in Tools, in one list: the offline tools Consilia always had and the Studio tools that write with AI
 * (Claude or Gemini with the teacher's own key, or any AI chat by copy and paste). Shown with tr(): the English text is
 * the key, translated in ms-ui.json. The Studio's fields and prompts are in tools.ts, loaded only when a tool opens.
 */
export type Cat = 'plan' | 'create' | 'assess' | 'support' | 'classroom' | 'fun' | 'write';
export const CATS: { id: Cat; name: string; icon: IconName }[] = [
  { id: 'plan', name: 'Plan', icon: 'plan' },
  { id: 'create', name: 'Create materials', icon: 'scissors' },
  { id: 'assess', name: 'Assess', icon: 'check' },
  { id: 'support', name: 'Support every pupil', icon: 'heart' },
  { id: 'classroom', name: 'In the classroom', icon: 'classes' },
  { id: 'fun', name: 'Fun and creative', icon: 'smile' },
  { id: 'write', name: 'Write for me', icon: 'mail' }
];
export interface ToolMeta { id: string; icon: IconName; cat: Cat; title: string; about: string; keys: string; ai: boolean; isNew?: boolean; route?: 'recommend' }

export const TOOLS: ToolMeta[] = [
  // ---- plan
  { id: 'recommend', icon: 'sparkle', cat: 'plan', ai: false, route: 'recommend', title: 'Consilia recommends', about: 'Tell Consilia about your class; get a whole lesson with step-by-step activities, teaching aids and digital tools.', keys: 'ai generate whole lesson rph auto rancang pelajaran cadangan agentic' },
  { id: 'lesson-plan', icon: 'plan', cat: 'plan', ai: true, isNew: true, title: 'Lesson plan writer', about: 'A complete lesson plan from a topic, standard or objective, ready to open in the builder.', keys: 'lesson plan rph rancangan pengajaran harian daily objective standard ppp generate' },
  { id: 'hook', icon: 'magnet', cat: 'plan', ai: true, isNew: true, title: 'Lesson hooks', about: 'Five creative ways to open your lesson and catch every pupil\'s attention.', keys: 'hook set induction set induksi starter opening warm-up warmer attention engage' },
  { id: 'connections', icon: 'link', cat: 'plan', ai: true, isNew: true, title: 'Real-life connections', about: 'Link your topic to pupils\' lives in Malaysia: home, school, food, festivals and places.', keys: 'real life connection relevant meaningful kehidupan harian context malaysia culture' },
  { id: 'activities', icon: 'grid', cat: 'plan', ai: true, isNew: true, title: 'Activity designer', about: 'Three fresh activities for any stage and skill, with easier and harder versions.', keys: 'activity aktiviti design creative group pair game practice production new idea' },
  { id: 'ideas', icon: 'bulb', cat: 'plan', ai: false, title: 'Activity ideas', about: '86 tried activities. Filter by skill, stage, year, time and what your class has.', keys: 'activity aktiviti warm-up warmer set induction set induksi penutup closure game permainan practice production' },
  { id: 'objectives', icon: 'target', cat: 'plan', ai: false, title: 'Objective writer', about: 'ABCD objectives that pass SMART, with success criteria for pupils.', keys: 'objective objektif abcd smart success criteria kriteria kejayaan' },
  // ---- create
  { id: 'text', icon: 'book', cat: 'create', ai: true, isNew: true, title: 'Reading and listening texts', about: 'A story, email, diary or report at your pupils\' level, with word help and questions.', keys: 'reading text passage petikan bacaan listening story cerita comprehension kefahaman email diary news poem' },
  { id: 'level', icon: 'sliders', cat: 'create', ai: true, isNew: true, title: 'Text leveller', about: 'Rewrite any text for your pupils\' level, keeping the meaning.', keys: 'level simplify ringkaskan permudahkan rewrite adapt text difficult easy cefr' },
  { id: 'vocab', icon: 'letters', cat: 'create', ai: true, isNew: true, title: 'Vocabulary builder', about: 'Child-friendly meanings, examples, Malay meanings and picture ideas for your key words.', keys: 'vocabulary kosa kata perkataan word list meaning maksud glossary dictionary malay' },
  { id: 'dialogue', icon: 'chat', cat: 'create', ai: true, isNew: true, title: 'Role-play and dialogue', about: 'A short dialogue with role cards for pair or group work.', keys: 'dialogue dialog role play lakonan conversation perbualan speaking pair work script' },
  { id: 'phonics', icon: 'phonics', cat: 'create', ai: true, isNew: true, title: 'Phonics pack', about: 'Word lists, odd one out, a tongue twister and decodable sentences for one sound.', keys: 'phonics fonik sound bunyi letter huruf blend digraph tongue twister year 1 year 2 decodable' },
  { id: 'grammar', icon: 'puzzle', cat: 'create', ai: true, isNew: true, title: 'Grammar explainer', about: 'A child-friendly explanation, examples, common mistakes and practice with answers.', keys: 'grammar tatabahasa tense verb noun preposition article explanation mistakes language arts' },
  { id: 'bbm', icon: 'scissors', cat: 'create', ai: false, title: 'Teaching aids', about: '25 teaching aids with pictures, what you need and how to make them step by step.', keys: 'bbm bahan bantu mengajar teaching aids kad imbas flashcard puppet boneka dice dadu spinner make buat craft' },
  { id: 'worksheets', icon: 'sheet', cat: 'create', ai: false, title: 'Worksheet maker', about: 'Flashcards, gap-fill, matching, strips, tiered worksheets, rubrics. Print offline.', keys: 'worksheet lembaran kerja printable cetak flashcard gap fill matching rubric exit ticket' },
  { id: 'slides', icon: 'slides', cat: 'create', ai: false, title: 'Lesson slides', about: 'Turn a lesson plan into a full slide deck. Present it, or download PowerPoint for Canva and Google Slides.', keys: 'slides slaid powerpoint pptx canva google slides presentation pembentangan projector deck tayangan' },
  { id: 'ai', icon: 'prompt', cat: 'create', ai: false, title: 'AI prompt builder', about: 'Ready prompts for Claude, ChatGPT, Gemini, Copilot or Canva AI: texts, questions, songs, pictures.', keys: 'ai claude chatgpt gemini copilot canva prompt text story questions soalan cerita' },
  // ---- assess
  { id: 'quiz', icon: 'help', cat: 'assess', ai: true, isNew: true, title: 'Quiz maker', about: 'Questions with answers to print, or to play as a Quiz show on the projector.', keys: 'quiz kuiz test ujian multiple choice objektif true false questions soalan answer key' },
  { id: 'questions', icon: 'stairs', cat: 'assess', ai: true, isNew: true, title: 'Questions at every level', about: 'From remembering to creating, with higher-order (KBAT) questions marked.', keys: 'questions soalan kbat hots higher order thinking bloom questioning aras tinggi' },
  { id: 'rubric', icon: 'table', cat: 'assess', ai: true, isNew: true, title: 'PBD rubric', about: 'A TP1 to TP6 rubric for any task, with an "I can" checklist for pupils.', keys: 'rubric rubrik pbd pentaksiran bilik darjah tp tahap penguasaan assessment marking criteria' },
  { id: 'exit', icon: 'ticket', cat: 'assess', ai: true, isNew: true, title: 'Exit tickets', about: 'Four quick end-of-lesson checks to print or show on the board.', keys: 'exit ticket tiket keluar plenary closure penutup check understanding 3-2-1' },
  { id: 'feedback', icon: 'pen', cat: 'assess', ai: true, isNew: true, title: 'Writing feedback', about: 'Two stars and a wish for a pupil\'s writing, a corrected version and a next step.', keys: 'feedback maklum balas writing penulisan correct mark semak karangan essay two stars wish' },
  // ---- support
  { id: 'scaffold', icon: 'layers', cat: 'support', ai: true, isNew: true, title: 'Sentence frames and word banks', about: 'Support for weaker pupils and a stretch for stronger ones, for any task.', keys: 'scaffold sentence frame starter word bank sokongan murid lemah differentiation support' },
  { id: 'pupil-help', icon: 'heart', cat: 'support', ai: true, isNew: true, title: 'Help for one pupil', about: 'Practical support for a pupil who needs something different. No names needed.', keys: 'sen mbk special needs slow learner weak reader shy distracted gifted pemulihan inclusive' },
  { id: 'differentiate', icon: 'stairs', cat: 'support', ai: false, title: 'Differentiation helper', about: 'Low, moderate and high versions of any activity.', keys: 'differentiation pembezaan low moderate high tier weak pupils lemah murid cerdas' },
  // ---- classroom
  { id: 'games', icon: 'game', cat: 'classroom', ai: false, title: 'Classroom games', about: 'Spin wheel, Unjumble, Mystery word and Quiz show on the projector. Offline.', keys: 'game permainan projector wheel spin roda quiz kuiz unjumble mystery word teka' },
  { id: 'digital', icon: 'globe', cat: 'classroom', ai: false, title: 'Digital tools', about: 'Ready-made Wordwall, Liveworksheets, Quizizz, StoryWeaver and more for your topic.', keys: 'digital online wordwall liveworksheets quizizz kahoot youtube video internet tmk ict' },
  { id: 'manage', icon: 'compass', cat: 'classroom', ai: false, title: 'Classroom management', about: 'Routines, attention signals and rewards for your class.', keys: 'classroom management pengurusan bilik darjah noisy bising discipline disiplin routine rutin attention reward' },
  // ---- fun
  { id: 'song', icon: 'music', cat: 'fun', ai: true, isNew: true, title: 'Song and rhyme writer', about: 'New words to a tune pupils know, with actions to do while singing.', keys: 'song lagu nyanyian rhyme sajak tune music action jazz chant rap poem' },
  { id: 'story', icon: 'signpost', cat: 'fun', ai: true, isNew: true, title: 'Choose-your-path story', about: 'A story where the class votes what happens next, with two endings.', keys: 'story cerita adventure choice vote interactive ending narrative reading listening' },
  { id: 'riddles', icon: 'smile', cat: 'fun', ai: true, isNew: true, title: 'Riddles and jokes', about: 'Clean, simple riddles and jokes about your topic for warm-ups.', keys: 'riddle teka-teki joke lawak jenaka warm-up fun brain teaser' },
  { id: 'chant', icon: 'music', cat: 'fun', ai: false, title: 'Chant maker', about: 'Turn your key words into a catchy chant with actions.', keys: 'chant song lagu nyanyian rhyme poem sajak music' },
  // ---- write for me
  { id: 'parents', icon: 'home', cat: 'write', ai: true, isNew: true, title: 'Message to parents', about: 'A clear, friendly WhatsApp message or letter in Malay, English or both.', keys: 'parents ibu bapa penjaga whatsapp letter surat notice notis homework kerja rumah event' },
  { id: 'reflection', icon: 'thought', cat: 'write', ai: true, isNew: true, title: 'Lesson reflection', about: 'Turn quick notes into a professional reflection for your practicum file.', keys: 'reflection refleksi practicum praktikum gibbs kolb journal jurnal what so what now what' },
  { id: 'email', icon: 'mail', cat: 'write', ai: true, isNew: true, title: 'Professional email', about: 'A polite email to your mentor, lecturer, headteacher or a colleague.', keys: 'email emel letter mentor lecturer pensyarah guru besar headteacher formal message' },
  { id: 'ask', icon: 'prompt', cat: 'write', ai: true, isNew: true, title: 'Ask the teaching assistant', about: 'Ask anything about teaching English, your class or your practicum.', keys: 'ask question tanya help advice nasihat chat assistant teaching tips' }
];
export const toolMeta = (id: string) => TOOLS.find((t) => t.id === id);
