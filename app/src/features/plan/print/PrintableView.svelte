<script lang="ts">
  import './paper.css';
  import type { Lesson } from '../../../lib/lesson/model';
  import { gapFill, matching, strips, exitTickets, tiered, rubricRows, TYPE_INFO, type Printable } from '../../../lib/materials';

  /** One printable on A4, ready for the photocopier. Pupil-facing text uses Andika. */
  let { p, lesson }: { p: Printable; lesson: Lesson } = $props();
  const head = $derived(`${lesson.topic || 'English'} · Year ${lesson.curriculum.year}`);
  const tiers = $derived(tiered(p.words, p.frame));
  const levels = [['low', '🌱 Low'], ['mod', '🌿 Moderate'], ['high', '🌳 High']] as const;
</script>

{#snippet top(title: string)}
  <div class="wtop"><span>Name: ______________________</span><span>Class: __________</span><span>Date: __________</span></div>
  <h3 class="wt">{title}</h3>
{/snippet}

<article class="paper printable" aria-label={p.title}>
  <p class="kick">{head} · {TYPE_INFO[p.type].name}</p>
  {#if p.type === 'flashcards'}
    <div class="cards per{p.perPage}">
      {#each p.words as w}<div class="card"><div class="pic">{#if p.images[w]}<img src={p.images[w]} alt="" />{/if}</div><span class="pupil">{w}</span></div>{/each}
    </div>
  {:else if p.type === 'gapfill'}
    {@render top(p.title || 'Fill in the blanks')}
    {#if p.words.length}<p class="bank pupil"><b>Word bank:</b> {p.words.join(' · ')}</p>{/if}
    <ol class="lines pupil">{#each gapFill(p.sentences, p.words) as g}<li>{g.text}</li>{/each}</ol>
    <p class="ans">Answers: {gapFill(p.sentences, p.words).map((g, i) => `${i + 1}. ${g.answer}`).join('  ')}</p>
  {:else if p.type === 'matching'}
    {@render top(p.title || 'Match the word to the picture')}
    <div class="match pupil">{#each matching(p.words, p.seed).left as w, i}<div class="row2"><span class="dot">{w}</span><span class="sp"></span><span class="box">{#if p.images[matching(p.words, p.seed).right[i]]}<img src={p.images[matching(p.words, p.seed).right[i]]} alt="" />{:else}{i + 1}{/if}</span></div>{/each}</div>
  {:else if p.type === 'strips'}
    <p class="hint">Cut along the lines. Pupils put the sentences in order.</p>
    <div class="strips pupil">{#each strips(p.sentences, p.seed) as s}<div class="strip">{s}</div>{/each}</div>
  {:else if p.type === 'exit'}
    <div class="exits">{#each Array(4) as _}<div class="exit pupil"><p>Name: ________________</p>{#each exitTickets(lesson) as c}<p>{c} <span class="faces">☺ 😐 ☹</span></p>{/each}<p>One thing I learnt today: ______________________________</p></div>{/each}</div>
  {:else if p.type === 'tiered'}
    {#each levels as [k, name], i}
      {@const t = tiers[k]}
      <section class="tier" class:brk={i > 0}>
        {@render top(`${p.title || lesson.topic || 'Worksheet'} (${name})`)}
        {#if t.bank}<p class="bank pupil"><b>Word bank:</b> {t.items.join(' · ')}</p>{/if}
        <ol class="lines pupil">{#each t.items as w}<li><span class="kw">{w}</span>{#if t.frame}<br /><span class="frame">{t.frame}</span>{:else}<br />______________________________________________{/if}</li>{/each}</ol>
        {#if k === 'high'}<p class="pupil">Extra: write two more sentences of your own about {lesson.topic || 'the topic'}.</p>{/if}
      </section>
    {/each}
  {:else if p.type === 'rubric'}
    <h3 class="wt">{p.title || 'Assessment rubric'}</h3>
    <table><thead><tr><th>Objective</th><th>Not yet</th><th>Getting there</th><th>Achieved</th><th>Beyond</th></tr></thead>
      <tbody>{#each rubricRows(lesson.objectives) as r}<tr><td><b>{r.label}</b> {r.objective}</td><td></td><td></td><td></td><td></td></tr>{/each}</tbody></table>
    <p class="hint">Use with the TP descriptors: Not yet ≈ TP1–2, Getting there ≈ TP3, Achieved ≈ TP4, Beyond ≈ TP5–6.</p>
  {/if}
</article>

<style>
  .printable { min-height: auto; }
  .kick { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 2mm; }
  .pupil { font-family: Andika, Arial, sans-serif; }
  .wtop { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 3mm; }
  .wt { font-size: 15pt; margin-bottom: 3mm; }
  .bank { border: 1.5px dashed #888; border-radius: 3mm; padding: 2mm 3mm; margin-bottom: 4mm; font-size: 13pt; }
  .lines { padding-left: 7mm; display: grid; gap: 7mm; font-size: 14pt; line-height: 1.6; }
  .kw { font-weight: 700; }
  .frame { color: #333; }
  .ans { margin-top: 8mm; font-size: 8pt; color: #888; transform: rotate(180deg); text-align: right; }
  .cards { display: grid; gap: 3mm; }
  .cards.per2 { grid-template-columns: 1fr; } .cards.per4 { grid-template-columns: 1fr 1fr; } .cards.per8 { grid-template-columns: 1fr 1fr; }
  .card { border: 1.5px dashed #999; border-radius: 3mm; display: grid; grid-template-rows: 1fr auto; justify-items: center; padding: 3mm; break-inside: avoid; }
  .per2 .card { height: 125mm; } .per4 .card { height: 125mm; } .per8 .card { height: 62mm; }
  .card .pic { width: 100%; display: grid; place-items: center; overflow: hidden; }
  .card img { max-height: 100%; max-width: 100%; object-fit: contain; }
  .card span { font-size: 28pt; font-weight: 700; }
  .per8 .card span { font-size: 20pt; }
  .match { display: grid; gap: 6mm; font-size: 15pt; margin-top: 4mm; }
  .row2 { display: grid; grid-template-columns: 50mm 1fr 32mm; align-items: center; }
  .dot::after { content: ' ●'; color: #999; }
  .box { width: 32mm; height: 24mm; border: 1.5px solid #999; border-radius: 2mm; display: grid; place-items: center; color: #bbb; overflow: hidden; }
  .box img { max-width: 100%; max-height: 100%; }
  .strips { display: grid; }
  .strip { border-top: 1.5px dashed #999; padding: 6mm 4mm; font-size: 16pt; }
  .strip:last-child { border-bottom: 1.5px dashed #999; }
  .hint { font-size: 9pt; color: #666; margin: 2mm 0; }
  .exits { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .exit { border: 1.5px dashed #999; border-radius: 3mm; padding: 4mm; display: grid; gap: 3mm; font-size: 12pt; break-inside: avoid; }
  .faces { white-space: nowrap; }
  .tier.brk { break-before: page; margin-top: 10mm; }
  table th, table td { font-size: 10pt; height: 16mm; }
</style>
