/** Classroom-management routines for trainee teachers, chosen for what the class is like. */
export type Need = 'noisy' | 'energetic' | 'shy' | 'large' | 'mixed' | 'sen' | 'slow-start' | 'transitions';
type Item = [string, string];
const BASE: Item[] = [['Greeting at the door.', 'Greet each pupil by name; it settles the class before the lesson starts.'], ['One attention signal.', 'Choose one and use it every lesson: "Class, class!" — "Yes, yes!", or a clap pattern pupils copy.'], ['Clear expectations.', 'Three positive rules on the wall with pictures: Listen. Try. Be kind.']];
const BY: Record<Need, Item[]> = {
  noisy: [['Noise traffic light.', 'Show green (partner voices), amber (whisper) or red (silence) with the Noise tool in Teach mode.'], ['Countdown 5-4-3-2-1.', 'Count down with fingers; by 1 voices are off and eyes are on you. Wait for silence; never talk over noise.'], ['Praise the quiet table.', 'Name the group that is ready first; others copy quickly.']],
  energetic: [['Brain breaks.', 'A 1-minute action song or "Simon says" between stages.'], ['Movement with a purpose.', 'Stand up for true, sit for false; walk to four corners; board race.'], ['Jobs for busy pupils.', 'Hand out materials, keep the timer, be the "word wall writer".']],
  shy: [['Think–pair–share.', 'Think alone (30 s), tell a partner, then pairs share. Nobody speaks to the class unprepared.'], ['Wait time.', 'Wait 3–5 seconds after a question before choosing anyone.'], ['Low-risk answers.', 'Mini whiteboards, thumbs, choral answers and puppets let pupils answer without standing out.']],
  large: [['Group roles.', 'Leader, writer, timekeeper, reporter: give a role card to each pupil in groups of 4.'], ['Numbered heads.', 'Number pupils 1–4 in each group; call a number to answer, so everyone prepares.'], ['Name picker.', 'Use the Name picker in Teach mode so every pupil gets a turn across the week.']],
  mixed: [['Tiered tasks.', 'One goal, three versions (🌱 🌿 🌳). Let pupils move up when ready.'], ['Expert helpers.', 'Fast finishers become helpers after their High task.'], ['Flexible groups.', 'Use PBD levels to group for a task, then mix again next lesson.']],
  sen: [['Visual timetable.', 'Show the stages of the lesson with pictures and tick them off.'], ['Chunked instructions.', 'One instruction at a time; show, say and check.'], ['Buddy and calm corner.', 'A kind buddy nearby, and a quiet place to reset when needed. Ask your school\'s special education teacher for advice.']],
  'slow-start': [['Bell work.', 'A task on the board before pupils sit (unjumble a sentence, draw and label) so they start at once.'], ['Settling song.', 'The same short song every lesson to signal "English starts now".']],
  transitions: [['Timer on the board.', 'Use the Timer tool for every task change; announce "2 minutes left".'], ['Rehearse moves.', 'Practise getting into groups in 30 seconds, twice, and praise the fastest tidy group.'], ['Materials monitors.', 'Two pupils per row hand out and collect.']]
};
export function routinesFor(needs: Need[]): { title: string; items: Item[] }[] {
  const t: Record<Need, string> = { noisy: 'For a noisy class', energetic: 'For an energetic class', shy: 'For shy pupils', large: 'For a large class', mixed: 'For mixed ability', sen: 'For pupils with special needs', 'slow-start': 'Starting the lesson', transitions: 'Smooth transitions' };
  return [{ title: 'Every class', items: BASE }, ...needs.map((n) => ({ title: t[n], items: BY[n] }))];
}
