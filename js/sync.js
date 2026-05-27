/* ═══════════════════════════════════════════
   sync.js — Sincronización con Supabase
   Los datos viajan cifrados y bajo RLS:
   solo el usuario autenticado puede leerlos.
═══════════════════════════════════════════ */

const LS_URL = 'refugio-sb-url';
const LS_KEY = 'refugio-sb-key';

let sb = null; // cliente Supabase

/* Inicializa el cliente e inicia sesión anónima */
export async function initSupabase(url, key) {
  const { createClient } = await import(
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
  );
  sb = createClient(url, key);

  /* Auth anónima automática */
  const { data: { user } } = await sb.auth.getUser();
  if (!user) await sb.auth.signInAnonymously();

  localStorage.setItem(LS_URL, url);
  localStorage.setItem(LS_KEY, key);
  return sb;
}

/* Restaura sesión guardada en localStorage */
export async function restoreSupabase() {
  const url = localStorage.getItem(LS_URL);
  const key = localStorage.getItem(LS_KEY);
  if (!url || !key) return false;
  try {
    await initSupabase(url, key);
    return true;
  } catch { return false; }
}

export function isReady()  { return sb !== null; }

export async function getUser() {
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/* Sube todas las entradas locales (upsert por id único) */
export async function syncToCloud(entries) {
  if (!sb) throw new Error('Supabase no configurado');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const rows = entries.map(e => ({
    id:        `${user.id}_${e.timestamp}`,
    user_id:   user.id,
    text:      e.text,
    timestamp: e.timestamp,
    date:      e.date,
    hour:      e.hour,
  }));

  const { error } = await sb.from('entries').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return rows.length;
}

/* Descarga entradas desde Supabase */
export async function syncFromCloud() {
  if (!sb) throw new Error('Supabase no configurado');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await sb
    .from('entries')
    .select('text, timestamp, date, hour')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/* SQL para crear la tabla (pegar en Supabase SQL Editor) */
export function getSQL() {
  return `-- Refugio · Tabla de entradas
-- Pega esto en Supabase → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS entries (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  timestamp   BIGINT NOT NULL,
  date        TEXT NOT NULL,
  hour        SMALLINT NOT NULL,
  synced_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Solo el propietario puede leer y modificar sus entradas
CREATE POLICY "Propietario gestiona sus entradas"
  ON entries FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`;
}
