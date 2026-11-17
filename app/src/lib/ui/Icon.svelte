<script lang="ts" module>
  // Original line icons drawn for Consilia: 24 px grid, 1.8 stroke, round ends. One family for the whole interface;
  // emoji stay only where pupils see them (slides, printed sheets) and for the 🌱 🌿 🌳 level marks.
  const paths = {
    // navigation
    today: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
    plan: 'M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8.5 13h7M8.5 17h5',
    classes: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.6 5.2',
    library: 'M4 5.5C6.5 4.3 9.5 4.3 12 6c2.5-1.7 5.5-1.7 8-.5V19c-2.5-1.2-5.5-1.2-8 .5-2.5-1.7-5.5-1.7-8-.5zM12 6v13.5',
    me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.7 3.8-6 7.5-6s6.7 2.3 7.5 6',
    tools: 'M4 20 14.5 9.5M14 4.5v-2M14 12.5v-2M18 7.5h2M8 7.5h2M16.9 4.6l1.4-1.4M11.1 10.4l-1.4 1.4M16.9 10.4l1.4 1.4',
    // actions
    plus: 'M12 5v14M5 12h14',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.5 16.5 21 21',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 5l7 7-7 7',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    close: 'M6 6l12 12M18 6 6 18',
    expand: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
    upload: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
    play: 'M7 4.5v15l12-7.5z',
    pause: 'M8 5v14M16 5v14',
    shuffle: 'M3 7h3.5c2 0 3.2.9 4.3 2.7l2.4 4.6c1.1 1.8 2.3 2.7 4.3 2.7H21M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4c.8-.9 1.8-1.4 3.2-1.4H21M18 4l3 3-3 3M18 14l3 3-3 3',
    // things
    offline: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.5M19 13a10 10 0 0 0-5-2.8M12 20h.01',
    wifi: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
    day: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4M8.5 13.5h3v3h-3z',
    year: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01',
    sparkle: 'M10 4c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7zM18 3v4M16 5h4',
    bulb: 'M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM12 12h.01',
    stairs: 'M3 20h5v-5h5v-5h5V5h3',
    scissors: 'M6 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8.2 8.2 20 18M8.2 15.8 20 6',
    sheet: 'M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6M8.5 9h3M8.5 13h2M8.5 17h7M17.5 3.5l3 3-7 7h-3v-3z',
    music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    slides: 'M3 4h18M4 4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4M12 15v3M8 21l4-3 4 3M8.5 11l2.5-2.5 2 2L16 7.5',
    prompt: 'M20 12a8 8 0 0 1-11.8 7L4 20l1-4.2A8 8 0 1 1 20 12zM12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z',
    game: 'M7.5 7h9a4.5 4.5 0 0 1 4.4 5.5l-1 4.3a2.5 2.5 0 0 1-4.2 1.2L14 16h-4l-1.7 2a2.5 2.5 0 0 1-4.2-1.2l-1-4.3A4.5 4.5 0 0 1 7.5 7zM8 10v3M6.5 11.5h3M15.5 11h.01M17.5 13h.01',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
    volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
    speaker: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6',
    bell: 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    'bell-off': 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0M3 3l18 18',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
    eye: 'M2.5 12C4.6 7.8 8 5.5 12 5.5s7.4 2.3 9.5 6.5c-2.1 4.2-5.5 6.5-9.5 6.5S4.6 16.2 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M10 2.5h4M19 6l1.5-1.5',
    screen: 'M3 5h18v11H3zM8 20h8M12 16v4',
    layers: 'M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
    warning: 'M12 3.5 21.5 20h-19zM12 10v4.5M12 17.5h.01',
    wheel: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4',
    trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H4.5c0 2.8 1.4 4.4 3.7 4.8M16 6h3.5c0 2.8-1.4 4.4-3.7 4.8M12 14v4M8 20.5h8M9.5 18h5'
  } as const;
  export type IconName = keyof typeof paths;
  export const ICON_NAMES = Object.keys(paths) as IconName[];
</script>
<script lang="ts">
  let { name, size = 22 }: { name: IconName; size?: number } = $props();
</script>
<svg class="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>
