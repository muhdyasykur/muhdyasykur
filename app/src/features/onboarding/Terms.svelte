<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { TERMS } from '../../lib/content/terms';
  import { acceptTerms, terms } from '../../lib/terms.svelte';
  import { i18n } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { trapFocus } from '../../lib/ui/focus';

  /** `gate`: the full-screen agreement before first use. Otherwise: the read-only page in Me → Terms of use. */
  let { gate = false }: { gate?: boolean } = $props();
  let lang = $state<'en' | 'ms'>(i18n.locale === 'ms' ? 'ms' : 'en');
  const t = $derived(TERMS[lang]);
  let ticks = $state([false, false, false]);
  const ready = $derived(ticks.every(Boolean));
</script>

<div class={gate ? 'gate' : ''} role={gate ? 'dialog' : undefined} aria-modal={gate ? 'true' : undefined} aria-labelledby="terms-title" use:trapFocus={{ enabled: gate }}>
  <article class="stack terms" lang={lang}>
    {#if gate}<div class="brand"><Logo size={40} /><span>Consilia</span></div>{:else}<a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />{tr('Me')}</a>{/if}
    <div class="head">
      <h1 id="terms-title">{gate ? t.title : lang === 'ms' ? 'Terma penggunaan' : 'Terms of use'}</h1>
      <div class="seg" role="group" aria-label={tr('Language')}>
        <button type="button" aria-pressed={lang === 'en'} onclick={() => (lang = 'en')}>English</button>
        <button type="button" aria-pressed={lang === 'ms'} onclick={() => (lang = 'ms')}>Bahasa Melayu</button>
      </div>
    </div>
    <p class="lead">{t.lead}</p>
    {#each t.sections as s}<section class="card stack tight"><h2>{s.h}</h2>{#each s.p as p}<p>{p}</p>{/each}</section>{/each}
    {#if gate}
      <fieldset class="card stack agree">
        <legend class="sr-only">{lang === 'ms' ? 'Pengakuan' : 'Agreement'}</legend>
        {#each t.agree as a, i}<label class="tick"><input type="checkbox" bind:checked={ticks[i]} data-agree={i} /><span>{a}</span></label>{/each}
        <button id="terms-accept" class="btn btn-gold" type="button" disabled={!ready} onclick={acceptTerms}>{t.button}</button>
        {#if !ready}<p class="muted small" aria-live="polite">{lang === 'ms' ? 'Tandakan ketiga-tiga kotak untuk bermula.' : 'Tick all three boxes to begin.'}</p>{/if}
      </fieldset>
      <a class="small" href={href('me', 'privacy')} target="_blank" rel="noopener">{t.read}</a>
    {:else}
      <p class="muted small">{t.updated}{terms.at ? ` · ${lang === 'ms' ? 'Anda bersetuju pada' : 'You agreed on'} ${new Date(terms.at).toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</p>
    {/if}
  </article>
</div>

<style>
  .gate { position: fixed; inset: 0; z-index: 60; background: var(--paper); overflow-y: auto; padding: var(--s-6) var(--s-4) var(--s-12); }
  .gate .terms { max-width: 760px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: var(--s-2); font: 800 var(--t-lg) var(--f-display); color: var(--navy); }
  .back { justify-self: start; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); flex-wrap: wrap; }
  .lead { font-size: var(--t-lg); max-width: 65ch; margin: 0; }
  h2 { font-size: var(--t-lg); margin: 0; }
  p { margin: 0; max-width: 70ch; }
  .tight { gap: var(--s-2); }
  .agree { border: 2px solid var(--gold-strong); }
  .tick { display: grid; grid-template-columns: auto 1fr; gap: var(--s-3); align-items: start; min-height: var(--tap); cursor: pointer; font-weight: 600; }
  .tick input { margin-top: 3px; }
  #terms-accept { justify-self: start; }
  .small { font-size: var(--t-sm); }
</style>
