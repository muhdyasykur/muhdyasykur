import { registerSW } from 'virtual:pwa-register';

interface InstallPromptEvent extends Event { prompt(): Promise<void> }

let deferred: InstallPromptEvent | null = null;
let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;

export const pwa = $state({
  offlineReady: false,
  needRefresh: false,
  canInstall: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  async install() { if (deferred) { await deferred.prompt(); deferred = null; pwa.canInstall = false; } },
  async refresh() { await applyUpdate?.(true); }
});

export function startPwa() {
  applyUpdate = registerSW({
    onOfflineReady() { pwa.offlineReady = true; },
    onNeedRefresh() { pwa.needRefresh = true; }
  });
  navigator.serviceWorker?.getRegistration().then((r) => { if (r?.active) pwa.offlineReady = true; });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallPromptEvent; pwa.canInstall = true; });
  window.addEventListener('online', () => (pwa.online = true));
  window.addEventListener('offline', () => (pwa.online = false));
}
