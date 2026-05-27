/* ═══════════════════════════════════════════
   garden.js — Sistema de jardín digital
   5 etapas de crecimiento según entradas totales
═══════════════════════════════════════════ */

/* Paleta de colores del jardín */
const P  = '#6B9E64'; // verde salvia (planta)
const PE = '#B8956A'; // ámbar tierra (suelo/raíces)
const PL = '#A8C3A2'; // salvia claro (hojas interiores)

/* Estilos SVG compartidos */
const base = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;

/* ── Etapa 1: Semilla germinando (1-3 entradas) ─────────────────── */
const SVG_SEMILLA = `
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .s1-plant { fill:none; stroke:${P};  stroke-linecap:round; stroke-linejoin:round; }
    .s1-earth { fill:none; stroke:${PE}; stroke-linecap:round; stroke-linejoin:round; }
    .s1-wrap  { transform-origin:150px 250px; animation: sway1 5s ease-in-out infinite; }
    @keyframes sway1 { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
  </style>
  <!-- Suelo -->
  <line class="s1-earth" x1="55" y1="245" x2="245" y2="245" stroke-width="1.2"/>
  <!-- Textura tierra -->
  <circle class="s1-earth" cx="95"  cy="253" r="1.8" opacity=".35"/>
  <circle class="s1-earth" cx="130" cy="257" r="1.2" opacity=".35"/>
  <circle class="s1-earth" cx="170" cy="254" r="1.8" opacity=".35"/>
  <circle class="s1-earth" cx="205" cy="258" r="1.2" opacity=".35"/>
  <!-- Semilla + brotes -->
  <g class="s1-wrap">
    <!-- Cuerpo semilla (semibajo tierra) -->
    <ellipse class="s1-plant" cx="150" cy="254" rx="19" ry="24" stroke-width="1.6"/>
    <!-- Fisura semilla -->
    <path class="s1-plant" d="M147 233 Q150 228 153 233" stroke-width="1.1"/>
    <!-- Hoja izquierda emergiendo -->
    <path class="s1-plant" d="M147 241 C137 230 131 215 140 207 C148 215 148 230 147 241" stroke-width="1.5"/>
    <line class="s1-plant" x1="147" y1="241" x2="141" y2="210" stroke-width=".7" opacity=".5"/>
    <!-- Hoja derecha emergiendo -->
    <path class="s1-plant" d="M153 241 C163 230 169 215 160 207 C152 215 152 230 153 241" stroke-width="1.5"/>
    <line class="s1-plant" x1="153" y1="241" x2="159" y2="210" stroke-width=".7" opacity=".5"/>
    <!-- Raíces -->
    <path class="s1-earth" d="M142 272 C135 280 128 290 120 295" stroke-width="1.1"/>
    <path class="s1-earth" d="M150 278 L150 298" stroke-width="1.2"/>
    <path class="s1-earth" d="M158 274 C165 282 170 291 178 296" stroke-width="1.1"/>
  </g>
</svg>`;

/* ── Etapa 2: Brote (4-10 entradas) ────────────────────────────── */
const SVG_BROTE = `
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .s2-plant { fill:none; stroke:${P};  stroke-linecap:round; stroke-linejoin:round; }
    .s2-earth { fill:none; stroke:${PE}; stroke-linecap:round; stroke-linejoin:round; }
    .s2-wrap  { transform-origin:150px 255px; animation: sway2 4.5s ease-in-out infinite; }
    @keyframes sway2 { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
  </style>
  <!-- Suelo -->
  <line class="s2-earth" x1="55" y1="255" x2="245" y2="255" stroke-width="1.2"/>
  <path class="s2-earth" d="M110 255 Q150 243 190 255" stroke-width="1" opacity=".5"/>
  <g class="s2-wrap">
    <!-- Tallo principal -->
    <path class="s2-plant" d="M150 255 C149 232 151 210 150 187" stroke-width="1.8"/>
    <!-- Hoja izquierda inferior -->
    <path class="s2-plant" d="M150 230 C132 224 118 208 126 196 C138 202 147 218 150 230" stroke-width="1.5"/>
    <line class="s2-plant" x1="150" y1="230" x2="128" y2="199" stroke-width=".75" opacity=".5"/>
    <!-- Hoja derecha superior -->
    <path class="s2-plant" d="M150 210 C168 204 182 188 174 176 C162 182 153 198 150 210" stroke-width="1.5"/>
    <line class="s2-plant" x1="150" y1="210" x2="172" y2="179" stroke-width=".75" opacity=".5"/>
    <!-- Yema terminal -->
    <ellipse class="s2-plant" cx="150" cy="184" rx="5" ry="7" stroke-width="1.3"/>
  </g>
</svg>`;

/* ── Etapa 3: Planta joven (11-25 entradas) ─────────────────────── */
const SVG_PLANTA = `
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .s3-plant { fill:none; stroke:${P};  stroke-linecap:round; stroke-linejoin:round; }
    .s3-soft  { fill:none; stroke:${PL}; stroke-linecap:round; stroke-linejoin:round; }
    .s3-earth { fill:none; stroke:${PE}; stroke-linecap:round; stroke-linejoin:round; }
    .s3-wrap  { transform-origin:150px 260px; animation: sway3 5s ease-in-out infinite; }
    @keyframes sway3 { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
  </style>
  <!-- Suelo -->
  <line class="s3-earth" x1="50" y1="262" x2="250" y2="262" stroke-width="1.2"/>
  <path class="s3-earth" d="M105 262 Q150 248 195 262" stroke-width="1" opacity=".5"/>
  <g class="s3-wrap">
    <!-- Tallo -->
    <path class="s3-plant" d="M150 262 C149 238 151 210 149 175 C149 160 151 148 150 135" stroke-width="1.9"/>
    <!-- Rama derecha -->
    <path class="s3-plant" d="M150 215 C160 205 175 198 188 200" stroke-width="1.4"/>
    <!-- Hoja grande izquierda inferior -->
    <path class="s3-plant" d="M150 240 C128 230 112 210 122 196 C136 204 148 224 150 240" stroke-width="1.5"/>
    <line class="s3-plant" x1="150" y1="240" x2="124" y2="200" stroke-width=".8" opacity=".45"/>
    <!-- Hoja derecha media -->
    <path class="s3-plant" d="M150 220 C172 212 188 194 178 180 C165 188 153 206 150 220" stroke-width="1.5"/>
    <line class="s3-plant" x1="150" y1="220" x2="176" y2="183" stroke-width=".8" opacity=".45"/>
    <!-- Hoja izquierda alta -->
    <path class="s3-plant" d="M150 195 C133 188 120 172 130 160 C141 167 149 183 150 195" stroke-width="1.5"/>
    <line class="s3-plant" x1="150" y1="195" x2="132" y2="163" stroke-width=".8" opacity=".45"/>
    <!-- Hoja pequeña derecha alta -->
    <path class="s3-soft" d="M150 173 C163 167 173 155 166 146 C157 152 151 165 150 173" stroke-width="1.3"/>
    <!-- Yema terminal -->
    <ellipse class="s3-plant" cx="150" cy="132" rx="5" ry="7.5" stroke-width="1.3"/>
    <!-- Pequeña hoja en rama derecha -->
    <path class="s3-soft" d="M188 200 C196 192 202 182 196 175 C188 181 185 192 188 200" stroke-width="1.2"/>
  </g>
</svg>`;

/* ── Etapa 4: Floreciendo (26-50 entradas) ──────────────────────── */
const SVG_FLOR = `
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .s4-plant { fill:none; stroke:${P};  stroke-linecap:round; stroke-linejoin:round; }
    .s4-soft  { fill:none; stroke:${PL}; stroke-linecap:round; stroke-linejoin:round; }
    .s4-earth { fill:none; stroke:${PE}; stroke-linecap:round; stroke-linejoin:round; }
    .s4-wrap  { transform-origin:150px 262px; animation: sway4 5.5s ease-in-out infinite; }
    .s4-fl    { transform-origin:150px 108px; animation: sway4 5.5s ease-in-out infinite; }
    @keyframes sway4 { 0%,100%{transform:rotate(-.8deg)} 50%{transform:rotate(.8deg)} }
  </style>
  <!-- Suelo -->
  <line class="s4-earth" x1="48" y1="264" x2="252" y2="264" stroke-width="1.2"/>
  <path class="s4-earth" d="M100 264 Q150 250 200 264" stroke-width="1" opacity=".5"/>
  <g class="s4-wrap">
    <!-- Tallo -->
    <path class="s4-plant" d="M150 264 C149 240 151 215 149 180 C149 155 151 135 150 112" stroke-width="2"/>
    <!-- Ramas laterales -->
    <path class="s4-plant" d="M150 222 C160 210 178 204 192 207" stroke-width="1.4"/>
    <path class="s4-plant" d="M150 200 C140 188 124 182 110 185" stroke-width="1.4"/>
    <!-- Hojas principales -->
    <path class="s4-plant" d="M150 244 C127 234 110 213 121 198 C135 208 148 228 150 244" stroke-width="1.5"/>
    <line class="s4-plant" x1="150" y1="244" x2="123" y2="202" stroke-width=".8" opacity=".45"/>
    <path class="s4-plant" d="M150 225 C173 215 190 196 179 181 C166 190 153 208 150 225" stroke-width="1.5"/>
    <line class="s4-plant" x1="150" y1="225" x2="177" y2="184" stroke-width=".8" opacity=".45"/>
    <path class="s4-plant" d="M150 198 C130 190 116 173 127 161 C139 168 149 184 150 198" stroke-width="1.5"/>
    <path class="s4-soft" d="M150 175 C165 168 176 153 168 143 C158 150 152 165 150 175" stroke-width="1.3"/>
    <!-- Hojas en ramas -->
    <path class="s4-soft" d="M192 207 C200 198 206 186 199 178 C191 185 188 198 192 207" stroke-width="1.2"/>
    <path class="s4-soft" d="M110 185 C102 176 100 163 108 156 C116 163 115 177 110 185" stroke-width="1.2"/>
  </g>
  <!-- Flor (encima para que no se corte con el wrap) -->
  <g class="s4-fl">
    <!-- Pétalos (5 elipses rotadas) -->
    <ellipse class="s4-plant" cx="150" cy="95" rx="6" ry="14" stroke-width="1.4"/>
    <ellipse class="s4-plant" cx="150" cy="95" rx="6" ry="14" stroke-width="1.4" transform="rotate(72,150,108)"/>
    <ellipse class="s4-plant" cx="150" cy="95" rx="6" ry="14" stroke-width="1.4" transform="rotate(144,150,108)"/>
    <ellipse class="s4-plant" cx="150" cy="95" rx="6" ry="14" stroke-width="1.4" transform="rotate(216,150,108)"/>
    <ellipse class="s4-plant" cx="150" cy="95" rx="6" ry="14" stroke-width="1.4" transform="rotate(288,150,108)"/>
    <!-- Centro flor -->
    <circle class="s4-plant" cx="150" cy="108" r="7" stroke-width="1.6"/>
    <circle class="s4-earth" cx="150" cy="108" r="3.5" stroke-width="1.2"/>
  </g>
</svg>`;

/* ── Etapa 5: Árbol pleno (51+ entradas) ────────────────────────── */
const SVG_ARBOL = `
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg">
  <style>
    .s5-plant { fill:none; stroke:${P};  stroke-linecap:round; stroke-linejoin:round; }
    .s5-soft  { fill:none; stroke:${PL}; stroke-linecap:round; stroke-linejoin:round; }
    .s5-earth { fill:none; stroke:${PE}; stroke-linecap:round; stroke-linejoin:round; }
  </style>
  <!-- Raíces visibles -->
  <path class="s5-earth" d="M135 272 C125 278 115 285 105 290" stroke-width="1.2"/>
  <path class="s5-earth" d="M145 275 C142 282 140 290 138 298" stroke-width="1.1"/>
  <path class="s5-earth" d="M165 272 C175 278 185 285 195 290" stroke-width="1.2"/>
  <path class="s5-earth" d="M155 275 C158 282 160 290 162 298" stroke-width="1.1"/>
  <!-- Suelo -->
  <line class="s5-earth" x1="48" y1="268" x2="252" y2="268" stroke-width="1.3"/>
  <!-- Tronco -->
  <path class="s5-plant" d="M142 268 C141 252 139 235 140 218 C141 205 143 195 145 183" stroke-width="2.2"/>
  <path class="s5-plant" d="M158 268 C159 252 161 235 160 218 C159 205 157 195 155 183" stroke-width="2.2"/>
  <!-- Unión tronco-copa -->
  <path class="s5-plant" d="M145 183 C147 178 149 170 150 165" stroke-width="2"/>
  <path class="s5-plant" d="M155 183 C153 178 151 170 150 165" stroke-width="2"/>
  <!-- Rama principal izquierda -->
  <path class="s5-plant" d="M148 200 C138 188 124 178 108 172" stroke-width="1.8"/>
  <!-- Rama principal derecha -->
  <path class="s5-plant" d="M152 195 C162 183 176 173 192 167" stroke-width="1.8"/>
  <!-- Rama secundaria izq-alta -->
  <path class="s5-plant" d="M149 175 C140 163 130 153 118 148" stroke-width="1.5"/>
  <!-- Rama secundaria der-alta -->
  <path class="s5-plant" d="M151 172 C160 160 170 150 182 145" stroke-width="1.5"/>
  <!-- Copa: conjunto de elipses de hojas -->
  <!-- Cúpula exterior -->
  <ellipse class="s5-plant" cx="150" cy="128" rx="60" ry="42" stroke-width="1.6"/>
  <!-- Interior orgánico -->
  <ellipse class="s5-soft"  cx="128" cy="132" rx="32" ry="22" stroke-width="1.2"/>
  <ellipse class="s5-soft"  cx="172" cy="130" rx="32" ry="22" stroke-width="1.2"/>
  <ellipse class="s5-soft"  cx="150" cy="110" rx="28" ry="18" stroke-width="1.2"/>
  <!-- Pequeños detalles de hojas externas -->
  <path class="s5-soft" d="M93 130 C86 120 88 108 96 106 C100 114 100 124 93 130" stroke-width="1.1"/>
  <path class="s5-soft" d="M207 128 C214 118 212 106 204 104 C200 112 200 122 207 128" stroke-width="1.1"/>
  <path class="s5-soft" d="M128 90 C122 80 126 68 134 68 C136 76 134 86 128 90" stroke-width="1.1"/>
  <path class="s5-soft" d="M172 88 C178 78 174 66 166 66 C164 74 166 84 172 88" stroke-width="1.1"/>
  <!-- Frutos pequeños (círculos sutiles) -->
  <circle class="s5-earth" cx="110" cy="115" r="4.5" stroke-width="1.1"/>
  <circle class="s5-earth" cx="188" cy="112" r="4.5" stroke-width="1.1"/>
  <circle class="s5-earth" cx="148" cy="100" r="4.5" stroke-width="1.1"/>
  <!-- Hojas en ramas inferiores -->
  <path class="s5-plant" d="M108 172 C98 163 94 150 102 144 C110 150 112 163 108 172" stroke-width="1.3"/>
  <path class="s5-plant" d="M192 167 C202 158 206 145 198 139 C190 145 188 158 192 167" stroke-width="1.3"/>
</svg>`;

/* ── Definición de etapas ── */
export const STAGES = [
  { min: 0,  max: 3,   id: 1, label: 'Tu semilla ha germinado',         svg: SVG_SEMILLA },
  { min: 4,  max: 10,  id: 2, label: 'Tu brote crece hacia la luz',      svg: SVG_BROTE   },
  { min: 11, max: 25,  id: 3, label: 'Tu planta está echando raíces',    svg: SVG_PLANTA  },
  { min: 26, max: 50,  id: 4, label: 'Tu jardín está floreciendo',       svg: SVG_FLOR    },
  { min: 51, max: Infinity, id: 5, label: 'Tu árbol ha crecido fuerte',  svg: SVG_ARBOL   },
];

/* Devuelve la etapa para un total de entradas dado */
export function getStage(count) {
  return STAGES.find(s => count >= s.min && count <= s.max) ?? STAGES[0];
}

/* Mensaje de conteo (sin penalizaciones) */
export function getCountLabel(count) {
  if (count === 0)  return 'Escribe tu primera reflexión';
  if (count === 1)  return '1 reflexión guardada';
  if (count < 10)  return `${count} reflexiones guardadas`;
  return `${count} reflexiones · tu jardín florece`;
}
