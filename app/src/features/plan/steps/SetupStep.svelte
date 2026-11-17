<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson } from '../../../lib/lesson/model';
  import { endTime } from '../../../lib/lesson/model';
  import { rescale } from '../../../lib/lesson/frameworks';
  import { listClasses, countPupils } from '../../../lib/db/repo';
  import { db, type SchoolClass } from '../../../lib/db/schema';
  import { listLessons } from '../../../lib/db/repo';
  import { tipsFor } from '../../../lib/reflection';

  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  let classes = $state<SchoolClass[]>([]);
  let tips = $state<{ from: Lesson; text: string }[]>([]);
  $effect(() => { void lesson.classId; Promise.all([listLessons(), db.reflections.toArray()]).then(([ls, rs]) => (tips = tipsFor(lesson, ls, rs))); });
  $effect(() => { listClasses().then((c) => (classes = c.filter((x) => x.year === lesson.curriculum.year))); });

  async function pickClass(id: string) {
    const c = classes.find((x) => x.id === id);
    lesson.classId = c?.id ?? null;
    lesson.header.className = c?.name ?? '';
    lesson.header.levelLabel = c?.levelLabel ?? '';
    lesson.header.pupils = c ? (await countPupils(c.id)) || lesson.header.pupils : lesson.header.pupils;
  }
  function setDuration(d: number) {
    if (!(d >= 15 && d <= 120)) return;
    const mins = rescale(lesson.stages.map((s) => s.minutes), d);
    lesson.stages.forEach((s, i) => (s.minutes = mins[i]));
    lesson.header.durationMin = d;
  }
  const themes = ['World of Self, Family and Friends', 'World of Stories', 'World of Knowledge'];
</script>

<div class="stack">
  {#if tips.length}
    <aside class="card tips"><b>{tr('From your reflections')}</b>{#each tips as tip}<p>“{tip.text}” <span class="muted small">({tip.from.topic || tr('a lesson')}, {tip.from.header.date})</span></p>{/each}</aside>
  {/if}
  <section class="card grid">
    <label class="field"><span>{tr('Class')}</span>
      <select id="st-class" class="select" value={lesson.classId ?? ''} onchange={(e) => pickClass(e.currentTarget.value)}>
        <option value="">{tr('No class')}</option>
        {#each classes as c}<option value={c.id}>{c.name}</option>{/each}
      </select>
    </label>
    <label class="field"><span>{tr('Class name on the lesson plan')}</span><input id="st-cname" class="input" bind:value={lesson.header.className} placeholder={tr('e.g. 4 Zhong')} /></label>
    <label class="field"><span>{tr('Class level')}</span><input id="st-level" class="input" bind:value={lesson.header.levelLabel} placeholder={tr('e.g. Average')} /></label>
    <label class="field"><span>{tr('Number of pupils')}</span><input id="st-pupils" class="input" type="number" min="1" max="60" bind:value={lesson.header.pupils} /></label>
    <label class="field"><span>{tr('Date')}</span><input id="st-date" class="input" type="date" bind:value={lesson.header.date} /></label>
    <label class="field"><span>{tr('Start time')}</span><input id="st-start" class="input" type="time" bind:value={lesson.header.start} /></label>
    <label class="field"><span>{tr('Length (min)')}</span><input id="st-dur" class="input" type="number" min="15" max="120" step="5" value={lesson.header.durationMin} onchange={(e) => setDuration(Number(e.currentTarget.value))} /></label>
    <div class="field"><span>{tr('Ends at')}</span><p class="ro">{endTime(lesson.header.start, lesson.header.durationMin) || '–'}</p></div>
  </section>

  <section class="card grid">
    <label class="field wide"><span>{tr('Topic')}</span><input id="st-topic" class="input" bind:value={lesson.topic} placeholder={tr('e.g. What\'s the matter?')} /></label>
    <label class="field"><span>{tr('Theme')}</span><input id="st-theme" class="input" bind:value={lesson.theme} list="themes" /></label>
    <label class="field"><span>{tr('Language / grammar focus')}</span><input id="st-focus" class="input" bind:value={lesson.focus} placeholder={tr('e.g. should / shouldn\'t')} /></label>
    <label class="field"><span>{tr('Cross-curricular element (CCE)')}</span><input id="st-cce" class="input" bind:value={lesson.cce} list="cces" /></label>
    <label class="field"><span>{tr('21st-century skills / strategy')}</span><input id="st-21" class="input" bind:value={lesson.skills21} list="pak21" placeholder={tr('e.g. Collaboration, Critical thinking')} /></label>
    <label class="field"><span>{tr('Moral values')}</span><input id="st-values" class="input" bind:value={lesson.values} placeholder={tr('e.g. Health awareness')} /></label>
    <label class="field"><span>{tr('Current pedagogical practice')}</span><input id="st-ped" class="input" bind:value={lesson.pedagogy} list="peds" placeholder={tr('e.g. Contextual learning')} /></label>
    <label class="field wide"><span>{tr('What pupils already know')}</span><textarea id="st-prior" class="input ta" rows="2" bind:value={lesson.priorKnowledge} placeholder="e.g. Daily routines vocabulary from Unit 7; present simple."></textarea></label>
  </section>

  {#if lesson.sowNotes.note}<aside class="card note"><b>{tr('From the SoW')}</b><p class="pre">{lesson.sowNotes.note}</p></aside>{/if}
</div>

<datalist id="themes">{#each themes as t}<option value={t}></option>{/each}</datalist>
<datalist id="cces">{#each ['Language', 'Values', 'Environmental Sustainability', 'Science and Technology', 'Patriotism', 'Creativity and Innovation', 'Entrepreneurship', 'Information and Communications Technology', 'Global Sustainability', 'Financial Education'] as t}<option value={t}></option>{/each}</datalist>
<datalist id="pak21">{#each ['Collaboration', 'Communication', 'Critical thinking', 'Creativity', 'Character', 'Citizenship', 'Think-Pair-Share', 'Gallery Walk', 'Round Robin', 'Hot Seat', 'Role-play', 'i-THINK maps'] as t}<option value={t}></option>{/each}</datalist>
<datalist id="peds">{#each ['Contextual learning', 'Inquiry-based learning', 'Project-based learning', 'Mastery learning', 'Cooperative learning', 'Constructivism', 'STEM', 'Future studies'] as t}<option value={t}></option>{/each}</datalist>

<style>
  .grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: 1 / -1; }
  .ta { min-height: 64px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .ro { min-height: var(--tap); display: flex; align-items: center; font-family: var(--f-mono); }
  .note { border-style: dashed; }
  .tips { border-left: 4px solid var(--ok); }
  .small { font-size: var(--t-sm); }
  .pre { white-space: pre-line; color: var(--ink-2); }
</style>
