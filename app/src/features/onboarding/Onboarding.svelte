<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { trapFocus } from '../../lib/ui/focus';
  import { i18n, setLocale } from '../../lib/i18n/index.svelte';
  import { theme, setTheme, type Theme } from '../../lib/theme.svelte';
  import { profile, updateProfile, skipOnboarding } from '../../lib/profile.svelte';
  import ProfileForm from '../../lib/ui/ProfileForm.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
  import { startTour, tourDone } from '../../lib/tour.svelte';
  async function save(p: Parameters<typeof updateProfile>[0]) { await updateProfile(p); if (!tourDone()) startTour(); }
  function skip() { skipOnboarding(); if (!tourDone()) startTour(); }
  const themes: Theme[] = ['system', 'light', 'dark'];
</script>

<div class="wrap" role="dialog" aria-modal="true" aria-labelledby="ob-title" use:trapFocus={{ initial: '#pf-name' }}>
  <div class="panel stack">
    <header class="row head">
      <Logo size={56} animate />
      <div>
        <h1 id="ob-title">{tr('Welcome to Consilia')}</h1>
        <p class="muted"><i>{tr('Consilium: wise planning, meaningful learning.')}</i></p>
      </div>
    </header>
    <div class="row prefs">
      <div class="seg" role="group" aria-label={tr('Language')}>
        <button type="button" aria-pressed={i18n.locale === 'en'} onclick={() => setLocale('en')}>{tr('English')}</button>
        <button type="button" aria-pressed={i18n.locale === 'ms'} onclick={() => setLocale('ms')}>{tr('Bahasa Melayu')}</button>
      </div>
      <div class="seg" role="group" aria-label={tr('Theme')}>
        {#each themes as th}<button type="button" aria-pressed={theme.value === th} onclick={() => setTheme(th)}>{th[0].toUpperCase() + th.slice(1)}</button>{/each}
      </div>
    </div>
    <p>{tr('Tell Consilia a little about your practicum. These details fill the header of every lesson plan. Everything stays on this device.')}</p>
    <ProfileForm value={profile.value} saveLabel={tr('Start planning')} onsave={save}>
      <p class="muted small">{tr('You can change this later in Me.')}</p>
    </ProfileForm>
    <button class="btn btn-text skip" type="button" onclick={skip}>{tr('Skip for now')}</button>
  </div>
</div>

<style>
  .wrap { position: fixed; inset: 0; z-index: 60; background: var(--paper); overflow-y: auto; padding: max(var(--s-6), env(safe-area-inset-top, 0px)) max(var(--s-4), env(safe-area-inset-right, 0px)) var(--s-12) max(var(--s-4), env(safe-area-inset-left, 0px)); }
  .panel { max-width: 760px; margin: 0 auto; }
  .head { gap: var(--s-4); flex-wrap: nowrap; }
  .prefs { gap: var(--s-3); }
  .small { font-size: var(--t-sm); }
  .skip { justify-self: start; }
</style>
