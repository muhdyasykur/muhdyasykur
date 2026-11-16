<script lang="ts">
  import { THEMES, PATTERN_LABEL, type Slide, type Theme } from '../../lib/slides/deck';
  /** One slide drawn at any size (16:9, text scales with the box): thumbnails, the editor preview and the projector. */
  let { slide, theme = 'consilia', n = 0, total = 0, reveal = false }: { slide: Slide; theme?: Theme; n?: number; total?: number; reveal?: boolean } = $props();
  const th = $derived(THEMES[theme] ?? THEMES.consilia);
  const big = $derived(slide.kind === 'title' || slide.kind === 'end');
  const list = $derived(['activity', 'warmup', 'exit', 'goals', 'criteria'].includes(slide.kind));
  const numbered = $derived(slide.kind === 'activity' || slide.kind === 'warmup');
  const centred = $derived(slide.kind === 'words' || slide.kind === 'question');
  const chars = $derived(slide.lines.join(' ').length + slide.lines.length * 20);
  const cols = $derived(slide.kind === 'words' && slide.lines.length > 6 && slide.lines.every((x) => x.length < 22));
  // fit by length and by number of lines (the card is about 35 units tall)
  const rows = $derived(cols ? Math.ceil(slide.lines.length / 2) : slide.lines.length);
  const byLen = $derived(slide.kind === 'words' ? 4.4 : chars > 520 ? 2.1 : chars > 380 ? 2.4 : chars > 260 ? 2.9 : chars > 160 ? 3.4 : slide.kind === 'question' ? 4.6 : slide.kind === 'pattern' ? 4.2 : 3.9);
  const size = $derived(Math.max(1.8, Math.min(byLen, 30 / (Math.max(1, rows) * 1.78))));
  const tag = $derived([slide.pattern && PATTERN_LABEL[slide.pattern], slide.minutes && slide.kind !== 'question' ? `⏱ ${slide.minutes} min` : ''].filter(Boolean).join('   '));
</script>

<div class="slide" class:big style="--bg:{th.bg};--ink:{th.ink};--accent:{th.accent};--card:{th.card};--title:{th.title}" data-kind={slide.kind}>
  {#if big}
    <div class="bigtext"><h2>{slide.title}</h2>{#each slide.lines as l}<p>{l}</p>{/each}</div>
    <div class="band"></div>
  {:else}
    <div class="bar"></div>
    <header><h2>{slide.title}</h2>{#if tag}<span class="tag">{tag}</span>{/if}</header>
    <div class="card" class:short={!!slide.answer} class:centred class:cols style="font-size:{size}cqw">
      {#if list}
        {#if numbered}<ol>{#each slide.lines as l}<li>{l}</li>{/each}</ol>{:else}<ul>{#each slide.lines as l}<li>{l}</li>{/each}</ul>{/if}
      {:else}
        {#each slide.lines as l, i}<p class:strong={slide.kind === 'pattern' && i === 0}>{l}</p>{/each}
      {/if}
    </div>
    {#if slide.answer}<p class="answer" class:hidden={!reveal}>{reveal ? `Answer: ${slide.answer}` : 'Answer: tap or press → to show'}</p>{/if}
    {#if total}<span class="num">{n + 1} / {total}</span>{/if}
  {/if}
</div>

<style>
  .slide { container-type: inline-size; position: relative; aspect-ratio: 16 / 9; width: 100%; background: var(--bg); color: var(--ink); overflow: hidden; font-family: var(--f-body, Arial, sans-serif); border-radius: 4px; }
  .slide h2 { margin: 0; color: var(--title); font-family: var(--f-display, Arial, sans-serif); line-height: 1.15; }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 1.8cqw; background: var(--accent); }
  header { position: absolute; left: 5cqw; right: 3cqw; top: 3cqw; display: flex; justify-content: space-between; align-items: baseline; gap: 2cqw; }
  header h2 { font-size: 4.4cqw; }
  .tag { font-size: 1.8cqw; white-space: nowrap; opacity: .92; }
  .card { position: absolute; left: 5cqw; right: 5cqw; top: 12.5cqw; bottom: 4.5cqw; background: var(--card); border-radius: 1.2cqw; padding: 2cqw 2.6cqw; display: flex; flex-direction: column; justify-content: safe center; line-height: 1.3; overflow: hidden; }
  .card.short { bottom: 12cqw; }
  .card.centred { align-items: center; text-align: center; }
  .card.cols { display: block; column-count: 2; column-gap: 4cqw; padding-top: 3cqw; }
  .card.cols p { break-inside: avoid; }
  .card p { margin: 0 0 .45em; }
  .card p:last-child { margin-bottom: 0; }
  .card .strong { font-weight: 700; }
  .card ol, .card ul { margin: 0; padding-left: 1.3em; }
  .card li { margin-bottom: .45em; }
  .answer { position: absolute; left: 5cqw; right: 5cqw; bottom: 4.5cqw; margin: 0; text-align: center; font-weight: 700; font-size: 2.8cqw; color: var(--accent); }
  .answer.hidden { opacity: .55; font-weight: 400; font-size: 1.8cqw; }
  .num { position: absolute; right: 2cqw; bottom: 1.2cqw; font-size: 1.3cqw; opacity: .8; }
  .bigtext { position: absolute; left: 6cqw; right: 6cqw; top: 14cqw; bottom: 14cqw; display: flex; flex-direction: column; justify-content: center; gap: .3em; }
  .bigtext h2 { font-size: 6.6cqw; }
  .bigtext p { margin: 0; font-size: 2.8cqw; }
  .band { position: absolute; left: 0; right: 0; bottom: 0; height: 7.3cqw; background: var(--accent); }
</style>
