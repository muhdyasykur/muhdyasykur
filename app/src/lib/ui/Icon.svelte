<script lang="ts" module>
  // Original 24px stroke icons drawn for Consilia.
  const paths = {
    today: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
    plan: 'M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8.5 13h7M8.5 17h5',
    classes: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.900 2.100 6.500 5.500M16 4.300a3.500 3.500 0 0 1 0 6.400M18 14.800c1.900.700 3.200 2.500 3.600 5.200',
    library: 'M4 5.500C6.500 4.300 9.500 4.300 12 6c2.500-1.700 5.500-1.700 8-.5V19c-2.500-1.200-5.500-1.200-8 .5-2.500-1.700-5.500-1.700-8-.5zM12 6v13.500',
    me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.500 20.500c.800-3.700 3.800-6 7.500-6s6.700 2.300 7.500 6',
    plus: 'M12 5v14M5 12h14',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.500 16.500 21 21',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 5l7 7-7 7',
    check: 'M5 12.500l4.500 4.500L19 7.500',
    offline: 'M3 3l18 18M8.500 16.500a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.500M19 13a10 10 0 0 0-5-2.800M12 20h.010',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
    tools: 'M4 20 14.500 9.500M14 4.500v-2M14 12.500v-2M18 7.500h2M8 7.500h2M16.900 4.600l1.400-1.400M11.100 10.400l-1.400 1.400M16.900 10.400l1.400 1.400'
  } as const;
  export type IconName = keyof typeof paths;
</script>
<script lang="ts">
  let { name, size = 22 }: { name: IconName; size?: number } = $props();
</script>
<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
