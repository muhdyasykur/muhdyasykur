<script lang="ts">
  import { tr } from '../i18n/index.svelte';
  import { unlock } from '../lock.svelte';
  let { why = tr('Pupil names are protected with your PIN.') }: { why?: string } = $props();
  let pin = $state(''); let error = $state(''); let busy = $state(false);
  async function submit(e: SubmitEvent) {
    e.preventDefault(); busy = true; error = '';
    if (!(await unlock(pin))) { error = tr('That PIN is not right. Try again.'); pin = ''; }
    busy = false;
  }
</script>
<form class="card stack unlock" onsubmit={submit}>
  <h2>{tr('Locked')}</h2>
  <p class="muted">{why}</p>
  <label class="field"><span>{tr('PIN')}</span><input id="unlock-pin" class="input pin" type="password" inputmode="numeric" autocomplete="off" maxlength="6" bind:value={pin} /></label>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <button class="btn btn-gold" type="submit" disabled={busy || pin.length < 4}>{tr('Unlock')}</button>
</form>
<style>
  .unlock { max-width: 360px; margin: var(--s-8) auto; }
  .pin { font: 500 1.4rem var(--f-mono); letter-spacing: .4em; }
  .err { color: var(--bad); font-size: var(--t-sm); }
</style>
