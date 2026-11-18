<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';
  import ClayIcon from '../../lib/ui/ClayIcon.svelte';
  import type { IconName } from '../../lib/ui/icons';
  import { closePanel } from '../../lib/ui/shell.svelte';
  /** The round + button: the things a teacher starts most, one tap away from any screen. */
  type Tone = 'blue' | 'teal' | 'gold' | 'coral' | 'green' | 'purple' | 'navy';
  const ITEMS: { id: string; icon: IconName; tone: Tone; title: string; sub: string; to: string }[] = [
    { id: 'new', icon: 'plan', tone: 'blue', title: tr('New lesson plan'), sub: tr('From the Scheme of Work, standards or scratch'), to: href('plan', 'new') },
    { id: 'recommend', icon: 'sparkle', tone: 'gold', title: tr('Let Consilia plan it'), sub: tr('A whole lesson for your class, offline'), to: href('plan', 'new', 'recommend') },
    { id: 'writer', icon: 'prompt', tone: 'purple', title: tr('Lesson plan writer'), sub: tr('Write it with AI, then open it in the builder'), to: href('tools', 'lesson-plan') },
    { id: 'quiz', icon: 'help', tone: 'coral', title: tr('A quiz'), sub: tr('Print it or play it as a Quiz show'), to: href('tools', 'quiz') },
    { id: 'text', icon: 'book', tone: 'teal', title: tr('A reading text'), sub: tr('At your pupils\' level, with questions'), to: href('tools', 'text') },
    { id: 'worksheet', icon: 'sheet', tone: 'green', title: tr('A worksheet'), sub: tr('Gap-fill, matching, flashcards, offline'), to: href('tools', 'worksheets') },
    { id: 'game', icon: 'game', tone: 'purple', title: tr('A game for the projector'), sub: tr('Spin wheel, Unjumble, Quiz show'), to: href('tools', 'games') },
    { id: 'attendance', icon: 'check', tone: 'teal', title: tr('Take attendance'), sub: tr('Choose a class'), to: href('classes') },
    { id: 'day', icon: 'day', tone: 'navy', title: tr('My day'), sub: tr('Today\'s periods and notes'), to: href('plan', 'day') },
    { id: 'parents', icon: 'home', tone: 'coral', title: tr('Message to parents'), sub: tr('WhatsApp or letter, Malay or English'), to: href('tools', 'parents') }
  ];
</script>

<Sheet title={tr('Create')} onclose={closePanel} wide>
  <ul class="grid">
    {#each ITEMS as it (it.id)}
      <li><a href={it.to} onclick={closePanel} data-create={it.id}><ClayIcon name={it.icon} tone={it.tone} size={48} /><span class="t"><b>{it.title}</b><span class="muted small">{it.sub}</span></span></a></li>
    {/each}
  </ul>
</Sheet>

<style>
  .grid { list-style: none; margin: var(--s-3) 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: var(--s-2); }
  a { display: flex; gap: var(--s-3); align-items: center; min-height: 72px; padding: var(--s-2) var(--s-3); border-radius: var(--r-card); background: var(--card); border: 1px solid var(--line); color: var(--ink); text-decoration: none; transition: transform var(--dur-fast), border-color var(--dur-fast); }
  a:hover { border-color: var(--blue); transform: translateY(-2px); }
  .t { display: grid; gap: 2px; min-width: 0; }
</style>
