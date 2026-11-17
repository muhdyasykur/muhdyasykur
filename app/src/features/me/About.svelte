<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
  import Garden from './Garden.svelte';
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />{tr('Me')}</a>
  <header class="hero">
    <img class="photo" src="{import.meta.env.BASE_URL}developer/yasykur.webp" alt={tr('Muhammad Yasykur bin Muhamad Yasim')} width="240" height="300" />
    <div class="stack tight">
      <p class="eyebrow">{tr('About the developer')}</p>
      <h1>{tr('Muhammad Yasykur bin Muhamad Yasim')}</h1>
      <p class="muted">{tr('PISMP TESL, Year 4 · IPG Kampus Gaya, Kota Kinabalu, Sabah')}</p>
      <div class="row brand"><Logo size={36} /><span><b>{tr('Consilia')}</b> · <i>{tr('Consilium: wise planning, meaningful learning.')}</i></span></div>
    </div>
  </header>

  <article class="card letter">
    <p class="hi">{tr('Hello to everyone using Consilia,')}</p>
    <p>{tr('Thank you, from the bottom of my heart, for giving this app a place in your teaching.')}</p>
    <p>{tr('I\'m Yasykur, a Year 4 PISMP TESL trainee teacher at IPG Kampus Gaya, Kota Kinabalu, Sabah. Consilia started during my first practicum. I still remember the late nights rewriting my lesson plans, trying to make my objectives match the learning standards, and walking into class with activities that looked good on paper but didn\'t quite fit my pupils. Some lessons ran out of time. Some pupils finished in five minutes while others hadn\'t even started. Deep down, I knew I wasn\'t the only one going through this.')}</p>
    <p>{tr('So I asked. Eighteen of my fellow final year trainees shared their practicum stories with me, and so many of them said the same things: too much paperwork, classes with very different abilities, and never enough time.')}</p>
    <p>{tr('As technology keeps growing, I took this chance to build something that could help. Consilia is my small contribution to teachers, educators and trainee teachers like me, so that planning a good lesson takes less time and leaves more energy for what truly matters: our pupils.')}</p>
    <p>{tr('It isn\'t perfect, and it will keep growing with your feedback. If it saves you even one late night, or helps one lesson go a little better, then it has done its job.')}</p>
    <p>{tr('Teach with heart, and keep going.')}</p>
    <p class="sign"><b>{tr('Muhammad Yasykur bin Muhamad Yasim')}</b><br />{tr('PISMP TESL, Year 4 · IPG Kampus Gaya, Kota Kinabalu, Sabah')}</p>
  </article>

  <section class="card stack story">
    <h3>{tr('Where Consilia came from')}</h3>
    <p>{tr('Before a line of code, 18 final-year trainees answered a survey about Practicum 1. Their top three problems were heavy workload (11 of 18), mixed-ability classes (9) and time constraints (7). Every main feature answers one of their stories: the lesson plan builder and alignment checker, Low/Moderate/High differentiation, the pacing coach and Plan B, and Teach mode that keeps working when the internet or power fails.')}</p>
  </section>

  <section class="stack" id="garden">
    <h2>{tr('Feedback Garden')}</h2>
    <Garden />
  </section>
  <p class="muted small">{tr('Consilia {__APP_VERSION__} · Curriculum: KSSR (Semakan 2017), Kementerian Pendidikan Malaysia · Your data stays on this device.', { __APP_VERSION__ })}</p>
</div>

<style>
  .back { justify-self: start; }
  .hero { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--s-6); align-items: center; }
  @media (max-width: 600px) { .hero { grid-template-columns: 1fr; justify-items: start; } }
  .photo { width: 200px; height: 250px; object-fit: cover; border-radius: var(--r-card); box-shadow: var(--shadow-raised); border: 3px solid var(--gold-strong); }
  .tight { gap: var(--s-1); }
  .brand { gap: var(--s-2); margin-top: var(--s-2); }
  .letter { max-width: 68ch; gap: var(--s-3); font-size: 1.02rem; line-height: 1.7; }
  .hi { font-weight: 700; }
  .sign { margin-top: var(--s-2); }
  .story p { max-width: 70ch; }
  .small { font-size: var(--t-sm); }
</style>
