/**
 * OpenWeather API key storage with extension-aware backing.
 *
 * - In Chrome extension context (chrome.storage.local available) the key is
 *   stored in chrome.storage.local. localStorage is also kept in sync so the
 *   page can boot synchronously without showing an empty Weather widget.
 * - In a plain web context, only localStorage is used.
 *
 * Migration: on first call to `loadWeatherApiKey()` in extension context, if
 * localStorage has a value but chrome.storage.local doesn't, the value is
 * copied to chrome.storage.local. The localStorage mirror is preserved as a
 * sync fast-path.
 */

import { WEATHER_API_KEY_KEY } from '../constants/storageKeys'
import { readString, removeKey, writeString } from './storage'

function getChromeStorage() {
  if (typeof globalThis === 'undefined') return null
  // eslint-disable-next-line no-undef
  const c = typeof chrome !== 'undefined' ? chrome : null
  if (!c?.storage?.local) return null
  return c.storage.local
}

export function isExtensionStorageAvailable() {
  return getChromeStorage() !== null
}

/** Synchronous read from localStorage. Cheap, used at component init. */
export function readWeatherApiKeySync() {
  return readString(WEATHER_API_KEY_KEY, '')
}

function chromeGet(key) {
  const store = getChromeStorage()
  if (!store) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    try {
      store.get([key], (result) => {
        resolve(result?.[key])
      })
    } catch {
      resolve(undefined)
    }
  })
}

function chromeSet(key, value) {
  const store = getChromeStorage()
  if (!store) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      store.set({ [key]: value }, () => resolve())
    } catch {
      resolve()
    }
  })
}

function chromeRemove(key) {
  const store = getChromeStorage()
  if (!store) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      store.remove([key], () => resolve())
    } catch {
      resolve()
    }
  })
}

/**
 * Async read. In extension context prefers chrome.storage.local and migrates
 * any orphan localStorage value into it. Returns the resolved key string.
 */
export async function loadWeatherApiKey() {
  if (!isExtensionStorageAvailable()) {
    return readWeatherApiKeySync()
  }

  const fromExtension = await chromeGet(WEATHER_API_KEY_KEY)
  const fromLocal = readWeatherApiKeySync()

  if (typeof fromExtension === 'string' && fromExtension) {
    // Mirror to localStorage for sync init next time
    if (fromExtension !== fromLocal) writeString(WEATHER_API_KEY_KEY, fromExtension)
    return fromExtension
  }

  // Migrate localStorage value into chrome.storage.local
  if (fromLocal) {
    await chromeSet(WEATHER_API_KEY_KEY, fromLocal)
    return fromLocal
  }

  return ''
}

/** Persist the key to both stores so reads are consistent. */
export async function saveWeatherApiKey(value) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    removeKey(WEATHER_API_KEY_KEY)
    if (isExtensionStorageAvailable()) await chromeRemove(WEATHER_API_KEY_KEY)
    return
  }
  writeString(WEATHER_API_KEY_KEY, trimmed)
  if (isExtensionStorageAvailable()) await chromeSet(WEATHER_API_KEY_KEY, trimmed)
}
