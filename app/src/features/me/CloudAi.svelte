<script lang="ts">
  import { href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { ai, saveAi, forgetAi } from '../../lib/ai/settings.svelte';
  import { testKey, generate, KEY_PAGE, AiError } from '../../lib/ai/gemini';
  import { pwa } from '../../lib/pwa.svelte';

  /** Me → Cloud AI: optional Google Gemini with the teacher's own free key. Off by default. */
  let agree1 = $state(ai.agreed > 0), agree2 = $state(ai.agreed > 0), agree3 = $state(ai.agreed > 0);
  let keyInput = $state(ai.key);
  let models = $state<string[]>(ai.model ? [ai.model] : []);
  let status = $state(''); let err = $state(''); let busy = $state(false);
  let showKey = $state(false);
  const canTurnOn = $derived(agree1 && agree2 && agree3 && keyInput.trim().length > 20);

  async function test() {
    busy = true; status = ''; err = '';
    try {
      const r = await testKey(keyInput.trim());
      models = r.models.length ? r.models : [r.best];
      if (!ai.model || !models.includes(ai.model)) ai.model = r.best;
      status = `The key works. ${r.models.length} models are available; Consilia will use ${ai.model}.`;
    } catch (e) { err = e instanceof AiError ? e.message : 'Could not check the key.'; }
    busy = false;
  }
  async function turnOn() {
    if (!canTurnOn) return;
    ai.key = keyInput.trim(); ai.agreed = Date.now(); ai.on = true;
    if (!ai.model) await test();
    saveAi(); if (!err) status = 'Cloud AI is on. Use it from Lesson slides and the AI prompt builder.';
  }
  function turnOff() { ai.on = false; saveAi(); status = 'Cloud AI is off. Nothing is sent. Your key is kept so you can turn it on again.'; }
  function forget() { forgetAi(); keyInput = ''; agree1 = agree2 = agree3 = false; models = []; status = 'The key is removed from this device.'; err = ''; }
  async function trySample() {
    busy = true; err = ''; status = '';
    try { status = 'Gemini says: ' + (await generate(ai, 'Write one cheerful sentence (max 15 words) a Year 3 teacher in Malaysia could say to start an English lesson about animals.')).trim(); }
    catch (e) { err = e instanceof AiError ? e.message : 'The test did not work.'; }
    busy = false;
  }
</script>

<div class="stack">
  <a class="btn btn-text" href={href('me')}><Icon name="back" size={18} />Me</a>
  <header><p class="eyebrow">Optional</p><h1>Cloud AI (Google Gemini)</h1></header>
  <section class="card stack">
    <p>Consilia works fully without AI. If you want, it can also ask <b>Google Gemini</b> to write extra lesson content for you, such as a reading text, a dialogue and questions for your slides, or the answer to any prompt in the AI prompt builder, right inside the app.</p>
    <p>It uses <b>your own free API key</b> from Google. Consilia has no server: requests go straight from this device to Google. You can turn it off or remove the key at any time.</p>
    <p class="state" data-state={ai.on ? 'on' : 'off'} id="ai-state">{ai.on ? '● Cloud AI is on' : '○ Cloud AI is off'}{ai.on && ai.model ? ` · ${ai.model}` : ''}</p>
  </section>

  <section class="card stack">
    <h2>1. Get a free key</h2>
    <ol class="steps">
      <li>Open <a href={KEY_PAGE} target="_blank" rel="noopener noreferrer">Google AI Studio ↗</a> and sign in with a Google account (a personal one is best).</li>
      <li>Tap <b>Create API key</b>, then copy it.</li>
      <li>Paste it below. The free tier has daily limits; Consilia never turns on paid billing.</li>
    </ol>
    <label class="field">Your Gemini API key
      <span class="row keyrow">
        <input class="input" id="ai-key" type={showKey ? 'text' : 'password'} autocomplete="off" spellcheck="false" bind:value={keyInput} placeholder="AIza…" />
        <button class="btn btn-text" type="button" onclick={() => (showKey = !showKey)} aria-pressed={showKey}>{showKey ? 'Hide' : 'Show'}</button>
      </span>
    </label>
    <p class="muted small">The key is kept only in this browser on this device. It is not in your backups, shared lessons or anything you export. Do not share it.</p>
    <div class="row">
      <button class="btn btn-outline" type="button" onclick={test} disabled={busy || keyInput.trim().length < 20 || !pwa.online} id="ai-test">{busy ? 'Checking…' : 'Test the key'}</button>
      {#if models.length > 1}
        <label class="row small">Model
          <select class="select" bind:value={ai.model} onchange={saveAi} id="ai-model">{#each models as m}<option value={m}>{m}</option>{/each}</select>
        </label>
      {/if}
    </div>
  </section>

  <section class="card stack">
    <h2>2. Read and agree</h2>
    <label class="row tick"><input type="checkbox" bind:checked={agree1} id="ai-agree1" /><span>I understand that when I tap an AI button, the lesson's year, topic, theme, skill, key words, target sentence and objectives are sent to Google. <b>Pupils' names, class names, marks, attendance and my details are never sent.</b></span></label>
    <label class="row tick"><input type="checkbox" bind:checked={agree2} id="ai-agree2" /><span>I understand that on Google's free tier, Google may use what is sent to improve its products, under <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Google's terms ↗</a>. I will not type personal information into AI prompts.</span></label>
    <label class="row tick"><input type="checkbox" bind:checked={agree3} id="ai-agree3" /><span>I will check everything the AI writes before using it with pupils. AI can be wrong or unsuitable, and I am responsible for what I teach.</span></label>
  </section>

  <section class="card stack">
    <h2>3. Turn it on</h2>
    <div class="row">
      {#if ai.on}
        <button class="btn btn-outline" type="button" onclick={turnOff} id="ai-off">Turn Cloud AI off</button>
        <button class="btn btn-text" type="button" onclick={trySample} disabled={busy || !pwa.online} id="ai-sample">Try it</button>
      {:else}
        <button class="btn btn-gold" type="button" onclick={turnOn} disabled={!canTurnOn || busy} id="ai-on">Turn Cloud AI on</button>
      {/if}
      {#if ai.key || keyInput}<button class="btn btn-text del" type="button" onclick={forget} id="ai-forget">Remove the key from this device</button>{/if}
    </div>
    {#if !canTurnOn && !ai.on}<p class="muted small">Paste a key and tick all three boxes to turn it on.</p>{/if}
    {#if !pwa.online}<p class="muted small">You are offline. Cloud AI needs the internet.</p>{/if}
    {#if status}<p class="small ok" role="status" id="ai-status">{status}</p>{/if}
    {#if err}<p class="small bad" role="alert" id="ai-error">{err}</p>{/if}
  </section>
</div>

<style>
  .small { font-size: var(--t-sm); }
  .steps { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
  .field { display: grid; gap: 4px; font-weight: 600; font-size: var(--t-sm); }
  .keyrow { flex-wrap: nowrap; }
  .keyrow .input { flex: 1; font-family: ui-monospace, monospace; }
  .tick { align-items: flex-start; flex-wrap: nowrap; gap: var(--s-2); min-height: 44px; }
  .tick input { width: 20px; height: 20px; flex: none; margin-top: 3px; }
  .state { font-weight: 700; margin: 0; }
  .state[data-state='on'] { color: var(--ok, #2e7d4f); }
  .ok { color: var(--ok, #2e7d4f); }
  .bad, .del { color: var(--bad); }
</style>
