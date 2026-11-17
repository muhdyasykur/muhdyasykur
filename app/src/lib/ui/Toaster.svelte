<script lang="ts">
  import Icon from './Icon.svelte';
  import { toasts, dismiss } from './toast.svelte';
  import { appError, clearError } from '../errors.svelte';
  import { dbHealth } from '../db/health.svelte';
  import { pwa } from '../pwa.svelte';
  import { t, tr } from '../i18n/index.svelte';
  /** All app-wide messages in one stack: errors, a newer version in another tab, an update ready, and notify(). */
</script>

<div class="toaster" aria-live="polite">
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
  {#each toasts.list as x (x.id)}
    <div class="toast {x.kind}" role={x.kind === 'error' ? 'alert' : 'status'} data-toast>
      <span>{x.text}</span>
      {#if x.action}<button class="btn btn-gold" type="button" onclick={() => { x.action?.run(); dismiss(x.id); }}>{x.action.label}</button>{/if}
      {#if x.sticky}<button class="btn btn-text" type="button" onclick={() => dismiss(x.id)} aria-label={tr('Close')}><Icon name="close" size={18} /></button>{/if}
    </div>
  {/each}
</div>

<style>
  .toaster { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--tabbar-h) + var(--s-4) + env(safe-area-inset-bottom, 0px)); z-index: 40; display: grid; gap: var(--s-2); width: max-content; max-width: calc(100vw - 32px); pointer-events: none; }
  .toast { pointer-events: auto; background: var(--card); color: var(--ink); border: 1px solid var(--line); box-shadow: var(--shadow-overlay); border-radius: var(--r-card); padding: var(--s-3) var(--s-4); display: flex; gap: var(--s-4); align-items: center; }
  .toast.err, .toast.error { border-color: var(--bad); border-left-width: 4px; }
  .toast.ok { border-left: 4px solid var(--ok); }
  @media (min-width: 768px) { .toaster { bottom: var(--s-6); } }
  @media (prefers-reduced-motion: no-preference) { .toast { animation: up var(--dur) ease-out; } @keyframes up { from { transform: translateY(12px); opacity: 0; } } }
  @media print { .toaster { display: none; } }
</style>
