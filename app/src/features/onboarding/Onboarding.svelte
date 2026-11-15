<script lang="ts">
  import { i18n, setLocale } from '../../lib/i18n/index.svelte';
  import { theme, setTheme, type Theme } from '../../lib/theme.svelte';
  import { profile, updateProfile, skipOnboarding } from '../../lib/profile.svelte';
  import ProfileForm from '../../lib/ui/ProfileForm.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
  const themes: Theme[] = ['system', 'light', 'dark'];
</script>

<div class="wrap" role="dialog" aria-modal="true" aria-labelledby="ob-title">
  <div class="panel stack">
    <header class="row head">
      <Logo size={56} animate />
      <div>
        <h1 id="ob-title">Welcome to Consilia</h1>
        <p class="muted"><i>Consilium: wise planning, meaningful learning.</i></p>
      </div>
    </header>
    <div class="row prefs">
      <div class="seg" role="group" aria-label="Language">
        <button type="button" aria-pressed={i18n.locale === 'en'} onclick={() => setLocale('en')}>English</button>
        <button type="button" aria-pressed={i18n.locale === 'ms'} onclick={() => setLocale('ms')}>Bahasa Melayu</button>
      </div>
      <div class="seg" role="group" aria-label="Theme">
        {#each themes as th}<button type="button" aria-pressed={theme.value === th} onclick={() => setTheme(th)}>{th[0].toUpperCase() + th.slice(1)}</button>{/each}
      </div>
    </div>
    <p>Tell Consilia a little about your practicum. These details fill the header of every RPH. Everything stays on this device.</p>
    <ProfileForm value={profile.value} saveLabel="Start planning" onsave={updateProfile}>
      <p class="muted small">You can change this later in Me.</p>
    </ProfileForm>
    <button class="btn btn-text skip" type="button" onclick={skipOnboarding}>Skip for now</button>
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
