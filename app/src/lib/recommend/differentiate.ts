/** Rules for turning one activity into Low / Moderate / High versions (Tomlinson: content, process, product). */
export interface Tiered { low: string[]; mod: string[]; high: string[] }
const SUPPORT: Record<string, string[]> = {
  Listening: ['Play or read the text three times instead of twice.', 'Give pictures to point to instead of writing answers.', 'Pre-teach the 3 key words with picture cards.', 'Pause after each part and check with a thumbs up.'],
  Speaking: ['Give a sentence frame on the board, e.g. "I like … because …".', 'Let pupils rehearse with a partner before speaking to the class.', 'Use picture prompts for every answer.', 'Accept one-word answers first, then build to a sentence together.'],
  Reading: ['Give a shorter text or the first half only, with key words highlighted.', 'Read the text aloud first while pupils follow with a finger.', 'Turn questions into multiple choice or true/false.', 'Add a picture glossary of 5 hard words.'],
  Writing: ['Give a word bank and a sentence frame.', 'Ask for fewer sentences (3 instead of 5).', 'Let pupils draw first, then write labels or one sentence.', 'Provide a model text to follow line by line.'],
  'Language Arts': ['Give the repeated line or chorus only.', 'Let pupils use puppets or pictures to retell.', 'Pair with a confident pupil who leads.', 'Use actions and gestures to support meaning.']
};
const CHALLENGE: Record<string, string[]> = {
  Listening: ['Answer once, without a second listening.', 'Add a "why do you think…?" question.', 'Pupils write one question of their own about the text.'],
  Speaking: ['Add a reason with "because" to every answer.', 'Ask one follow-up question each time.', 'Speak for 30 seconds without notes.'],
  Reading: ['Answer an inference question and show the evidence in the text.', 'Give the text a new title and explain why.', 'Write 2 questions for a partner.'],
  Writing: ['Join sentences with and, but, because or so.', 'Write a longer paragraph with a title and an ending.', 'Edit a partner\'s work using the success criteria.'],
  'Language Arts': ['Write a new verse or a different ending.', 'Perform with expression and a new action for each line.', 'Lead the group or direct the performance.']
};
export function differentiate(activity: string, skill: string): Tiered {
  const a = activity.trim().replace(/[.]+$/, '') || 'the activity';
  const s = SUPPORT[skill] ?? SUPPORT.Speaking, c = CHALLENGE[skill] ?? CHALLENGE.Speaking;
  return {
    low: [`${a}, with support:`, ...s.slice(0, 3)],
    mod: [`${a}, as planned.`, 'Model one example first, then pupils work with a partner.', 'Fast finishers move on to the High task.'],
    high: [`${a}, with more challenge:`, ...c]
  };
}
