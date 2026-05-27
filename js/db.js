/* ═══════════════════════════════════════════
   db.js — Capa de persistencia (IndexedDB)
   Todas las entradas viven solo en este dispositivo.
═══════════════════════════════════════════ */

const DB_NAME    = 'refugio-v1';
const DB_VERSION = 1;
const STORE      = 'entries';

export class RefugioDB {
  constructor() { this._db = null; }

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = ({ target }) => {
        const db = target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('date',      'date');
        }
      };

      req.onsuccess = ({ target }) => { this._db = target.result; resolve(this._db); };
      req.onerror   = ({ target }) => reject(target.error);
    });
  }

  /* Guarda una entrada y devuelve el objeto completo con id */
  async saveEntry(text) {
    await this.open();
    const now   = new Date();
    const entry = {
      text,
      timestamp : now.getTime(),
      date      : now.toISOString().slice(0, 10), // 'YYYY-MM-DD'
      hour      : now.getHours(),
    };
    return new Promise((resolve, reject) => {
      const tx      = this._db.transaction(STORE, 'readwrite');
      const store   = tx.objectStore(STORE);
      const req     = store.add(entry);
      req.onsuccess = () => resolve({ ...entry, id: req.result });
      req.onerror   = () => reject(req.error);
    });
  }

  /* Todas las entradas, de más reciente a más antigua */
  async getAllEntries() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx    = this._db.transaction(STORE, 'readonly');
      const req   = tx.objectStore(STORE).index('timestamp').getAll();
      req.onsuccess = () => resolve(req.result.reverse());
      req.onerror   = () => reject(req.error);
    });
  }

  /* Entradas del mes indicado (month = 0-11) */
  async getEntriesForMonth(year, month) {
    const all = await this.getAllEntries();
    return all.filter(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  /* Elimina todo */
  async clearAll() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx    = this._db.transaction(STORE, 'readwrite');
      const req   = tx.objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }
}
