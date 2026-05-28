import { useEffect, useState } from 'react'
import { readJSON, readString, removeKey, writeJSON, writeString } from '../utils/storage'

/**
 * Hook: state that auto-syncs to localStorage.
 *
 * Collapses the common `useState` + `useEffect` pair that App.jsx had nine
 * copies of. Defaults to JSON serialization. For plain string values pass
 * `{ kind: 'string' }`.
 *
 * @template T
 * @param {string} key  localStorage key
 * @param {T} fallback  initial / fallback value
 * @param {{ kind?: 'json' | 'string', sanitize?: (raw: T) => T }} [options]
 * @returns {[T, (next: T) => void, () => void]} `[value, setValue, clear]`
 */
export function useStoredState(key, fallback, options = {}) {
  const { kind = 'json', sanitize } = options

  const [value, setValue] = useState(() => {
    const raw = kind === 'string' ? readString(key, fallback) : readJSON(key, fallback)
    return sanitize ? sanitize(raw) : raw
  })

  useEffect(() => {
    if (value === undefined || value === null) {
      removeKey(key)
      return
    }
    if (kind === 'string') {
      writeString(key, value)
    } else {
      writeJSON(key, value)
    }
  }, [key, kind, value])

  const clear = () => removeKey(key)

  return [value, setValue, clear]
}

export default useStoredState
