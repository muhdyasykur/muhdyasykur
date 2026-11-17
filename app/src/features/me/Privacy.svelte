<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { i18n } from '../../lib/i18n/index.svelte';
  import { PRIVACY } from '../../lib/content/privacy';
  import Icon from '../../lib/ui/Icon.svelte';
  /** Plain-language privacy page; its own EN/BM switch so a teacher can show either version to a head teacher. */
  let lang = $state<'en' | 'ms'>(i18n.locale === 'ms' ? 'ms' : 'en');
  const p = $derived(PRIVACY[lang]);
</script>

<article class="stack" lang={lang}>
  <a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />{tr('Me')}</a>
  <div class="head">
    <h1>{p.title}</h1>
    <div class="seg" role="group" aria-label={tr('Language')}>
      <button type="button" aria-pressed={lang === 'en'} onclick={() => (lang = 'en')}>{tr('English')}</button>
      <button type="button" aria-pressed={lang === 'ms'} onclick={() => (lang = 'ms')}>{tr('Bahasa Melayu')}</button>
    </div>
  </div>
  <p class="lead">{p.lead}</p>
  {#each p.sections as s}
    <section class="card stack tight"><h2>{s.h}</h2>{#each s.p as para}<p>{para}</p>{/each}</section>
  {/each}
  <p class="muted small">{p.updated}</p>
</article>

<style>
  .back { justify-self: start; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); flex-wrap: wrap; }
  .lead { font-size: var(--t-lg, 1.125rem); max-width: 65ch; }
  h2 { font-size: var(--t-lg, 1.125rem); margin: 0; }
  .tight { gap: var(--s-2); }
  p { max-width: 70ch; margin: 0; }
  .small { font-size: var(--t-sm); }
</style>
