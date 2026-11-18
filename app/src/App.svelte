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
  import { terms } from './lib/terms.svelte';
  import Terms from './features/onboarding/Terms.svelte';
  import Tools from './features/tools/Tools.svelte';
  import { afterNavigation } from './lib/ui/focus';
  import Recovery from './lib/ui/Recovery.svelte';
  import Toaster from './lib/ui/Toaster.svelte';
  import CreateSheet from './features/shell/CreateSheet.svelte';
  import SearchSheet from './features/shell/SearchSheet.svelte';
  import { shell, openPanel, installShortcuts } from './lib/ui/shell.svelte';
  const logCrash = (e: unknown) => console.error('Screen failed to render:', e);
  // Page title and focus follow the screen (keyboard and screen-reader users land on the new heading)
  $effect(() => installShortcuts());
  // close the panels when the screen changes
  $effect(() => { void route.name; void route.parts.join('/'); shell.panel = ''; });
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
  <header class="topbar">
    <a class="tbrand" href={href('today')}><Logo size={32} /><span class="word">{tr('Consilia')}</span></a>
    <button class="tsearch" type="button" onclick={() => openPanel('search')} aria-label={tr('Search')} data-open="search-phone"><Icon name="search" size={20} /></button>
  </header>
  <nav class="nav" aria-label={tr('Main')}>
    <a class="brand" href={href('today')}>
      <Logo size={44} />
      <span class="word">{tr('Consilia')}</span>
    </a>
    <ul>
      {#each tabs as tab}
        <li>
          <a href={href(tab.name)} aria-current={route.name === tab.name ? 'page' : undefined}>
            <span class="ic"><Icon name={tab.icon} /></span><span class="lbl">{t(tab.label)}</span>
          </a>
        </li>
      {/each}
    </ul>
    <div class="extra">
      <button class="tile search" type="button" onclick={() => openPanel('search')} data-open="search"><span class="ic"><Icon name="search" /></span><span class="lbl">{tr('Search')}</span></button>
    </div>
    <button class="fab" type="button" onclick={() => openPanel('create')} aria-label={tr('Create')} data-open="create"><Icon name="plus" size={26} /><span class="lbl">{tr('Create')}</span></button>
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

{#if shell.panel === 'create'}<CreateSheet />{:else if shell.panel === 'search'}<SearchSheet />{/if}
<Toaster />

<style>
  .teach-crash { padding: var(--s-4); }
  .skip { position: absolute; left: -999px; top: 8px; background: var(--card); padding: 8px 12px; border-radius: 8px; z-index: 50; }
  .skip:focus { left: 8px; }
  .shell { min-height: 100dvh; display: grid; grid-template-columns: var(--rail-w) minmax(0, 1fr); }
  .topbar { display: none; }
  /* Laptop: a rail of rounded pill tiles (the island-app look) */
  .nav { position: sticky; top: 0; height: 100dvh; overflow-y: auto; scrollbar-width: none; padding: var(--s-4) var(--s-2) var(--s-4); display: flex; flex-direction: column; align-items: center; gap: var(--s-3); }
  .brand { order: -2; display: grid; justify-items: center; gap: 2px; text-decoration: none; color: var(--ink); padding-bottom: var(--s-2); }
  .word { font: 800 .95rem var(--f-display); letter-spacing: -.02em; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .nav a[href]:not(.brand), .tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 80px; height: 74px; border-radius: 22px; border: 1px solid var(--line); background: var(--card); color: var(--ink-2); text-decoration: none; font: 700 .75rem var(--f-body); cursor: pointer; box-shadow: var(--shadow-raised); transition: transform var(--dur-fast), background var(--dur-fast); }
  .nav a[href]:not(.brand):hover, .tile:hover { transform: translateY(-2px); color: var(--ink); }
  .nav a[href][aria-current='page']:not(.brand) { background: linear-gradient(160deg, var(--navy-2), var(--navy)); border-color: transparent; color: var(--on-navy); box-shadow: 0 14px 28px -14px var(--navy); }
  .nav a[href][aria-current='page']:not(.brand) .ic { color: var(--gold-strong); }
  .extra { display: grid; gap: var(--s-2); }
  .tile { box-shadow: none; background: transparent; border-style: dashed; }
  .fab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; width: 80px; height: 74px; border: 0; border-radius: 22px; background: linear-gradient(160deg, #F2CB62, var(--gold-strong)); color: var(--on-gold); font: 800 .75rem var(--f-body); cursor: pointer; box-shadow: 0 16px 30px -14px #B07A12; order: -1; }
  .fab:hover { transform: translateY(-2px); }
  main { min-width: 0; outline: none; padding: var(--s-6) max(var(--s-6), env(safe-area-inset-right, 0px)) var(--s-12) max(var(--s-4), env(safe-area-inset-left, 0px)); }
  .screen { max-width: 1120px; margin: 0 auto; }
  @media (prefers-reduced-motion: no-preference) {
    .screen { animation: enter var(--dur) ease-out; }
    @keyframes enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  }
  .banner { display: flex; gap: var(--s-2); align-items: center; max-width: 1120px; margin: 0 auto var(--s-4); background: var(--gold-soft); color: var(--ink); border-radius: var(--r-ctl); padding: var(--s-2) var(--s-3); font-size: var(--t-sm); font-weight: 600; }

  /* Phone: a top bar with search, and a tab bar with a round Create button in the middle */
  @media (max-width: 767px) {
    .shell { grid-template-columns: 1fr; }
    .topbar { display: flex; position: sticky; top: 0; z-index: 25; align-items: center; justify-content: space-between; gap: var(--s-2); padding: calc(var(--s-2) + env(safe-area-inset-top, 0px)) var(--s-4) var(--s-2); background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(10px); }
    .tbrand { display: flex; align-items: center; gap: var(--s-2); color: var(--ink); text-decoration: none; }
    .tbrand .word { font-size: 1.15rem; }
    .tsearch { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); color: var(--ink); display: grid; place-items: center; cursor: pointer; }
    .nav { position: fixed; inset: auto 0 0 0; height: auto; overflow: visible; z-index: 30; padding: 0 var(--s-2) env(safe-area-inset-bottom, 0px); display: block; background: var(--card); border-top: 1px solid var(--line); box-shadow: 0 -10px 30px -18px rgba(19, 41, 75, .35); border-radius: 22px 22px 0 0; }
    .brand, .extra { display: none; }
    ul { grid-template-columns: repeat(3, minmax(0, 1fr)) 72px repeat(3, minmax(0, 1fr)); gap: 0; }
    li:nth-child(4) { grid-column: 5; }
    .nav a[href]:not(.brand) { width: auto; height: var(--tabbar-h); border: 0; border-radius: 14px; background: transparent; box-shadow: none; font-size: .66rem; gap: 2px; }
    .nav a[href][aria-current='page']:not(.brand) { background: var(--blue-soft); color: var(--blue); box-shadow: none; }
    .nav a[href][aria-current='page']:not(.brand) .ic { color: var(--blue); }
    .fab { position: absolute; left: 50%; top: -22px; transform: translateX(-50%); width: 62px; height: 62px; border-radius: 50%; border: 4px solid var(--paper); box-shadow: 0 14px 26px -10px #B07A12; }
    .fab:hover { transform: translateX(-50%) translateY(-2px); }
    .fab .lbl { display: none; }
    main { padding-top: var(--s-4); padding-bottom: calc(var(--tabbar-h) + var(--s-12) + env(safe-area-inset-bottom, 0px)); }
  }
  @media print {
    .nav, .topbar, .banner, .skip { display: none !important; }
    .shell { display: block; min-height: 0; }
    main { padding: 0 !important; }
    .screen { max-width: none; animation: none; }
  }
</style>
