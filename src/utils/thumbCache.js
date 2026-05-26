/**
 * Persistent IndexedDB cache for background thumbnails.
 * Keys are background IDs (stable filenames). Values are WebP data URLs.
 * Cache survives tab close / refresh — thumbnails only regenerate once per
 * extension install (or after a cache clear).
 */

const DB_NAME = 'focusloom-thumbs'
const DB_VERSION = 1
const STORE = 'thumbnails'

/** Singleton DB promise — opened once, reused everywhere. */
let _dbPromise = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE)
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

function getDB() {
  if (!_dbPromise) _dbPromise = openDB()
  return _dbPromise
}

/**
 * Read a single thumbnail from IndexedDB.
 * @param {string} key - Background ID
 * @returns {Promise<string|null>} data URL or null on miss/error
 */
export async function getThumb(key) {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Persist a generated thumbnail to IndexedDB.
 * Fire-and-forget — errors are swallowed since the cache is best-effort.
 * @param {string} key - Background ID
 * @param {string} dataUrl - WebP data URL
 */
export async function setThumb(key, dataUrl) {
  try {
    const db = await getDB()
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, key)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch {
    // Cache is best-effort; ignore write failures
  }
}

/**
 * Batch-load thumbnails for multiple keys in a single IDB transaction.
 * Returns only the keys that actually had a cached value.
 * @param {string[]} keys
 * @returns {Promise<Record<string, string>>}
 */
export async function loadAllThumbs(keys) {
  if (!keys.length) return {}
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const out = {}
      let pending = keys.length
      const done = () => {
        if (--pending === 0) resolve(out)
      }
      for (const key of keys) {
        const req = store.get(key)
        req.onsuccess = () => {
          if (req.result) out[key] = req.result
          done()
        }
        req.onerror = done
      }
    })
  } catch {
    return {}
  }
}
