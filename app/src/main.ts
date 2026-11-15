import './lib/ui/fonts.css';
import './lib/ui/tokens.css';
import './lib/ui/base.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { startRouter } from './router.svelte';
import { startPwa } from './lib/pwa.svelte';
import { i18n } from './lib/i18n/index.svelte';
import { loadProfile } from './lib/profile.svelte';
import { loadLock, lockNow } from './lib/lock.svelte';

document.documentElement.lang = i18n.locale;
startRouter();
startPwa();
loadProfile();
loadLock();
// Lock pupil data again after the app has been in the background for 5 minutes.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 5 * 60_000) lockNow();
});
mount(App, { target: document.getElementById('app')! });
