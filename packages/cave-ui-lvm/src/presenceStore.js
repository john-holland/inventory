/**
 * CaveDB-backed presence token storage for browser LVM surfaces.
 */

import { getServiceCaveDb, readPresenceFromDb, writePresenceToDb } from './browserCaveDb.js';

const DEFAULT_KEY = 'presence:token';

/** @param {string} [service] */
export function createPresenceStore(service = 'saurce') {
  /** @type {ReturnType<typeof getServiceCaveDb> | null} */
  let db = null;

  function getDb() {
    if (!db) db = getServiceCaveDb(service);
    return db;
  }

  return {
    get db() {
      return getDb();
    },
    async read() {
      return readPresenceFromDb(getDb(), DEFAULT_KEY);
    },
    async write(token) {
      if (token) {
        await writePresenceToDb(getDb(), token, DEFAULT_KEY);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('presence_token', token);
        }
      } else {
        await getDb().put(DEFAULT_KEY, { token: null, updatedAt: new Date().toISOString() });
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('presence_token');
        }
      }
    },
    readSync() {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('presence_token');
      }
      return null;
    },
  };
}

let storeByService = new Map();

/** @param {string} [service] */
export function getPresenceStore(service = 'saurce') {
  if (!storeByService.has(service)) {
    storeByService.set(service, createPresenceStore(service));
  }
  return storeByService.get(service);
}
