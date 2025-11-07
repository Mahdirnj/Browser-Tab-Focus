const hasWindow = typeof window !== 'undefined'

function getStorage() {
  if (!hasWindow) return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readString(key, fallback = '') {
  const storage = getStorage()
  if (!storage) return fallback
  const value = storage.getItem(key)
  return value ?? fallback
}

export function writeString(key, value) {
  const storage = getStorage()
  if (!storage) return
  if (value === undefined || value === null) {
    storage.removeItem(key)
    return
  }
  storage.setItem(key, String(value))
}

export function readJSON(key, fallback = null) {
  const storage = getStorage()
  if (!storage) return fallback
  const raw = storage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`Unable to parse stored value for ${key}`, error)
    storage.removeItem(key)
    return fallback
  }
}

export function writeJSON(key, value) {
  const storage = getStorage()
  if (!storage) return
  if (value === undefined) {
    storage.removeItem(key)
    return
  }
  storage.setItem(key, JSON.stringify(value))
}

export function removeKey(key) {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(key)
}
