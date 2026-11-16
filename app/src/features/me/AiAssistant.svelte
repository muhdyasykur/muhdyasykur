<script lang="ts">
  import { href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { ai, saveAi, forgetAi, current } from '../../lib/ai/settings.svelte';
  import { testKey, askText } from '../../lib/ai/ask';
  import { AiError, type Provider } from '../../lib/ai/common';
  import { KEY_PAGE as CLAUDE_KEYS, CLAUDE_MODELS } from '../../lib/ai/claude-models';
  import { GEMINI_KEY_PAGE as GEMINI_KEYS } from '../../lib/ai/claude-models';
  import { pwa } from '../../lib/pwa.svelte';

  /** Me → AI assistant: optional Claude (Anthropic) or Gemini (Google) with the teacher's own key. Off by default. */
  const P = {
    claude: { name: 'Claude', by: 'Anthropic', keys: CLAUDE_KEYS, site: 'the Claude Console', terms: 'https://www.anthropic.com/legal/commercial-terms', termsName: 'Anthropic\'s terms', placeholder: 'sk-ant-…' },
    gemini: { name: 'Gemini', by: 'Google', keys: GEMINI_KEYS, site: 'Google AI Studio', terms: 'https://ai.google.dev/gemini-api/terms', termsName: 'Google\'s terms', placeholder: 'AIza…' }
  } as const;
  let agree1 = $state(ai.agreed > 0), agree2 = $state(ai.agreed > 0), agree3 = $state(ai.agreed > 0);
  let keyInput = $state(current().key);
  let models = $state<string[]>(ai.provider === 'claude' ? CLAUDE_MODELS.map((m) => m.id) : (current().model ? [current().model] : []));
  let status = $state(''); let err = $state(''); let busy = $state(false);
  let showKey = $state(false);
  const p = $derived(P[ai.provider]);
  const canTurnOn = $derived(agree1 && agree2 && agree3 && keyInput.trim().length > 20);
  const label = (m: string) => CLAUDE_MODELS.find((x) => x.id === m)?.name ?? m;

  function choose(v: Provider) {
    if (v === ai.provider) return;
    ai.provider = v; ai.on = false; agree2 = false; // the second agreement names the company
    keyInput = current().key; status = ''; err = '';
    models = v === 'claude' ? CLAUDE_MODELS.map((m) => m.id) : (current().model ? [current().model] : []);
    saveAi();
  }
  async function test() {
    busy = true; status = ''; err = '';
    try {
      const r = await testKey(ai.provider, keyInput.trim());
      models = r.models.length ? r.models : [r.best];
      if (!current().model || !models.includes(current().model)) current().model = r.best;
      status = `The key works. Consilia will use ${label(current().model)}.`;
    } catch (e) { err = e instanceof AiError ? e.message : 'Could not check the key.'; }
    busy = false;
  }
  async function turnOn() {
    if (!canTurnOn) return;
    current().key = keyInput.trim(); ai.agreed = Date.now(); ai.on = true;
    if (!current().model) await test();
    saveAi(); if (!err) status = `${p.name} is on. Use it from Lesson slides, the AI prompt builder and Improve with AI.`;
  }
  function turnOff() { ai.on = false; saveAi(); status = 'The AI assistant is off. Nothing is sent. Your key is kept so you can turn it on again.'; }
  function forget() { forgetAi(); keyInput = ''; agree1 = agree2 = agree3 = false; models = CLAUDE_MODELS.map((m) => m.id); status = 'All AI keys are removed from this device.'; err = ''; }
  async function trySample() {
    busy = true; err = ''; status = '';
    try { status = `${p.name} says: ` + (await askText('Write one cheerful sentence (max 15 words) a Year 3 teacher in Malaysia could say to start an English lesson about animals.')).trim(); }
    catch (e) { err = e instanceof AiError ? e.message : 'The test did not work.'; }
    busy = false;
  }
</script>

<div class="stack">
  <a class="btn btn-text" href={href('me')}><Icon name="back" size={18} />Me</a>
  <header><p class="eyebrow">Optional</p><h1>AI assistant</h1></header>
  <section class="card stack">
    <p>Consilia works fully without AI. If you want, it can also ask <b>Claude</b> (by Anthropic) or <b>Gemini</b> (by Google) to write extra lesson content for you, such as a reading text, a dialogue and questions for your slides, or the answer to any prompt in the AI prompt builder, right inside the app.</p>
    <p>It uses <b>your own API key</b>. Consilia has no server: requests go straight from this device to the AI company. You can turn it off or remove the key at any time.</p>
    <p class="state" data-state={ai.on ? 'on' : 'off'} id="ai-state">{ai.on ? `● ${p.name} is on` : '○ The AI assistant is off'}{ai.on && current().model ? ` · ${label(current().model)}` : ''}</p>
  </section>

  <section class="card stack">
    <h2>1. Choose an AI</h2>
    <div class="choices" role="radiogroup" aria-label="AI assistant">
      <button type="button" role="radio" aria-checked={ai.provider === 'claude'} class="card choice" onclick={() => choose('claude')} id="ai-p-claude">
        <b>Claude <span class="chip">recommended</span></b><span class="muted small">By Anthropic. Careful, natural English at the pupils' level. Pay as you go: a slide request costs a few sen (about US$0.01–0.05). Billed separately from a Claude.ai subscription.</span>
      </button>
      <button type="button" role="radio" aria-checked={ai.provider === 'gemini'} class="card choice" onclick={() => choose('gemini')} id="ai-p-gemini">
        <b>Gemini</b><span class="muted small">By Google. Free tier with daily limits; on the free tier Google may use what is sent to improve its products.</span>
      </button>
    </div>
    <p class="muted small">Prefer not to use a key? Every AI button also copies a prompt for the free <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">Claude.ai ↗</a> chat (or ChatGPT, Gemini, Copilot); paste the answer back into Consilia.</p>
  </section>

  <section class="card stack">
    <h2>2. Get a key</h2>
    {#if ai.provider === 'claude'}
      <ol class="steps">
        <li>Open the <a href={p.keys} target="_blank" rel="noopener noreferrer">Claude Console ↗</a> and sign in (or create an account).</li>
        <li>Add a little credit under <b>Billing</b> (some Claude plans include monthly API credits). You can set a monthly spend limit there.</li>
        <li>Under <b>API keys</b>, tap <b>Create key</b>, then copy it and paste it below.</li>
      </ol>
    {:else}
      <ol class="steps">
        <li>Open <a href={p.keys} target="_blank" rel="noopener noreferrer">Google AI Studio ↗</a> and sign in with a Google account (a personal one is best).</li>
        <li>Tap <b>Create API key</b>, then copy it and paste it below. The free tier has daily limits.</li>
      </ol>
    {/if}
    <label class="field">Your {p.name} API key
      <span class="row keyrow">
        <input class="input" id="ai-key" type={showKey ? 'text' : 'password'} autocomplete="off" spellcheck="false" bind:value={keyInput} placeholder={p.placeholder} />
        <button class="btn btn-text" type="button" onclick={() => (showKey = !showKey)} aria-pressed={showKey}>{showKey ? 'Hide' : 'Show'}</button>
      </span>
    </label>
    <p class="muted small">The key is kept only in this browser on this device. It is not in your backups, shared lessons or anything you export. Do not share it.</p>
    <div class="row">
      <button class="btn btn-outline" type="button" onclick={test} disabled={busy || keyInput.trim().length < 20 || !pwa.online} id="ai-test">{busy ? 'Checking…' : 'Test the key'}</button>
      {#if models.length > 1}
        <label class="row small">Model
          <select class="select" value={current().model} onchange={(e) => { current().model = e.currentTarget.value; saveAi(); }} id="ai-model">{#each models as m}<option value={m}>{label(m)}{ai.provider === 'claude' ? ` · ${CLAUDE_MODELS.find((x) => x.id === m)?.about ?? ''}` : ''}</option>{/each}</select>
        </label>
      {/if}
    </div>
  </section>

  <section class="card stack">
    <h2>3. Read and agree</h2>
    <label class="row tick"><input type="checkbox" bind:checked={agree1} id="ai-agree1" /><span>I understand that when I tap an AI button, the lesson's year, topic, theme, skill, key words, target sentence and objectives (or the prompt I can see) are sent to {p.by}. <b>Pupils' names, class names, marks, attendance and my details are never sent.</b></span></label>
    <label class="row tick"><input type="checkbox" bind:checked={agree2} id="ai-agree2" /><span>I understand that what is sent is handled by {p.by} under <a href={p.terms} target="_blank" rel="noopener noreferrer">{p.termsName} ↗</a>{ai.provider === 'gemini' ? ', and that on the free tier Google may use it to improve its products' : ', and that I pay Anthropic for what I use with my key'}. I will not type personal information into AI prompts.</span></label>
    <label class="row tick"><input type="checkbox" bind:checked={agree3} id="ai-agree3" /><span>I will check everything the AI writes before using it with pupils. AI can be wrong or unsuitable, and I am responsible for what I teach.</span></label>
  </section>

  <section class="card stack">
    <h2>4. Turn it on</h2>
    <div class="row">
      {#if ai.on}
        <button class="btn btn-outline" type="button" onclick={turnOff} id="ai-off">Turn the AI assistant off</button>
        <button class="btn btn-text" type="button" onclick={trySample} disabled={busy || !pwa.online} id="ai-sample">Try it</button>
      {:else}
        <button class="btn btn-gold" type="button" onclick={turnOn} disabled={!canTurnOn || busy} id="ai-on">Turn {p.name} on</button>
      {/if}
      {#if ai.claude.key || ai.gemini.key || keyInput}<button class="btn btn-text del" type="button" onclick={forget} id="ai-forget">Remove all keys from this device</button>{/if}
    </div>
    {#if !canTurnOn && !ai.on}<p class="muted small">Paste a key and tick all three boxes to turn it on.</p>{/if}
    {#if !pwa.online}<p class="muted small">You are offline. The AI assistant needs the internet.</p>{/if}
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
  .choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-2); }
  .choice { text-align: left; display: grid; gap: 4px; cursor: pointer; font: inherit; color: inherit; }
  .choice[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }
  .choice b { display: flex; gap: var(--s-2); align-items: center; }
  .state { font-weight: 700; margin: 0; }
  .state[data-state='on'] { color: var(--ok, #2e7d4f); }
  .ok { color: var(--ok, #2e7d4f); }
  .bad, .del { color: var(--bad); }
</style>
