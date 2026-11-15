<script lang="ts">
  import { t } from '../../lib/i18n/index.svelte';
</script>
<div class="stack">
  <h1>{t('plan.title')}</h1>
  <section class="empty">
    <h3>{t('plan.empty.title')}</h3>
    <p>{t('plan.empty.body')}</p>
    <span class="chip">{t('common.comingIn', { m: '2–3' })}</span>
  </section>
</div>
