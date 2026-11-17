<script lang="ts">
  import { today as localToday, addDays } from '../../lib/dates';
  import { untrack } from 'svelte';
  import { href, go } from '../../router.svelte';
  import { getClass, listPupils } from '../../lib/db/repo';
  import type { Mark, Pupil, Register, SchoolClass } from '../../lib/db/schema';
  import { MARKS, getRegister, saveRegister, regId, listRegisters, summarise, dayCounts, registerSheet } from '../../lib/attendance';
  import { lock } from '../../lib/lock.svelte';
  import Unlock from '../../lib/ui/Unlock.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Take attendance for one class on any day; see the month and export it (milestone 9). */
  let { classId, initialDate = '' }: { classId: string; initialDate?: string } = $props();
  const today = localToday();
  let date = $state(untrack(() => (/^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : today)));
  let cls = $state<SchoolClass | undefined>(); let pupils = $state<Pupil[]>([]);
  let reg = $state<Register | null>(null);
  let view = $state<'day' | 'month'>('day');
  let msg = $state('');
  $effect(() => { void lock.unlocked; getClass(classId).then((c) => (cls = c)); listPupils(classId).then((p) => (pupils = p)); });
  $effect(() => { const d = date; getRegister(classId, d).then((r) => { if (d === date) reg = r ?? { id: regId(classId, d), classId, date: d, marks: {}, reasons: {}, takenAt: 0 }; }); });
  async function persist() { if (reg) { await saveRegister($state.snapshot(reg) as Register); msg = 'Saved on this device.'; } }
  function mark(p: Pupil, m: Mark) { if (!reg) return; reg.marks[p.id] = m; if (m === 'P') delete reg.reasons[p.id]; persist(); }
  function allPresent() { if (!reg) return; for (const p of pupils) if (!reg.marks[p.id]) reg.marks[p.id] = 'P'; persist(); }
  const counts = $derived(dayCounts(reg ?? undefined, pupils));
  const shift = (n: number) => { date = addDays(date, n); };

  // month view
  let month = $state(untrack(() => date.slice(0, 7)));
  let regs = $state<Register[]>([]);
  $effect(() => { const m = month; if (view === 'month') listRegisters(classId, `${m}-01`, `${m}-31`).then((r) => { if (m === month) regs = r; }); });
  const sum = $derived(summarise(pupils, regs));
  async function exportMonth() {
    if (!cls) return;
    const { sheetsToBlob } = await import('../../lib/export/xlsx');
    const { saveFile } = await import('../../lib/export/download');
    const blob = await sheetsToBlob([registerSheet(cls, pupils, regs, month)]);
    await saveFile(blob, `Attendance-${cls.name.replace(/[^\w-]+/g, '-')}-${month}.xlsx`);
    msg = 'Excel file saved.';
  }
  async function copyAbsent() {
    const names = pupils.filter((p) => reg?.marks[p.id] === 'A' || reg?.marks[p.id] === 'E').map((p) => `${p.name}${reg?.reasons[p.id] ? ` (${reg.reasons[p.id]})` : ''}`);
    const text = `${cls?.name} · ${date}\nPresent ${counts.P + counts.L} of ${pupils.length}${names.length ? `\nAbsent: ${names.join(', ')}` : ''}`;
    try { await navigator.clipboard.writeText(text); msg = 'Summary copied. Paste it where you need it.'; } catch { msg = text; }
  }
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('classes', classId)}><Icon name="back" size={18} />{cls?.name ?? 'Class'}</a>
  <div class="row between"><h1>Attendance</h1>
    <div class="seg" role="group" aria-label="View"><button type="button" aria-pressed={view === 'day'} onclick={() => (view = 'day')}>Day</button><button id="att-month" type="button" aria-pressed={view === 'month'} onclick={() => { month = date.slice(0, 7); view = 'month'; }}>Month</button></div>
  </div>
  {#if lock.configured && !lock.unlocked}<Unlock why="Unlock to see pupil names." />{/if}
  {#if !pupils.length}
    <p class="muted">Add the pupil list first. <a href={href('classes', classId)}>Open the class</a></p>
  {:else if view === 'day'}
    <section class="card stack tight">
      <div class="row datebar">
        <button class="btn btn-outline" type="button" aria-label="Previous day" onclick={() => shift(-1)}>‹</button>
        <input id="att-date" class="input dateinput" type="date" bind:value={date} aria-label="Date" />
        <button class="btn btn-outline" type="button" aria-label="Next day" onclick={() => shift(1)}>›</button>
        {#if date !== today}<button class="btn btn-text" type="button" onclick={() => (date = today)}>Today</button>{/if}
      </div>
      <p class="counts" aria-live="polite"><b>{counts.P + counts.L}</b> of {pupils.length} present · {counts.L} late · {counts.A} absent · {counts.E} excused{counts.unmarked ? ` · ${counts.unmarked} not marked` : ''}</p>
      <div class="row"><button id="att-all" class="btn btn-gold" type="button" onclick={allPresent} disabled={!counts.unmarked}>✓ Everyone else present</button><button class="btn btn-outline" type="button" onclick={copyAbsent}>Copy summary</button></div>
    </section>
    <ul class="list">
      {#each pupils as p, i (p.id)}
        {@const m = reg?.marks[p.id]}
        <li class="card pupil" data-att={p.name} class:absent={m === 'A'} class:late={m === 'L'} class:exc={m === 'E'}>
          <span class="name"><span class="n">{i + 1}</span>{p.name}</span>
          <div class="marks" role="radiogroup" aria-label="Attendance for {p.name}">
            {#each MARKS as k}<button type="button" role="radio" aria-checked={m === k.id} title={k.label} class="mk mk-{k.id}" data-mark={k.id} onclick={() => mark(p, k.id)}>{k.short}<span class="sr-only"> {k.label}</span></button>{/each}
          </div>
          {#if m === 'A' || m === 'E'}<input class="input reason" placeholder="Reason (optional), e.g. MC, sports" value={reg?.reasons[p.id] ?? ''} onchange={(e) => { if (reg) { reg.reasons[p.id] = (e.currentTarget as HTMLInputElement).value; persist(); } }} aria-label="Reason for {p.name}" />{/if}
        </li>
      {/each}
    </ul>
    <p class="muted small">P present · L late · A absent · E excused (MC, school duty). Teach mode fills this in too. Pupil names stay on this device{lock.configured ? ' and are protected by your PIN' : ''}.</p>
  {:else}
    <section class="card stack tight">
      <div class="row"><label class="field"><span>Month</span><input id="att-mon" class="input" type="month" bind:value={month} /></label>
        <button id="att-excel" class="btn btn-outline" type="button" onclick={exportMonth} disabled={!regs.length}>Export to Excel</button></div>
      <p class="muted small">{regs.length} day{regs.length === 1 ? '' : 's'} recorded in this month.</p>
    </section>
    {#if regs.length}
      <div class="tablewrap card"><table class="month">
        <thead><tr><th scope="col">Pupil</th>{#each regs as r}<th scope="col"><button class="linkish" type="button" onclick={() => { date = r.date; view = 'day'; }}>{r.date.slice(8)}</button></th>{/each}<th scope="col">%</th></tr></thead>
        <tbody>{#each pupils as p (p.id)}{@const s = sum.get(p.id)}<tr><th scope="row">{p.name}</th>{#each regs as r}<td class="c c-{r.marks[p.id] ?? ''}">{r.marks[p.id] ?? ''}</td>{/each}<td class="rate" class:low={!!s && s.days > 0 && s.rate < 80}>{s && s.days ? s.rate : ''}</td></tr>{/each}</tbody>
      </table></div>
      <p class="muted small">Below 80% is highlighted. Tap a date to open that day.</p>
    {:else}<p class="muted">No attendance in this month yet.</p>{/if}
  {/if}
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}
</div>

<style>
  .back { justify-self: start; }
  .between { justify-content: space-between; align-items: center; }
  h1 { margin: 0; }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .datebar { align-items: center; }
  .dateinput { width: auto; }
  .counts { margin: 0; font-size: var(--t-lg); }
  .list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-2); }
  .pupil { display: grid; grid-template-columns: 1fr auto; gap: var(--s-2) var(--s-3); align-items: center; padding: var(--s-2) var(--s-3); }
  .pupil.absent { border-left: 4px solid var(--bad); } .pupil.late { border-left: 4px solid var(--warn); } .pupil.exc { border-left: 4px solid var(--navy-2); }
  .name { font-weight: 700; display: flex; gap: var(--s-2); align-items: center; }
  .n { font: 500 var(--t-sm) var(--f-mono); color: var(--ink-3); min-width: 2ch; }
  .marks { display: flex; gap: 4px; }
  .mk { width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); font: 800 var(--t-md) var(--f-body); color: var(--ink-2); cursor: pointer; }
  .mk-P[aria-checked='true'] { background: var(--ok); color: #fff; border-color: var(--ok); }
  .mk-L[aria-checked='true'] { background: var(--warn); color: #fff; border-color: var(--warn); }
  .mk-A[aria-checked='true'] { background: var(--bad); color: #fff; border-color: var(--bad); }
  .mk-E[aria-checked='true'] { background: var(--navy-2); color: var(--on-navy); border-color: var(--navy-2); }
  .reason { grid-column: 1 / -1; }
  .tablewrap { overflow-x: auto; padding: 0; }
  .month { border-collapse: collapse; width: 100%; font-size: var(--t-sm); }
  .month th, .month td { border-bottom: 1px solid var(--line); padding: 6px 8px; text-align: center; white-space: nowrap; }
  .month th[scope=row] { text-align: left; }
  .c-A { background: color-mix(in srgb, var(--bad) 22%, transparent); } .c-L { background: color-mix(in srgb, var(--warn) 22%, transparent); } .c-E { background: color-mix(in srgb, var(--navy-2) 18%, transparent); }
  .rate.low { color: var(--bad); font-weight: 800; }
  .linkish { background: none; border: 0; color: var(--navy); font: inherit; font-weight: 700; cursor: pointer; min-height: 32px; padding: 0 4px; }
</style>
