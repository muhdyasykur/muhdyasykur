<script lang="ts">
  import { t } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
</script>
<div class="stack">
  <header class="hello">
    <Logo size={64} animate />
    <div>
      <p class="eyebrow">Consilia</p>
      <h1>{t('today.greeting')}</h1>
      <p class="muted">{t('app.tagline')}</p>
    </div>
  </header>

  <section class="empty">
    <h3>{t('today.empty.title')}</h3>
    <p>{t('today.empty.body')}</p>
    <div class="row">
      <a class="btn btn-gold" href={href('plan', 'new')}><Icon name="plus" size={18} />{t('today.newRph')}</a>
      <a class="btn btn-outline" href={href('library')}><Icon name="library" size={18} />{t('today.openLibrary')}</a>
    </div>
  </section>

  <section class="card">
    <h3>{t('today.status')}</h3>
    <ul class="status">
      <li class="done"><Icon name="check" size={18} /><span>M0 · {t('today.status.m0')}</span></li>
      <li class="done"><Icon name="check" size={18} /><span>M1 · {t('today.status.m1')}</span></li>
      <li class="done"><Icon name="check" size={18} /><span>M2 · {t('today.status.m2')}</span></li>
      <li><span class="dot"></span><span>{t('today.status.next')}</span></li>
    </ul>
  </section>
</div>
<style>
  .hello { display: flex; gap: var(--s-4); align-items: center; flex-wrap: wrap; }
  .status { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .status li { display: flex; gap: var(--s-2); align-items: center; color: var(--ink-2); }
  .status li.done { color: var(--ok); }
  .status li.done span { color: var(--ink); }
  .dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--line); flex: none; }
</style>
