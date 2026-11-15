<script lang="ts">
  import { signal } from '../../../lib/audio/sfx';
  let count = $state(0);
  $effect(() => { signal(); });
  function again() { signal(); count = 3; const t = setInterval(() => { count--; if (count <= 0) clearInterval(t); }, 1000); }
</script>
<div class="tool">
  <p class="big pupil-font">Eyes on me! 👀</p>
  <p class="sub pupil-font">Stop · Look · Listen</p>
  {#if count > 0}<p class="count" aria-live="assertive">{count}</p>{/if}
  <button class="btn btn-outline" type="button" onclick={again}>Signal again with 3-2-1</button>
</div>
<style>
  .tool { display: grid; gap: var(--s-3); justify-items: center; text-align: center; padding: var(--s-8) 0; }
  .big { font: 700 clamp(2.4rem, 8vw, 5rem)/1.1 var(--f-pupil); }
  .sub { font-size: clamp(1.2rem, 3vw, 1.8rem); color: var(--ink-2); }
  .count { font: 800 4rem var(--f-display); color: var(--gold); }
</style>
