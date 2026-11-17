<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { untrack } from 'svelte';
  import { route, href } from '../../router.svelte';
  import { ctx } from '../../lib/tools/context.svelte';
  import { toggleFull } from '../../lib/ui/fullscreen.svelte';
  import FullExit from '../../lib/ui/FullExit.svelte';

  /** Projector games made from the teacher's own words. Offline; the words are remembered on this device. */
  let { initialWords = '', embedded = false }: { initialWords?: string; embedded?: boolean } = $props();
  type Game = 'wheel' | 'unjumble' | 'mystery' | 'quiz';
  const GAMES: [Game, string, string][] = [['wheel', tr('🎡 Spin wheel'), tr('Words or questions')], ['unjumble', tr('🔀 Unjumble'), tr('Sentences')], ['mystery', tr('🔍 Mystery word'), tr('Words')], ['quiz', tr('🏆 Quiz show'), tr('Questions | answers')]];
  const saved = (() => { try { return JSON.parse(localStorage.getItem('consilia.games') || '{}'); } catch { return {}; } })();
  let game = $state<Game>((['wheel', 'unjumble', 'mystery', 'quiz'] as Game[]).includes(route.parts[1] as Game) ? (route.parts[1] as Game) : 'wheel');
  let words = $state<string>(untrack(() => initialWords) || saved.words || '');
  let sentences = $state<string>(saved.sentences || '');
  let quiz = $state<string>(saved.quiz || '');
  $effect(() => { const v = { words, sentences, quiz }; try { localStorage.setItem('consilia.games', JSON.stringify(v)); } catch { /* fine */ } });
  const W = $derived((embedded ? words : ctx.words).split(/[,\n]+/).map((w) => w.trim()).filter(Boolean).slice(0, 16));
  const S = $derived(sentences.split(/\n+/).map((w) => w.trim()).filter((x) => x.split(/\s+/).length >= 2));
  const Q = $derived(quiz.split(/\n+/).map((l) => l.split('|').map((x) => x.trim())).filter((x) => x[0] && x[1]).map(([q, a]) => ({ q, a })));
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#E2BC4F', '#9CC9F0', '#F6C9A8', '#A8DCC0', '#C9B8F0', '#F3A6A0', '#FFE08A', '#B7D7F5'];
  const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---- wheel
  let angle = $state(0); let spinning = $state(false); let landed = $state('');
  function spin() {
    if (W.length < 2 || spinning) return;
    const pick = Math.floor(Math.random() * W.length);
    const seg = 360 / W.length;
    const target = 360 - (pick * seg + seg / 2);
    angle = angle - (angle % 360) + 360 * (reduced ? 1 : 6) + target;
    spinning = true; landed = '';
    setTimeout(() => { spinning = false; landed = W[pick]; }, reduced ? 50 : 4200);
  }
  const arc = (i: number, n: number) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const p = (a: number) => `${100 + 96 * Math.cos(a)} ${100 + 96 * Math.sin(a)}`;
    return `M100 100 L${p(a0)} A96 96 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}Z`;
  };

  // ---- unjumble
  let si = $state(0); let showAnswer = $state(false); let tiles = $state<string[]>([]);
  function deal(i = si) { const s = S[i]; if (!s) { tiles = []; return; } const w = s.split(/\s+/); let t = shuffle(w); for (let k = 0; k < 5 && t.join(' ') === w.join(' ') && w.length > 2; k++) t = shuffle(w); tiles = t; showAnswer = false; }
  $effect(() => { if (game === 'unjumble' && S.length && !tiles.length) deal(0); });

  // ---- mystery word
  let mi = $state(0); let shownLetters = $state<number[]>([]); let mysteryDone = $state(false);
  const mword = $derived(W[mi % Math.max(1, W.length)] ?? '');
  function nextLetter() { const hidden = [...mword].map((_, i) => i).filter((i) => /[a-z]/i.test(mword[i]) && !shownLetters.includes(i)); if (hidden.length <= 1) { mysteryDone = true; return; } shownLetters = [...shownLetters, hidden[Math.floor(Math.random() * hidden.length)]]; }
  function nextWord() { mi = (mi + 1) % Math.max(1, W.length); shownLetters = []; mysteryDone = false; }
  const points = $derived(Math.max(1, [...mword].filter((c, i) => /[a-z]/i.test(c) && !shownLetters.includes(i)).length));

  // ---- quiz show
  let teams = $state(3); let scores = $state<number[]>([0, 0, 0, 0]); let qi = $state(0); let reveal = $state(false);

  let stageEl = $state<HTMLElement>();
  /** Space or Enter: the main action; → (or a presentation clicker): next. Ignored while typing. */
  function key(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'BUTTON' || t.isContentEditable)) return;
    const main = e.key === ' ' || e.key === 'Enter', next = e.key === 'ArrowRight' || e.key === 'PageDown';
    if (!main && !next) return;
    e.preventDefault();
    if (game === 'wheel') spin();
    else if (game === 'unjumble') { if (main && !showAnswer) showAnswer = true; else if (S.length) { si = (si + 1) % S.length; deal(si); } }
    else if (game === 'mystery') { if (main) nextLetter(); else nextWord(); }
    else if (Q.length) { if (main && !reveal) reveal = true; else { qi = (qi + 1) % Q.length; reveal = false; } }
  }
  function full() { toggleFull(stageEl); }
</script>

<svelte:window onkeydown={key} />
<div class="stack games">
  <div class="tabs" role="tablist" aria-label={tr('Games')}>
    {#each GAMES as [id, label]}<a role="tab" aria-selected={game === id} href={embedded ? undefined : href('tools', 'games', id)} onclick={(e) => { if (embedded) e.preventDefault(); game = id; }} data-game={id}>{label}</a>{/each}
  </div>

  <details class="card" open={(game === 'wheel' || game === 'mystery') ? W.length < 2 : game === 'unjumble' ? !S.length : !Q.length}>
    <summary><b>{tr('Your words')}</b> <span class="muted small">{tr('(saved on this device)')}</span></summary>
    <div class="grid">
      {#if game === 'wheel' || game === 'mystery'}<label class="field"><span>{tr('Words or questions (comma or one per line)')}</span>{#if embedded}<textarea id="g-words" class="input ta" rows="3" bind:value={words} placeholder="Malaysia, Japan, China, India"></textarea>{:else}<textarea id="g-words" class="input ta" rows="3" bind:value={ctx.words} placeholder="Malaysia, Japan, China, India"></textarea>{/if}</label>{/if}
      {#if game === 'unjumble'}<label class="field"><span>{tr('Sentences (one per line)')}</span><textarea id="g-sent" class="input ta" rows="4" bind:value={sentences} placeholder={tr('He is from Japan.\nShe lives in Kota Kinabalu.')}></textarea></label>{/if}
      {#if game === 'quiz'}<label class="field"><span>{tr('Question | answer (one per line)')}</span><textarea id="g-quiz" class="input ta" rows="4" bind:value={quiz} placeholder={tr('Where is Mount Kinabalu? | Sabah\nWhat is the capital of Japan? | Tokyo')}></textarea></label>{/if}
    </div>
  </details>

  <section class="stage" bind:this={stageEl} aria-live="polite" lang="en"><FullExit el={stageEl} />
    {#if game === 'wheel'}
      {#if W.length < 2}<p class="empty">Type at least two words to make a wheel.</p>{:else}
        <div class="wheelbox">
          <svg class="wheel" viewBox="0 0 200 200" style="transform: rotate({angle}deg); transition: transform {reduced ? 0 : 4}s cubic-bezier(.12,.75,.15,1)" role="img" aria-label="Spin wheel with {W.length} words">
            {#each W as w, i}<path d={arc(i, W.length)} fill={COLORS[i % COLORS.length]} stroke="#1E2B40" stroke-width="1.5" />
              <text x="100" y="100" transform="rotate({(i + 0.5) * (360 / W.length) - 90} 100 100) translate(52 4)" font-size={W.length > 10 ? 7 : 9} font-weight="700" fill="#1E2B40">{w.length > 14 ? w.slice(0, 13) + '…' : w}</text>{/each}
            <circle cx="100" cy="100" r="10" fill="#1E2B40" />
          </svg>
          <div class="pointer" aria-hidden="true">▼</div>
        </div>
        <p class="big result">{landed || (spinning ? '…' : ' ')}</p>
        <div class="row center"><button id="g-spin" class="btn btn-gold huge" type="button" onclick={spin} disabled={spinning}>Spin</button></div>
      {/if}
    {:else if game === 'unjumble'}
      {#if !S.length}<p class="empty">Type at least one sentence.</p>{:else}
        <p class="muted center">Sentence {si + 1} of {S.length}</p>
        <div class="tiles">{#each tiles as t, i (i + t)}<span class="tile">{t}</span>{/each}</div>
        {#if showAnswer}<p class="big answer">{S[si]}</p>{/if}
        <div class="row center"><button class="btn btn-outline" type="button" onclick={() => deal()}>Mix again</button><button id="g-reveal" class="btn btn-gold" type="button" onclick={() => (showAnswer = true)}>Reveal</button>
          <button class="btn btn-primary" type="button" onclick={() => { si = (si + 1) % S.length; deal(si); }}>Next sentence</button></div>
      {/if}
    {:else if game === 'mystery'}
      {#if !W.length}<p class="empty">Type some words first.</p>{:else}
        <div class="letters" aria-label="Mystery word">{#each [...mword] as c, i}{#if c === ' '}<span class="gap"></span>{:else}<span class="letter">{mysteryDone || shownLetters.includes(i) || !/[a-z]/i.test(c) ? c : ''}</span>{/if}{/each}</div>
        <p class="muted center">Guess now for {mysteryDone ? 0 : points} point{points === 1 ? '' : 's'}. Describe it with clues while letters appear.</p>
        <div class="row center"><button id="g-letter" class="btn btn-gold" type="button" onclick={nextLetter} disabled={mysteryDone}>Next letter</button><button class="btn btn-outline" type="button" onclick={() => (mysteryDone = true)}>Reveal</button><button class="btn btn-primary" type="button" onclick={nextWord}>Next word</button></div>
      {/if}
    {:else}
      {#if !Q.length}<p class="empty">Type questions as "question | answer", one per line.</p>{:else}
        <div class="row center"><label class="row small">Teams <select class="select auto" bind:value={teams}>{#each [2, 3, 4] as n}<option value={n}>{n}</option>{/each}</select></label></div>
        <p class="muted center">Question {qi + 1} of {Q.length}</p>
        <p class="big q">{Q[qi].q}</p>
        {#if reveal}<p class="big answer">{Q[qi].a}</p>{/if}
        <div class="row center"><button id="g-answer" class="btn btn-gold" type="button" onclick={() => (reveal = true)}>Show answer</button><button class="btn btn-primary" type="button" onclick={() => { qi = (qi + 1) % Q.length; reveal = false; }}>Next question</button></div>
        <div class="scores">{#each Array(teams) as _, t}<div class="team" style="border-color:{COLORS[t]}"><b>Team {t + 1}</b><span class="n">{scores[t]}</span><div class="row"><button class="btn btn-outline" type="button" aria-label="Team {t + 1} minus one" onclick={() => (scores[t] = Math.max(0, scores[t] - 1))}>−</button><button class="btn btn-gold" type="button" aria-label="Team {t + 1} plus one" onclick={() => (scores[t] += 1)}>+1</button></div></div>{/each}</div>
      {/if}
    {/if}
  </section>
  {#if !embedded}<div class="row"><button class="btn btn-outline" type="button" onclick={full}>{tr('⛶ Full screen for the projector')}</button><span class="muted small">{tr('Keyboard or clicker: Space = {x}, → = next.', { x: game === 'wheel' ? 'spin' : game === 'mystery' ? tr('next letter') : tr('show the answer') })}</span></div>{/if}
</div>

<style>
  .tabs { display: flex; gap: var(--s-2); flex-wrap: wrap; }
  .tabs a { min-height: var(--tap); display: inline-flex; align-items: center; padding: 0 var(--s-4); border-radius: var(--r-pill); border: 1px solid var(--line); background: var(--card); color: var(--ink); text-decoration: none; font-weight: 700; cursor: pointer; }
  .tabs a[aria-selected='true'] { background: var(--navy); color: var(--on-navy); border-color: var(--navy); }
  .grid { display: grid; gap: var(--s-3); padding-top: var(--s-2); }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .small { font-size: var(--t-sm); }
  summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; gap: 6px; }
  .stage { background: var(--card); border: 1px solid var(--line); border-radius: var(--r-card); padding: var(--s-6) var(--s-4); display: grid; gap: var(--s-4); min-height: 420px; align-content: center; }
  .stage:fullscreen, .stage:global(.pseudo-full) { background: var(--paper); padding: 4vh 4vw; }
  .empty { text-align: center; color: var(--ink-2); font-weight: 600; }
  .center { justify-content: center; text-align: center; }
  .wheelbox { position: relative; width: min(80vw, 420px); margin: 0 auto; }
  .wheel { width: 100%; height: auto; display: block; }
  .pointer { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 2rem; color: var(--bad); }
  .big { font: 800 clamp(1.6rem, 5vw, 3.2rem) var(--f-pupil); text-align: center; margin: 0; color: var(--ink); min-height: 1.2em; }
  .answer { color: var(--ok); }
  .huge { font-size: var(--t-xl); min-height: 64px; padding: 0 var(--s-12); }
  .tiles { display: flex; flex-wrap: wrap; gap: var(--s-3); justify-content: center; }
  .tile { font: 700 clamp(1.2rem, 3.5vw, 2.4rem) var(--f-pupil); background: var(--gold-soft); border: 2px solid var(--gold-strong); border-radius: 12px; padding: 6px 16px; color: var(--ink); }
  .letters { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .letter { width: clamp(36px, 7vw, 72px); height: clamp(48px, 9vw, 88px); border-bottom: 5px solid var(--navy); display: grid; place-items: center; font: 800 clamp(1.6rem, 5vw, 3.4rem) var(--f-pupil); color: var(--ink); text-transform: lowercase; }
  .gap { width: 24px; }
  .q { font-size: clamp(1.4rem, 4vw, 2.6rem); }
  .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--s-3); }
  .team { border: 3px solid; border-radius: var(--r-card); padding: var(--s-3); display: grid; justify-items: center; gap: 6px; background: var(--card); }
  .n { font: 800 2.4rem var(--f-display); }
  .auto { width: auto; }
</style>
