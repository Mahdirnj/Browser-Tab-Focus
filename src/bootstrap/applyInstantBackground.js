import { DEFAULT_BACKGROUND_ID, loadBackgroundImage } from '../background'
import { BACKGROUND_KEY } from '../constants/storageKeys'

const CSS_VAR_NAME = '--instant-background-image'

function resolveStoredBackgroundId() {
  try {
    if (typeof window === 'undefined') {
      return DEFAULT_BACKGROUND_ID
    }
    const stored = window.localStorage?.getItem(BACKGROUND_KEY)
    return stored || DEFAULT_BACKGROUND_ID
  } catch {
    return DEFAULT_BACKGROUND_ID
  }
}

export function applyInstantBackground() {
  if (typeof document === 'undefined') return
  const selectedId = resolveStoredBackgroundId()
  const src =
    loadBackgroundImage(selectedId) ?? loadBackgroundImage(DEFAULT_BACKGROUND_ID)
  if (!src) return
  document.documentElement.style.setProperty(
    CSS_VAR_NAME,
    `url("${src}")`,
  )
}
