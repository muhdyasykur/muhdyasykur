<script lang="ts">
  import type { Lesson } from '../../../lib/lesson/model';
  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  let label = $state(''); let url = $state(''); let err = $state('');
  function addLink() {
    const u = url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) { err = 'Paste a full link starting with https://'; return; }
    lesson.links.push({ label: label.trim() || u.replace(/^https?:\/\//, '').split('/')[0], url: u });
    label = ''; url = ''; err = '';
  }
</script>

<div class="stack">
  {#if lesson.sowNotes.materials}<aside class="card note"><b>SoW materials and references</b><p class="small">{lesson.sowNotes.materials}</p></aside>{/if}
  <section class="card grid">
    <label class="field wide"><span>Teaching aids and materials</span><textarea id="mt-aids" class="input ta" rows="3" bind:value={lesson.aids} placeholder="e.g. Picture flashcards, worksheet, writing paper"></textarea></label>
    <label class="field wide"><span>Key vocabulary</span><input id="mt-vocab" class="input" bind:value={lesson.vocabulary} placeholder="e.g. healthy, unhealthy, brush, junk food" /></label>
  </section>
  <section class="card grid">
    <h3 class="wide">Assessment (PBD)</h3>
    <label class="field"><span>Evidence: what pupils produce</span><input id="mt-evidence" class="input" bind:value={lesson.assessment.evidence} placeholder="e.g. Paragraph, exit ticket" /></label>
    <label class="field"><span>Method: how you check</span><input id="mt-method" class="input" bind:value={lesson.assessment.method} placeholder="e.g. Checklist while monitoring, questioning" /></label>
  </section>
  <section class="card stack">
    <h3>Links</h3>
    <p class="muted small">Your Canva designs, Wordwall games or videos. They print on the RPH and will open in Teach mode.</p>
    {#each lesson.links as l, i}
      <div class="row"><span class="chip">{l.label}</span><span class="muted small url">{l.url}</span><button class="btn btn-text" type="button" onclick={() => lesson.links.splice(i, 1)}>Remove</button></div>
    {/each}
    <div class="grid">
      <label class="field"><span>Name</span><input id="mt-lname" class="input" bind:value={label} placeholder="e.g. Healthy habits game" /></label>
      <label class="field"><span>Link</span><input id="mt-url" class="input" type="url" bind:value={url} placeholder="https://" /></label>
    </div>
    {#if err}<p class="bad">{err}</p>{/if}
    <button class="btn btn-outline add" type="button" onclick={addLink}>Add link</button>
  </section>
  <section class="card">
    <label class="field"><span>Appendices (worksheet text, model paragraph, song lyrics)</span><textarea id="mt-app" class="input ta big" rows="8" bind:value={lesson.appendices}></textarea></label>
  </section>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: 1 / -1; }
  .ta { min-height: 72px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .big { min-height: 160px; }
  .note { border-style: dashed; }
  .small { font-size: var(--t-sm); }
  .url { overflow-wrap: anywhere; min-width: 0; }
  .bad { color: var(--bad); font-size: var(--t-sm); }
  .add { justify-self: start; }
</style>
