<script lang="ts">
  import { today as localToday } from '../../lib/dates';
  import { href } from '../../router.svelte';
  import { db, type MentorNote } from '../../lib/db/schema';
  import { listLessons } from '../../lib/db/repo';
  import { MENTOR_TAGS, patterns, GUIDE_FOR_TAG } from '../../lib/reflection';
  import { uid, type Lesson } from '../../lib/lesson/model';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Mentor and lecturer feedback, with the patterns it shows over time (blueprint F22). */
  let notes = $state<MentorNote[]>([]);
  let lessons = $state<Lesson[]>([]);
  let draft = $state<MentorNote>({ id: '', lessonId: null, who: 'Mentor teacher', date: localToday(), text: '', tags: [] });
  async function load() { notes = (await db.mentorNotes.toArray()).sort((a, b) => b.date.localeCompare(a.date)); lessons = await listLessons(); }
  $effect(() => { load(); });
  function toggle(t: string) { draft.tags = draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t]; }
  async function add() { if (!draft.text.trim()) return; await db.mentorNotes.put({ ...$state.snapshot(draft), id: uid() }); draft.text = ''; draft.tags = []; await load(); }
  async function del(id: string) { await db.mentorNotes.delete(id); await load(); }
  const pats = $derived(patterns(notes));
  const topic = (id: string | null) => lessons.find((l) => l.id === id)?.topic ?? '';
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />Me</a>
  <h1>Mentor and lecturer feedback</h1>
  {#if pats.length}
    <section class="card stack"><h3>Patterns</h3>
      <ul class="pat">{#each pats as p}<li><b>{p.tag}</b> mentioned {p.count}× in {p.observations} observation{p.observations === 1 ? '' : 's'}{#if GUIDE_FOR_TAG[p.tag]} · <a href={href('library', 4, 'sk', 'guide')}>Method Guide</a>{/if}</li>{/each}</ul>
    </section>
  {/if}
  <section class="card stack">
    <h3>Add feedback</h3>
    <div class="grid">
      <label class="field"><span>From</span><input id="mn-who" class="input" bind:value={draft.who} list="whos" /></label>
      <label class="field"><span>Date</span><input id="mn-date" class="input" type="date" bind:value={draft.date} /></label>
      <label class="field"><span>Lesson (optional)</span><select class="select" bind:value={draft.lessonId}><option value={null}>General</option>{#each lessons as l}<option value={l.id}>{l.header.date} · {l.topic || 'Untitled'}</option>{/each}</select></label>
    </div>
    <label class="field"><span>Comment</span><textarea id="mn-text" class="input ta" rows="3" bind:value={draft.text}></textarea></label>
    <div class="row tags">{#each MENTOR_TAGS as t}<button type="button" class="chip tag" aria-pressed={draft.tags.includes(t)} onclick={() => toggle(t)}>{t}</button>{/each}</div>
    <button id="mn-add" class="btn btn-gold add" type="button" onclick={add} disabled={!draft.text.trim()}>Save feedback</button>
  </section>
  {#each notes as n (n.id)}
    <article class="card"><p class="eyebrow">{n.date} · {n.who}{n.lessonId ? ` · ${topic(n.lessonId)}` : ''}</p><p>{n.text}</p><div class="row">{#each n.tags as t}<span class="chip">{t}</span>{/each}<button class="btn btn-text del" type="button" onclick={() => del(n.id)}>Delete</button></div></article>
  {/each}
</div>
<datalist id="whos"><option value="Mentor teacher"></option><option value="IPG lecturer"></option><option value="Headteacher"></option></datalist>
<style>
  .back { justify-self: start; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .tag { cursor: pointer; } .tag[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); border-color: var(--navy); }
  .add { justify-self: start; }
  .pat { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
  .del { color: var(--bad); margin-left: auto; }
</style>
