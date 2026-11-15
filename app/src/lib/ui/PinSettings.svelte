<script lang="ts">
  import { lock, setPin, removePin, lockNow } from '../lock.svelte';
  import { validPin } from '../crypto/pin';
  let a = $state(''); let b = $state(''); let old = $state(''); let msg = $state(''); let err = $state(''); let busy = $state(false);
  let mode = $state<'' | 'set' | 'remove'>('');
  async function doSet(e: SubmitEvent) {
    e.preventDefault(); err = '';
    if (!validPin(a)) { err = 'Use 4 to 6 digits.'; return; }
    if (a !== b) { err = 'The two PINs do not match.'; return; }
    busy = true; await setPin(a); busy = false;
    a = b = ''; mode = ''; msg = 'PIN set. Pupil names are now encrypted on this device.';
  }
  async function doRemove(e: SubmitEvent) {
    e.preventDefault(); err = ''; busy = true;
    const ok = await removePin(old); busy = false;
    if (!ok) { err = 'That PIN is not right.'; return; }
    old = ''; mode = ''; msg = 'PIN removed. Pupil names are stored without a PIN.';
  }
</script>

<div class="stack">
  <p class="muted small">{lock.configured ? 'Pupil names and notes are encrypted with your PIN. Classes, PBD and Teach mode ask for it after the app has been closed or left for 5 minutes.' : 'Protect pupil names and notes with a 4–6 digit PIN. They are then encrypted on this device.'}</p>
  {#if msg}<p class="ok small" role="status">{msg}</p>{/if}
  {#if mode === 'set'}
    <form class="stack" onsubmit={doSet}>
      <p class="warn small"><b>Important:</b> a forgotten PIN cannot be recovered, and the pupil names it protects would be lost. Write it down somewhere safe.</p>
      <div class="row">
        <label class="field"><span>New PIN</span><input id="pin-a" class="input pin" type="password" inputmode="numeric" maxlength="6" bind:value={a} /></label>
        <label class="field"><span>Type it again</span><input id="pin-b" class="input pin" type="password" inputmode="numeric" maxlength="6" bind:value={b} /></label>
      </div>
      {#if err}<p class="err small">{err}</p>{/if}
      <div class="row"><button id="pin-save" class="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Encrypting…' : 'Set PIN'}</button><button class="btn btn-text" type="button" onclick={() => (mode = '')}>Cancel</button></div>
    </form>
  {:else if mode === 'remove'}
    <form class="stack" onsubmit={doRemove}>
      <label class="field"><span>Current PIN</span><input class="input pin" type="password" inputmode="numeric" maxlength="6" bind:value={old} /></label>
      {#if err}<p class="err small">{err}</p>{/if}
      <div class="row"><button class="btn btn-outline" type="submit" disabled={busy}>Remove PIN</button><button class="btn btn-text" type="button" onclick={() => (mode = '')}>Cancel</button></div>
    </form>
  {:else}
    <div class="row">
      {#if lock.configured}
        <button class="btn btn-outline" type="button" onclick={() => { lockNow(); msg = 'Locked.'; }}>Lock now</button>
        <button class="btn btn-text" type="button" onclick={() => { mode = 'remove'; msg = ''; }}>Remove PIN</button>
      {:else}
        <button id="pin-start" class="btn btn-primary" type="button" onclick={() => { mode = 'set'; msg = ''; }}>Set a PIN</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .small { font-size: var(--t-sm); }
  .pin { font: 500 1.2rem var(--f-mono); letter-spacing: .3em; max-width: 160px; }
  .ok { color: var(--ok); } .err { color: var(--bad); } .warn { color: var(--warn); }
</style>
