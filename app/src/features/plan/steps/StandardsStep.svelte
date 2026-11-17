<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson, Role } from '../../../lib/lesson/model';
  import type { Standards } from '../../../lib/curriculum/types';
  import { skillOfLs } from '../../../lib/lesson/objectives';

  let { lesson = $bindable(), standards }: { lesson: Lesson; standards: Standards } = $props();
  const fromSow = lesson.mode !== 'scratch' && lesson.standards.main.ls.length > 0;
  let unlocked = $state(!fromSow);
  let role = $state<Role>('main');
  let skill = $state(lesson.standards.main.ls[0] ? skillOfLs(lesson.standards.main.ls) : 'Listening');
  const skills = ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'];

  function toggle(code: string) {
    const r = lesson.standards[role];
    const has = r.ls.some((x) => x.code === code);
    const ls = has ? r.ls.filter((x) => x.code !== code) : [...r.ls, { code, text: standards.ls.find((x) => x.code === code)?.text ?? '' }];
    ls.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const csCodes = [...new Set(ls.map((x) => x.code.split('.').slice(0, 2).join('.')))];
    lesson.standards[role] = { ls, cs: csCodes.map((c) => ({ code: c, text: standards.cs.find((x) => x.code === c)?.text ?? '' })) };
    if (role === 'main') { const s = skillOfLs(ls); if (s && lesson.mode === 'scratch') lesson.mainSkill = s; else if (s && !lesson.mainSkill) lesson.mainSkill = s; }
    else lesson.compSkill = skillOfLs(ls);
  }
  const list = $derived(standards.ls.filter((l) => l.skill === skill));
  const chosen = (code: string) => lesson.standards[role].ls.some((x) => x.code === code);
  const roles: { r: Role; pill: string; name: string }[] = [{ r: 'main', pill: 'M', name: tr('Main skill') }, { r: 'comp', pill: 'C', name: tr('Complementary skill') }];
</script>

<div class="stack">
  {#each roles as x}
    <section class="card std">
      <span class={x.r === 'main' ? 'pill-m' : 'pill-c'}>{x.pill}</span>
      <div class="stack tight">
        <b>{x.name}{#if x.r === 'main' && lesson.mainSkill}: {lesson.mainSkill}{:else if x.r === 'comp' && lesson.compSkill}: {lesson.compSkill}{/if}</b>
        {#each lesson.standards[x.r].cs as c}<p><span class="code">{tr('CS {code}', { code: c.code })}</span> {c.text}</p>{/each}
        {#each lesson.standards[x.r].ls as l}<p class="pre"><span class="code">{tr('LS {code}', { code: l.code })}</span> {l.text}</p>{/each}
        {#if !lesson.standards[x.r].ls.length}<p class="muted">{x.r === 'comp' ? tr('No complementary standard yet. The SoW pairs every lesson with one, and it needs its own objective.') : tr('Choose the main Learning Standard below.')}</p>{/if}
      </div>
    </section>
  {/each}
  {#if lesson.sowNotes.note && !lesson.standards.main.ls.length}<p class="card note pre">{lesson.sowNotes.note}</p>{/if}

  {#if !unlocked}
    <p class="muted">{tr('These standards come from SoW lesson {sowLesson}.', { sowLesson: lesson.curriculum.sowLesson })} <button class="btn btn-text" type="button" onclick={() => (unlocked = true)}>{tr('Change them')}</button></p>
  {:else}
    <section class="card stack">
      <h3>{tr('Choose from the Year {year} DSKP', { year: lesson.curriculum.year })}</h3>
      <div class="row">
        <div class="seg" role="group" aria-label={tr('Standard role')}>
          {#each roles as x}<button type="button" aria-pressed={role === x.r} onclick={() => (role = x.r)}>{x.pill} · {x.name}</button>{/each}
        </div>
      </div>
      <div class="seg skills" role="group" aria-label={tr('Skill')}>
        {#each skills as s}<button type="button" aria-pressed={skill === s} onclick={() => (skill = s)}>{s}</button>{/each}
      </div>
      <ul class="pick">
        {#each list as l (l.code)}
          <li><label class:on={chosen(l.code)}>
            <input type="checkbox" checked={chosen(l.code)} onchange={() => toggle(l.code)} data-ls={l.code} />
            <span class="code">{l.code}</span>
            <span class="pre">{l.text}</span>
          </label></li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .std { grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--s-3); }
  .tight { gap: var(--s-1); }

  .note { border-style: dashed; color: var(--ink-2); }
  .skills { max-width: 100%; overflow-x: auto; }
  .skills button { white-space: nowrap; }
  .pick { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .pick label { display: grid; grid-template-columns: 22px 52px minmax(0, 1fr); gap: var(--s-2); align-items: start; padding: var(--s-2); border-radius: 8px; cursor: pointer; }
  .pick label:hover { background: var(--sunken); }
  .pick label.on { background: var(--gold-soft); }
  .pick input { margin-top: 4px; width: 18px; height: 18px; }
</style>
