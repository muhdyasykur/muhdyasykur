<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { db, type Reflection } from '../../lib/db/schema';
  import { getLesson, countPupils } from '../../lib/db/repo';
  import { reflectionFacts } from '../../lib/reflection';
  import { runChecks } from '../../lib/lesson/checker';
  import type { Lesson } from '../../lib/lesson/model';
  import Icon from '../../lib/ui/Icon.svelte';
  import { untrack } from 'svelte';

  /** Guided reflection after teaching (blueprint F21). One reflection per lesson. */
  let { id }: { id: string } = $props();
  let lesson = $state<Lesson | null>(null);
  let facts = $state<string[]>([]);
  // keyed by lesson id in Plan, so the first id is the only one
  const lid = untrack(() => id);
  let r = $state<Reflection>({ id: lid, lessonId: lid, worked: '', didnt: '', next: '', createdAt: Date.now() });
  let saved = $state('');
  $effect(() => {
    (async () => {
      const l = await getLesson(id); if (!l) return;
      lesson = l;
      const s = (await db.sessions.where('lessonId').equals(id).toArray()).filter((x) => x.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
      const recs = l.classId ? await db.pbd.where('lessonId').equals(id).toArray() : [];
      const size = l.classId ? await countPupils(l.classId) : 0;
      facts = [...reflectionFacts(l, s, recs, size), `Alignment score when planned: ${runChecks(l).score}/100.`];
      const old = await db.reflections.get(id);
      if (old) r = old;
    })();
  });
  const words = $derived([r.worked, r.didnt, r.next].join(' ').trim().split(/\s+/).filter(Boolean).length);
  async function save() { await db.reflections.put({ ...$state.snapshot(r), createdAt: r.createdAt || Date.now() }); saved = words < 30 ? tr('Saved. A few more words would make it more useful next time.') : tr('Saved. Your "next time" note will appear when you plan for this class or these standards again.'); }
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('plan')}><Icon name="back" size={18} />{tr('Plan')}</a>
  {#if lesson}
    <header><p class="eyebrow">{tr('Reflection · {x} · {date}', { x: lesson.header.className || tr('Year {year}', { year: lesson.curriculum.year }), date: lesson.header.date })}</p><h1>{lesson.topic || tr('Lesson')}</h1></header>
    <section class="card stack"><h3>{tr('What happened')}</h3><ul class="facts">{#each facts as f}<li>{f}</li>{/each}</ul></section>
    <section class="card stack">
      <label class="field"><span>{tr('What worked well, and how do you know?')}</span><textarea id="rf-worked" class="input ta" rows="3" bind:value={r.worked}></textarea></label>
      <label class="field"><span>{tr('What did not go as planned, and why?')}</span><textarea id="rf-didnt" class="input ta" rows="3" bind:value={r.didnt}></textarea></label>
      <label class="field"><span>{tr('What will you change next time?')}</span><textarea id="rf-next" class="input ta" rows="3" bind:value={r.next}></textarea></label>
      <div class="row"><button id="rf-save" class="btn btn-gold" type="button" onclick={save}>{tr('Save reflection')}</button><span class="muted small">{tr('{words} words', { words })}</span>{#if saved}<span class="ok small" role="status">{saved}</span>{/if}</div>
    </section>
    <p class="muted small">{tr('The reflection prints in section 9 of the Consilia Lesson Blueprint.')}</p>
  {/if}
</div>
<style>
  .facts { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }

</style>
