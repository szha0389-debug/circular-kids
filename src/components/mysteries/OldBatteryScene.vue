<script setup>
// Accepted so every scene shares one interface; this scene has no solved state.
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <rect width="520" height="210" fill="#FFF0F2" />

    <!-- clock -->
    <circle cx="71" cy="61" r="30" fill="#FFFFFF" stroke="#FF929C" stroke-width="5" />
    <line x1="71" y1="61" x2="71" y2="43" stroke="#3D4A50" stroke-width="4" stroke-linecap="round" />
    <line x1="71" y1="61" x2="85" y2="68" stroke="#3D4A50" stroke-width="4" stroke-linecap="round" />

    <!-- bench -->
    <rect y="206" width="520" height="114" fill="#F6EFE6" />
    <rect y="200" width="520" height="14" fill="#E8DCCB" />
    <rect x="30" y="238" width="140" height="70" rx="8" fill="#EFE4D6" />
    <rect x="186" y="238" width="140" height="70" rx="8" fill="#EFE4D6" />
    <rect x="86" y="256" width="28" height="6" rx="3" fill="#D6C5AE" />
    <rect x="242" y="256" width="28" height="6" rx="3" fill="#D6C5AE" />

    <!-- TV remote with its battery cover open -->
    <g transform="translate(114 228) rotate(-6)">
      <rect x="-58" y="-14" width="116" height="30" rx="12" fill="#3D4A50" />
      <circle cx="-38" cy="1" r="5" fill="#FF929C" />
      <circle cx="-22" cy="1" r="4" fill="#79C7F0" />
      <circle cx="-9" cy="1" r="4" fill="#79C7F0" />
      <rect x="18" y="-10" width="34" height="22" rx="4" fill="#27323A" />
      <rect x="22" y="-16" width="26" height="8" rx="3" fill="#5B6970" transform="rotate(-18 35 -12)" />
    </g>

    <!-- battery drop-off box -->
    <rect x="194" y="146" width="92" height="62" rx="8" fill="#91D66F" />
    <rect x="208" y="140" width="64" height="10" rx="4" fill="#6FBE4E" />
    <rect x="224" y="160" width="30" height="16" rx="3" fill="#FFFFFF" />
    <rect x="254" y="165" width="4" height="6" rx="1" fill="#FFFFFF" />
    <text x="240" y="198" text-anchor="middle" font-size="9" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif" letter-spacing=".5">BATTERIES</text>

    <!-- kitchen bin with its lid open -->
    <ellipse cx="394" cy="240" rx="46" ry="6" fill="#3D4A50" opacity=".08" />
    <path d="M352 132 L436 132 L428 238 L360 238 Z" fill="#A7B1B6" />
    <rect x="344" y="124" width="100" height="14" rx="6" fill="#8A969C" />
    <path d="M346 122 L438 94 L442 106 L350 132 Z" fill="#8A969C" />

    <!-- batteries dropping into the bin -->
    <g transform="translate(390 88) rotate(24)">
      <rect x="-8" y="-20" width="16" height="38" rx="4" fill="#3D4A50" />
      <rect x="-8" y="-20" width="16" height="12" rx="4" fill="#FFDC52" />
      <rect x="-3" y="-25" width="6" height="6" rx="1" fill="#899194" />
    </g>
    <g transform="translate(420 112) rotate(-30)">
      <rect x="-8" y="-20" width="16" height="38" rx="4" fill="#3D4A50" />
      <rect x="-8" y="-20" width="16" height="12" rx="4" fill="#FFDC52" />
      <rect x="-3" y="-25" width="6" height="6" rx="1" fill="#899194" />
    </g>
    <g fill="none" stroke="#899194" stroke-width="3" stroke-linecap="round" opacity=".45">
      <path d="M362 70 q8 -6 16 0" />
      <path d="M430 80 q8 -6 16 0" />
    </g>
  </g>
</template>
