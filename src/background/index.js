import {
  getAllCustomBackgrounds,
  setCustomBackground as persistCustomBackground,
  deleteCustomBackground as removeCustomBackground,
} from '../utils/thumbCache'

const modules = import.meta.glob('./*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
})

const CUSTOM_PREFIX = 'custom:'

/**
 * localStorage keys we read at module load to seed the in-memory cache
 * synchronously. They match the constants in storageKeys.js. We avoid the
 * import here so this module stays lightweight and free of cycles.
 */
const ACTIVE_ID_LS_KEY = 'focus_dashboard_background'
const ACTIVE_DATA_LS_KEY = 'focus_dashboard_activeBackgroundData'

function formatLabel(path) {
  const file = path.split('/').pop() ?? ''
  const withoutExt = file.replace(/\.[^.]+$/, '')
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const sortedEntries = Object.entries(modules).sort(([a], [b]) =>
  a.localeCompare(b),
)

/** Bundled wallpaper options — static, known at build time. */
export const bundledBackgrounds = sortedEntries.map(([relativePath]) => ({
  id: relativePath,
  label: formatLabel(relativePath),
  isCustom: false,
}))

/**
 * Backwards-compatible export: bundled-only list. Prefer reading the merged
 * list from App.jsx state when custom backgrounds are needed.
 */
export const backgroundOptions = bundledBackgrounds

export const DEFAULT_BACKGROUND_ID =
  bundledBackgrounds[0]?.id ?? './sample-default'

/** In-memory cache of custom backgrounds keyed by ID. Hydrated from IDB. */
const customBackgrounds = new Map()
const subscribers = new Set()
let primePromise = null

/**
 * Synchronously seed the active custom background from localStorage so the
 * very first render of <BackgroundLayer> resolves to the right data URL —
 * IndexedDB priming happens async and would otherwise let a default image
 * flash through. We read straight from window.localStorage to keep this
 * module dependency-free and runnable before React mounts.
 */
function seedActiveCustomFromLocalStorage() {
  if (typeof window === 'undefined') return
  let activeId = ''
  let activeData = ''
  try {
    activeId = window.localStorage.getItem(ACTIVE_ID_LS_KEY) ?? ''
    activeData = window.localStorage.getItem(ACTIVE_DATA_LS_KEY) ?? ''
  } catch {
    // localStorage unavailable — nothing to seed
    return
  }
  if (!activeId.startsWith(CUSTOM_PREFIX) || !activeData) return
  customBackgrounds.set(activeId, {
    id: activeId,
    label: 'Custom',
    dataUrl: activeData,
    addedAt: Date.now(),
  })
}

seedActiveCustomFromLocalStorage()

function notify() {
  subscribers.forEach((fn) => {
    try {
      fn()
    } catch (error) {
      console.warn('Background subscriber threw', error)
    }
  })
}

/** Returns true if `id` looks like a custom background ID. */
export function isCustomBackgroundId(id) {
  return typeof id === 'string' && id.startsWith(CUSTOM_PREFIX)
}

/** Generate a fresh ID for a new custom background. */
export function makeCustomBackgroundId() {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${CUSTOM_PREFIX}${random}`
}

/**
 * Synchronously resolve a background ID to its underlying source.
 * Returns null when a custom ID hasn't been primed yet — call
 * primeCustomBackgrounds() once during app start before relying on it.
 *
 * @param {string} id
 * @returns {string | null}
 */
export function loadBackgroundImage(id) {
  if (typeof id !== 'string') return null
  if (isCustomBackgroundId(id)) {
    const record = customBackgrounds.get(id)
    return record?.dataUrl ?? null
  }
  const src = modules[id]
  if (typeof src === 'string') return src
  return null
}

/** Snapshot of all custom backgrounds, sorted oldest → newest. */
export function getCustomBackgroundsSnapshot() {
  return Array.from(customBackgrounds.values())
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))
    .map((record) => ({
      id: record.id,
      label: record.label || 'Custom',
      isCustom: true,
    }))
}

/**
 * Subscribe to changes in the custom-background set. Returns an unsubscribe
 * function. Used by App.jsx so the SettingsPanel grid stays in sync.
 */
export function subscribeBackgrounds(fn) {
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
  }
}

/**
 * Load all stored custom backgrounds from IndexedDB into memory.
 * Idempotent — safe to call multiple times.
 */
export function primeCustomBackgrounds() {
  if (primePromise) return primePromise
  primePromise = (async () => {
    const records = await getAllCustomBackgrounds()
    let changed = false
    for (const record of records) {
      if (record?.id && !customBackgrounds.has(record.id)) {
        customBackgrounds.set(record.id, record)
        changed = true
      }
    }
    if (changed) notify()
    return records
  })()
  return primePromise
}

/**
 * Add (or overwrite) a custom background.
 * @param {{ id: string, label?: string, dataUrl: string }} record
 */
export async function addCustomBackground(record) {
  const finalRecord = {
    id: record.id,
    label: record.label || 'Custom',
    dataUrl: record.dataUrl,
    addedAt: Date.now(),
  }
  await persistCustomBackground(finalRecord)
  customBackgrounds.set(finalRecord.id, finalRecord)
  notify()
  return finalRecord
}

/** Remove a custom background. Removes its thumbnail too. */
export async function deleteCustomBackground(id) {
  if (!isCustomBackgroundId(id)) return
  await removeCustomBackground(id)
  customBackgrounds.delete(id)
  notify()
}
