import { DEFAULT_BACKGROUND_ID, isCustomBackgroundId, loadBackgroundImage } from '../background'
import {
  ACTIVE_BACKGROUND_DATA_KEY,
  BACKGROUND_KEY,
} from '../constants/storageKeys'
import { readString } from '../utils/storage'

const CSS_VAR_NAME = '--instant-background-image'

function resolveStoredBackgroundId() {
  return readString(BACKGROUND_KEY, DEFAULT_BACKGROUND_ID)
}

/**
 * Paint the saved background as a CSS variable before React mounts so the
 * page never flashes its solid fallback. For bundled images we resolve the
 * Vite-emitted URL synchronously. For custom (user-uploaded) images, we keep
 * a tiny shadow copy of the active data URL in localStorage and use it here
 * — IndexedDB is async and would defeat the instant-paint guarantee.
 */
export function applyInstantBackground() {
  if (typeof document === 'undefined') return
  const selectedId = resolveStoredBackgroundId()

  let src = null
  if (isCustomBackgroundId(selectedId)) {
    const cached = readString(ACTIVE_BACKGROUND_DATA_KEY, '')
    if (cached) {
      src = cached
    }
  } else {
    src = loadBackgroundImage(selectedId)
  }

  // Always have a final fallback so the page never starts blank.
  if (!src) {
    src = loadBackgroundImage(DEFAULT_BACKGROUND_ID)
  }

  if (!src) return
  document.documentElement.style.setProperty(
    CSS_VAR_NAME,
    `url("${src}")`,
  )
}
