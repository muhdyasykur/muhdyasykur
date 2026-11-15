<script lang="ts">
  /** QR code for a link, drawn as SVG on the device (no web service). */
  let { url, size = 72 }: { url: string; size?: number } = $props();
  let svg = $state('');
  $effect(() => { const u = url; import('qrcode').then((q) => q.toString(u, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })).then((s) => { if (u === url) svg = s; }).catch(() => (svg = '')); });
</script>
<span class="qr" style="width:{size}px;height:{size}px" role="img" aria-label="QR code for {url}">{@html svg}</span>
<style>.qr { display: inline-block; background: #fff; } .qr :global(svg) { width: 100%; height: 100%; }</style>
