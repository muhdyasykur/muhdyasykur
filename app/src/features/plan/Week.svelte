<script lang="ts">
  import { route, href, go } from '../../router.svelte';
  import { listClasses, listLessons, getSetting, setSetting } from '../../lib/db/repo';
  import { DAYS, addDays, mondayOf, iso, weekItems, overlaps, parseDate, type Slot, type Cancelled } from '../../lib/timetable';
  import { runChecks } from '../../lib/lesson/checker';
  import { uid } from '../../lib/lesson/model';
  import type { Lesson } from '../../lib/lesson/model';
  import type { SchoolClass } from '../../lib/db/schema';
  import ScoreRing from '../../lib/ui/ScoreRing.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  let classes = $state<SchoolClass[]>([]);
  let lessons = $state<Lesson[]>([]);
  let slots = $state<Slot[]>([]);
  let cancelled = $state<Cancelled>({});
  let editing = $state(false);
  let draft = $state<Omit<Slot, 'id'>>({ classId: '', day: 1, start: '07:30', durationMin: 60 });
  let cancelFor = $state(''); let cancelReason = $state('');

  const monday = $derived(/^\d{4}-\d{2}-\d{2}$/.test(route.parts[1] ?? '') ? mondayOf(route.parts[1]) : mondayOf(iso(new Date())));
  async function load() {
    [classes, lessons, slots, cancelled] = await Promise.all([listClasses(), listLessons(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})]);
    if (!slots.length && classes.length) editing = true;
    if (!draft.classId && classes[0]) draft.classId = classes[0].id;
  }
  $effect(() => { load(); });

  const items = $derived(weekItems(monday, slots, lessons, cancelled));
  const clash = $derived(overlaps(slots));
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? 'Deleted class';
  const fmt = (d: string) => parseDate(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const today = iso(new Date());

  async function saveSlots() { await setSetting('timetable', $state.snapshot(slots)); }
  async function addSlot() { if (!draft.classId) return; slots.push({ id: uid(), ...$state.snapshot(draft) }); await saveSlots(); }
  async function removeSlot(id: string) { slots = slots.filter((s) => s.id !== id); await saveSlots(); }
  async function cancel(key: string) { cancelled[key] = cancelReason.trim() || 'No class'; cancelFor = ''; cancelReason = ''; await setSetting('cancelled', $state.snapshot(cancelled)); }
  async function restore(key: string) { delete cancelled[key]; await setSetting('cancelled', $state.snapshot(cancelled)); }
</script>

<div class="stack">
  <div class="row between">
    <div class="row">
      <a class="btn btn-outline" href={href('plan', 'week', addDays(monday, -7))} aria-label="Previous week"><Icon name="back" size={18} /></a>
      <b class="wk">Week of {fmt(monday)} – {fmt(addDays(monday, 4))}</b>
      <a class="btn btn-outline" href={href('plan', 'week', addDays(monday, 7))} aria-label="Next week"><Icon name="chevron" size={18} /></a>
      {#if monday !== mondayOf(today)}<a class="btn btn-text" href={href('plan', 'week')}>This week</a>{/if}
    </div>
    <button class="btn btn-text" type="button" onclick={() => (editing = !editing)}>{editing ? 'Done editing timetable' : 'Edit timetable'}</button>
  </div>

  {#if editing}
    <section class="card stack" aria-label="Timetable">
      <h3>Your English timetable</h3>
      {#if !classes.length}
        <p class="muted">Add your classes first. <a href={href('classes')}>Go to Classes</a></p>
      {:else}
        <div class="grid">
          <label class="field"><span>Class</span><select id="tt-class" class="select" bind:value={draft.classId}>{#each classes as c}<option value={c.id}>{c.name}</option>{/each}</select></label>
          <label class="field"><span>Day</span><select id="tt-day" class="select" bind:value={draft.day}>{#each [1, 2, 3, 4, 5, 6, 7] as d}<option value={d}>{DAYS[d]}</option>{/each}</select></label>
          <label class="field"><span>Start</span><input id="tt-start" class="input" type="time" bind:value={draft.start} /></label>
          <label class="field"><span>Minutes</span><input id="tt-dur" class="input" type="number" min="15" max="120" step="5" bind:value={draft.durationMin} /></label>
        </div>
        <button id="tt-add" class="btn btn-primary add" type="button" onclick={addSlot}>Add to timetable</button>
        {#each clash as [a, b]}<p class="warn" role="status">{cname(a.classId)} and {cname(b.classId)} overlap on {DAYS[a.day]} ({a.start} and {b.start}).</p>{/each}
        {#if slots.length}
          <ul class="slots">{#each [...slots].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)) as s (s.id)}<li><span>{DAYS[s.day]} {s.start} · {cname(s.classId)} · {s.durationMin} min</span><button class="btn btn-text del" type="button" onclick={() => removeSlot(s.id)}>Remove</button></li>{/each}</ul>
        {/if}
      {/if}
    </section>
  {/if}

  {#if !slots.length && !editing}
    <section class="empty"><h3>No timetable yet</h3><p>Add your English periods once. Each week then shows which lessons are planned and which still need a lesson plan.</p><button class="btn btn-primary" type="button" onclick={() => (editing = true)}>Set up timetable</button></section>
  {/if}

  <div class="days">
    {#each [1, 2, 3, 4, 5, 6, 7] as d}
      {@const dayItems = items.filter((i) => i.slot.day === d)}
      {#if dayItems.length || d <= 5}
        <section class="day" class:today={addDays(monday, d - 1) === today}>
          <h4>{DAYS[d]} <span class="muted">{fmt(addDays(monday, d - 1))}</span></h4>
          {#if !dayItems.length}<p class="muted small">No English</p>{/if}
          {#each dayItems as it (it.slot.id)}
            {@const key = `${it.slot.id}@${it.date}`}
            <div class="slot card" class:off={it.cancelled} data-slot={key}>
              <span class="muted small">{it.slot.start} · {cname(it.slot.classId)}</span>
              {#if it.cancelled}
                <b>No class</b><span class="small">{it.cancelled}</span>
                <button class="btn btn-text" type="button" onclick={() => restore(key)}>Undo</button>
              {:else if it.lesson}
                <a class="lesson" href={href('plan', 'edit', it.lesson.id, 'setup')}><ScoreRing score={runChecks(it.lesson).score} size={36} /><span><b>{it.lesson.topic || 'Untitled'}</b><span class="small muted">{it.lesson.status === 'ready' ? 'Ready' : 'Draft'}</span></span></a>
              {:else}
                <a class="btn btn-gold plan" href={href('plan', 'new', it.slot.classId, it.date, it.slot.start, it.slot.durationMin)}>Plan this lesson</a>
                {#if cancelFor === key}
                  <input class="input" bind:value={cancelReason} placeholder="Reason, e.g. Sports day" aria-label="Reason" />
                  <div class="row"><button class="btn btn-outline" type="button" onclick={() => cancel(key)}>Mark no class</button><button class="btn btn-text" type="button" onclick={() => (cancelFor = '')}>Cancel</button></div>
                {:else}
                  <button class="btn btn-text" type="button" onclick={() => (cancelFor = key)}>No class this day…</button>
                {/if}
              {/if}
            </div>
          {/each}
        </section>
      {/if}
    {/each}
  </div>
</div>

<style>
  .between { justify-content: space-between; }
  .wk { font-family: var(--f-display); }
  .small { font-size: var(--t-sm); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: var(--s-3); }
  .add { justify-self: start; }
  .warn { color: var(--warn); font-weight: 600; font-size: var(--t-sm); }
  .slots { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .slots li { display: flex; justify-content: space-between; align-items: center; gap: var(--s-2); border-bottom: 1px solid var(--line); }
  .del { color: var(--bad); }
  .days { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .day { display: grid; gap: var(--s-2); align-content: start; }
  .day h4 { font-size: var(--t-sm); }
  .day.today h4 { color: var(--gold); }
  .slot { gap: 6px; }
  .slot.off { opacity: .7; border-style: dashed; }
  .lesson { display: flex; gap: var(--s-2); align-items: center; text-decoration: none; color: var(--ink); }
  .lesson > span { display: grid; min-width: 0; }
  .plan { justify-self: start; }
</style>
