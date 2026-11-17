<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import { pick, type PickerState } from '../../../lib/classroom/picker';
  import { tick, chime } from '../../../lib/audio/sfx';
  import type { TeachPupil } from '../types';

  let { pupils, picker = $bindable({ picked: [] }) }: { pupils: TeachPupil[]; picker?: PickerState } = $props();
  let shown = $state(''); let spinning = $state(false); let note = $state('');
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function spin() {
    if (!pupils.length || spinning) return;
    const r = pick(pupils.map((p) => p.id), picker);
    picker = r.state;
    note = r.roundDone ? tr('Everyone has had a turn. Starting a new round.') : '';
    const winner = pupils.find((p) => p.id === r.id)!.name;
    if (reduce) { shown = winner; chime(); return; }
    spinning = true;
    // slot-reel: fast at first, slowing down over about 2.5 s
    let delay = 40;
    while (delay < 320) {
      shown = pupils[Math.floor(Math.random() * pupils.length)].name; tick();
      await new Promise((res) => setTimeout(res, delay)); delay *= 1.18;
    }
    shown = winner; spinning = false; chime();
  }
  const left = $derived(pupils.filter((p) => !picker.picked.includes(p.id)).length);
</script>

<div class="tool">
  <p class="name pupil-font" class:spinning aria-live="polite">{shown || 'Who will it be?'}</p>
  <button id="picker-go" class="btn btn-gold big" type="button" onclick={spin} disabled={spinning || !pupils.length}>{shown ? tr('Pick again') : tr('Pick a name')}</button>
  <p class="muted small">{pupils.length ? tr('{left} of {length} not picked yet this round · absent pupils are left out', { left, length: pupils.length }) : tr('No pupils present. Add a pupil list to the class.')}</p>
  {#if note}<p class="small">{note}</p>{/if}
  {#if picker.picked.length}<button class="btn btn-text" type="button" onclick={() => { picker = { picked: [] }; shown = ''; }}>{tr('Start a new round')}</button>{/if}
</div>

<style>
  .tool { display: grid; gap: var(--s-4); justify-items: center; text-align: center; padding: var(--s-6) 0; }
  .name { font: 700 clamp(2.2rem, 7vw, 4.5rem)/1.1 var(--f-pupil); min-height: 1.2em; color: var(--ink); }
  .name.spinning { color: var(--ink-3); }
  .big { min-height: 56px; font-size: var(--t-lg); padding: 0 var(--s-8); }

</style>
