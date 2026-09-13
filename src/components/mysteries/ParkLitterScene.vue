<script setup>
// Accepted so every scene shares one interface; this scene has no solved state.
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <rect width="520" height="320" fill="#EAF7FE" />
    <g fill="#FFFFFF">
      <ellipse cx="236" cy="52" rx="40" ry="15" />
      <ellipse cx="266" cy="44" rx="28" ry="14" />
      <ellipse cx="420" cy="74" rx="34" ry="12" />
    </g>

    <rect y="206" width="520" height="114" fill="#CDEBB5" />
    <path d="M0 208 Q130 190 260 208 T520 208 L520 222 L0 222 Z" fill="#BFE3A2" />

    <!-- tree -->
    <rect x="84" y="126" width="24" height="104" rx="6" fill="#B8895A" />
    <circle cx="96" cy="96" r="54" fill="#91D66F" />
    <circle cx="62" cy="122" r="34" fill="#7FC95B" />
    <circle cx="132" cy="120" r="36" fill="#86CE62" />

    <!-- bench -->
    <rect x="196" y="156" width="152" height="10" rx="4" fill="#C9A77C" />
    <rect x="196" y="172" width="152" height="10" rx="4" fill="#C9A77C" />
    <rect x="206" y="150" width="8" height="46" fill="#B08D63" />
    <rect x="330" y="150" width="8" height="46" fill="#B08D63" />
    <rect x="188" y="190" width="168" height="12" rx="4" fill="#B08D63" />
    <rect x="200" y="202" width="8" height="8" fill="#8F7250" />
    <rect x="336" y="202" width="8" height="8" fill="#8F7250" />

    <!-- bin -->
    <rect x="390" y="178" width="60" height="64" rx="8" fill="#63D7C8" />
    <rect x="384" y="166" width="72" height="14" rx="6" fill="#48BFB0" />
    <text x="420" y="218" text-anchor="middle" font-size="12" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif">BIN</text>

    <!-- litter on the grass -->
    <g transform="translate(234 268) rotate(-16)">
      <rect x="-15" y="-19" width="30" height="38" rx="4" fill="#FF929C" />
      <rect x="-15" y="-6" width="30" height="11" fill="#FFDC52" />
      <line x1="7" y1="-19" x2="13" y2="-33" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
    </g>
    <path d="M270 278 l10 -10 l10 8 l12 -8 l8 12 l-10 8 l6 10 l-14 2 l-8 -8 l-12 6 Z" fill="#FFDC52" stroke="#E6BE2E" stroke-width="2" stroke-linejoin="round" />

    <!-- flowers -->
    <g>
      <circle cx="40" cy="270" r="5" fill="#FF929C" /><circle cx="40" cy="270" r="2" fill="#FFDC52" />
      <circle cx="150" cy="292" r="5" fill="#B59CF0" /><circle cx="150" cy="292" r="2" fill="#FFDC52" />
      <circle cx="372" cy="296" r="5" fill="#FF929C" /><circle cx="372" cy="296" r="2" fill="#FFDC52" />
    </g>

    <!-- bird -->
    <g transform="translate(474 270)">
      <ellipse cx="0" cy="0" rx="16" ry="11" fill="#B59CF0" />
      <circle cx="12" cy="-9" r="8" fill="#B59CF0" />
      <path d="M19 -10 L27 -7 L19 -5 Z" fill="#FFDC52" />
      <circle cx="14" cy="-11" r="1.8" fill="#3D4A50" />
      <line x1="-3" y1="10" x2="-4" y2="17" stroke="#8A969C" stroke-width="2" />
      <line x1="4" y1="10" x2="5" y2="17" stroke="#8A969C" stroke-width="2" />
    </g>
  </g>
</template>
