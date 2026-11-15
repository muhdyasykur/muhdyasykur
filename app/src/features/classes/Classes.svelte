<script lang="ts">
  import { t } from '../../lib/i18n/index.svelte';
</script>
<div class="stack">
  <h1>{t('classes.title')}</h1>
  <section class="empty">
    <h3>{t('classes.empty.title')}</h3>
    <p>{t('classes.empty.body')}</p>
    <span class="chip">{t('common.comingIn', { m: '4' })}</span>
  </section>
</div>
