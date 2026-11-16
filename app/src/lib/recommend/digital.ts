/**
 * Digital tools Consilia recommends (blueprint F15, extended). Outside sites open a search for the lesson topic, so the
 * teacher lands on ready-made activities; Consilia's own games run offline on the projector from the lesson's words.
 */
export type Needs = 'internet' | 'projector' | 'devices' | 'speakers';
export interface Digital {
  id: string; name: string; kind: 'game' | 'quiz' | 'worksheet' | 'video' | 'story' | 'design' | 'board' | 'built-in';
  what: string; pupils: string; setup: string[]; needs: Needs[]; free: string;
  /** Search link for the topic; built-in tools open inside Consilia instead. */
  url?: (topic: string, year: number) => string; inApp?: string;
}
const enc = encodeURIComponent;
const google = (site: string, q: string) => `https://www.google.com/search?q=${enc(`site:${site} ${q}`)}`;

export const DIGITAL: Digital[] = [
  { id: 'consilia-wheel', name: 'Consilia Spin wheel', kind: 'built-in', what: 'A big colourful wheel made from your key words or questions, on the projector.', pupils: 'Watch the wheel spin, then say a sentence or answer the question it lands on.',
    setup: ['Type your key words in Tools → Classroom games, or open Teach mode → Games.', 'Press Spin.'], needs: ['projector'], free: 'Free, works offline', inApp: 'wheel' },
  { id: 'consilia-unjumble', name: 'Consilia Unjumble', kind: 'built-in', what: 'Sentences from your lesson appear with the words mixed up.', pupils: 'Groups race to say or write the sentence in the right order.',
    setup: ['Type 3–6 target sentences in Classroom games → Unjumble.', 'Show one sentence at a time; press Reveal to check.'], needs: ['projector'], free: 'Free, works offline', inApp: 'unjumble' },
  { id: 'consilia-mystery', name: 'Consilia Mystery word', kind: 'built-in', what: 'A word appears letter by letter, with a picture clue you describe.', pupils: 'Guess the word as early as possible; fewer letters, more points.',
    setup: ['Type your key words in Classroom games → Mystery word.', 'Press Next letter until someone guesses.'], needs: ['projector'], free: 'Free, works offline', inApp: 'mystery' },
  { id: 'consilia-quiz', name: 'Consilia Quiz show', kind: 'built-in', what: 'A team quiz on the projector with points, made from your questions.', pupils: 'Teams discuss, show the answer on mini whiteboards and score.',
    setup: ['Type questions and answers in Classroom games → Quiz show.', 'Split the class into teams and play.'], needs: ['projector'], free: 'Free, works offline', inApp: 'quiz' },
  { id: 'wordwall', name: 'Wordwall', kind: 'game', what: 'Thousands of ready-made games (match up, quiz, anagram, whack-a-mole, open the box) made by teachers.', pupils: 'Come to the board in turns, or play on devices with a link.',
    setup: ['Open the search; pick an activity for your topic and level.', 'Press "Present" to play on the projector, or "Share" to set it as an assignment.', 'Switch the template (for example from Quiz to Match up) to suit your stage.'], needs: ['internet', 'projector'], free: 'Free to play; making your own is limited on the free plan',
    url: (t) => `https://wordwall.net/community?query=${enc(t)}` },
  { id: 'liveworksheets', name: 'Liveworksheets', kind: 'worksheet', what: 'Interactive worksheets that pupils complete online and that mark themselves.', pupils: 'Fill in, match, drag and drop or record speaking on a device.',
    setup: ['Open the search and choose a worksheet for your topic.', 'Project it and complete it together, or share the link for devices.', 'Print it if there are no devices.'], needs: ['internet'], free: 'Free with an account',
    url: (t) => google('liveworksheets.com', `${t} english`) },
  { id: 'quizizz', name: 'Quizizz (Wayground)', kind: 'quiz', what: 'Self-paced quizzes with fun avatars and instant feedback.', pupils: 'Answer on a device at their own speed; see the class leaderboard.',
    setup: ['Search for a quiz on your topic; check every question.', 'Start a live game and show the join code.', 'No devices? Use "paper mode" or play as teams on the projector.'], needs: ['internet', 'devices'], free: 'Free basic plan',
    url: (t) => google('quizizz.com', `${t} english`) },
  { id: 'kahoot', name: 'Kahoot!', kind: 'quiz', what: 'A fast, loud, game-show quiz on the projector.', pupils: 'Teams answer on a shared device; the fastest correct team scores most.',
    setup: ['Search for a Kahoot on your topic and preview it.', 'Play in Team mode if devices are few.'], needs: ['internet', 'projector', 'devices'], free: 'Free basic plan',
    url: (t) => google('create.kahoot.it', `${t} english kids`) },
  { id: 'baamboozle', name: 'Baamboozle', kind: 'game', what: 'Team games on the projector: no pupil devices needed.', pupils: 'Teams choose a numbered square and answer the hidden question.',
    setup: ['Search for a game on your topic.', 'Press Play, choose the number of teams and project it.'], needs: ['internet', 'projector'], free: 'Free to play',
    url: (t) => google('baamboozle.com', `${t} english`) },
  { id: 'youtube', name: 'YouTube (songs and stories)', kind: 'video', what: 'Songs, chants and read-aloud stories for the topic.', pupils: 'Watch, sing along and do the actions.',
    setup: ['Search and watch the whole video yourself first.', 'Check the adverts and suggested videos before showing it.', 'Download it to your device in advance where YouTube allows, in case the internet fails.'], needs: ['internet', 'projector', 'speakers'], free: 'Free',
    url: (t, y) => `https://www.youtube.com/results?search_query=${enc(`${t} song for kids year ${y} english`)}` },
  { id: 'storyweaver', name: 'StoryWeaver', kind: 'story', what: 'Free illustrated story books at four reading levels, which you can read online or print.', pupils: 'Read a levelled story in pairs or as a class big book.',
    setup: ['Search for a story on your topic; choose the level for your class.', 'Project it as a big book, or download the PDF to print.'], needs: ['internet'], free: 'Free (open licence)',
    url: (t) => google('storyweaver.org.in', `${t} story`) },
  { id: 'learnenglishkids', name: 'British Council LearnEnglish Kids', kind: 'story', what: 'Short songs, stories and games for primary learners, with worksheets.', pupils: 'Watch a short story or song, then do the printable activity.',
    setup: ['Search for your topic and pick a story, song or game.', 'Download the worksheet that goes with it.'], needs: ['internet', 'projector', 'speakers'], free: 'Free',
    url: (t) => google('learnenglishkids.britishcouncil.org', t) },
  { id: 'canva', name: 'Canva templates', kind: 'design', what: 'Ready-made worksheets, flashcards, posters and slides you can edit.', pupils: '— (teacher tool)',
    setup: ['Open the search and choose a template.', 'Change the words to your lesson\'s words, then print or present.', 'Canva for Education is free for verified primary and secondary school teachers.'], needs: ['internet'], free: 'Free for teachers (Canva for Education)',
    url: (t) => `https://www.canva.com/search/templates?q=${enc(`${t} worksheet kids`)}` },
  { id: 'padlet', name: 'Padlet', kind: 'board', what: 'An online wall where pupils post words, sentences or pictures.', pupils: 'Post one sentence or picture; read and react to classmates\' posts.',
    setup: ['Create a free Padlet with a question at the top.', 'Show the QR code; pupils post from a device, or you type their answers.'], needs: ['internet', 'projector'], free: 'Free for 3 boards',
    url: () => 'https://padlet.com' }
];

export const digitalById = (id: string) => DIGITAL.find((d) => d.id === id);
/** True when the tool works with the class's resources. */
export function fits(d: Digital, has: { projector: boolean; internet: boolean; devices: boolean; speakers: boolean }): boolean {
  return d.needs.every((n) => has[n]);
}
