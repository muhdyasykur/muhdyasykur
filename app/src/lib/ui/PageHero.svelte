<script lang="ts">
  import type { Snippet } from 'svelte';
  import Scene, { type SceneName } from './art/Scene.svelte';
  /**
   * The top of a main screen in the new look: an eyebrow pill, the screen's title (the page's only h1), a handwritten
   * accent line, a sentence, actions, and an illustration on a soft sky gradient.
   */
  let { title, eyebrow = '', script = '', sub = '', scene = 'plan', tone = 'sky', actions, children }:
    { title: string; eyebrow?: string; script?: string; sub?: string; scene?: SceneName; tone?: 'sky' | 'mint' | 'peach' | 'lilac'; actions?: Snippet; children?: Snippet } = $props();
</script>
<header class="ph {tone}">
  <div class="txt">
    {#if eyebrow}<p class="pill">{eyebrow}</p>{/if}
    <h1>{title}</h1>
    {#if script}<p class="script accent">{script}</p>{/if}
    {#if sub}<p class="sub">{sub}</p>{/if}
    {#if actions}<div class="row acts">{@render actions()}</div>{/if}
    {@render children?.()}
  </div>
  <div class="art"><Scene name={scene} /></div>
</header>
<style>
  .ph { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(150px, 260px); gap: var(--s-4); align-items: center; padding: var(--s-6) var(--s-6) var(--s-4); border-radius: var(--r-xl); overflow: hidden; }
  .sky { background: linear-gradient(135deg, var(--sky-1), var(--sky-2) 70%); --scene-blob: rgba(255, 255, 255, .55); }
  .mint { background: linear-gradient(135deg, var(--teal-soft), var(--sky-2) 75%); --scene-blob: rgba(255, 255, 255, .55); }
  .peach { background: linear-gradient(135deg, var(--coral-soft), var(--gold-soft) 80%); --scene-blob: rgba(255, 255, 255, .55); }
  .lilac { background: linear-gradient(135deg, var(--tint-purple), var(--sky-2) 80%); --scene-blob: rgba(255, 255, 255, .5); }
  .txt { display: grid; gap: var(--s-2); justify-items: start; min-width: 0; }
  .pill { font-size: var(--t-xs); font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ink); background: var(--card); padding: 4px 12px; border-radius: var(--r-pill); box-shadow: var(--shadow-raised); }
  h1 { font-size: clamp(2rem, 4.2vw, 2.8rem); line-height: 1.05; }
  .accent { font-size: clamp(1.7rem, 3.4vw, 2.3rem); line-height: 1; margin-top: -4px; }
  .sub { color: var(--ink-2); max-width: 52ch; }
  .acts { margin-top: var(--s-2); }
  .art { align-self: end; }
  @media (max-width: 599px) {
    .ph { grid-template-columns: minmax(0, 1fr) 110px; padding: var(--s-4); gap: var(--s-2); }
    .art { align-self: start; }
  }
</style>
