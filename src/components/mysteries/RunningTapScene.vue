<script setup>
// Accepted so every scene shares one interface; the picture keeps the
// problem visible, so this scene has no solved state.
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <defs>
      <pattern id="ck-tap-tiles" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="#FFFFFF" stroke-width="2" />
      </pattern>
    </defs>
    <rect width="520" height="320" fill="#EAF7FE" />
    <rect width="520" height="200" fill="url(#ck-tap-tiles)" />

    <!-- mirror -->
    <rect x="184" y="24" width="152" height="78" rx="18" fill="#D5EEF9" stroke="#FFFFFF" stroke-width="8" />
    <path d="M208 42 L234 42 M204 54 L220 54" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".85" />

    <!-- cupboard -->
    <rect x="82" y="220" width="356" height="100" fill="#D9CCF7" />
    <rect x="96" y="236" width="156" height="72" rx="10" fill="#E6DCFA" />
    <rect x="268" y="236" width="156" height="72" rx="10" fill="#E6DCFA" />
    <circle cx="238" cy="272" r="5" fill="#B59CF0" />
    <circle cx="282" cy="272" r="5" fill="#B59CF0" />

    <!-- bench top -->
    <rect x="60" y="194" width="400" height="28" rx="8" fill="#FFFFFF" />
    <rect x="60" y="216" width="400" height="6" fill="#DCE8EC" />

    <!-- basin -->
    <ellipse cx="284" cy="200" rx="84" ry="14" fill="#F4F8FA" stroke="#CFE3EA" stroke-width="3" />
    <ellipse cx="284" cy="202" rx="60" ry="8" fill="#DCEBF0" />

    <!-- tap -->
    <rect x="244" y="150" width="18" height="48" rx="6" fill="#B8C4CA" />
    <rect x="244" y="143" width="68" height="17" rx="8" fill="#C9D3D8" />
    <rect x="296" y="152" width="16" height="16" rx="5" fill="#B8C4CA" />
    <circle cx="253" cy="138" r="9" fill="#FF929C" />

    <!-- Running water, which stays running after the answer is found: the
         amber mark says "Still running", so turning the tap off in the picture
         would contradict the label the child is reading. -->
    <g>
      <path class="ck-tap-stream" d="M304 168 C299 178 309 188 304 198" stroke="#79C7F0" stroke-width="7" fill="none" stroke-linecap="round" />
      <circle cx="286" cy="194" r="3" fill="#79C7F0" />
      <circle cx="322" cy="192" r="3.5" fill="#79C7F0" />
      <circle cx="296" cy="186" r="2.5" fill="#79C7F0" />
    </g>

    <!-- cup and toothbrushes -->
    <rect x="122" y="122" width="7" height="48" rx="3" fill="#63D7C8" transform="rotate(-10 125 146)" />
    <rect x="118" y="114" width="15" height="12" rx="3" fill="#FFFFFF" transform="rotate(-10 125 146)" />
    <rect x="144" y="128" width="7" height="42" rx="3" fill="#FFDC52" transform="rotate(12 147 150)" />
    <rect x="116" y="150" width="46" height="46" rx="9" fill="#FF929C" />

    <!-- toothpaste -->
    <path d="M370 188 L420 180 L422 192 L372 198 Z" fill="#FFFFFF" stroke="#DCE8EC" stroke-width="2" />
    <rect x="418" y="178" width="10" height="16" rx="3" fill="#63D7C8" />
  </g>
</template>

<style scoped>
.ck-tap-stream {
  stroke-dasharray: 9 5;
  animation: ck-tap-flow .6s linear infinite;
}
@keyframes ck-tap-flow { to { stroke-dashoffset: -14; } }
</style>
