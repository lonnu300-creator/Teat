(function (root) {
  'use strict';
  const DB_NAME = 'farnava-local-db';
  const STORE_NAME = 'app-state';
  const KEY = 'main';
  let dbPromise;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in root)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Database open failed'));
    });
    return dbPromise;
  }
  async function getState() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      try { return JSON.parse(localStorage.getItem('farnava-state') || 'null'); } catch { return null; }
    }
  }
  async function saveState(state) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(state, KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Database write failed'));
        tx.onabort = () => reject(tx.error || new Error('Database write aborted'));
      });
      return true;
    } catch (error) {
      try { localStorage.setItem('farnava-state', JSON.stringify(state)); return true; }
      catch { throw new Error('فضای ذخیره‌سازی دستگاه کافی نیست. از اطلاعات پشتیبان بگیرید.'); }
    }
  }
  async function clearState() {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch { localStorage.removeItem('farnava-state'); }
  }
  root.FarnavaStorage = { getState, saveState, clearState };
})(window);
