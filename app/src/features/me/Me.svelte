<script lang="ts">
  import { t, i18n, setLocale } from '../../lib/i18n/index.svelte';
  import { theme, setTheme, type Theme } from '../../lib/theme.svelte';
  import { requestPersistence } from '../../lib/db/schema';
  import { pwa } from '../../lib/pwa.svelte';
  import { profile, updateProfile } from '../../lib/profile.svelte';
  import ProfileForm from '../../lib/ui/ProfileForm.svelte';
  let savedNote = $state('');

  let persisted = $state<boolean | null>(null);
  let usage = $state<string>('');
  $effect(() => {
    requestPersistence().then((p) => (persisted = p));
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage != null) usage = (e.usage / 1048576).toFixed(1) + ' MB';
    }).catch(() => {});
  });
  const themes: Theme[] = ['system', 'light', 'dark'];
</script>
<div class="stack">
  <h1>{t('me.title')}</h1>

  <section class="card">
    <div class="setting">
      <span id="lang-l">{t('me.language')}</span>
      <div class="seg" role="group" aria-labelledby="lang-l">
        <button type="button" aria-pressed={i18n.locale === 'en'} onclick={() => setLocale('en')}>English</button>
        <button type="button" aria-pressed={i18n.locale === 'ms'} onclick={() => setLocale('ms')}>Bahasa Melayu</button>
      </div>
    </div>
    <div class="setting">
      <span id="theme-l">{t('me.theme')}</span>
      <div class="seg" role="group" aria-labelledby="theme-l">
        {#each themes as th}
          <button type="button" aria-pressed={theme.value === th} onclick={() => setTheme(th)}>{t(`me.theme.${th}`)}</button>
        {/each}
      </div>
    </div>
  </section>

  <section class="card">
    <h3>Profile</h3>
    {#if profile.loaded}
      {#key profile.value?.createdAt}
        <ProfileForm value={profile.value} saveLabel="Save profile" onsave={async (p) => { await updateProfile(p); savedNote = 'Saved.'; }}>
          {#if savedNote}<p class="muted" role="status">{savedNote}</p>{/if}
        </ProfileForm>
      {/key}
    {/if}
  </section>

  <section class="card">
    <h3>{t('me.storage')}</h3>
    <p class="muted">
      {#if persisted === true}{t('me.storage.persisted')}{:else if persisted === false}{t('me.storage.notPersisted')}{:else}{t('common.loading')}{/if}
      {#if usage} · {usage}{/if}
    </p>
    {#if pwa.offlineReady}<p class="chip ok">{t('common.offlineReady')}</p>{/if}
    {#if pwa.canInstall}<button class="btn btn-primary" type="button" onclick={() => pwa.install()}>{t('me.install')}</button>{/if}
  </section>

  <section class="card">
    <h3>{t('me.about')}</h3>
    <p class="muted">{t('me.about.body')}</p>
    <p class="muted small">{t('me.version', { v: __APP_VERSION__ })}</p>
  </section>
</div>
<style>
  .setting { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); flex-wrap: wrap; font-weight: 600; }
  .ok { color: var(--ok); justify-self: start; }
  .small { font-size: var(--t-sm); }
</style>
