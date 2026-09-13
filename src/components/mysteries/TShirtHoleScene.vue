<script setup>
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <rect width="520" height="244" fill="#EAFBF8" />
    <rect y="244" width="520" height="76" fill="#E9DDC8" />
    <rect y="240" width="520" height="7" fill="#DCCDB3" />

    <!-- T-shirt -->
    <ellipse cx="262" cy="230" rx="96" ry="8" fill="#3D4A50" opacity=".07" />
    <path d="M200 70 L150 100 L172 146 L200 132 Z" fill="#FFDC52" />
    <path d="M324 70 L374 100 L352 146 L324 132 Z" fill="#FFDC52" />
    <path d="M200 70 L236 52 Q262 74 288 52 L324 70 L324 218 L200 218 Z" fill="#FFDC52" />
    <path d="M236 52 Q262 76 288 52" fill="none" stroke="#E6BE2E" stroke-width="6" stroke-linecap="round" />
    <path d="M286 150 l7 15 l16 2 l-12 11 l3 16 l-14 -8 l-14 8 l3 -16 l-12 -11 l16 -2 Z" fill="#FF929C" />

    <!-- The one small hole on the sleeve — the wall shows through its frayed
         edge — mended with a patch once it has been found. -->
    <path
      v-if="!solved"
      d="M166 111 l5 -5 l5 3 l6 -4 l3 6 l-1 5 l4 4 l-6 4 l-5 -2 l-6 3 l-3 -6 l-4 -2 Z"
      fill="#EAFBF8"
      stroke="#C99A1E"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <g v-else>
      <circle cx="176" cy="116" r="11" fill="#63D7C8" />
      <circle cx="176" cy="116" r="8" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 3" />
    </g>

    <!-- heading to the bin -->
    <path d="M334 204 Q376 236 400 238" fill="none" stroke="#899194" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round" opacity=".6" />
    <path d="M398 230 L408 238 L396 244" fill="none" stroke="#899194" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".6" />

    <!-- bin -->
    <path d="M412 206 L490 206 L482 294 L420 294 Z" fill="#A7B1B6" />
    <rect x="404" y="194" width="94" height="14" rx="6" fill="#8A969C" />

    <!-- reel of thread and a needle -->
    <rect x="40" y="252" width="54" height="10" rx="3" fill="#C9A77C" />
    <rect x="46" y="262" width="42" height="26" fill="#B59CF0" />
    <rect x="40" y="288" width="54" height="10" rx="3" fill="#C9A77C" />
    <line x1="100" y1="300" x2="124" y2="276" stroke="#8A969C" stroke-width="3" stroke-linecap="round" />
  </g>
</template>
