<script lang="ts">
  import { tr } from './lib/i18n/index.svelte';
  import { route, href, type RouteName } from './router.svelte';
  import { t, i18n, type Key } from './lib/i18n/index.svelte';
  import { pwa } from './lib/pwa.svelte';
  import Icon, { type IconName } from './lib/ui/Icon.svelte';
  import Logo from './lib/ui/Logo.svelte';
  import Today from './features/today/Today.svelte';
  import Plan from './features/plan/Plan.svelte';
  import Classes from './features/classes/Classes.svelte';
  import Library from './features/library/Library.svelte';
  import Me from './features/me/Me.svelte';
  import Onboarding from './features/onboarding/Onboarding.svelte';
  import Teach from './features/teach/Teach.svelte';
  import Splash from './lib/ui/Splash.svelte';
  import Tour from './features/help/Tour.svelte';
  import { tour } from './lib/tour.svelte';
  import { pause as pauseMusic, music } from './lib/audio/player.svelte';

  // Splash: at most once a day, never with reduced motion or when opening straight into Teach mode
  const today = new Date().toDateString();
  let splash = $state((() => { try { return localStorage.getItem('consilia.splash') !== today && !matchMedia('(prefers-reduced-motion: reduce)').matches && !location.hash.startsWith('#/teach'); } catch { return false; } })());
  function splashDone() { splash = false; try { localStorage.setItem('consilia.splash', today); } catch { /* ignore */ } }
  // Music never plays during a lesson
  $effect(() => { if (route.name === 'teach' && music.playing) pauseMusic(); });
  import { profile } from './lib/profile.svelte';
  import { appError, clearError } from './lib/errors.svelte';
  import { terms } from './lib/terms.svelte';
  import Terms from './features/onboarding/Terms.svelte';
  import Tools from './features/tools/Tools.svelte';
  import { afterNavigation } from './lib/ui/focus';
  import Recovery from './lib/ui/Recovery.svelte';
  import { dbHealth } from './lib/db/health.svelte';
  const logCrash = (e: unknown) => console.error('Screen failed to render:', e);
  // Page title and focus follow the screen (keyboard and screen-reader users land on the new heading)
  let firstScreen = true;
  $effect(() => { void route.name; void route.parts.join('/'); afterNavigation('Consilia', firstScreen); firstScreen = false; });

  const tabs: { name: RouteName; icon: IconName; label: Key }[] = [
    { name: 'today', icon: 'today', label: 'nav.today' },
    { name: 'plan', icon: 'plan', label: 'nav.plan' },
    { name: 'classes', icon: 'classes', label: 'nav.classes' },
    { name: 'library', icon: 'library', label: 'nav.library' },
    { name: 'tools', icon: 'tools', label: 'nav.tools' },
    { name: 'me', icon: 'me', label: 'nav.me' }
  ];
</script>

<!-- A language change re-creates the screens, so text built in code switches too -->
{#key i18n.locale}
{#if route.name === 'teach' && route.parts[0]}
  {#key route.parts[0]}
    <svelte:boundary onerror={logCrash}>
      <Teach id={route.parts[0]} />
      {#snippet failed(error, reset)}<main class="teach-crash"><Recovery {error} {reset} /></main>{/snippet}
    </svelte:boundary>
  {/key}
{:else}
<a class="skip" href="#main">{tr('Skip to content')}</a>
<div class="shell">
  <nav class="nav" aria-label={tr('Main')}>
    <a class="brand" href={href('today')}>
      <Logo size={36} />
      <span class="word">{tr('Consilia')}</span>
    </a>
    <ul>
      {#each tabs as tab}
        <li>
          <a href={href(tab.name)} aria-current={route.name === tab.name ? 'page' : undefined}>
            <Icon name={tab.icon} /><span>{t(tab.label)}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <main id="main" tabindex="-1">
    {#if !pwa.online}<p class="banner" role="status"><Icon name="offline" size={18} />{t('pwa.offline')}</p>{/if}
    {#key route.name}
      <div class="screen">
        <svelte:boundary onerror={logCrash}>
          {#if route.name === 'today'}<Today />
          {:else if route.name === 'plan'}<Plan />
          {:else if route.name === 'classes'}<Classes />
          {:else if route.name === 'library'}<Library />
          {:else if route.name === 'tools'}<Tools />
          {:else}<Me />{/if}
          {#snippet failed(error, reset)}<Recovery {error} {reset} />{/snippet}
        </svelte:boundary>
      </div>
    {/key}
  </main>
</div>

{/if}

{/key}

{#if terms.accepted && profile.loaded && !profile.value && !profile.skipped && route.name !== 'teach'}<Onboarding />{/if}
{#if terms.accepted && tour.open && route.name !== 'teach'}<Tour />{/if}
{#if !terms.accepted && !splash}<Terms gate />{/if}
{#if splash}<Splash ondone={splashDone} />{/if}

{#if appError.message}
  <div class="toast err" role="alert">
    <span><b>{appError.message}</b> {appError.next}</span>
    <button class="btn btn-outline" type="button" onclick={clearError}>{tr('OK')}</button>
  </div>
{/if}

{#if dbHealth.stale}
  <div class="toast err" role="alert" data-db-stale>
    <span><b>{tr('Consilia was updated in another tab.')}</b> {tr('Reload this tab to keep working; your saved work is safe.')}</span>
    <button class="btn btn-gold" type="button" onclick={() => location.reload()}>{tr('Reload')}</button>
  </div>
{:else if dbHealth.blocked}
  <div class="toast" role="status" data-db-blocked>
    <span><b>{tr('Finishing an update.')}</b> {tr('Close Consilia in your other tabs or windows to continue.')}</span>
  </div>
{/if}

{#if pwa.needRefresh}
  <div class="toast" role="status">
    <span>{t('pwa.update')}</span>
    <button class="btn btn-gold" type="button" onclick={() => pwa.refresh()}>{t('pwa.refresh')}</button>
  </div>
{/if}

<style>
  .teach-crash { padding: var(--s-4); }
  .skip { position: absolute; left: -999px; top: 8px; background: var(--card); padding: 8px 12px; border-radius: 8px; z-index: 50; }
  .skip:focus { left: 8px; }
  .shell { min-height: 100dvh; display: grid; grid-template-columns: var(--rail-w) minmax(0, 1fr); }
  .nav { position: sticky; top: 0; height: 100dvh; border-right: 1px solid var(--line); background: var(--card); padding: var(--s-6) var(--s-3); display: grid; gap: var(--s-6); align-content: start; }
  .brand { display: flex; align-items: center; gap: var(--s-3); text-decoration: none; color: var(--ink); padding: 0 var(--s-2); }
  .word { font: 800 1.35rem var(--f-display); letter-spacing: -.02em; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .nav a[href]:not(.brand) { display: flex; align-items: center; gap: var(--s-3); min-height: var(--tap); padding: 0 var(--s-3); border-radius: var(--r-ctl); color: var(--ink-2); text-decoration: none; font-weight: 600; font-size: var(--t-sm); }
  .nav a[href]:not(.brand):hover { background: var(--sunken); color: var(--ink); }
  .nav a[aria-current='page'] { background: var(--sunken); color: var(--navy) !important; box-shadow: inset 3px 0 0 var(--gold-strong); }
  main { min-width: 0; outline: none; padding: var(--s-8) max(var(--s-4), env(safe-area-inset-right, 0px)) var(--s-12) max(var(--s-4), env(safe-area-inset-left, 0px)); }
  .screen { max-width: 1040px; margin: 0 auto; }
  @media (prefers-reduced-motion: no-preference) {
    .screen { animation: enter var(--dur) ease-out; }
    @keyframes enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  }
  .banner { display: flex; gap: var(--s-2); align-items: center; max-width: 1040px; margin: 0 auto var(--s-4); background: var(--gold-soft); color: var(--ink); border-radius: var(--r-ctl); padding: var(--s-2) var(--s-3); font-size: var(--t-sm); font-weight: 600; }
  .toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--tabbar-h) + var(--s-4) + env(safe-area-inset-bottom, 0px)); background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow-overlay); border-radius: var(--r-card); padding: var(--s-3) var(--s-4); display: flex; gap: var(--s-4); align-items: center; z-index: 40; max-width: calc(100vw - 32px); }

  /* Phone: bottom tab bar */
  @media (max-width: 767px) {
    .shell { grid-template-columns: 1fr; }
    .nav { position: fixed; inset: auto 0 0 0; height: auto; z-index: 30; border-right: 0; border-top: 1px solid var(--line); padding: 0 0 env(safe-area-inset-bottom, 0px); display: block; }
    .brand { display: none; }
    ul { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0; }
    .nav a[href]:not(.brand) { flex-direction: column; justify-content: center; gap: 2px; height: var(--tabbar-h); padding: 0; border-radius: 0; font-size: 0.6875rem; }
    .nav a[aria-current='page'] { background: transparent; box-shadow: inset 0 3px 0 var(--gold-strong); }
    main { padding-top: calc(var(--s-6) + env(safe-area-inset-top, 0px)); padding-bottom: calc(var(--tabbar-h) + var(--s-8) + env(safe-area-inset-bottom, 0px)); }
  }
  .toast.err { border-color: var(--bad); border-left-width: 4px; }
  @media (min-width: 768px) { .toast { bottom: var(--s-6); } }
  @media print {
    .nav, .toast, .banner, .skip { display: none !important; }
    .shell { display: block; min-height: 0; }
    main { padding: 0 !important; }
    .screen { max-width: none; animation: none; }
  }
</style>
