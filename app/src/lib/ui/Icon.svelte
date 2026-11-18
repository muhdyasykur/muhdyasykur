<script lang="ts" module>
  // emoji stay only where pupils see them (slides, printed sheets) and for the 🌱 🌿 🌳 level marks
  export { ICON_NAMES, type IconName } from './icons';
</script>
<script lang="ts">
  import { paths, type IconName } from './icons';
  let { name, size = 22 }: { name: IconName; size?: number } = $props();
</script>
<svg class="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>
