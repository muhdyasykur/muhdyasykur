<script lang="ts">
  import { tr } from '../i18n/index.svelte';
  import type { Profile } from '../db/schema';
  import { fileToDataUrl } from './image';
  import { untrack } from 'svelte';

  let { value, onsave, saveLabel, children }: { value: Profile | null; onsave: (p: Omit<Profile, 'id' | 'createdAt'>) => void; saveLabel: string; children?: import('svelte').Snippet } = $props();
  // The form edits a copy: later changes to `value` do not overwrite what the teacher is typing.
  const init = untrack(() => value);
  let name = $state(init?.name ?? '');
  let school = $state(init?.school ?? '');
  let schoolType = $state<'SK' | 'SJK'>(init?.schoolType ?? 'SK');
  let programme = $state(init?.programme ?? '');
  let campus = $state(init?.campus ?? '');
  let logo = $state(init?.logo ?? '');
  let logoError = $state('');

  async function pick(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    try { logo = await fileToDataUrl(f); logoError = ''; } catch (err) { logoError = (err as Error).message; }
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    onsave({ name: name.trim(), school: school.trim(), schoolType, programme: programme.trim(), campus: campus.trim(), logo: logo || undefined });
  }
</script>

<form class="stack" onsubmit={submit}>
  <div class="grid">
    <label class="field"><span>{tr('Your name')}</span><input id="pf-name" class="input" bind:value={name} autocomplete="name" placeholder={tr('e.g. Muhammad Yasykur')} /></label>
    <label class="field"><span>{tr('Practicum school')}</span><input id="pf-school" class="input" bind:value={school} placeholder={tr('e.g. SK(C) Anglo Chinese Kota Kinabalu')} /></label>
    <div class="field">
      <span id="pf-type-l">{tr('School type')}</span>
      <div class="seg" role="group" aria-labelledby="pf-type-l">
        <button type="button" aria-pressed={schoolType === 'SK'} onclick={() => (schoolType = 'SK')}>{tr('SK (national)')}</button>
        <button type="button" aria-pressed={schoolType === 'SJK'} onclick={() => (schoolType = 'SJK')}>{tr('SJK (national-type)')}</button>
      </div>
      <small class="muted">{tr('Decides which Scheme of Work opens by default. Each class can still be set separately.')}</small>
    </div>
    <label class="field"><span>{tr('Programme (optional)')}</span><input id="pf-prog" class="input" bind:value={programme} placeholder={tr('e.g. PISMP TESL')} /></label>
    <label class="field"><span>{tr('Campus (optional)')}</span><input id="pf-campus" class="input" bind:value={campus} placeholder={tr('e.g. IPG Kampus Gaya')} /></label>
    <div class="field">
      <span>{tr('School badge for the lesson plan header (optional)')}</span>
      <div class="row">
        {#if logo}<img src={logo} alt={tr('School badge')} class="logo" /><button type="button" class="btn btn-text" onclick={() => (logo = '')}>{tr('Remove')}</button>{/if}
        <label class="btn btn-outline">{tr('Choose image')}<input id="pf-logo" type="file" accept="image/*" class="sr-only" onchange={pick} /></label>
      </div>
      {#if logoError}<small class="err">{logoError}</small>{/if}
    </div>
  </div>
  {@render children?.()}
  <div class="row"><button class="btn btn-gold" type="submit">{saveLabel}</button></div>
</form>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: var(--s-4); }
  .logo { width: 56px; height: 56px; object-fit: contain; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
  .err { color: var(--bad); }
  small { font-size: var(--t-xs); }
</style>
