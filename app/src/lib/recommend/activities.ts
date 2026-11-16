/**
 * Activity recipes for Consilia Recommends: the 70 bank activities, each linked to teaching aids (BBM), digital tools,
 * an energy level and what pupils produce, plus 16 "signature" activities written in full, step by step.
 * Placeholders: {topic}, {words}, {sentence}, {text}.
 */
import { BANK, type BankItem, type BankSkill } from '../content/bank';

export type Energy = 'calm' | 'active';
export type Output = 'answers' | 'sentences' | 'dialogue' | 'story' | 'text' | 'drawing' | 'performance' | 'questions' | 'report' | 'poster' | 'list';
export interface Recipe extends BankItem {
  bbm: string[]; digital: string[]; energy: Energy; wow: boolean; output: Output;
  /** Resources the activity cannot run without. */
  needs: ('projector' | 'internet' | 'devices' | 'speakers')[];
  /** Full teacher script; when absent, steps are composed from teacher, pupils and tiers. */
  steps?: string[];
  signature?: boolean;
}

type E = [string[], string[], 'a' | 'c', 0 | 1, Output];
const ENRICH: Record<string, E> = {
  L1: [['bingo'], ['wordwall'], 'c', 0, 'answers'], L2: [[], [], 'a', 0, 'answers'], L3: [['flashcards'], ['youtube', 'learnenglishkids'], 'c', 0, 'answers'],
  L4: [[], [], 'c', 0, 'drawing'], L5: [[], ['youtube', 'learnenglishkids'], 'c', 0, 'answers'], L6: [[], [], 'c', 0, 'answers'], L7: [['scene-poster'], [], 'c', 0, 'answers'],
  L8: [['phonics-cards', 'word-cards'], ['wordwall'], 'a', 0, 'answers'], L9: [[], [], 'c', 0, 'answers'], L10: [[], ['youtube'], 'a', 1, 'performance'],
  S1: [[], [], 'a', 0, 'questions'], S2: [['flashcards', 'scene-poster'], ['consilia-wheel'], 'c', 0, 'sentences'], S3: [['microphone', 'realia'], [], 'a', 1, 'dialogue'],
  S4: [['masks', 'microphone'], [], 'a', 1, 'questions'], S5: [['flashcards', 'ball'], ['consilia-wheel'], 'a', 0, 'sentences'], S6: [[], ['padlet'], 'a', 1, 'report'],
  S7: [['flashcards'], [], 'c', 0, 'sentences'], S8: [['dice'], ['consilia-wheel'], 'a', 0, 'answers'], S9: [['realia', 'microphone'], [], 'c', 1, 'sentences'], S10: [['microphone'], [], 'c', 0, 'questions'],
  R1: [['flashcards'], ['storyweaver'], 'c', 0, 'sentences'], R2: [[], [], 'a', 0, 'answers'], R3: [[], ['liveworksheets'], 'c', 0, 'answers'], R4: [['traffic-cards'], ['quizizz', 'liveworksheets'], 'c', 0, 'answers'],
  R5: [['envelopes'], [], 'a', 1, 'answers'], R6: [['flashcards', 'sentence-strips'], ['wordwall', 'liveworksheets'], 'c', 0, 'answers'], R7: [['sentence-strips'], ['wordwall'], 'c', 0, 'story'],
  R8: [['word-cards'], [], 'c', 0, 'sentences'], R9: [['mini-whiteboards'], ['consilia-quiz', 'kahoot'], 'a', 0, 'questions'], R10: [['traffic-cards'], ['padlet'], 'c', 0, 'sentences'],
  W1: [['sentence-strips'], ['canva'], 'c', 0, 'answers'], W2: [['mind-map'], [], 'c', 0, 'list'], W3: [['sentence-strips', 'pocket-chart'], ['liveworksheets'], 'c', 0, 'sentences'],
  W4: [['flashcards'], ['liveworksheets'], 'c', 0, 'sentences'], W5: [['pocket-chart'], [], 'c', 0, 'text'], W6: [['traffic-cards'], [], 'c', 0, 'text'], W7: [[], ['canva'], 'c', 1, 'text'],
  W8: [[], ['padlet'], 'a', 1, 'text'], W9: [['sentence-strips'], ['consilia-unjumble'], 'c', 0, 'sentences'], W10: [['word-wall'], ['padlet', 'canva'], 'c', 1, 'text'],
  A1: [[], ['youtube'], 'a', 1, 'performance'], A2: [[], [], 'c', 1, 'performance'], A3: [['masks'], [], 'a', 1, 'performance'], A4: [['mind-map', 'puppets'], [], 'c', 1, 'story'],
  A5: [[], [], 'c', 1, 'drawing'], A6: [[], [], 'a', 0, 'performance'], A7: [[], [], 'a', 1, 'performance'], A8: [['puppets'], [], 'a', 1, 'story'], A9: [[], ['canva'], 'c', 1, 'poster'], A10: [[], [], 'c', 0, 'answers'],
  P1: [['mystery-bag'], ['consilia-mystery'], 'a', 1, 'answers'], P2: [['scene-poster'], [], 'c', 0, 'sentences'], P3: [['word-cards'], [], 'c', 0, 'answers'], P4: [[], [], 'a', 0, 'answers'],
  P5: [[], [], 'a', 0, 'answers'], P6: [['mind-map'], [], 'a', 0, 'list'], P7: [[], ['youtube'], 'a', 0, 'performance'], P8: [['flashcards'], [], 'a', 0, 'answers'], P9: [[], [], 'a', 0, 'answers'],
  P10: [['sentence-strips'], ['consilia-unjumble'], 'c', 0, 'sentences'],
  C1: [[], [], 'c', 0, 'answers'], C2: [['traffic-cards'], [], 'c', 0, 'answers'], C3: [[], ['padlet'], 'c', 0, 'list'], C4: [['ball'], [], 'a', 0, 'questions'], C5: [[], [], 'c', 0, 'sentences'],
  C6: [['traffic-cards'], [], 'c', 0, 'answers'], C7: [[], [], 'c', 0, 'sentences'], C8: [['word-wall'], [], 'c', 0, 'list'], C9: [['mini-whiteboards'], ['consilia-quiz', 'baamboozle'], 'a', 1, 'answers'], C10: [[], [], 'c', 0, 'text']
};

const NEEDS: Record<string, Recipe['needs']> = { A1: ['speakers'], L3: [], L5: [] };

const fromBank = (b: BankItem): Recipe => {
  const [bbm, digital, e, wow, output] = ENRICH[b.id] ?? [[], [], 'c', 0, 'answers'];
  return { ...b, bbm, digital, energy: e === 'a' ? 'active' : 'calm', wow: !!wow, output, needs: NEEDS[b.id] ?? [] };
};

type Sig = Omit<Recipe, 'signature' | 'offline'> & { offline?: string };
const SIGNATURE: Sig[] = [
  { id: 'X1', title: 'Fly-swatter slap', skill: 'Speaking', stages: ['presentation', 'practice', 'pre', 'pre-lesson', 'focus'], years: [1, 6], pattern: 'whole-class', minutes: 8,
    teacher: 'Stick the {topic} picture cards on the board and call words, meanings or sentences with a gap.', pupils: 'Two players race to slap the right card; the class says the word together after each round.',
    tiers: { low: 'Call the word itself; the picture is on the card.', mod: 'Call a sentence with the word missing.', high: 'Call a definition or a riddle ("It is yellow and long…").' },
    materials: 'Two fly swatters, picture cards, Blu-tack', bbm: ['fly-swatters', 'flashcards'], digital: ['wordwall'], energy: 'active', wow: true, output: 'answers', needs: [],
    steps: ['Stick 8 picture cards for {words} on the board, spread out.', 'Split the class into two teams; the first player from each team stands at the line with a fly swatter.', 'Model one round with a volunteer: call "{first}", slap the card, and say the word aloud.', 'Call a word (or a sentence with a gap); the first player to slap the right card wins a point.', 'The whole class repeats the word after every round, so everyone speaks, not only the players.', 'Rotate players every round; finish with the team score and one sentence from each team using a word.'] },
  { id: 'X2', title: 'Board race', skill: 'Writing', stages: ['practice', 'post-lesson', 'focus', 'revising'], years: [3, 6], pattern: 'groups', minutes: 8,
    teacher: 'Draw one column per team on the board and give a category or sentence prompt about {topic}.', pupils: 'Team members run one at a time to write a word or sentence in their column; teammates help with spelling from their seats.',
    tiers: { low: 'Write a word from the word bank on the board.', mod: 'Write a word without help.', high: 'Write a full sentence using the word.' },
    materials: 'Whiteboard, one marker per team', bbm: ['mini-whiteboards'], digital: [], energy: 'active', wow: false, output: 'sentences', needs: [],
    steps: ['Divide the board into 3–4 columns, one per team, and give each team one marker.', 'Say the prompt, for example "Words about {topic}" or "A sentence with {sentence}".', 'On "Go!", the first pupil runs, writes one word, runs back and passes the marker on.', 'After 2 minutes say "Stop!"; check each column with the class: one point per correct word, a bonus for correct spelling.', 'Do a second round with a harder prompt (sentences instead of words).'] },
  { id: 'X3', title: 'Escape envelopes', skill: 'Reading', stages: ['post', 'production', 'task-cycle', 'post-lesson'], years: [3, 6], pattern: 'groups', minutes: 15,
    teacher: 'Give each group three numbered envelopes with tasks on the {text}; each answer gives one letter of a code word.', pupils: 'Groups read and solve each task, show the answer to get the next envelope, and "escape" with the code word.',
    tiers: { low: 'Task cards with picture clues and multiple-choice answers.', mod: 'Short-answer tasks.', high: 'Add a bonus envelope: write one question about the text for another group.' },
    materials: 'Envelopes, task cards, a code word on the board', bbm: ['envelopes'], digital: [], energy: 'active', wow: true, output: 'answers', needs: [],
    steps: ['Before class: write 3 tasks on the {text} (find a fact, unjumble a sentence, answer a "why" question); each answer gives one letter of a code word linked to {topic}.', 'Put the tasks in envelopes numbered 1–3, one set per group, and draw a padlock on the board.', 'Explain: "Solve envelope 1, show me the answer, then you get envelope 2."', 'Groups work; check each answer quickly and hand over the next envelope.', 'The first group to say the code word "escapes"; let other groups finish, then go through the answers together.'] },
  { id: 'X4', title: 'QR stations', skill: 'Listening', stages: ['while', 'practice', 'task-cycle'], years: [4, 6], pattern: 'groups', minutes: 20,
    teacher: 'Set up 3–4 stations, each with a QR code to a short video, audio or game about {topic} and a task card.', pupils: 'Groups rotate every 5 minutes, scan the code, listen or watch, and complete the task card.',
    tiers: { low: 'Task cards with pictures and choices.', mod: 'Short-answer task cards.', high: 'One open question per station ("What would you do?").' },
    materials: 'QR task cards, one device per station, task cards', bbm: ['qr-cards'], digital: ['youtube', 'learnenglishkids'], energy: 'active', wow: true, output: 'answers', needs: ['internet', 'devices'],
    steps: ['Choose 3–4 short videos or audios about {topic}; add their links in the Materials step so Consilia prints a QR code for each.', 'Put one device (phone or tablet) and one task card at each station; test every code.', 'Explain the rotation with a timer: 5 minutes per station, move clockwise on the signal.', 'Groups scan, watch or listen, and complete the task card together.', 'After the last rotation, groups share one answer from each station.'] },
  { id: 'X5', title: 'Four corners', skill: 'Speaking', stages: ['production', 'post', 'pre-task', 'pre-lesson'], years: [3, 6], pattern: 'whole-class', minutes: 10,
    teacher: 'Put an answer or opinion in each corner (A, B, C, D) and ask questions about {topic}.', pupils: 'Walk to the corner they choose, discuss why with the others there, and one pupil per corner explains the choice.',
    tiers: { low: 'Give the reason with a frame: "I chose A because…".', mod: 'Give a reason in their own words.', high: 'Try to persuade one pupil from another corner to change.' },
    materials: 'Four signs (A–D)', bbm: ['word-cards'], digital: [], energy: 'active', wow: false, output: 'sentences', needs: [],
    steps: ['Stick signs A, B, C and D in the four corners.', 'Read a question about {topic} with four answers or opinions.', 'Pupils walk to their corner and tell the people there why (1 minute).', 'One reporter per corner explains the choice to the class, using "{sentence}" if it fits.', 'Repeat with 2–3 more questions; finish by asking who changed their mind and why.'] },
  { id: 'X6', title: 'Living sentences', skill: 'Writing', stages: ['presentation', 'focus', 'practice', 'pre-lesson'], years: [2, 6], pattern: 'groups', minutes: 10,
    teacher: 'Give each pupil in a group one word card from a sentence like "{sentence}".', pupils: 'Pupils stand and arrange themselves in the right order to make the sentence, then read it aloud.',
    tiers: { low: 'Four-word sentences with a picture clue.', mod: 'Six to eight words, with the full stop as a card.', high: 'Change one word to make a new, correct sentence.' },
    materials: 'Word cards (one sentence per group)', bbm: ['word-cards', 'sentence-strips'], digital: ['consilia-unjumble'], energy: 'active', wow: true, output: 'sentences', needs: [],
    steps: ['Write 3–4 sentences using the target language ("{sentence}") and cut each into word cards; include a capital-letter card and a full-stop card.', 'Give each group one set; each pupil holds one card.', 'On "Go!", groups stand in front of the class in the right order.', 'The class reads each living sentence aloud and says if it is correct; the group fixes it if not.', 'Challenge round: swap one pupil between groups and make new sentences.'] },
  { id: 'X7', title: 'Snowball questions', skill: 'Speaking', stages: ['post', 'production', 'post-lesson'], years: [3, 6], pattern: 'whole-class', minutes: 10,
    teacher: 'Pupils write one question about {topic} on scrap paper and crumple it into a "snowball".', pupils: 'Throw the snowballs gently, pick one up, and answer the question to a partner, then to the class.',
    tiers: { low: 'Question starters on the board (What…? Where…? Do you…?).', mod: 'Write their own question.', high: 'Answer with a reason and ask a follow-up question.' },
    materials: 'Scrap paper', bbm: ['ball'], digital: [], energy: 'active', wow: true, output: 'questions', needs: [],
    steps: ['Give each pupil a piece of scrap paper; they write one question about {topic}.', 'Check a few questions as you walk round; help with question forms.', 'Everyone crumples their paper; on "Snowball!", they throw it gently into the middle (10 seconds).', 'Each pupil picks up one snowball, opens it and answers the question to a partner.', 'Invite 4–5 pupils to read their question and answer to the class.'] },
  { id: 'X8', title: 'Spin and speak', skill: 'Speaking', stages: ['practice', 'pre-lesson', 'post-lesson', 'focus'], years: [1, 6], pattern: 'groups', minutes: 10,
    teacher: 'Make a spinner with {topic} pictures or questions (or use Consilia\'s Spin wheel on the projector).', pupils: 'Take turns to spin and say a sentence about what it lands on using "{sentence}".',
    tiers: { low: 'Say the word, then the sentence with the frame on the board.', mod: 'Say a full sentence.', high: 'Say two linked sentences with "and", "but" or "because".' },
    materials: 'Paper-plate spinner or the projector wheel', bbm: ['spinner'], digital: ['consilia-wheel'], energy: 'active', wow: false, output: 'sentences', needs: [],
    steps: ['Put the sentence frame "{sentence}" on the board.', 'Model: spin, look at the picture, say the sentence.', 'Groups take turns: spin, say, and the group gives a thumbs up if it is correct.', 'Walk round and note common mistakes for quick feedback at the end.', 'Finish with each group saying their best sentence to the class.'] },
  { id: 'X9', title: 'Show me! (mini whiteboards)', skill: 'Writing', stages: ['practice', 'presentation', 'post-lesson', 'focus', 'while'], years: [1, 6], pattern: 'individual', minutes: 8,
    teacher: 'Ask quick questions about {topic}: spell a word, choose an answer, complete a sentence.', pupils: 'Write the answer on their mini whiteboard and hold it up on "3-2-1, show me!".',
    tiers: { low: 'Choose A or B; copy the word from the board.', mod: 'Write the word or short answer.', high: 'Write a full sentence.' },
    materials: 'Mini whiteboards, markers, cloths', bbm: ['mini-whiteboards'], digital: ['consilia-quiz'], energy: 'calm', wow: false, output: 'answers', needs: [],
    steps: ['Hand out mini whiteboards, markers and cloths; agree the routine: write, cover, show, wipe.', 'Ask a question about {topic} ("Spell {first}", "Complete: {sentence}").', 'Count "3-2-1, show me!"; scan every board.', 'Praise correct answers; if many are wrong, re-teach on the spot before the next question.', 'Note pupils who need help for the Low group later in the lesson.'] },
  { id: 'X10', title: 'Museum walk', skill: 'Writing', stages: ['revising', 'production', 'post', 'post-lesson'], years: [3, 6], pattern: 'groups', minutes: 15,
    teacher: 'Display the groups\' posters or drafts about {topic} around the class like a museum.', pupils: 'Groups visit each "exhibit" for 2 minutes and leave a star (something good) and a wish (one improvement) on a sticky note.',
    tiers: { low: 'Choose a feedback sticker from three ready phrases.', mod: 'Write a star and a wish.', high: 'Write a wish that names a language point (spelling, a joining word).' },
    materials: 'Posters or drafts, sticky notes', bbm: ['mind-map'], digital: ['padlet'], energy: 'active', wow: true, output: 'text', needs: [],
    steps: ['Stick each group\'s work on the wall with space around it.', 'Show the success criteria as a checklist; model one star and one wish.', 'Groups move clockwise every 2 minutes on your signal and write feedback.', 'Groups return to their own work, read the notes and make one improvement.', 'Two groups share what they changed.'] },
  { id: 'X11', title: 'Musical cards', skill: 'Speaking', stages: ['practice', 'pre-lesson', 'post-lesson'], years: [1, 4], pattern: 'whole-class', minutes: 8,
    teacher: 'Pass picture cards round the circle while music plays (or while you clap).', pupils: 'When the music stops, pupils holding a card say a sentence about it using "{sentence}".',
    tiers: { low: 'Say the word only.', mod: 'Say the full sentence.', high: 'Ask a question about the card for a classmate.' },
    materials: 'Picture cards, music or clapping', bbm: ['flashcards'], digital: ['youtube'], energy: 'active', wow: false, output: 'sentences', needs: [],
    steps: ['Sit pupils in a circle or keep them at desks passing along rows.', 'Hand out 4–5 picture cards of {words}.', 'Play music or clap a rhythm; pupils pass the cards on.', 'Stop the music; pupils holding cards stand and say their sentence.', 'Play 4–5 rounds so many pupils get a turn.'] },
  { id: 'X12', title: 'News reporter', skill: 'Speaking', stages: ['production', 'task-cycle', 'post'], years: [4, 6], pattern: 'pairs', minutes: 15,
    teacher: 'Pairs prepare a 1-minute news report or interview about {topic}.', pupils: 'One pupil is the reporter, the other the guest; they plan, rehearse and perform with a paper microphone.',
    tiers: { low: 'Fill in a report frame: "Good morning. Today in… We met…".', mod: 'Plan with key words only.', high: 'Add a surprising detail and a question from the audience.' },
    materials: 'Paper microphone, report frame', bbm: ['microphone'], digital: [], energy: 'active', wow: true, output: 'report', needs: [],
    steps: ['Show a 30-second model report about {topic} with you as the reporter.', 'Give each pair a report frame with useful language ("{sentence}").', 'Pairs plan (4 min) and rehearse twice (3 min).', 'Three or four pairs perform for the class with the paper microphone; the audience asks one question.', 'Give feedback on one strength and one language point.'] },
  { id: 'X13', title: 'Comic strip', skill: 'Writing', stages: ['production', 'drafting', 'post'], years: [3, 6], pattern: 'individual', minutes: 18,
    teacher: 'Pupils draw a 4-box comic about {topic} with speech bubbles.', pupils: 'Draw four scenes and write one or two sentences in each speech bubble using the target language.',
    tiers: { low: 'Comic with pictures already drawn; write the speech bubbles from a word bank.', mod: 'Draw and write 4 boxes.', high: 'Six boxes with a problem and an ending.' },
    materials: 'Paper folded into 4 boxes, pencils', bbm: [], digital: ['canva'], energy: 'calm', wow: true, output: 'story', needs: [],
    steps: ['Show a model comic about {topic} with four boxes and speech bubbles.', 'Point out the target language in the bubbles ("{sentence}").', 'Pupils fold paper into 4 boxes, sketch quickly in pencil (no colouring yet), then write the bubbles.', 'Pairs swap comics and check one thing against the success criteria.', 'Display the comics; colouring can be homework.'] },
  { id: 'X14', title: 'Running dictation', skill: 'Reading', stages: ['while', 'practice', 'pre'], years: [3, 6], pattern: 'pairs', minutes: 12,
    teacher: 'Stick a short text about {topic} on the wall outside or at the back of the class.', pupils: 'The runner reads a line, runs back and says it; the writer writes it down; they swap roles halfway.',
    tiers: { low: 'Shorter text with pictures; runner may run more often.', mod: 'Five-sentence text.', high: 'Longer text, then answer two questions about it.' },
    materials: 'Copies of a short text, paper', bbm: ['sentence-strips'], digital: [], energy: 'active', wow: true, output: 'text', needs: [],
    steps: ['Stick 3–4 copies of a 5-sentence {text} on the walls.', 'Pair pupils: one runner, one writer; the runner cannot write and the writer cannot run.', 'On "Go!", runners read, remember, run back and dictate; swap roles after 3 sentences.', 'The first pair to finish shows you; let others finish.', 'Pairs check their text against the original and correct spelling.'] },
  { id: 'X15', title: 'Sound hop', skill: 'Listening', stages: ['presentation', 'practice', 'pre-lesson', 'while'], years: [1, 3], pattern: 'whole-class', minutes: 8,
    teacher: 'Put sound cards on the floor in a hopscotch line and say words from today\'s phonics.', pupils: 'Hop to the sound they hear at the start (or in the middle) of the word and say the sound.',
    tiers: { low: 'Teacher says the word slowly and stretches the sound.', mod: 'Normal speed.', high: 'Pupil says a new word with the same sound.' },
    materials: 'Sound cards, masking tape', bbm: ['phonics-cards'], digital: [], energy: 'active', wow: true, output: 'answers', needs: [],
    steps: ['Tape 4–6 sound cards in a line or grid on the floor.', 'Say a word from today\'s list (such as {first}); model hopping to its first sound and saying the sound.', 'Pupils take turns in small groups to hop; the class says the sound together.', 'Speed up as they get better.', 'Finish by blending: hop three sounds in a row to make a word.'] },
  { id: 'X16', title: 'Detective case file', skill: 'Reading', stages: ['while', 'post'], years: [4, 6], pattern: 'pairs', minutes: 15,
    teacher: 'Give pairs a "case file" with the {text} and five clues to find.', pupils: 'Read like detectives: underline the evidence for each clue and write the line number.',
    tiers: { low: 'Three clues with paragraph numbers given.', mod: 'Five clues.', high: 'Five clues plus "What happened next?" with evidence.' },
    materials: 'Case file (text + clue card), coloured pencils', bbm: ['envelopes'], digital: ['liveworksheets'], energy: 'calm', wow: true, output: 'answers', needs: [],
    steps: ['Put the {text} and a clue card in a folder labelled CASE FILE for each pair.', 'Model one clue: read, underline the evidence, write the line number.', 'Pairs solve the other clues (8 minutes); fast pairs do the bonus question.', 'Pairs compare with another pair and agree on the answers.', 'Go through the case together; pupils show the evidence in the text.'] }
];

export const RECIPES: Recipe[] = [...BANK.map(fromBank), ...SIGNATURE.map((s) => ({ ...s, offline: s.offline ?? 'Already offline: needs no device.', signature: true }))];
export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);
export type { BankSkill };
