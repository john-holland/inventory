/**
 * IndexedDB-backed CaveDB adapter for browser UI state, presence defer, snapshots.
 */

/** @typedef {import('log-view-machine/browser').CaveDBAdapter} CaveDBAdapter */

const DB_NAME = 'inventory-cave-ui';
const STORE = 'kv';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * @param {string} tomeId
 * @returns {CaveDBAdapter}
 */
export function createBrowserCaveDb(tomeId) {
  /** @type {Promise<IDBDatabase> | null} */
  let dbPromise = null;

  function ensureDb() {
    if (!dbPromise) dbPromise = openDb();
    return dbPromise;
  }

  async function withStore(mode, fn) {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
      fn(store, resolve, reject);
    });
  }

  const prefix = `${tomeId}:`;

  return {
    tomeId,
    async put(key, value) {
      await withStore('readwrite', (store) => {
        store.put(value, prefix + key);
      });
    },
    async get(key) {
      return new Promise((resolve, reject) => {
        withStore('readonly', (store) => {
          const req = store.get(prefix + key);
          req.onsuccess = () => resolve((req.result ?? null));
          req.onerror = () => reject(req.error);
        }).catch(reject);
      });
    },
    async find(selector) {
      const out = [];
      const db = await ensureDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve(out);
            return;
          }
          const key = String(cursor.key || '');
          if (key.startsWith(prefix)) {
            const doc = cursor.value;
            if (!selector || matchSelector(doc, selector)) {
              out.push(doc);
            }
          }
          cursor.continue();
        };
        req.onerror = () => reject(req.error);
      });
    },
    async findOne(selector) {
      const rows = await this.find(selector);
      return rows[0] || null;
    },
    async close() {
      if (!dbPromise) return;
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    },
  };
}

function matchSelector(doc, selector) {
  if (!doc || typeof doc !== 'object') return false;
  for (const [k, v] of Object.entries(selector)) {
    if ((doc)[k] !== v) return false;
  }
  return true;
}

/** @typedef {{ ok: boolean; token?: string | null }} PresenceRecord */

export async function readPresenceFromDb(db, key = 'presence:token') {
  const row = await db.get(key);
  return row?.token ?? null;
}

export async function writePresenceToDb(db, token, key = 'presence:token') {
  await db.put(key, { token, updatedAt: new Date().toISOString() });
}

/** @type {Map<string, import('./browserCaveDb.js').CaveDBAdapter>} */
const serviceDbCache = new Map();

/** Shared IndexedDB namespace per SOA service (all surfaces on that service). */
export function serviceCaveDbTomeId(service) {
  return `${service}-inventory-ui`;
}

/**
 * @param {string} service
 * @returns {import('./browserCaveDb.js').CaveDBAdapter}
 */
export function getServiceCaveDb(service) {
  const tomeId = serviceCaveDbTomeId(service);
  if (!serviceDbCache.has(tomeId)) {
    serviceDbCache.set(tomeId, createBrowserCaveDb(tomeId));
  }
  return serviceDbCache.get(tomeId);
}

/** @deprecated prefer getServiceCaveDb(service) for shared service namespace */
export function createServiceCaveDb(service) {
  return getServiceCaveDb(service);
}
