<script lang="ts">
  import Icon from './Icon.svelte';
  import { tr } from '../i18n/index.svelte';
  import { full, exitFull } from './fullscreen.svelte';
  /** Shown inside an element in the filled-window view: a way out (touch screens have no Esc key) and the note. */
  let { el }: { el: HTMLElement | null | undefined } = $props();
  let hideNote = $state(false);
</script>
{#if el && full.pseudo === el}
  <button class="btn btn-outline fs-exit" type="button" onclick={exitFull} data-fs-exit><Icon name="close" size={18} />{tr('Exit full view')}</button>
  {#if full.note && !hideNote}<p class="fs-note" role="status">{full.note}<button class="btn btn-text" type="button" onclick={() => (hideNote = true)}>{tr('OK')}</button></p>{/if}
{/if}
