/**
 * Settings export / import (IDEA-V2-008).
 *
 * Snapshots every persisted FocusLoom preference into a portable JSON file
 * and restores it back. Covers:
 *   - All localStorage keys under `STORAGE_KEYS` plus the favicon cache and
 *     notification permission flag.
 *   - Custom backgrounds stored in IndexedDB (full data URLs are embedded).
 *
 * Format version 1 — bump if the payload shape changes incompatibly.
 */

import { STORAGE_KEYS } from '../constants/storageKeys'
import { getAllCustomBackgrounds, setCustomBackground } from './thumbCache'

/** Extra keys we want included that aren't in STORAGE_KEYS. */
const EXTRA_KEYS = [
  'focus_dashboard_faviconCache',
  'focus_notif_asked',
  'focus_dashboard_overlayStrength',
]

const FORMAT_VERSION = 1

function listAllExportableKeys() {
  return Array.from(new Set([...Object.values(STORAGE_KEYS), ...EXTRA_KEYS]))
}

/**
 * Build the export payload. Reads localStorage synchronously and pulls
 * custom backgrounds from IndexedDB.
 */
export async function exportAll() {
  const localStorageEntries = {}
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of listAllExportableKeys()) {
      const value = window.localStorage.getItem(key)
      if (value !== null) localStorageEntries[key] = value
    }
  }

  const customBackgrounds = await getAllCustomBackgrounds()

  return {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'FocusLoom',
    localStorage: localStorageEntries,
    customBackgrounds: Array.isArray(customBackgrounds) ? customBackgrounds : [],
  }
}

/** Trigger a browser download for the current settings snapshot. */
export async function downloadExport(filename) {
  const payload = await exportAll()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    filename ?? `focusloom-settings-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Validate a parsed JSON payload. Throws a friendly error if invalid.
 */
function validatePayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file. Expected a settings JSON object.')
  }
  if (data.version !== FORMAT_VERSION) {
    throw new Error(
      `Unsupported settings file version (got ${data.version}, expected ${FORMAT_VERSION}).`,
    )
  }
  if (data.localStorage && typeof data.localStorage !== 'object') {
    throw new Error('Invalid localStorage section in backup.')
  }
  if (data.customBackgrounds && !Array.isArray(data.customBackgrounds)) {
    throw new Error('Invalid customBackgrounds section in backup.')
  }
}

/**
 * Restore a settings snapshot. Overwrites the current localStorage entries
 * (only those we manage — unrelated keys are left alone) and re-imports
 * custom backgrounds into IndexedDB.
 *
 * Returns a count of restored entries for caller feedback.
 */
export async function importAll(data) {
  validatePayload(data)

  let lsCount = 0
  let bgCount = 0

  if (typeof window !== 'undefined' && window.localStorage) {
    const knownKeys = new Set(listAllExportableKeys())
    // Clear any currently stored values for the known keys
    for (const key of knownKeys) {
      window.localStorage.removeItem(key)
    }
    // Then write the imported values (only known keys, to avoid arbitrary writes)
    if (data.localStorage) {
      for (const [key, value] of Object.entries(data.localStorage)) {
        if (!knownKeys.has(key)) continue
        if (typeof value !== 'string') continue
        window.localStorage.setItem(key, value)
        lsCount += 1
      }
    }
  }

  if (Array.isArray(data.customBackgrounds)) {
    for (const record of data.customBackgrounds) {
      if (!record?.id || typeof record.dataUrl !== 'string') continue
      await setCustomBackground({
        id: record.id,
        label: record.label ?? 'Custom',
        dataUrl: record.dataUrl,
        addedAt: record.addedAt ?? Date.now(),
      })
      bgCount += 1
    }
  }

  return { localStorageCount: lsCount, customBackgroundCount: bgCount }
}

/** Read a File via FileReader, return parsed JSON. */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file.'))
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? '')))
      } catch {
        reject(new Error('That file is not valid JSON.'))
      }
    }
    reader.readAsText(file)
  })
}
