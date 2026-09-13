<script setup>
// Accepted so every scene shares one interface; this scene has no solved state.
defineProps({ solved: { type: Boolean, default: false } });
</script>

<template>
  <g>
    <rect width="520" height="236" fill="#FFF8D8" />
    <rect y="236" width="520" height="84" fill="#F1E6D2" />
    <rect y="231" width="520" height="8" fill="#E6D6B8" />

    <!-- window -->
    <rect x="30" y="34" width="110" height="90" rx="10" fill="#EAF7FE" stroke="#FFFFFF" stroke-width="7" />
    <circle cx="112" cy="58" r="11" fill="#FFDC52" opacity=".85" />
    <line x1="85" y1="38" x2="85" y2="120" stroke="#FFFFFF" stroke-width="5" />
    <line x1="34" y1="79" x2="136" y2="79" stroke="#FFFFFF" stroke-width="5" />

    <!-- recycling bin -->
    <ellipse cx="200" cy="276" rx="58" ry="7" fill="#3D4A50" opacity=".08" />
    <path d="M156 164 L244 164 L236 272 L164 272 Z" fill="#79C7F0" />
    <rect x="148" y="150" width="104" height="18" rx="7" fill="#54B2E0" />
    <!-- three chasing arrows -->
    <g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M190 190 L197 179 Q200 175 203 179 L208 187" />
      <path d="M204 184 L208 188 L211 182" />
      <path d="M214 197 L220 207 Q222 212 217 212 L205 212" />
      <path d="M209 208 L204 212 L209 216" />
      <path d="M195 212 L183 212 Q178 212 181 207 L186 199" />
      <path d="M181 202 L186 198 L189 204" />
    </g>
    <text x="200" y="250" text-anchor="middle" font-size="11" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif" letter-spacing="1">RECYCLING</text>

    <!-- general waste bin -->
    <ellipse cx="342" cy="276" rx="58" ry="7" fill="#3D4A50" opacity=".08" />
    <path d="M298 164 L386 164 L378 272 L306 272 Z" fill="#A7B1B6" />
    <rect x="290" y="150" width="104" height="18" rx="7" fill="#8A969C" />
    <text x="342" y="226" text-anchor="middle" font-size="11" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif" letter-spacing="1">GENERAL</text>
    <text x="342" y="242" text-anchor="middle" font-size="11" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif" letter-spacing="1">WASTE</text>

    <!-- motion lines -->
    <g fill="none" stroke="#899194" stroke-width="3" stroke-linecap="round" opacity=".45">
      <path d="M368 62 q9 -7 18 0" />
      <path d="M376 80 q9 -7 18 0" />
    </g>

    <!-- plastic bottle dropping into the general waste bin -->
    <g transform="translate(342 104) rotate(-26)">
      <rect x="-14" y="-30" width="28" height="56" rx="10" fill="#CDEEFA" stroke="#79C7F0" stroke-width="2.5" />
      <rect x="-8" y="-43" width="16" height="15" rx="4" fill="#CDEEFA" stroke="#79C7F0" stroke-width="2.5" />
      <rect x="-9" y="-52" width="18" height="10" rx="3" fill="#FF929C" />
      <rect x="-14" y="-6" width="28" height="15" fill="#63D7C8" opacity=".8" />
      <rect x="-8" y="-24" width="4" height="40" rx="2" fill="#FFFFFF" opacity=".75" />
    </g>

    <!-- plant -->
    <path d="M446 240 L492 240 L486 276 L452 276 Z" fill="#FF929C" />
    <g fill="#91D66F">
      <ellipse cx="456" cy="210" rx="11" ry="26" transform="rotate(-24 456 210)" />
      <ellipse cx="482" cy="210" rx="11" ry="26" transform="rotate(24 482 210)" />
      <ellipse cx="469" cy="198" rx="10" ry="30" />
    </g>
  </g>
</template>
