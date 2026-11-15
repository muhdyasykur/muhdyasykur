import './lib/ui/fonts.css';
import './lib/ui/tokens.css';
import './lib/ui/base.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { startRouter } from './router.svelte';
import { startPwa } from './lib/pwa.svelte';
import { i18n } from './lib/i18n/index.svelte';

document.documentElement.lang = i18n.locale;
startRouter();
startPwa();
mount(App, { target: document.getElementById('app')! });
