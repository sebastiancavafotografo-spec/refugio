/* ═══════════════════════════════════════════
   app.js — Controlador principal de Refugio v1.1
   Características: jardín · IA · voz · Unsplash · Supabase · modo oscuro
═══════════════════════════════════════════ */

import { RefugioDB }       from './db.js';
import { getStage, getCountLabel } from './garden.js';
import { analyze, getSavedMessage, generateMonthlyInsight } from './ai.js';
import { restoreSupabase, initSupabase, syncToCloud, isReady, getSQL } from './sync.js';

const db = new RefugioDB();

/* ── Stopwords para análisis de palabras ── */
const STOP = new Set([
  'de','la','el','en','y','a','que','se','no','un','una','los','las','del',
  'por','con','es','para','le','lo','me','te','mi','su','al','más','mas',
  'pero','como','si','hay','ya','fue','era','ser','este','esta','ese','eso',
  'muy','todo','bien','tan','también','tambien','cuando','he','ha','son',
  'o','e','ni','porque','donde','hoy','ayer','día','dia','días','dias',
  'estar','estoy','estaba','tengo','tiene','hacer','así','asi','sin','entre',
  'antes','después','despues','sobre','desde','hasta','soy','fui','voy',
  'uno','dos','tres','sus','tus','nos','les','qué','cómo','cuándo','dónde',
  'quién','han','una','unas','unos','este','estos','estas','ese','esos',
]);

/* ════════════════════════════════════════
   UTILIDADES
════════════════════════════════════════ */
const $ = id => document.getElementById(id);

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatDateLong(d = new Date()) {
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatHour(h) {
  const h12   = h % 12 || 12;
  const label = h < 12 ? 'de la mañana' : h < 17 ? 'de la tarde' : 'de la noche';
  return `${h12}:00 ${label}`;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

let toastTimer;
function showToast(msg, ms = 2800) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => { t.hidden = true; }, 350);
  }, ms);
}

function getTopWords(entries, n = 14) {
  const freq = {};
  for (const e of entries) {
    const words = e.text
      .toLowerCase()
      .replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ\s]/g, ' ')
      .split(/\s+/);
    for (const w of words) {
      if (w.length < 4 || STOP.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function getOptimalHour(entries) {
  if (entries.length < 3) return null;
  const freq = {};
  for (const e of entries) freq[e.hour] = (freq[e.hour] || 0) + 1;
  return +Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/* ════════════════════════════════════════
   MODO OSCURO
════════════════════════════════════════ */
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function applyTheme(dark) {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('refugio-dark', String(dark));
  updateThemeBtn();
  const toggle = $('toggle-darkmode');
  if (toggle) toggle.checked = dark;
}

function updateThemeBtn() {
  const btn = $('theme-toggle');
  if (!btn) return;
  const dark = isDark();
  btn.setAttribute('aria-pressed', String(dark));
  btn.title = dark ? 'Modo claro' : 'Modo oscuro';
}

function initDarkMode() {
  const saved = localStorage.getItem('refugio-dark') === 'true';
  applyTheme(saved);
}

/* ════════════════════════════════════════
   NAVEGACIÓN
════════════════════════════════════════ */
let currentView = 'garden';

function navigate(viewId) {
  if (viewId === currentView) return;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-current', 'false');
  });
  const section = $(`view-${viewId}`);
  const navBtn  = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  section?.classList.add('active');
  if (navBtn) { navBtn.classList.add('active'); navBtn.setAttribute('aria-current', 'page'); }
  currentView = viewId;
  if (viewId === 'insights') renderInsights();
  if (viewId === 'write')    updateWriteDate();
}

/* ════════════════════════════════════════
   JARDÍN
════════════════════════════════════════ */
async function renderGarden() {
  const entries = await db.getAllEntries();
  const count   = entries.length;
  const stage   = getStage(count);

  $('garden-art').innerHTML          = stage.svg;
  $('garden-stage-label').textContent = stage.label;
  $('garden-count').textContent      = getCountLabel(count);
  renderRecentEntries(entries.slice(0, 6));
}

function renderRecentEntries(entries) {
  const list  = $('entries-list');
  const empty = $('entries-empty');
  const title = $('entries-preview-title');
  list.innerHTML = '';

  if (!entries.length) {
    empty.hidden = false;
    title.hidden = true;
    return;
  }
  empty.hidden = true;
  title.hidden = false;

  for (const e of entries) {
    const preview = e.text.length > 90 ? e.text.slice(0, 90).trimEnd() + '…' : e.text;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <span class="entry-card-date">${formatDate(e.timestamp)}</span>
      <span class="entry-card-text">${preview.replace(/</g, '&lt;')}</span>`;
    list.appendChild(card);
  }
}

/* ════════════════════════════════════════
   ESCRIBIR
════════════════════════════════════════ */
function updateWriteDate() {
  $('write-date').textContent = formatDateLong();
}

function updateWordCount() {
  const n = countWords($('entry-textarea').value);
  $('word-count').textContent = n === 1 ? '1 palabra' : `${n} palabras`;
}

async function handleSave() {
  const textarea = $('entry-textarea');
  const text     = textarea.value.trim();
  if (!text) { showToast('Escribe algo primero'); return; }

  if (isRecording) stopRecording();

  const btn = $('btn-save');
  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  try {
    await db.saveEntry(text);

    const [result, photo] = await Promise.all([
      analyze(text),
      fetchUnsplashReward(),
    ]);

    showAIResponse(result);
    if (photo) showRewardImage(photo);

    textarea.value = '';
    $('word-count').textContent = '0 palabras';
    $('ai-response').hidden = false;

    renderGarden();

    /* Auto-sync si Supabase está listo */
    if (isReady()) {
      db.getAllEntries().then(entries => syncToCloud(entries)).catch(() => {});
    }
  } catch (err) {
    showToast('Algo salió mal. Inténtalo de nuevo.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar en tu refugio';
  }
}

function showAIResponse(result) {
  const wrapper     = $('ai-response');
  const savedDiv    = $('ai-saved');
  const actionsDiv  = $('ai-actions');

  wrapper.hidden    = false;
  savedDiv.hidden   = true;
  actionsDiv.hidden = true;

  /* Re-trigger animation */
  wrapper.style.animation = 'none';
  void wrapper.offsetHeight;
  wrapper.style.animation = '';

  if (result.type === 'action' && result.actions?.length) {
    actionsDiv.hidden = false;
    $('micro-action-list').innerHTML = result.actions
      .map(a => `<li>${a.replace(/</g, '&lt;')}</li>`)
      .join('');
  } else {
    savedDiv.hidden = false;
    $('ai-saved-text').textContent = getSavedMessage();
  }
}

/* ════════════════════════════════════════
   UNSPLASH — imágenes de recompensa
════════════════════════════════════════ */
const UNSPLASH_TERMS = [
  'vintage botanical illustration',
  'minimalist nature macro photography',
  'botanical leaves minimal',
  'morning light forest',
  'fern macro detail',
  'moss garden minimal',
  'seed sprout photography',
  'watercolor botanical',
  'pressed flowers minimal',
  'green leaf macro texture',
];

async function fetchUnsplashReward() {
  const key = localStorage.getItem('refugio-unsplash-key');
  if (!key) return null;
  const term = UNSPLASH_TERMS[Math.floor(Math.random() * UNSPLASH_TERMS.length)];
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(term)}&orientation=squarish`,
      { headers: { 'Authorization': `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      url:      d.urls.regular,
      alt:      d.alt_description || 'Imagen botánica',
      user:     d.user.name,
      userLink: `${d.user.links.html}?utm_source=refugio&utm_medium=referral`,
    };
  } catch { return null; }
}

function showRewardImage(photo) {
  const card = $('reward-card');
  const img  = $('reward-img');
  const attr = $('reward-attribution');

  img.src          = photo.url;
  img.alt          = photo.alt;
  attr.href        = photo.userLink;
  attr.textContent = `${photo.user} · Unsplash`;
  card.hidden      = false;
}

/* ════════════════════════════════════════
   VOZ — Web Speech API
════════════════════════════════════════ */
let recognition  = null;
let isRecording  = false;

function initVoiceInput() {
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn    = $('btn-mic');
  if (!micBtn) return;

  if (!SpeechAPI) {
    micBtn.disabled = true;
    micBtn.title    = 'Voz no disponible en este navegador';
    return;
  }

  recognition              = new SpeechAPI();
  recognition.lang         = 'es-ES';
  recognition.continuous   = true;
  recognition.interimResults = true;

  let baseText     = '';
  let finalChunk   = '';

  recognition.onstart = () => {
    isRecording  = true;
    baseText     = $('entry-textarea').value;
    finalChunk   = '';
    micBtn.classList.add('recording');
    micBtn.setAttribute('aria-label', 'Detener grabación de voz');
  };

  recognition.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalChunk += t + ' ';
      } else {
        interim = t;
      }
    }
    const sep  = baseText ? '\n' : '';
    $('entry-textarea').value = baseText + sep + finalChunk + interim;
    updateWordCount();
  };

  recognition.onerror = e => {
    if (e.error !== 'aborted') showToast('Micrófono: ' + e.error);
    stopRecording();
  };

  /* Chrome para el móvil detiene automáticamente; relanzar si sigue activo */
  recognition.onend = () => {
    if (isRecording) {
      try { recognition.start(); } catch {}
    }
  };

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      try { recognition.start(); }
      catch { showToast('No se pudo acceder al micrófono'); }
    }
  });
}

function stopRecording() {
  isRecording = false;
  recognition?.stop();
  const micBtn = $('btn-mic');
  micBtn?.classList.remove('recording');
  micBtn?.setAttribute('aria-label', 'Entrada de voz');
}

/* ════════════════════════════════════════
   INSIGHTS
════════════════════════════════════════ */
async function renderInsights() {
  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth();
  const entries = await db.getEntriesForMonth(year, month);
  const all     = await db.getAllEntries();

  $('insights-month').textContent = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  /* Hora óptima */
  const optH = getOptimalHour(all);
  if (optH !== null) {
    $('insight-time-value').textContent = formatHour(optH);
    $('insight-time-note').textContent  = 'Tu momento más frecuente de escritura';
  } else {
    $('insight-time-value').textContent = '—';
    $('insight-time-note').textContent  = 'Escribe más días para descubrirlo';
  }

  renderWordDisplay(getTopWords(entries));
  renderRhythmGrid(entries, year, month);
  renderMonthlyMessage(entries);
}

function renderWordDisplay(words) {
  const container = $('word-display');
  container.innerHTML = '';
  if (!words.length) {
    container.innerHTML = '<em style="color:var(--text-soft);font-style:italic">Aún no hay palabras este mes.</em>';
    return;
  }
  const maxFreq = words[0]?.[1] ?? 1;
  for (const [word, freq] of words) {
    const ratio = freq / maxFreq;
    const size  = (0.82 + ratio * 1.0).toFixed(2);
    const op    = (0.5 + ratio * 0.5).toFixed(2);
    const span  = document.createElement('span');
    span.className = 'word-tag';
    span.textContent = word;
    span.style.cssText = `font-size:${size}rem;opacity:${op}`;
    container.appendChild(span);
  }
}

function renderRhythmGrid(entries, year, month) {
  const grid  = $('rhythm-grid');
  grid.innerHTML = '';
  const today = new Date();
  const days  = new Date(year, month + 1, 0).getDate();
  const active = new Set(entries.map(e => new Date(e.timestamp).getDate()));

  for (let d = 1; d <= days; d++) {
    const dot    = document.createElement('div');
    dot.className = 'rhythm-dot';
    dot.title     = `${d}`;
    const isToday  = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isFuture = new Date(year, month, d) > today;
    if (active.has(d))         dot.classList.add('active');
    if (isToday)               dot.classList.add('today');
    if (isFuture && !isToday)  dot.classList.add('future');
    grid.appendChild(dot);
  }
}

async function renderMonthlyMessage(entries) {
  const el  = $('insight-message');
  if (!entries.length) { el.textContent = 'Comienza a escribir este mes para ver tu resumen.'; return; }

  const apiKey = localStorage.getItem('refugio-api-key');
  if (apiKey) {
    try {
      const msg = await generateMonthlyInsight(entries, apiKey);
      if (msg) { el.textContent = msg; return; }
    } catch {}
  }

  const n = entries.length;
  const msgs = [
    [1,  2,  'Cada pequeño inicio es un acto de valor. Aquí empieza tu jardín.'],
    [3,  6,  'Has creado un espacio de reflexión para ti. Eso vale mucho.'],
    [7,  14, 'Tu jardín crece con tus palabras. Sigue cultivándolo con calma.'],
    [15, 25, 'Este mes has dedicado tiempo a escucharte. Eso se nota en las raíces.'],
    [26, Infinity, 'Has cultivado la mente con dedicación este mes. Tu árbol interior está fuerte.'],
  ];
  const match = msgs.find(([min, max]) => n >= min && n <= max);
  el.textContent = match?.[2] ?? 'Sigue escribiendo. Cada entrada es una semilla.';
}

/* ════════════════════════════════════════
   NOTIFICACIONES
════════════════════════════════════════ */
let notifTimer = null;

function getSettings() {
  return {
    notifOn     : localStorage.getItem('refugio-notif')   === 'true',
    weekendOff  : localStorage.getItem('refugio-weekend') === 'true',
    silenceFull : localStorage.getItem('refugio-silence') === 'true',
  };
}

function isSilenced() {
  const { notifOn, weekendOff, silenceFull } = getSettings();
  if (!notifOn || silenceFull) return true;
  if (weekendOff) { const d = new Date().getDay(); if (d === 0 || d === 6) return true; }
  return false;
}

async function scheduleNotif() {
  clearTimeout(notifTimer);
  if (isSilenced()) return;
  const all  = await db.getAllEntries();
  const hour = getOptimalHour(all) ?? 20;
  const now  = new Date();
  const tgt  = new Date(); tgt.setHours(hour, 0, 0, 0);
  if (tgt <= now) tgt.setDate(tgt.getDate() + 1);
  notifTimer = setTimeout(fireNotif, tgt.getTime() - now.getTime());
}

async function fireNotif() {
  if (isSilenced()) return;
  const msgs = [
    'Tu espacio de reflexión te espera 🌱',
    'Un momento para ti, cuando quieras',
    'Tu jardín aguarda tus palabras',
    'Refugio está listo cuando tú lo estés',
  ];
  if (Notification.permission === 'granted') {
    new Notification('Refugio', {
      body: msgs[Math.floor(Math.random() * msgs.length)],
      silent: true,
    });
  }
  scheduleNotif();
}

async function requestNotifPerm() {
  if ('Notification' in window && Notification.permission === 'default') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') {
      $('toggle-notifications').checked = false;
      localStorage.setItem('refugio-notif', 'false');
      showToast('Notificaciones no permitidas por el sistema');
    }
  }
}

/* ════════════════════════════════════════
   SILENCIO (header)
════════════════════════════════════════ */
function updateSilenceBtn() {
  const { silenceFull } = getSettings();
  const btn = $('silence-toggle');
  btn.setAttribute('aria-pressed', String(silenceFull));
  btn.classList.toggle('silenced', silenceFull);
  btn.querySelector('.icon-bell').style.display     = silenceFull ? 'none' : '';
  btn.querySelector('.icon-bell-off').style.display = silenceFull ? '' : 'none';
  const t = $('toggle-silence');
  if (t) t.checked = silenceFull;
}

/* ════════════════════════════════════════
   EXPORTAR
════════════════════════════════════════ */
async function exportEntries() {
  const entries = await db.getAllEntries();
  if (!entries.length) { showToast('No hay entradas para exportar'); return; }
  const lines = entries.map(e => `[${new Date(e.timestamp).toLocaleString('es-ES')}]\n${e.text}`);
  const blob  = new Blob([lines.join('\n\n─────────────────\n\n')], { type: 'text/plain;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `refugio-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Reflexiones exportadas');
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
async function init() {
  await db.open();

  initDarkMode();
  await renderGarden();
  updateWriteDate();
  updateSilenceBtn();
  initVoiceInput();

  /* Restaurar Supabase si había credenciales */
  const sbReady = await restoreSupabase();
  if (sbReady) {
    $('btn-sync-now').disabled = false;
    $('sb-status').textContent = 'Conectado';
    $('sb-status').className   = 'api-key-status ok';
  }

  /* ── Navegación ── */
  document.querySelectorAll('.nav-item[data-view]').forEach(btn =>
    btn.addEventListener('click', () => navigate(btn.dataset.view))
  );

  /* ── Escribir ── */
  const textarea = $('entry-textarea');
  textarea.addEventListener('input', () => {
    updateWordCount();
    if (textarea.value.trim()) $('ai-response').hidden = true;
  });
  $('btn-save').addEventListener('click', handleSave);
  textarea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
  });

  /* ── Reward dismiss ── */
  $('reward-dismiss')?.addEventListener('click', () => {
    $('reward-card').hidden = true;
  });

  /* ── Modo oscuro ── */
  $('theme-toggle').addEventListener('click', () => {
    applyTheme(!isDark());
    showToast(isDark() ? 'Modo oscuro activado' : 'Modo claro activado');
  });

  /* ── Modo silencio (header) ── */
  $('silence-toggle').addEventListener('click', () => {
    const now = localStorage.getItem('refugio-silence') === 'true';
    localStorage.setItem('refugio-silence', String(!now));
    updateSilenceBtn();
    showToast(now ? 'Modo Silencio desactivado' : 'Modo Silencio activado');
    scheduleNotif();
  });

  /* ── Settings: toggles ── */
  const s = getSettings();
  $('toggle-darkmode').checked       = isDark();
  $('toggle-notifications').checked  = s.notifOn;
  $('toggle-weekend').checked        = s.weekendOff;
  $('toggle-silence').checked        = s.silenceFull;

  $('toggle-darkmode').addEventListener('change', e => applyTheme(e.target.checked));

  $('toggle-notifications').addEventListener('change', async e => {
    localStorage.setItem('refugio-notif', String(e.target.checked));
    if (e.target.checked) { await requestNotifPerm(); scheduleNotif(); }
    else clearTimeout(notifTimer);
  });
  $('toggle-weekend').addEventListener('change',  e => {
    localStorage.setItem('refugio-weekend', String(e.target.checked));
    scheduleNotif();
  });
  $('toggle-silence').addEventListener('change', e => {
    localStorage.setItem('refugio-silence', String(e.target.checked));
    updateSilenceBtn();
    scheduleNotif();
  });

  /* ── API Key Anthropic ── */
  if (localStorage.getItem('refugio-api-key')) {
    $('api-key-input').value         = '••••••••••••••';
    $('api-key-status').textContent  = 'Clave guardada · IA real activa';
    $('api-key-status').className    = 'api-key-status ok';
  }
  $('btn-save-api-key').addEventListener('click', () => {
    const val = $('api-key-input').value.trim();
    if (!val || val.startsWith('•')) { showToast('Introduce una clave válida'); return; }
    if (!val.startsWith('sk-ant-')) {
      $('api-key-status').textContent = 'Debe empezar por sk-ant-';
      $('api-key-status').className   = 'api-key-status err';
      return;
    }
    localStorage.setItem('refugio-api-key', val);
    $('api-key-input').value         = '••••••••••••••';
    $('api-key-status').textContent  = 'Clave guardada · IA real activa';
    $('api-key-status').className    = 'api-key-status ok';
    showToast('Clave de API guardada');
  });

  /* ── Unsplash ── */
  if (localStorage.getItem('refugio-unsplash-key')) {
    $('unsplash-key-input').value       = '••••••••••••••';
    $('unsplash-key-status').textContent = 'Clave guardada · Imágenes activas';
    $('unsplash-key-status').className   = 'api-key-status ok';
  }
  $('btn-save-unsplash').addEventListener('click', () => {
    const val = $('unsplash-key-input').value.trim();
    if (!val || val.startsWith('•')) { showToast('Introduce una clave válida'); return; }
    localStorage.setItem('refugio-unsplash-key', val);
    $('unsplash-key-input').value        = '••••••••••••••';
    $('unsplash-key-status').textContent  = 'Clave guardada · Imágenes activas';
    $('unsplash-key-status').className    = 'api-key-status ok';
    showToast('Unsplash configurado');
  });

  /* ── Supabase ── */
  $('btn-connect-supabase').addEventListener('click', async () => {
    const url = $('sb-url-input').value.trim();
    const key = $('sb-key-input').value.trim();
    if (!url || !key) { showToast('Completa URL y clave'); return; }
    try {
      $('sb-status').textContent = 'Conectando…';
      $('sb-status').className   = 'api-key-status';
      await initSupabase(url, key);
      $('sb-status').textContent = 'Conectado correctamente';
      $('sb-status').className   = 'api-key-status ok';
      $('btn-sync-now').disabled = false;
      showToast('Supabase conectado');
    } catch (e) {
      $('sb-status').textContent = 'Error: ' + e.message;
      $('sb-status').className   = 'api-key-status err';
    }
  });

  $('btn-sync-now').addEventListener('click', async () => {
    try {
      $('sb-status').textContent = 'Sincronizando…';
      const entries = await db.getAllEntries();
      const n = await syncToCloud(entries);
      $('sb-status').textContent = `${n} entradas en la nube · ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      $('sb-status').className   = 'api-key-status ok';
      showToast(`${n} reflexiones sincronizadas`);
    } catch (e) {
      $('sb-status').textContent = 'Error: ' + e.message;
      $('sb-status').className   = 'api-key-status err';
    }
  });

  $('btn-copy-sql').addEventListener('click', () => {
    navigator.clipboard.writeText(getSQL())
      .then(() => showToast('SQL copiado al portapapeles'))
      .catch(() => showToast('No se pudo copiar'));
  });

  /* ── Exportar / Borrar ── */
  $('btn-export').addEventListener('click', exportEntries);
  $('btn-clear').addEventListener('click', async () => {
    if (!confirm('¿Borrar todas las reflexiones? Esta acción no se puede deshacer.')) return;
    await db.clearAll();
    await renderGarden();
    showToast('Todas las entradas borradas');
  });

  /* ── Service Worker ── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .catch(() => {});
    /* Recarga automática cuando un SW nuevo toma el control */
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  if (getSettings().notifOn) scheduleNotif();
}

document.addEventListener('DOMContentLoaded', init);
