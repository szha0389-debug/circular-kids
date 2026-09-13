<script setup>
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <rect width="520" height="250" fill="#F3EEFF" />
    <rect y="250" width="520" height="70" fill="#EDE1CC" />
    <rect y="245" width="520" height="7" fill="#DDCDB0" />

    <!-- sunny window -->
    <rect x="390" y="42" width="106" height="102" rx="10" fill="#DFF3FD" stroke="#FFFFFF" stroke-width="7" />
    <circle cx="466" cy="74" r="17" fill="#FFDC52" />
    <line x1="443" y1="46" x2="443" y2="140" stroke="#FFFFFF" stroke-width="5" />
    <line x1="394" y1="93" x2="492" y2="93" stroke="#FFFFFF" stroke-width="5" />
    <path d="M396 148 L494 148 L452 250 L362 250 Z" fill="#FFF3B0" opacity=".45" />

    <!-- note on the wall -->
    <g transform="rotate(-4 118 92)">
      <rect x="68" y="62" width="102" height="58" rx="6" fill="#FFFFFF" />
      <circle cx="119" cy="66" r="4" fill="#FF929C" />
      <text x="119" y="92" text-anchor="middle" font-size="12" font-weight="800" fill="#3D4A50" font-family="Nunito, sans-serif">Out playing!</text>
      <text x="119" y="110" text-anchor="middle" font-size="14">⚽</text>
    </g>

    <!-- bed -->
    <rect x="30" y="168" width="16" height="92" rx="6" fill="#C9A77C" />
    <rect x="40" y="200" width="176" height="44" rx="10" fill="#79C7F0" />
    <rect x="52" y="184" width="56" height="24" rx="10" fill="#FFFFFF" />
    <path d="M104 196 L216 196 L216 238 L104 238 Z" fill="#63D7C8" />
    <rect x="204" y="236" width="10" height="24" fill="#C9A77C" />

    <!-- rug -->
    <ellipse cx="256" cy="294" rx="120" ry="16" fill="#FFB8C0" opacity=".85" />

    <!-- desk -->
    <rect x="250" y="196" width="130" height="12" rx="4" fill="#C9A77C" />
    <rect x="258" y="208" width="10" height="42" fill="#B08D63" />
    <rect x="362" y="208" width="10" height="42" fill="#B08D63" />

    <!-- desk lamp -->
    <g v-if="!solved">
      <circle class="ck-lamp-glow" cx="296" cy="124" r="52" fill="#FFDC52" opacity=".3" />
      <path d="M282 132 L312 132 L348 196 L252 196 Z" fill="#FFF0A6" opacity=".6" />
    </g>
    <ellipse cx="324" cy="194" rx="22" ry="5" fill="#8A969C" />
    <line x1="324" y1="192" x2="304" y2="150" stroke="#8A969C" stroke-width="6" stroke-linecap="round" />
    <line x1="304" y1="150" x2="318" y2="112" stroke="#8A969C" stroke-width="6" stroke-linecap="round" />
    <path d="M320 100 L330 118 L292 138 L272 118 Z" :fill="solved ? '#D6DCDF' : '#FFDC52'" />
    <circle cx="288" cy="134" r="7" :fill="solved ? '#EEF1F2' : '#FFFBE0'" />
  </g>
</template>

<style scoped>
.ck-lamp-glow { animation: ck-lamp-hum 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes ck-lamp-hum { 50% { opacity: .42; transform: scale(1.06); } }
</style>
