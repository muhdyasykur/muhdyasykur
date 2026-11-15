<script lang="ts">
  import { route, href, go } from '../../router.svelte';
  import { listLessons, deleteLesson, duplicateLesson } from '../../lib/db/repo';
  import { FRAMEWORKS } from '../../lib/lesson/frameworks';
  import { longDate } from '../../lib/lesson/derive';
  import type { Lesson } from '../../lib/lesson/model';
  import Icon from '../../lib/ui/Icon.svelte';
  import NewRph from './NewRph.svelte';
  import Builder from './Builder.svelte';

  let lessons = $state<Lesson[] | null>(null);
  let confirm = $state('');
  async function refresh() { lessons = await listLessons(); }
  $effect(() => { if (!route.parts[0]) refresh(); });

  async function dup(id: string) { const n = await duplicateLesson(id); if (n) go('plan', 'edit', n, 'setup'); }
  async function del(id: string) { await deleteLesson(id); confirm = ''; refresh(); }
  const statusLabel = { draft: 'Draft', ready: 'Ready', taught: 'Taught' } as const;
</script>

{#if route.parts[0] === 'new'}
  <NewRph />
{:else if route.parts[0] === 'edit' && route.parts[1]}
  <Builder id={route.parts[1]} step={route.parts[2] ?? 'setup'} />
{:else}
<div class="stack">
  <div class="row top">
    <h1>Plan</h1>
    <a class="btn btn-gold" href={href('plan', 'new')}><Icon name="plus" size={18} />New RPH</a>
  </div>
  {#if lessons && !lessons.length}
    <section class="empty">
      <h3>No lesson plans yet</h3>
      <p>Start from a Scheme of Work lesson, keep its standards and write your own activities, or plan from scratch.</p>
      <a class="btn btn-primary" href={href('plan', 'new')}>Plan your first lesson</a>
    </section>
  {:else if lessons}
    <ul class="list">
      {#each lessons as l (l.id)}
        <li class="card">
          <a class="main" href={href('plan', 'edit', l.id, 'setup')}>
            <span class="eyebrow">{longDate(l.header.date)} · {l.header.className || `Year ${l.curriculum.year}`}</span>
            <b>{l.topic || 'Untitled lesson'}</b>
            <span class="row chips">
              <span class="chip">{l.mainSkill || 'No skill yet'}</span>
              <span class="chip">{FRAMEWORKS[l.framework].short}</span>
              <span class="chip status-{l.status}">{statusLabel[l.status]}</span>
            </span>
          </a>
          <div class="row actions">
            <a class="btn btn-text" href={href('plan', 'edit', l.id, 'review')}>Print</a>
            <button class="btn btn-text" type="button" onclick={() => dup(l.id)}>Duplicate</button>
            {#if confirm === l.id}
              <button class="btn btn-outline del" type="button" onclick={() => del(l.id)}>Delete</button>
              <button class="btn btn-text" type="button" onclick={() => (confirm = '')}>Keep</button>
            {:else}
              <button class="btn btn-text del" type="button" onclick={() => (confirm = l.id)}>Delete…</button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
{/if}

<style>
  .top { justify-content: space-between; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-3); }
  .main { display: grid; gap: 4px; text-decoration: none; color: var(--ink); }
  .main b { font: 700 var(--t-lg) var(--f-display); }
  .chips { gap: 6px; }
  .status-ready { color: var(--ok); border-color: currentColor; }
  .actions { gap: 0; border-top: 1px solid var(--line); padding-top: var(--s-1); }
  .del { color: var(--bad); }
</style>
