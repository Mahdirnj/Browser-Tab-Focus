/**
 * Persistent IndexedDB store for FocusLoom assets.
 *
 * Two object stores:
 *   - `thumbnails` — small WebP thumbnails of every background (bundled or
 *     custom), keyed by background ID. Used by the SettingsPanel grid.
 *   - `customBackgrounds` — full-size user-supplied backgrounds, keyed by ID.
 *     Each value is `{ id, label, dataUrl, addedAt }`.
 *
 * Cache survives tab close / refresh — IDs prefixed `custom:` for user
 * uploads coexist with the bundled `./pexels-…jpg` IDs without collision.
 */

const DB_NAME = 'focusloom-thumbs'
const DB_VERSION = 2
const THUMB_STORE = 'thumbnails'
const CUSTOM_STORE = 'customBackgrounds'

/** Singleton DB promise — opened once, reused everywhere. */
let _dbPromise = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(THUMB_STORE)) {
        db.createObjectStore(THUMB_STORE)
      }
      if (!db.objectStoreNames.contains(CUSTOM_STORE)) {
        db.createObjectStore(CUSTOM_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = (event) => resolve(event.target.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB open blocked'))
  })
}

function getDB() {
  if (!_dbPromise) _dbPromise = openDB()
  return _dbPromise
}

/* ─────────────────────────  Thumbnails  ───────────────────────── */

/**
 * Read a single thumbnail from IndexedDB.
 * @param {string} key - Background ID
 * @returns {Promise<string|null>} data URL or null on miss/error
 */
export async function getThumb(key) {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const req = db.transaction(THUMB_STORE, 'readonly').objectStore(THUMB_STORE).get(key)
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
      const tx = db.transaction(THUMB_STORE, 'readwrite')
      tx.objectStore(THUMB_STORE).put(dataUrl, key)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch {
    // Cache is best-effort; ignore write failures
  }
}

/**
 * Delete a thumbnail. Called when removing custom backgrounds so the
 * thumbnail store doesn't accumulate orphaned entries.
 * @param {string} key
 */
export async function deleteThumb(key) {
  try {
    const db = await getDB()
    await new Promise((resolve) => {
      const tx = db.transaction(THUMB_STORE, 'readwrite')
      tx.objectStore(THUMB_STORE).delete(key)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch {
    // ignored
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
      const tx = db.transaction(THUMB_STORE, 'readonly')
      const store = tx.objectStore(THUMB_STORE)
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

/* ────────────────────  Custom backgrounds  ──────────────────── */

/**
 * Persist a custom background record.
 * @param {{ id: string, label: string, dataUrl: string, addedAt?: number }} record
 */
export async function setCustomBackground(record) {
  if (!record?.id || !record?.dataUrl) return
  const db = await getDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_STORE, 'readwrite')
    tx.objectStore(CUSTOM_STORE).put({
      id: record.id,
      label: record.label ?? 'Custom',
      dataUrl: record.dataUrl,
      addedAt: record.addedAt ?? Date.now(),
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Read a single custom background record.
 * @param {string} id
 * @returns {Promise<{id:string,label:string,dataUrl:string,addedAt:number}|null>}
 */
export async function getCustomBackground(id) {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const req = db.transaction(CUSTOM_STORE, 'readonly').objectStore(CUSTOM_STORE).get(id)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Read every custom background record. Used to seed the SettingsPanel grid.
 * @returns {Promise<Array<{id:string,label:string,dataUrl:string,addedAt:number}>>}
 */
export async function getAllCustomBackgrounds() {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const tx = db.transaction(CUSTOM_STORE, 'readonly')
      const req = tx.objectStore(CUSTOM_STORE).getAll()
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : [])
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Delete a custom background and its thumbnail.
 * @param {string} id
 */
export async function deleteCustomBackground(id) {
  try {
    const db = await getDB()
    await new Promise((resolve) => {
      const tx = db.transaction(CUSTOM_STORE, 'readwrite')
      tx.objectStore(CUSTOM_STORE).delete(id)
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  } catch {
    // ignored
  }
  await deleteThumb(id)
}
