import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

const THUMB_MAX_WIDTH = 320
const THUMB_MAX_HEIGHT = 190
const THUMB_QUALITY = 0.72

const BackgroundOption = memo(function BackgroundOption({
  label,
  thumbnailUrl,
  isSelected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border transition-colors duration-150 ${
        isSelected ? 'border-white/80' : 'border-white/10 hover:border-white/35'
      }`}
      aria-label={`Use background ${label}`}
      aria-pressed={isSelected}
    >
      <img
        src={thumbnailUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-16 w-full object-cover transition duration-300 group-hover:scale-105"
      />
      {isSelected ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold uppercase tracking-[0.25em]">
          Active
        </span>
      ) : null}
    </button>
  )
})

export function SettingsPanel({
  backgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
  currentName,
  onNameEditRequest,
}) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const thumbnailCacheRef = useRef(new Map())
  const [thumbRevision, bumpThumbRevision] = useReducer((count) => count + 1, 0)

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const handleBackgroundSelect = useCallback(
    (id) => {
      onBackgroundSelect(id)
    },
    [onBackgroundSelect],
  )

  useEffect(() => {
    if (!open) return

    const handleClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!backgrounds.length) return

    const cache = thumbnailCacheRef.current
    const pending = backgrounds.filter((item) => !cache.has(item.id))
    if (!pending.length) return

    let cancelled = false

    const createThumbnail = async (item) => {
      if (thumbnailCacheRef.current.has(item.id)) {
        return thumbnailCacheRef.current.get(item.id)
      }

      const drawBitmapToCanvas = (bitmap) => {
        if (!bitmap) return null
        const scale = Math.min(
          1,
          THUMB_MAX_WIDTH / bitmap.width,
          THUMB_MAX_HEIGHT / bitmap.height,
        )
        const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
        const targetHeight = Math.max(1, Math.round(bitmap.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const context = canvas.getContext('2d', { alpha: true })
        if (!context) return null
        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
        if (typeof bitmap.close === 'function') {
          bitmap.close()
        }
        return canvas.toDataURL('image/webp', THUMB_QUALITY)
      }

      try {
        if (typeof window.fetch === 'function' && 'createImageBitmap' in window) {
          const response = await fetch(item.url)
          if (!response.ok) throw new Error('Failed to fetch image')
          const blob = await response.blob()
          const bitmap = await window.createImageBitmap(blob, {
            resizeWidth: THUMB_MAX_WIDTH,
          })
          return drawBitmapToCanvas(bitmap)
        }
      } catch {
        // Ignore and try fallback
      }

      return new Promise((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.crossOrigin = 'anonymous'
        image.src = item.url

        const cleanup = () => {
          image.onload = null
          image.onerror = null
        }

        image.onload = () => {
          const scale = Math.min(
            1,
            THUMB_MAX_WIDTH / image.naturalWidth,
            THUMB_MAX_HEIGHT / image.naturalHeight,
          )
          const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
          const targetHeight = Math.max(
            1,
            Math.round(image.naturalHeight * scale),
          )
          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const context = canvas.getContext('2d', { alpha: true })
          if (!context) {
            cleanup()
            resolve(null)
            return
          }
          context.drawImage(image, 0, 0, targetWidth, targetHeight)
          const dataUrl = canvas.toDataURL('image/webp', THUMB_QUALITY)
          cleanup()
          resolve(dataUrl)
        }

        image.onerror = () => {
          cleanup()
          resolve(null)
        }
      })
    }

    const processQueue = async () => {
      for (const item of pending) {
        if (cancelled) break
        try {
          const result = await createThumbnail(item)
          if (cancelled || !result) continue
          if (!thumbnailCacheRef.current.has(item.id)) {
            thumbnailCacheRef.current.set(item.id, result)
            bumpThumbRevision()
          }
        } catch {
          // Swallow errors; fall back to full asset
        }
      }
    }

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(processQueue)
        : window.setTimeout(processQueue, 120)

    return () => {
      cancelled = true
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(schedule)
      } else {
        window.clearTimeout(schedule)
      }
    }
  }, [backgrounds, bumpThumbRevision])

  const backgroundItems = useMemo(
    () =>
      backgrounds.map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        isSelected: selectedBackgroundId === item.id,
        thumbnailUrl: thumbnailCacheRef.current.get(item.id) ?? item.url,
      })),
    [backgrounds, selectedBackgroundId, thumbRevision],
  )

  return (
    <div className="absolute right-6 top-6 z-20">
      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] transition hover:border-white/35 hover:bg-white/20"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="settings-panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="1.6"
            stroke="currentColor"
            fill="none"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 3.06-1.756 3.486 0a1.724 1.724 0 002.573 1.066c1.543-.93 3.31.836 2.38 2.38a1.724 1.724 0 001.065 2.572c1.756.426 1.756 3.06 0 3.486a1.724 1.724 0 00-1.066 2.573c.93 1.543-.836 3.31-2.38 2.38a1.724 1.724 0 00-2.572 1.065c-.426 1.756-3.06 1.756-3.486 0a1.724 1.724 0 00-2.573-1.066c-1.543.93-3.31-.836-2.38-2.38a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-3.06 0-3.486a1.724 1.724 0 001.066-2.573c-.93-1.543.836-3.31 2.38-2.38.996.6 2.276.16 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {open && (
          <div
            id="settings-panel"
            ref={panelRef}
            className="absolute right-0 top-full mt-3 w-80 rounded-3xl border border-white/15 bg-slate-900/80 p-5 text-white shadow-[0_35px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em]">
                Settings
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Profile
                </p>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                      Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/90">
                      {currentName ? currentName : 'Not set'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNameEditRequest?.()}
                    className="rounded-full border border-white/20 bg-white/[0.12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/75 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/35"
                    disabled={!onNameEditRequest}
                  >
                    Edit
                  </button>
                </div>
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Background
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {backgroundItems.map((item) => (
                    <BackgroundOption
                      key={item.id}
                      label={item.label}
                      thumbnailUrl={item.thumbnailUrl}
                      isSelected={item.isSelected}
                      onSelect={() => handleBackgroundSelect(item.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
