<script lang="ts">
  import { buildLesson } from '../../lib/lesson/create';
  import MaterialsStudio from '../plan/steps/MaterialsStudio.svelte';
  import type { Lesson } from '../../lib/lesson/model';
  import { ctx } from '../../lib/tools/context.svelte';
  import { untrack } from 'svelte';
  /** The materials studio on its own, for printables that are not tied to a lesson plan. */
  let lesson = $state<Lesson>(buildLesson({ mode: 'scratch', year: 4, school: 'SK', date: new Date().toISOString().slice(0, 10), start: '08:00', durationMin: 60 }, { cs: [], ls: [] } as never));
  untrack(() => { lesson.vocabulary = ctx.words; lesson.topic = ctx.topic; });
</script>
<p class="muted">Make printables from your own words. To keep them with an RPH, use the Materials step in the builder instead. Exit tickets and rubrics need objectives, so make those inside a lesson.</p>
<MaterialsStudio bind:lesson />
