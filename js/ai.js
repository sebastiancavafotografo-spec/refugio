/* ═══════════════════════════════════════════
   ai.js — Clasificador + API Anthropic (mejorado)
═══════════════════════════════════════════ */

/* Indicadores de bloqueo/agobio operativo — español e inglés */
const OVERWHELM_KW = [
  // Bloqueo / indecisión
  'no sé', 'no se', 'no sé qué', 'no sé cómo', 'qué hago', 'que hago',
  'qué hacer', 'que hacer', 'cómo sigo', 'indeciso', 'indecisa',
  'indecisión', 'decidir', 'bloqueado', 'bloqueada', 'bloqueo',
  'stuck', 'atascado', 'atascada', 'paralizado', 'paralizada',
  // Agobio / estrés activo
  'agobiado', 'agobiada', 'agobio', 'abrumado', 'abrumada',
  'estresado', 'estresada', 'estrés', 'estres', 'overwhelmed',
  'ansiedad', 'ansioso', 'ansiosa', 'angustia', 'angustiado',
  // Cansancio extremo
  'no puedo más', 'no puedo mas', 'ya no puedo', 'agotado', 'agotada',
  'exhausto', 'exhausta', 'sin energía', 'sin energia', 'sin fuerzas',
  'burnout', 'harto', 'harta', 'hasta aquí', 'hasta aqui',
  // Pérdida / desorientación
  'perdido', 'perdida', 'sin rumbo', 'sin norte', 'qué elijo',
  // Petición de orientación
  'ayuda', 'necesito ayuda', 'qué hago con', 'no sé por dónde',
  'help', 'necesito que alguien',
];

/* Variantes del mensaje de "guardado" */
const SAVED_MSGS = [
  'Guardado en tu refugio',
  'Aquí estará siempre, a salvo',
  'Tu palabra ha encontrado su lugar',
  'Escuchado con calma',
  'Guardado. Este espacio es tuyo',
  'Recibido con cuidado',
  'Ya está aquí, contigo',
];

/* Pool de micro-acciones por categoría */
const MICRO_ACTIONS = {
  cuerpo: [
    'Bebe un vaso de agua despacio, sin prisa',
    'Estira los hombros hacia atrás y suelta el aire',
    'Haz 3 respiraciones: inhala 4 s, exhala 6 s',
    'Ponte de pie y sacude el cuerpo 30 segundos',
    'Cierra los ojos y escucha solo los sonidos cercanos',
  ],
  mente: [
    'Escribe en papel una sola cosa que puedas hacer ahora',
    '¿Cuál es el siguiente paso más pequeño posible?',
    'Anota lo que te agobia y apártalo mentalmente por hoy',
    'Pon una alarma en 10 min y descansa sin culpa hasta entonces',
    'Dibuja o garabatea algo sin pensar durante 2 minutos',
  ],
  entorno: [
    'Da un paseo de 5 minutos, sin teléfono',
    'Sal a una ventana y observa el exterior un momento',
    'Prepárate una bebida caliente y bébela sin hacer nada más',
    'Pon una canción que te relaje o te levante el ánimo',
    'Ordena solo una superficie pequeña de tu espacio',
  ],
  conexion: [
    'Escríbele un mensaje corto a alguien que te importa',
    'Recuerda algo que salió bien esta semana, lo que sea',
    'Reconoce en voz alta que hoy está siendo difícil',
    'Llama a alguien de confianza, aunque sea 5 minutos',
  ],
};

const ALL_ACTIONS = Object.values(MICRO_ACTIONS).flat();

export function getMicroActions(n = 2) {
  /* Mezcla asegurando categorías distintas cuando n >= 2 */
  const cats = Object.values(MICRO_ACTIONS);
  const picks = [];
  const usedCats = new Set();
  const shuffled = cats.map(c => c.sort(() => Math.random() - 0.5));

  for (let i = 0; picks.length < n && i < 30; i++) {
    const catIdx = i % shuffled.length;
    if (!usedCats.has(catIdx) && shuffled[catIdx].length) {
      picks.push(shuffled[catIdx].shift());
      usedCats.add(catIdx);
    }
  }
  if (picks.length < n) {
    const remaining = ALL_ACTIONS.filter(a => !picks.includes(a))
      .sort(() => Math.random() - 0.5);
    picks.push(...remaining.slice(0, n - picks.length));
  }
  return picks;
}

export function getSavedMessage() {
  return SAVED_MSGS[Math.floor(Math.random() * SAVED_MSGS.length)];
}

/* Clasificador local (sin API) */
export function classifyEntry(text) {
  const lower = text.toLowerCase();
  return OVERWHELM_KW.some(kw => lower.includes(kw)) ? 'action' : 'reflect';
}

/* ── Llamada real a Anthropic ── */
export async function callAnthropicAPI(text, apiKey) {
  const system = `Eres el núcleo empático de Refugio, un diario de bienestar mental.
Analiza la entrada del usuario y devuelve ÚNICAMENTE un JSON, sin texto adicional.

Reglas de clasificación:
• "reflect" → reflexión, sentimiento, vivencia, desahogo emocional, gratitud, relato
• "action"  → bloqueo operativo, agobio activo, incapacidad de decidir, petición de orientación concreta

Formato de respuesta:
- Si reflect: {"type":"reflect"}
- Si action:  {"type":"action","actions":["acción 1","acción 2"]}

Reglas para micro-acciones:
• Máximo 9 palabras por acción
• Tono cálido y directo, nunca imperativo ni condescendiente
• Realizables en menos de 5 minutos, sin salir del lugar
• Una acción física y una mental si es posible
• En español, tuteo natural`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system,
      messages: [{ role: 'user', content: text.slice(0, 1200) }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const d = await res.json();
  const raw = d.content[0].text.replace(/```json?|```/g, '').trim();
  return JSON.parse(raw);
}

/* ── Resumen mensual con IA ── */
export async function generateMonthlyInsight(entries, apiKey) {
  if (!entries.length) return null;

  const sample = entries
    .slice(0, 15)
    .map(e => e.text.slice(0, 160))
    .join('\n—\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 160,
      system: `Eres el corazón de Refugio, un diario de bienestar.
Analiza estas entradas y escribe UN mensaje personal en 2-3 frases.
Destaca algo positivo, un patrón de crecimiento, o una fortaleza que el usuario muestra.
Tono: íntimo, cálido, como una nota de un amigo sabio. Sin datos, sin estadísticas.
Dirígete en segunda persona singular. Escribe el mensaje directamente, sin preámbulos.`,
      messages: [{ role: 'user', content: sample }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const d = await res.json();
  return d.content[0].text.trim();
}

/* ── Punto de entrada principal ── */
export async function analyze(text) {
  const apiKey = localStorage.getItem('refugio-api-key');
  if (apiKey) {
    try { return await callAnthropicAPI(text, apiKey); }
    catch { /* fallback a mock */ }
  }
  const type = classifyEntry(text);
  return type === 'action'
    ? { type: 'action', actions: getMicroActions(2) }
    : { type: 'reflect' };
}
