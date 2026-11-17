<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Activity, Lesson, Stage, Tier, FrameworkId, Pattern } from '../../../lib/lesson/model';
  import { newActivity } from '../../../lib/lesson/model';
  import { FRAMEWORKS, recommend, checkTiming, defaultMinutes } from '../../../lib/lesson/frameworks';
  import { changeFramework } from '../../../lib/lesson/create';
  import { objectiveLabels } from '../../../lib/lesson/derive';
  import type { Support } from '../../../lib/curriculum/types';
  import { bankFor, BANK } from '../../../lib/content/bank';

  let { lesson = $bindable(), support }: { lesson: Lesson; support: Support } = $props();
  const rec = $derived(recommend(lesson.mainSkill || 'Language Awareness', lesson.curriculum.year, lesson.focus));
  const fw = $derived(FRAMEWORKS[lesson.framework]);
  const purposes = $derived(new Map(fw.stages.map((s) => [s.key, s.purpose])));
  const labels = $derived(objectiveLabels(lesson));
  const issues = $derived(checkTiming(lesson.stages, lesson.header.durationMin));
  const total = $derived(lesson.stages.reduce((a, s) => a + (s.minutes || 0), 0));
  const tierNames: { t: Tier; name: string; icon: string }[] = [{ t: 'low', name: tr('Low'), icon: '🌱' }, { t: 'mod', name: tr('Moderate'), icon: '🌿' }, { t: 'high', name: tr('High'), icon: '🌳' }];
  const patterns: Pattern[] = ['whole-class', 'T-P', 'P-P', 'pairs', 'groups', 'individual'];
  const colours = ['#5B6B8C', '#13294B', '#2B4E86', '#8A6A12', '#1F6F63', '#6B4FB3'];

  function setFramework(id: FrameworkId) { if (id !== lesson.framework) changeFramework(lesson, id); }
  function resetTimes() { const m = defaultMinutes(lesson.framework, lesson.header.durationMin); lesson.stages.forEach((s, i) => (s.minutes = m[i] ?? s.minutes)); }
  function addActivity(s: Stage) { s.activities.push(newActivity({ objectiveIds: s.key === 'pre-lesson' || s.key === 'post-lesson' ? [] : lesson.objectives.slice(0, 1).map((o) => o.id) })); }
  function move(s: Stage, i: number, d: number) { const j = i + d; if (j < 0 || j >= s.activities.length) return; const [a] = s.activities.splice(i, 1); s.activities.splice(j, 0, a); }
  function remove(s: Stage, i: number) { s.activities.splice(i, 1); if (!s.activities.length) addActivity(s); }
  function toggleObj(a: Activity, id: string) { a.objectiveIds = a.objectiveIds.includes(id) ? a.objectiveIds.filter((x) => x !== id) : [...a.objectiveIds, id]; }
  function insertTask(s: Stage, kind: 'pre' | 'post', no: string) {
    const t = support[kind].find((x) => String(x.no) === no);
    if (!t) return;
    const text = `${t.title}: ${t.steps.map((x, i) => `(${i + 1}) ${x}`).join(' ')}`;
    const blank = s.activities.find((a) => !a.teacher && !a.pupils);
    if (blank) { blank.teacher = text; blank.aids = blank.aids || t.materials; blank.source = `SoW ${kind}-lesson task ${t.no}`; }
    else s.activities.push(newActivity({ teacher: text, aids: t.materials, source: `SoW ${kind}-lesson task ${t.no}` }));
  }
  let openTier = $state<Record<string, Tier>>({});
  function insertBank(s: Stage, id: string) {
    const b = BANK.find((x) => x.id === id); if (!b) return;
    const objs = s.key === 'pre-lesson' || s.key === 'post-lesson' ? [] : lesson.objectives.slice(0, 1).map((o) => o.id);
    const act = newActivity({ teacher: b.teacher, pupils: b.pupils, pattern: (['whole-class', 'T-P', 'P-P', 'pairs', 'groups', 'individual'].includes(b.pattern) ? b.pattern : '') as Pattern | '', aids: b.materials === 'None' ? '' : b.materials, tiers: { ...b.tiers }, objectiveIds: objs, source: `Activity bank: ${b.title}` });
    const blank = s.activities.findIndex((a) => !a.teacher && !a.pupils);
    if (blank >= 0) s.activities[blank] = act; else s.activities.push(act);
  }
</script>

<div class="stack">
  <section class="card stack">
    <div class="row between"><h3>{tr('Framework')}</h3><span class="chip">{tr('Recommended: {short}', { short: FRAMEWORKS[rec.id].short })}</span></div>
    <p class="muted small">{tr(rec.reason)}</p>
    {#each rec.alternatives as a}<p class="muted small">{tr('Alternative:')} <b>{FRAMEWORKS[a.id].short}</b>. {tr(a.when)}</p>{/each}
    <div class="fws" role="radiogroup" aria-label={tr('Framework')}>
      {#each Object.values(FRAMEWORKS) as f}
        <button type="button" role="radio" aria-checked={lesson.framework === f.id} onclick={() => setFramework(f.id)} data-fw={f.id}>
          <b>{f.short}{#if f.id === rec.id} ★{/if}</b><span>{tr(f.summary)}</span>
        </button>
      {/each}
    </div>
    {#if lesson.framework !== rec.id}
      <label class="field"><span>{tr('Why this framework instead of {short}? (printed in the notes)', { short: FRAMEWORKS[rec.id].short })}</span>
        <input id="fw-reason" class="input" bind:value={lesson.frameworkReason} placeholder={tr('e.g. The lesson focuses on one sentence pattern: should / shouldn\'t.')} /></label>
    {/if}
  </section>

  <section class="card stack">
    <div class="row between"><h3>{tr('Timing')}</h3><span class="muted small">{tr('{total} of {durationMin} min planned', { total, durationMin: lesson.header.durationMin })}</span></div>
    <div class="ribbon" role="img" aria-label={lesson.stages.map((s) => `${s.title} ${s.minutes} minutes`).join(', ')}>
      {#each lesson.stages as s, i}<div style="flex:{Math.max(1, s.minutes)};background:{colours[i % colours.length]}" title={tr('{title}: {minutes} min', { title: s.title, minutes: s.minutes })}>{s.minutes}</div>{/each}
    </div>
    <div class="mins">
      {#each lesson.stages as s}<label class="field"><span>{s.title}</span><input class="input" type="number" min="1" max="120" bind:value={s.minutes} data-stage-min={s.key} /></label>{/each}
    </div>
    {#each issues as i}<p class={i.level === 'error' ? 'bad' : 'warn'} role="status">{i.message}</p>{/each}
    <button class="btn btn-text" type="button" onclick={resetTimes}>{tr('Reset to suggested times')}</button>
  </section>

  {#if lesson.sowNotes.differentiation}<aside class="card note"><b>{tr('SoW differentiation advice')}</b><p class="small">{lesson.sowNotes.differentiation}</p></aside>{/if}

  {#each lesson.stages as s, si (s.id)}
    <section class="stage stack">
      <header class="row between">
        <div><p class="eyebrow">{tr('{x} · {minutes} min', { x: si === 0 ? tr('Start') : si === lesson.stages.length - 1 ? tr('End') : tr('Lesson delivery'), minutes: s.minutes })}</p><h3>{s.title}</h3></div>
        {#if s.key === 'pre-lesson' || s.key === 'post-lesson'}
          {@const kind = s.key === 'pre-lesson' ? 'pre' : 'post'}
          <select class="select bank" aria-label={tr('Insert a task from the SoW task bank')} onchange={(e) => { insertTask(s, kind, e.currentTarget.value); e.currentTarget.value = ''; }}>
            <option value="">{tr('Insert a SoW {kind}-lesson task…', { kind })}</option>
            {#each support[kind] as t}<option value={t.no}>{t.no}. {t.title}</option>{/each}
          </select>
        {/if}
      </header>
      <p class="muted small">{purposes.get(s.key)}</p>
      {#if bankFor(s.key, lesson.curriculum.year, lesson.mainSkill).length}
        <select class="select bank" aria-label={tr('Insert from the activity bank')} data-bank-stage={s.key} onchange={(e) => { insertBank(s, e.currentTarget.value); e.currentTarget.value = ''; }}>
          <option value="">{tr('Insert from the activity bank…')}</option>
          {#each bankFor(s.key, lesson.curriculum.year, lesson.mainSkill) as b}<option value={b.id}>{tr('{title} ({skill}, {minutes} min)', { title: b.title, skill: b.skill, minutes: b.minutes })}</option>{/each}
        </select>
      {/if}

      {#each s.activities as a, ai (a.id)}
        <div class="card act">
          <div class="row between"><b class="small">{tr('Activity {x}', { x: ai + 1 })}{#if a.source} · <span class="muted">{a.source}</span>{/if}</b>
            <div class="row tools">
              <button class="btn btn-text" type="button" aria-label={tr('Move up')} disabled={ai === 0} onclick={() => move(s, ai, -1)}>↑</button>
              <button class="btn btn-text" type="button" aria-label={tr('Move down')} disabled={ai === s.activities.length - 1} onclick={() => move(s, ai, 1)}>↓</button>
              <button class="btn btn-text del" type="button" onclick={() => remove(s, ai)}>{tr('Remove')}</button>
            </div>
          </div>
          <div class="two">
            <label class="field"><span>{tr('Teacher does')}</span><textarea class="input ta" rows="3" bind:value={a.teacher} data-act="teacher"></textarea></label>
            <label class="field"><span>{tr('Pupils do')}</span><textarea class="input ta" rows="3" bind:value={a.pupils} data-act="pupils"></textarea></label>
          </div>
          <div class="three">
            <label class="field"><span>{tr('Interaction')}</span><select class="select" bind:value={a.pattern}><option value="">–</option>{#each patterns as p}<option value={p}>{p}</option>{/each}</select></label>
            <label class="field"><span>{tr('Teaching aids')}</span><input class="input" bind:value={a.aids} placeholder={tr('e.g. Worksheet')} /></label>
            <label class="field"><span>{tr('Moral values / CCE note')}</span><input class="input" bind:value={a.values} placeholder={tr('e.g. Peer discussion')} /></label>
          </div>
          {#if lesson.objectives.length}
            <div class="row objs"><span class="small muted">{tr('Serves')}</span>
              {#each lesson.objectives as o}<label class="chip pick"><input type="checkbox" checked={a.objectiveIds.includes(o.id)} onchange={() => toggleObj(a, o.id)} />{labels.get(o.id)}</label>{/each}
            </div>
          {/if}
          <div class="tiers">
            <div class="seg" role="group" aria-label={tr('Differentiation level')}>
              {#each tierNames as tn}<button type="button" aria-pressed={(openTier[a.id] ?? 'mod') === tn.t} onclick={() => (openTier[a.id] = tn.t)}>{tn.icon} {tn.name}{#if a.tiers[tn.t]} ✓{/if}</button>{/each}
            </div>
            {#each tierNames as tn}
              {#if (openTier[a.id] ?? 'mod') === tn.t}
                <textarea class="input ta" rows="2" bind:value={a.tiers[tn.t]} aria-label="{tn.name} tier" data-tier={tn.t}
                  placeholder={tn.t === 'low' ? 'Support: sentence frames, word bank, pictures, fewer items' : tn.t === 'mod' ? tr('Core task for most pupils') : 'Challenge: more items, reasons with "because", less support'}></textarea>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
      <button class="btn btn-outline add" type="button" onclick={() => addActivity(s)}>{tr('+ Activity in {title}', { title: s.title })}</button>
    </section>
  {/each}
</div>

<style>
  .between { justify-content: space-between; }
  .small { font-size: var(--t-sm); }
  .fws { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-2); }
  .fws button { display: grid; gap: 4px; text-align: left; padding: var(--s-3); border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--card); cursor: pointer; color: var(--ink); font-size: var(--t-sm); }
  .fws button span { color: var(--ink-2); }
  .fws button[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }
  .ribbon { display: flex; height: 34px; border-radius: 8px; overflow: hidden; color: #fff; font: 700 var(--t-xs) var(--f-mono); }
  .ribbon div { display: grid; place-items: center; min-width: 0; overflow: hidden; }
  .mins { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: var(--s-2); }
  .mins span { font-size: var(--t-xs); }
  .bad { color: var(--bad); font-weight: 600; font-size: var(--t-sm); }
  .warn { color: var(--warn); font-weight: 600; font-size: var(--t-sm); }
  .note { border-style: dashed; }
  .stage { padding-top: var(--s-4); border-top: 2px solid var(--line); }
  .bank { width: 100%; max-width: 440px; min-width: 0; }
  .act { gap: var(--s-3); }
  .tools { gap: 0; }
  .del { color: var(--bad); }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--s-3); }
  .three { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .ta { min-height: 72px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .objs { gap: 6px; }
  .pick { cursor: pointer; }
  .tiers { display: grid; gap: var(--s-2); }
  .tiers .seg { max-width: 100%; overflow-x: auto; }
  .tiers .seg button { white-space: nowrap; }
  .add { justify-self: start; }
</style>
