import { cefr } from '../recommend/prompts';
import type { ToolContext } from '../tools/context.svelte';

/**
 * The Studio's AI tools: what each form asks, an example to try, and the prompt it sends. Prompts are written for
 * English lessons in Malaysian primary schools (KSSR, CEFR) and ask for Markdown with fixed headings, so results can be
 * printed, copied, read aloud, or turned into a quiz, a spin wheel or a lesson plan. Only what the teacher types is
 * sent, never pupils' names (the tool page checks for them first). Labels, hints and options are English keys for tr().
 */
export type FieldKind = 'year' | 'text' | 'area' | 'select';
export interface Field {
  id: string; kind: FieldKind; label: string;
  placeholder?: string; hint?: string; options?: string[]; required?: boolean; rows?: number; def?: string;
  /** Filled from the lesson bar (Tools context) when it has a value. */
  from?: 'topic' | 'words' | 'sentence' | 'skill' | 'objectives';
}
export type Values = Record<string, string>;
export type Send = 'quiz' | 'wheel' | 'builder';
export interface ToolDef {
  id: string;
  /** Who reads the result: pupils (simple English at their level) or the teacher. */
  audience: 'pupils' | 'teacher';
  fields: Field[];
  example: Values;
  task: (v: Values) => (string | false | undefined | null)[];
  send?: Send[];
  /** Offer "Read aloud" and "Show on the projector". */
  read?: boolean;
  chips?: string[];
}

// ---- shared fields
const YEAR: Field = { id: 'year', kind: 'year', label: 'Year' };
const SKILL: Field = { id: 'skill', kind: 'select', label: 'Main skill', options: ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'], from: 'skill' };
const WORDS: Field = { id: 'words', kind: 'text', label: 'Key words (optional)', placeholder: 'e.g. Malaysia, Japan, China, India', from: 'words' };
const SENTENCE: Field = { id: 'sentence', kind: 'text', label: 'Target sentence or structure (optional)', placeholder: 'e.g. He is from …', from: 'sentence' };
const EXTRA: Field = { id: 'extra', kind: 'area', rows: 2, label: 'Anything else? (optional)', placeholder: 'e.g. a weak class, include a game, no projector' };
const topic = (o: Partial<Field> = {}): Field => ({ id: 'topic', kind: 'text', label: 'Topic', placeholder: 'e.g. Where are you from?', required: true, from: 'topic', ...o });
const lang = (def = 'English', options = ['English', 'Bahasa Melayu']): Field => ({ id: 'lang', kind: 'select', label: 'Language of the answer', options, def });
const NO_NAMES = 'Type or paste it without the pupil\'s name.';

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const textLength = (year: number, len: string) => {
  const base = year <= 2 ? [40, 60, 90] : year <= 4 ? [60, 100, 140] : [80, 140, 200];
  return base[len === 'Long' ? 2 : len === 'Medium' ? 1 : 0];
};

export const DEFS: ToolDef[] = [
  {
    id: 'lesson-plan', audience: 'teacher', send: ['builder'],
    chips: ['Add more pair and group work', 'Make it work without a projector', 'Make the Production stage more creative'],
    fields: [YEAR, SKILL, topic({ id: 'topic', kind: 'area', rows: 2, label: 'Topic, learning standard or objective', placeholder: 'e.g. Where are you from? · 2.1.5 · Pupils can ask and answer about countries' }),
      { id: 'minutes', kind: 'select', label: 'Lesson length', options: ['60 minutes', '30 minutes'] }, WORDS, SENTENCE,
      { id: 'class', kind: 'area', rows: 2, label: 'About your class (optional)', placeholder: 'e.g. 35 pupils, mixed ability, shy speakers, no projector' }, EXTRA],
    example: { year: '4', skill: 'Speaking', topic: 'Where are you from? Asking and answering about countries and nationalities', minutes: '60 minutes', words: 'Malaysia, Japan, China, India, Thailand, Australia', sentence: 'Where is he from? He is from …', class: '32 pupils, mixed ability, a few shy speakers' },
    task: (v) => {
      const m = parseInt(v.minutes) || 60;
      return [
        `Write a complete daily lesson plan (RPH) for a ${m}-minute English lesson.`,
        `Main skill: ${v.skill}. Topic, learning standard or objective: ${v.topic}.`,
        v.words && `Key words: ${v.words}.`, v.sentence && `Target sentence or structure: ${v.sentence}.`, v.class && `About the class: ${v.class}.`,
        'Use exactly these sections, in this order, with these exact headings:',
        '## Lesson overview: a short lesson title on the first line, then one sentence about the lesson.',
        '## Learning standards: the KSSR content and learning standards this lesson most likely addresses, with their codes (for example 2.1.5). If you are not sure, write "To be confirmed".',
        '## Learning objectives: one or two measurable objectives, each starting "By the end of the lesson, pupils will be able to".',
        '## Success criteria: two or three "I can …" statements in simple English for pupils.',
        '## Key vocabulary and target language: the key words, then a line starting "Target sentence:".',
        '## Teaching aids: a short list of cheap, realistic aids.',
        `## Pre-lesson (N minutes), ## Presentation (N minutes), ## Practice (N minutes), ## Production (N minutes), ## Post-lesson (N minutes): five separate sections with the minutes in each heading, adding up to ${m}. In each, write bullet points starting "Teacher:", "Pupils:" and "Teaching aids:". Make it active and creative, with pair or group work, and make the Production task different from Practice.`,
        '## Differentiation: three bullet points starting "Low:", "Moderate:" and "High:".',
        '## Assessment: how the teacher checks each objective during the lesson (classroom-based assessment, PBD).',
        '## Cross-curricular elements and 21st-century skills: one line for each.',
        '## Reflection prompts: two or three questions for the teacher to answer after the lesson.'
      ];
    }
  },
  {
    id: 'hook', audience: 'teacher', chips: ['Use no materials at all', 'Make them quieter for a big class'],
    fields: [YEAR, topic(), WORDS, { id: 'time', kind: 'select', label: 'Time for the hook', options: ['5 minutes', '2 minutes', '10 minutes'] }, EXTRA],
    example: { year: '3', topic: 'My favourite food', words: 'nasi lemak, roti canai, noodles, satay', time: '5 minutes' },
    task: (v) => [
      `Suggest 5 different, creative ways to open a lesson (set induction) on: ${v.topic}.`, v.words && `Key words: ${v.words}.`,
      `Each takes about ${v.time}. Include at least one with no materials, one with movement, one with a mystery or surprise, and one that links to pupils' lives in Malaysia.`,
      'For each one write a heading "## 1. (a catchy name)" (2., 3. …), then bullet points "You need:", "Steps:" (short steps for the teacher), "Pupils say or do:" and "Leads into the lesson by:".'
    ]
  },
  {
    id: 'connections', audience: 'teacher',
    fields: [YEAR, topic(), EXTRA],
    example: { year: '5', topic: 'Saving water' },
    task: (v) => [
      `Show how the topic "${v.topic}" connects to the everyday lives of Malaysian primary pupils.`,
      'Use these sections:',
      '## Why it matters: two sentences for the teacher.',
      '## Connections: six bullet points, each starting with a bold title (home, school, food, festivals, places in Malaysia, games or media), then how to use it in class.',
      '## Questions to ask pupils: five simple questions at the pupils\' level.',
      '## A mini task: one short task that takes the language outside the classroom (for example at home or in the school canteen).'
    ]
  },
  {
    id: 'activities', audience: 'teacher', chips: ['Make them quieter for a big class', 'Use no materials at all'],
    fields: [YEAR, SKILL, topic(),
      { id: 'stage', kind: 'select', label: 'Lesson stage', options: ['Any stage', 'Pre-lesson', 'Presentation', 'Practice', 'Production', 'Post-lesson'] },
      { id: 'grouping', kind: 'select', label: 'Grouping', options: ['Any grouping', 'Whole class', 'Pairs', 'Groups', 'Individual'] },
      { id: 'resources', kind: 'select', label: 'What you have', options: ['Paper and stationery only', 'No materials at all', 'A projector', 'A few devices'] }, EXTRA],
    example: { year: '4', skill: 'Writing', topic: 'My dream house', stage: 'Production', grouping: 'Groups', resources: 'Paper and stationery only' },
    task: (v) => [
      `Design 3 creative ${v.skill} activities on "${v.topic}"${v.stage === 'Any stage' ? '' : ` for the ${v.stage} stage`}${v.grouping === 'Any grouping' ? '' : `, done as ${lower(v.grouping)}`}. What the teacher has: ${lower(v.resources)}.`,
      'For each activity write a heading "## 1. (a name)" (2., 3.), then bullet points "Time:", "Grouping:", "You need:", "Steps:" (numbered), "Language pupils use:", "Easier version:" and "Harder version:".',
      'Make them lively and practical for a class of 30 to 40 pupils.'
    ]
  },
  {
    id: 'text', audience: 'pupils', send: ['quiz'], read: true,
    fields: [YEAR, topic(), WORDS,
      { id: 'kind', kind: 'select', label: 'Type of text', options: ['Story', 'Information text', 'Dialogue', 'Email or letter', 'Diary entry', 'News report', 'Poem', 'Instructions or recipe'] },
      { id: 'length', kind: 'select', label: 'Length', options: ['Short', 'Medium', 'Long'] }, EXTRA],
    example: { year: '4', topic: 'A visit to Taman Negara', words: 'river, jungle, monkey, boat, guide', kind: 'Diary entry', length: 'Medium' },
    task: (v) => [
      `Write a ${lower(v.kind)} about "${v.topic}" for reading or listening, about ${textLength(Number(v.year) || 4, v.length)} words long.`, v.words && `Use these key words: ${v.words}.`,
      'Use these sections:',
      '## (a title)', 'The text itself, in short paragraphs or lines.',
      '## Word help: a table with the columns Word | Meaning, for up to six harder words, with meanings in very simple English.',
      '## Questions: five numbered questions (three about facts in the text, two that make pupils think), each followed by a line starting "Answer:".'
    ]
  },
  {
    id: 'level', audience: 'pupils', read: true,
    fields: [YEAR, { id: 'source', kind: 'area', rows: 7, required: true, label: 'The text to rewrite', placeholder: 'Paste a text from a book, a website or a story.' },
      { id: 'keep', kind: 'text', label: 'Words to keep (optional)', placeholder: 'e.g. orang utan, rainforest' }, EXTRA],
    example: { year: '3', source: 'The orang utan is a great ape native to the rainforests of Borneo and Sumatra. It spends most of its life in the trees, where it builds a new nest every night from branches and leaves. Because their habitat is disappearing as forests are cleared for agriculture, orang utans are now critically endangered.', keep: 'orang utan, rainforest, nest' },
    task: (v) => [
      `Rewrite the text below for these pupils. Keep the meaning and the main facts; use shorter sentences, common words and simple tenses.`, v.keep && `Keep these words: ${v.keep}.`,
      'Use these sections:', '## Levelled text', '## What changed: three short bullet points for the teacher.', '## Word help: a table Word | Meaning for up to six words that may still be new.',
      'The text:', '"""', v.source, '"""'
    ]
  },
  {
    id: 'vocab', audience: 'pupils', send: ['wheel'],
    fields: [YEAR, { id: 'words', kind: 'area', rows: 2, required: true, label: 'Key words', placeholder: 'e.g. kitchen, bedroom, bathroom, garden', from: 'words' },
      topic({ required: false, label: 'Topic (optional)' }), { id: 'malay', kind: 'select', label: 'Malay meanings', options: ['With Malay meanings', 'English only'] }, EXTRA],
    example: { year: '2', words: 'kitchen, bedroom, bathroom, living room, garden', topic: 'My house', malay: 'With Malay meanings' },
    task: (v) => [
      `Make a vocabulary list for these words${v.topic ? ` (topic: ${v.topic})` : ''}: ${v.words}.`,
      `## Word list: a table with the columns ${v.malay === 'English only' ? 'Word | Meaning | Example sentence | Picture idea' : 'Word | Meaning | Example sentence | Bahasa Melayu | Picture idea'}, one row per word in the same order. Meanings and examples must be very simple and use Malaysian settings.`,
      '## Word families: related words pupils may meet (only where useful).',
      '## Three quick games: three five-minute games to practise these words, each with short steps.'
    ]
  },
  {
    id: 'dialogue', audience: 'pupils', read: true,
    fields: [YEAR, { id: 'situation', kind: 'text', required: true, label: 'Situation', placeholder: 'e.g. Buying food at the school canteen', from: 'topic' }, SENTENCE,
      { id: 'speakers', kind: 'select', label: 'Speakers', options: ['2', '3', '4'] }, EXTRA],
    example: { year: '3', situation: 'Buying food at the school canteen', sentence: 'How much is it? It is … ringgit.', speakers: '2' },
    task: (v) => [
      `Write a short, natural dialogue for ${v.speakers} speakers in this situation: ${v.situation}.`, v.sentence && `Use this target language several times: ${v.sentence}.`,
      'Use these sections:', '## (a title)', 'The dialogue: 8 to 14 lines, each starting with the speaker\'s name in bold, for example **Aina:**, using Malaysian names.',
      '## Role cards: one short card per speaker (who you are, what you want, two useful phrases).',
      '## Make it longer: three ideas for pupils to change or extend the dialogue.'
    ]
  },
  {
    id: 'phonics', audience: 'pupils', send: ['wheel'], read: true,
    fields: [YEAR, { id: 'sound', kind: 'text', required: true, label: 'Sound or spelling pattern', placeholder: 'e.g. sh · a_e as in cake · the short a in cat' }, EXTRA],
    example: { year: '1', sound: 'sh' },
    task: (v) => [
      `Make a phonics pack for the sound or spelling pattern: ${v.sound}.`,
      'Use these sections:',
      '## Words with this sound: 12 to 16 common words that are easy to draw, simplest first, in a table with the columns Word | Picture idea.',
      '## Odd one out: three sets of four words where one does not have the sound, each followed by a line starting "Answer:".',
      '## Tongue twister: one short, fun tongue twister.',
      '## Decodable sentences: five short sentences using mostly words with this sound and simple sight words.',
      '## A quick game: a five-minute game to practise the sound.'
    ]
  },
  {
    id: 'grammar', audience: 'pupils',
    fields: [YEAR, { id: 'point', kind: 'text', required: true, label: 'Grammar point', placeholder: 'e.g. has / have · simple past -ed · in, on, under' }, topic({ required: false, label: 'Lesson topic (optional)' }), EXTRA],
    example: { year: '5', point: 'Simple past tense: regular verbs with -ed', topic: 'My holiday' },
    task: (v) => [
      `Explain the grammar point "${v.point}" for these pupils${v.topic ? `, using the topic "${v.topic}"` : ''}.`,
      'Use these sections:',
      '## Explain it simply: two to four very short sentences for pupils.',
      '## Examples: five example sentences with the grammar point in bold.',
      '## Common mistakes: a table with the columns Mistake | Correct | Why, with mistakes Malaysian pupils often make (for example because of Malay, Chinese or Tamil).',
      '## Practice: six numbered items for pupils.',
      '## Answers: the answers to the practice items.'
    ]
  },
  {
    id: 'quiz', audience: 'pupils', send: ['quiz'], chips: ['Make the questions harder', 'Make the questions easier'],
    fields: [YEAR, topic({ kind: 'area', rows: 3, label: 'Topic or text', placeholder: 'Type a topic, or paste a text pupils have read.' }),
      { id: 'count', kind: 'select', label: 'Number of questions', options: ['8', '5', '10'] },
      { id: 'qtype', kind: 'select', label: 'Type of questions', options: ['Multiple choice', 'True or false', 'Short answer', 'A mix'] }, EXTRA],
    example: { year: '4', topic: 'Countries and nationalities in Southeast Asia', count: '8', qtype: 'Multiple choice' },
    task: (v) => [
      `Write a quiz of ${v.count} ${v.qtype === 'A mix' ? 'mixed (multiple choice, true or false and short answer)' : lower(v.qtype)} questions about: ${v.topic}.`,
      'Use this exact format: ## (a title), then the numbered questions. For multiple choice, put each option on its own line as A), B), C) (and D) if needed). After each question write a line starting "Answer:" with the correct answer (for multiple choice, the letter and the option).',
      'Questions must be clear, fair and at the pupils\' level, with one correct answer each.'
    ]
  },
  {
    id: 'questions', audience: 'pupils', send: ['quiz'],
    fields: [YEAR, topic({ kind: 'area', rows: 3, label: 'Topic or text', placeholder: 'Type a topic, or paste a text pupils have read.' }), EXTRA],
    example: { year: '6', topic: 'The story "The Mouse Deer and the Crocodiles" (Sang Kancil)' },
    task: (v) => [
      `Write questions about "${v.topic}" at every level of thinking (Bloom's taxonomy), from easy to hard, at the pupils' level.`,
      'Use these headings in this order: ## Remember, ## Understand, ## Apply, ## Analyse (KBAT), ## Evaluate (KBAT), ## Create (KBAT).',
      'Under each heading write two numbered questions, each followed by a line starting "Answer:" with a possible answer.',
      'Finish with ## Using them in class: two short tips (for example think-pair-share or a question wheel).'
    ]
  },
  {
    id: 'rubric', audience: 'teacher',
    fields: [YEAR, { id: 'task', kind: 'area', rows: 2, required: true, label: 'The task', placeholder: 'e.g. Write five sentences about my family' },
      { id: 'standard', kind: 'text', label: 'Learning standard (optional)', placeholder: 'e.g. 4.2.3 or Writing' },
      { id: 'count', kind: 'select', label: 'Number of criteria', options: ['3', '4'] }, EXTRA],
    example: { year: '4', task: 'Write a short postcard to a friend about a holiday', standard: '4.2.4', count: '3' },
    task: (v) => [
      `Make a PBD (classroom-based assessment) rubric for this task: ${v.task}.`, v.standard && `Learning standard: ${v.standard}.`,
      'Use the six KSSR performance levels (Tahap Penguasaan) TP1 to TP6: TP1 knows the very basics, TP2 knows and understands, TP3 knows, understands and can do, TP4 does it well, TP5 does it very well and confidently, TP6 does it excellently and creatively and can help others.',
      `## Rubric: a table with the columns Criteria | TP1 | TP2 | TP3 | TP4 | TP5 | TP6, with ${v.count} criteria and short, observable descriptors.`,
      '## Pupil checklist: three or four "I can …" statements in simple English.',
      '## Evidence to keep: two bullet points.'
    ]
  },
  {
    id: 'exit', audience: 'pupils', send: ['quiz'],
    fields: [YEAR, { id: 'objective', kind: 'area', rows: 2, required: true, label: 'Lesson objective or topic', placeholder: 'e.g. Pupils can describe three animals using can and cannot', from: 'objectives' }, EXTRA],
    example: { year: '2', objective: 'Pupils can name five animals and say what they can do, using "can" and "cannot".' },
    task: (v) => [
      `Make four different exit tickets to check this objective at the end of the lesson: ${v.objective}`,
      'Use these headings: ## 1. 3-2-1, ## 2. Traffic lights, ## 3. One sentence, ## 4. Quick quiz.',
      'For each: what pupils see or get (ready to print or to copy onto the board), then a line starting "Check:" with what a good answer shows. The quick quiz has three numbered questions, each followed by a line starting "Answer:".'
    ]
  },
  {
    id: 'feedback', audience: 'teacher',
    fields: [YEAR, { id: 'task', kind: 'text', label: 'What pupils were asked to write (optional)', placeholder: 'e.g. A postcard about a holiday' },
      { id: 'writing', kind: 'area', rows: 7, required: true, label: 'The pupil\'s writing', hint: NO_NAMES },
      { id: 'lang', kind: 'select', label: 'Next step for the pupil', options: ['In English', 'In English and Malay'] }, EXTRA],
    example: { year: '4', task: 'A postcard to a friend about a holiday', writing: 'Dear Mei,\nI am in Langkawi with my family. Yesterday we go to the beach and swim. The water is very blue and beautifull. We eat seafood for dinner. I buyed a keychain for you.\nSee you soon,\nYour friend', lang: 'In English and Malay' },
    task: (v) => [
      'Give feedback on this piece of writing by a pupil.', v.task && `The task was: ${v.task}.`,
      'Use these sections:',
      '## Two stars: two specific things done well.',
      '## A wish: one clear thing to improve.',
      '## Corrected version: the writing with mistakes corrected and the corrected words in bold. Keep the pupil\'s ideas.',
      '## Mistakes to teach: patterns for the teacher, not every small error.',
      `## Next step for the pupil: one simple sentence the pupil can understand${v.lang === 'In English and Malay' ? ', then the same sentence in Bahasa Melayu' : ''}.`,
      'The pupil\'s writing:', '"""', v.writing, '"""'
    ]
  },
  {
    id: 'scaffold', audience: 'pupils',
    fields: [YEAR, { id: 'task', kind: 'area', rows: 2, required: true, label: 'The task', placeholder: 'e.g. Describe your best friend' }, SENTENCE, EXTRA],
    example: { year: '5', task: 'Write a paragraph about your best friend', sentence: 'My best friend is … He/She likes … because …' },
    task: (v) => [
      `Make language support for this task: ${v.task}.`, v.sentence && `Target language: ${v.sentence}.`,
      'Use these sections:',
      '## Word bank: a table with a column for each type of word pupils need (for example nouns, verbs, adjectives, linking words).',
      '## Sentence frames: three groups with the headings ### Low (one gap to fill), ### Moderate (two or three gaps) and ### High (a starter to finish freely), with four frames each.',
      '## Model answer: a short model at the Moderate level.',
      '## For fast finishers: two challenges.'
    ]
  },
  {
    id: 'pupil-help', audience: 'teacher',
    fields: [YEAR, { id: 'need', kind: 'select', label: 'The pupil', options: ['A weak reader', 'A pupil who finds writing hard', 'A shy pupil who does not speak', 'A pupil who is easily distracted', 'A pupil with special needs (MBK)', 'A fast finisher who needs a challenge', 'A pupil who is new to English'] },
      topic({ required: false, label: 'Lesson topic (optional)' }),
      { id: 'notes', kind: 'area', rows: 3, label: 'What you have noticed (optional)', placeholder: 'e.g. reads slowly, guesses words from pictures, loves drawing', hint: 'No names, please.' }, EXTRA],
    example: { year: '3', need: 'A weak reader', topic: 'Animals in the zoo', notes: 'Knows most letter sounds, reads slowly, guesses words from pictures, loves drawing.' },
    task: (v) => [
      `Suggest practical support in an English lesson for ${lower(v.need)}.`, v.topic && `Today's topic: ${v.topic}.`, v.notes && `What the teacher has noticed: ${v.notes}.`,
      'Use these sections: ## Before the lesson, ## During the lesson, ## Materials that help, ## Check how it went (two or three quick signs to look for), ## Kind words to say (two encouraging sentences the teacher can say).',
      'Keep each point short and realistic for a class of 30 to 40 pupils. Do not diagnose.'
    ]
  },
  {
    id: 'song', audience: 'pupils', read: true,
    fields: [YEAR, topic(), WORDS,
      { id: 'tune', kind: 'select', label: 'Tune', options: ['Twinkle, Twinkle, Little Star', 'Row, Row, Row Your Boat', 'The Wheels on the Bus', 'Old MacDonald Had a Farm', 'If You\'re Happy and You Know It', 'Are You Sleeping? (Frère Jacques)', 'London Bridge Is Falling Down', 'No tune: a chant or rap'] }, EXTRA],
    example: { year: '1', topic: 'Colours', words: 'red, blue, yellow, green', tune: 'Twinkle, Twinkle, Little Star' },
    task: (v) => [
      v.tune.startsWith('No tune') ? `Write a catchy chant or rap about "${v.topic}" with a strong, simple beat.` : `Write new words about "${v.topic}" to the tune of "${v.tune}", matching its rhythm and number of lines.`,
      v.words && `Use these words: ${v.words}.`,
      'Use these sections: ## (a title, with the tune in brackets), then the lyrics with one sung line per line and a blank line between verses; ## Actions: a simple action for each line or verse; ## Teaching it in three steps.'
    ]
  },
  {
    id: 'story', audience: 'pupils', read: true,
    fields: [YEAR, topic({ label: 'What is the story about?', placeholder: 'e.g. A lost kitten at the night market' }),
      { id: 'setting', kind: 'text', label: 'Where it happens (optional)', placeholder: 'e.g. a kampung, the rainforest, a school trip' }, WORDS, EXTRA],
    example: { year: '4', topic: 'A lost kitten at the night market', setting: 'a pasar malam in Ipoh', words: 'stall, crowded, lantern, brave' },
    task: (v) => [
      `Write a short choose-your-path story about: ${v.topic}.`, v.setting && `Setting: ${v.setting}.`, v.words && `Use these words: ${v.words}.`,
      'Use these sections:', '## (a title)', '## Part 1: the beginning (80 to 120 words), ending with a problem.',
      '## What should happen next?: two choices, labelled A and B, for the class to vote on.',
      '## Path A: what happens (60 to 100 words) and an ending.', '## Path B: what happens (60 to 100 words) and a different ending.',
      '## Talk about it: three questions about the choices and the values in the story.'
    ]
  },
  {
    id: 'riddles', audience: 'pupils', send: ['quiz'], read: true,
    fields: [YEAR, topic(), { id: 'count', kind: 'select', label: 'How many', options: ['8', '5', '10'] }, EXTRA],
    example: { year: '3', topic: 'Animals', count: '8' },
    task: (v) => [
      `Write ${v.count} riddles and clean, simple jokes about "${v.topic}" for a warm-up.`,
      'Number them. After each, write a line starting "Answer:". Use only words pupils know, and no jokes about people, religion, race or bodies.',
      'Finish with ## How to use them: two quick classroom ideas.'
    ]
  },
  {
    id: 'parents', audience: 'teacher',
    fields: [{ id: 'purpose', kind: 'select', label: 'What it is about', options: ['Homework', 'An upcoming event', 'A reminder of things to bring', 'Praise for the class', 'A reading-at-home tip', 'A concern about the class'] },
      { id: 'details', kind: 'area', rows: 4, required: true, label: 'Details', placeholder: 'e.g. Spelling test on Friday 21 November, ten words from Unit 3, the list is in the exercise book' },
      lang('Bahasa Melayu', ['Bahasa Melayu', 'English', 'Bahasa Melayu and English']),
      { id: 'format', kind: 'select', label: 'Format', options: ['WhatsApp message', 'Letter', 'Short notice'] }, EXTRA],
    example: { purpose: 'An upcoming event', details: 'English Week next week (24 to 28 November). Pupils may come in costume as a storybook character on Friday. Please help them practise a short sentence about their character.', lang: 'Bahasa Melayu and English', format: 'WhatsApp message' },
    task: (v) => [
      `Write a ${lower(v.format)} to parents and guardians from their child's English teacher.`, `It is about: ${lower(v.purpose)}.`, `Details: ${v.details}`,
      v.lang === 'Bahasa Melayu' ? 'Write it in Bahasa Melayu.' : v.lang === 'English' ? 'Write it in simple English.' : 'Write it in Bahasa Melayu under the heading ## Bahasa Melayu, then the same message in simple English under ## English.',
      'Use a warm, polite greeting suitable for every family (for example "Salam sejahtera" or "Dear parents and guardians"), short sentences, and end with "[Your name], English teacher". Never name or single out a pupil.',
      v.format === 'WhatsApp message' && 'Keep it under 120 words for each language, with short lines and no tables.'
    ]
  },
  {
    id: 'reflection', audience: 'teacher',
    fields: [{ id: 'notes', kind: 'area', rows: 7, required: true, label: 'Your notes about the lesson', placeholder: 'What happened, what went well, what did not, how pupils responded.', hint: 'No pupils\' names, please.' },
      { id: 'model', kind: 'select', label: 'Reflection model', options: ['What? So what? Now what?', 'Gibbs\' reflective cycle', 'Kolb\'s learning cycle'] },
      { id: 'length', kind: 'select', label: 'Length', options: ['Short (about 150 words)', 'Full (about 300 words)'] },
      topic({ required: false, label: 'Lesson topic (optional)' }), lang(), EXTRA],
    example: { notes: 'Year 4 speaking lesson on countries. The flag warm-up worked very well and everyone joined in. The pair interviews took too long because my instructions were not clear, so I had no time for the exit ticket. Two groups were noisy. Most pupils used "He is from …" correctly by the end.', model: 'What? So what? Now what?', length: 'Short (about 150 words)', topic: 'Where are you from?', lang: 'English' },
    task: (v) => [
      `Turn the notes below into a lesson reflection for a trainee teacher's practicum file, using ${v.model}.`, v.topic && `Lesson topic: ${v.topic}.`,
      `Write in the first person, honestly and professionally, ${lower(v.length)} in total, in ${v.lang}. Use the stages of the model as ## headings, then add ## Action plan with three specific, realistic steps for the next lesson.`,
      'Do not invent events that are not in the notes.',
      'The notes:', '"""', v.notes, '"""'
    ]
  },
  {
    id: 'email', audience: 'teacher',
    fields: [{ id: 'to', kind: 'select', label: 'To', options: ['My mentor teacher', 'My lecturer or supervisor', 'The headteacher', 'A colleague', 'A parent or guardian'] },
      { id: 'purpose', kind: 'area', rows: 2, required: true, label: 'What is it about?', placeholder: 'e.g. Ask to move my observation from Tuesday to Thursday' },
      { id: 'points', kind: 'area', rows: 3, label: 'Points to include (optional)' },
      { id: 'tone', kind: 'select', label: 'Tone', options: ['Formal', 'Friendly but professional'] }, lang()],
    example: { to: 'My mentor teacher', purpose: 'Ask to move my lesson observation from Tuesday to Thursday', points: 'The school sports day rehearsal is on Tuesday morning; Thursday 8.40 am with 4 Bestari would work; I will send the lesson plan on Wednesday.', tone: 'Formal', lang: 'English' },
    task: (v) => [
      `Write an email from a trainee English teacher to ${lower(v.to)}.`, `It is about: ${v.purpose}.`, v.points && `Include: ${v.points}`,
      `Tone: ${lower(v.tone)}. Language: ${v.lang}. Keep it short and clear.`,
      'Start with a line "Subject: …", then the email with a suitable greeting and closing, signed "[Your name]". Use placeholders in square brackets for any detail you do not know.'
    ]
  },
  {
    id: 'ask', audience: 'teacher',
    fields: [{ id: 'question', kind: 'area', rows: 4, required: true, label: 'Your question', placeholder: 'e.g. How do I get a noisy Year 5 class to work well in groups?' }, lang()],
    example: { question: 'How do I get a noisy Year 5 class to work well in groups without shouting?', lang: 'English' },
    task: (v) => [
      `A trainee English teacher in a Malaysian primary school asks: ${v.question}`,
      `Answer in ${v.lang}, practically and kindly, for a busy teacher: start with the answer, then concrete steps or examples. Mention KSSR, CEFR or PBD only where it helps. Keep it under 350 words.`
    ]
  }
];
export const defOf = (id: string) => DEFS.find((d) => d.id === id);
/** Tools that can be based on a Scheme of Work lesson (not the ones that work on a text or a pupil's writing). */
export const groundable = (d: ToolDef) => d.fields.some((f) => f.kind === 'year') && d.id !== 'level' && d.id !== 'feedback';

const PUPILS = 'Anything pupils read or hear must use simple, correct British English at their level, Malaysian names, places, food and festivals that respect every culture and religion in Malaysia, and nothing unsuitable for children.';
/** What English at each year's CEFR level looks like, so pupil texts are pitched right. */
export const LEVEL: Record<number, string> = {
  1: 'Pitch it at Pre-A1: single words, chunks and very short sentences (3 to 6 words), present simple, the most common everyday words, lots of repetition and things pupils can see or do.',
  2: 'Pitch it at Pre-A1: very short sentences (up to 7 words), present simple, can and can\'t, the most common everyday words, lots of repetition.',
  3: 'Pitch it at A1: short sentences (5 to 9 words), present simple and continuous, the simple past of common verbs, can and can\'t, there is and there are, everyday words.',
  4: 'Pitch it at A1: short sentences (up to 10 words), present and past simple, can and can\'t, joined with and, but or because; explain any new word in context.',
  5: 'Pitch it at A1 to A2: sentences up to 12 words, past, present and future forms, comparatives, linking words (and, but, because, so, then); new words explained in context.',
  6: 'Pitch it at A2: sentences up to 14 words, a range of tenses, comparatives and superlatives, linking words (because, so, although, first, finally); new words explained in context.'
};
const TEACHER = 'Write for the teacher in clear, practical language that fits Malaysian primary classrooms (often large, mixed-ability classes with few resources).';
const FORMAT = 'Format the answer in Markdown: ## for section headings, - for bullet points, 1. for numbered items, **bold** for key words, and a table only where asked. Start straight with the content: no introduction, no closing remarks and no questions back. Never include pupils\' real names or personal details.';

const clean = (v: Values): Values => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x ?? '').trim()]));
/**
 * The prompt for a tool: who the pupils are, the curriculum facts when the teacher chose a Scheme of Work lesson
 * (`grounding`, see grounding.ts), the task, the level, and the format. Only what the teacher typed is in it.
 */
export function buildPrompt(d: ToolDef, values: Values, grounding = ''): string {
  const v = clean(values);
  const y = Math.min(6, Math.max(1, Number(v.year) || 4));
  const hasYear = d.fields.some((f) => f.kind === 'year');
  return [
    'You are helping a teacher of English in a Malaysian primary school (KSSR curriculum, aligned to CEFR).',
    hasYear && `The pupils are in Year ${y} (about ${y + 6} years old, CEFR ${cefr(y)}).`,
    grounding.trim(),
    ...d.task(v),
    grounding.trim() && d.id === 'lesson-plan' && 'In the Learning standards section, give exactly the standards in the curriculum facts above.',
    v.extra && `Also: ${v.extra}`,
    d.audience === 'pupils' ? PUPILS : TEACHER,
    hasYear && d.audience === 'pupils' && LEVEL[y],
    FORMAT
  ].filter((x): x is string => !!x).join('\n');
}
/** Ask for a changed version: the original request, the current version and the change. */
export function refinePrompt(d: ToolDef, values: Values, current: string, change: string, grounding = ''): string {
  if (d.id === 'ask') return [buildPrompt(d, values, grounding), '', 'Your earlier answer:', '"""', current, '"""', `The teacher's follow-up: ${change.trim()}`, 'Answer the follow-up, building on your earlier answer, in the same format.'].join('\n');
  return [buildPrompt(d, values, grounding), '', 'This is the current version:', '"""', current, '"""', `Change it: ${change.trim()}`, 'Keep the same sections and format. Return the complete new version only.'].join('\n');
}
/** Chips offered for changes, depending on who reads the result. */
export function chipsFor(d: ToolDef): string[] {
  if (d.id === 'ask') return ['Give me an example', 'Make it shorter', 'Explain it in Bahasa Melayu'];
  const base = d.audience === 'pupils'
    ? ['Make it simpler', 'Make it shorter', 'Make it longer', 'Make it more fun', 'Add Malay meanings for the key words', 'Use more Malaysian examples']
    : ['Make it shorter', 'Add more detail', 'Make it more formal', 'Make it friendlier', 'Write it in Bahasa Melayu', 'Write it in English'];
  return [...(d.chips ?? []), ...base];
}
/** Starting values: the lesson bar first, then each field's default. */
export function startValues(d: ToolDef, c: Pick<ToolContext, 'year' | 'topic' | 'words' | 'sentence' | 'skill' | 'objectives'>, locale = 'en'): Values {
  const v: Values = {};
  for (const f of d.fields) {
    const fromCtx = f.from ? (f.from === 'objectives' ? c.objectives || c.topic : c[f.from]) : '';
    if (f.kind === 'year') v[f.id] = String(c.year || 4);
    else if (fromCtx && (f.kind !== 'select' || f.options?.includes(fromCtx))) v[f.id] = String(fromCtx);
    else if (f.id === 'lang' && d.id === 'ask' && locale === 'ms' && f.options?.includes('Bahasa Melayu')) v[f.id] = 'Bahasa Melayu';
    else v[f.id] = f.def ?? (f.kind === 'select' ? f.options?.[0] ?? '' : '');
  }
  return v;
}
export const missingFields = (d: ToolDef, v: Values) => d.fields.filter((f) => f.required && !String(v[f.id] ?? '').trim());
