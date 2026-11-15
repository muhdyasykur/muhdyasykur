<script lang="ts">
  import { href } from '../../router.svelte';
  import { startTour } from '../../lib/tour.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  const topics: [string, string][] = [
    ['Plan a lesson', 'Plan → New RPH. Choose your class, date and time, then how to start: follow a SoW lesson, keep its standards with your own activities, or start from scratch. Work through the seven steps; Consilia saves as you type. The score ring shows what still needs attention.'],
    ['Write objectives', 'Use the four ABCD boxes. The S, M, A, R and T squares turn green when the objective is specific, measurable, achievable, relevant and time-bound. "Understand" and "with minimal support" cannot be measured, so Consilia asks for a verb you can see and a number.'],
    ['Teach', 'Press ▶ Teach on a lesson. Take attendance, start the clock, and use Next for each stage. The toolkit has a name picker, groups, a noise meter, points, an attention signal, a timer and your textbook. Press and hold Exit to leave.'],
    ['Record PBD', 'At the end of Teach mode, tap Record PBD, then tap TP1–TP6 for each pupil. Classes → your class → PBD progress shows the heatmap and suggested levels.'],
    ['Textbooks', 'Library → Textbooks. Add your own PDF once per book; it stays on this device. Search by page, unit or topic. Page references in a lesson open the book.'],
    ['Back up', 'Me → Backup. Save one file to Google Drive, WhatsApp or your laptop every week. Restoring it on any device brings everything back, except textbook PDFs, which you add again.'],
    ['Privacy', 'Consilia has no server and no account. Everything stays on this device. Only feedback you choose to send leaves it. A PIN encrypts pupil names; a forgotten PIN cannot be recovered.']
  ];
</script>
<div class="stack">
  <a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />Me</a>
  <h1>Help</h1>
  <div class="row"><button id="help-tour" class="btn btn-gold" type="button" onclick={startTour}>Replay the guided tour</button></div>
  {#each topics as [t, b]}<details class="card"><summary><b>{t}</b></summary><p>{b}</p></details>{/each}
  <p class="muted small">Short video tutorials and the full manual arrive with the final release (milestone 7).</p>
</div>
<style>.back { justify-self: start; } summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; } .small { font-size: var(--t-sm); }</style>
