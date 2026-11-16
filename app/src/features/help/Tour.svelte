<script lang="ts">
  import { tour, endTour } from '../../lib/tour.svelte';
  import { go } from '../../router.svelte';

  /** Nine short steps that highlight the real controls. Works on phone (bottom bar) and laptop (side rail). */
  const steps: { target?: string; route?: Parameters<typeof go>; title: string; body: string }[] = [
    { title: 'Welcome to Consilia', body: 'A quick tour of the six places you will use. It takes under a minute. You can replay it any time from Me → Help.' },
    { target: 'a[href="#/today"]', route: ['today'], title: 'Today', body: 'Your next lesson, what still needs planning, and reminders to reflect and back up.' },
    { target: 'a[href="#/plan"]', route: ['plan'], title: 'Plan', body: 'Every lesson plan you make, your weekly timetable, and sharing lessons with friends.' },
    { target: '.btn-gold[href="#/plan/new"]', route: ['plan'], title: 'New lesson plan', body: 'Let Consilia recommend a whole lesson, follow a Scheme of Work lesson, keep its standards with your own activities, or plan from scratch. Consilia checks alignment as you go.' },
    { target: 'a[href="#/classes"]', route: ['classes'], title: 'Classes', body: 'Paste your pupil lists, record TP levels after teaching and see who needs support.' },
    { target: 'a[href="#/library"]', route: ['library'], title: 'Library', body: 'The full KSSR Scheme of Work, DSKP standards, your textbooks, the activity bank and the Method Guide. All offline.' },
    { target: 'a[href="#/tools"]', route: ['tools'], title: 'Tools', body: 'Let Consilia plan a whole lesson for your class, play projector games made from your words, find teaching aids with step-by-step making guides, and write prompts for AI.' },
    { target: 'a[href="#/me"]', route: ['me'], title: 'Me', body: 'Your profile, PIN lock, background music, backups, help and the Feedback Garden.' },
    { title: 'You are ready', body: 'Plan your first lesson. When you teach, press ▶ Teach for the stage timer and classroom tools.' }
  ];
  let rect = $state<DOMRect | null>(null);
  const cur = $derived(steps[tour.step]);
  function place() {
    const el = cur.target ? [...document.querySelectorAll(cur.target)].find((e) => (e as HTMLElement).offsetParent !== null) as HTMLElement | undefined : undefined;
    rect = el ? el.getBoundingClientRect() : null;
  }
  $effect(() => {
    void tour.step;
    if (cur.route) go(...cur.route);
    const t = setTimeout(place, 250);
    addEventListener('resize', place);
    return () => { clearTimeout(t); removeEventListener('resize', place); };
  });
  $effect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') endTour(); if (e.key === 'ArrowRight') nextStep(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); });
  function nextStep() { if (tour.step < steps.length - 1) tour.step++; else { endTour(); go('today'); } }
  const below = $derived(!rect || rect.top < innerHeight / 2);
</script>

<div class="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
  {#if rect}<div class="hole" style="left:{rect.left - 6}px;top:{rect.top - 6}px;width:{rect.width + 12}px;height:{rect.height + 12}px"></div>{:else}<div class="dim"></div>{/if}
  <div class="bubble" class:centre={!rect} style={rect ? (below ? `top:${Math.min(innerHeight - 220, rect.bottom + 14)}px;` : `bottom:${innerHeight - rect.top + 14}px;`) + `left:${Math.max(12, Math.min(innerWidth - 332, rect.left))}px` : ''}>
    <p class="eyebrow">Step {tour.step + 1} of {steps.length}</p>
    <h3 id="tour-title">{cur.title}</h3>
    <p>{cur.body}</p>
    <div class="row">
      <button class="btn btn-text" type="button" onclick={() => endTour()}>Skip tour</button>
      {#if tour.step > 0}<button class="btn btn-outline" type="button" onclick={() => tour.step--}>Back</button>{/if}
      <button id="tour-next" class="btn btn-gold" type="button" onclick={nextStep}>{tour.step === steps.length - 1 ? 'Start planning' : 'Next'}</button>
    </div>
  </div>
</div>

<style>
  .tour { position: fixed; inset: 0; z-index: 80; }
  .dim { position: absolute; inset: 0; background: rgba(8, 16, 32, .6); }
  .hole { position: absolute; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(8, 16, 32, .6); outline: 3px solid var(--gold-strong); transition: all .25s ease; pointer-events: none; }
  .bubble { position: absolute; width: min(320px, calc(100vw - 24px)); background: var(--card); color: var(--ink); border-radius: var(--r-card); padding: var(--s-4); box-shadow: var(--shadow-overlay); display: grid; gap: var(--s-2); }
  .bubble.centre { left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .row { justify-content: flex-end; }
</style>
