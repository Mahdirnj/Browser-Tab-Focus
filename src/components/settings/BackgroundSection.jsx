import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { isCustomBackgroundId, loadBackgroundImage, makeCustomBackgroundId } from '../../background'
import { resizeImageToDataUrl } from '../../utils/imageResize'
import { getThumb, loadAllThumbs, setThumb } from '../../utils/thumbCache'
import BackgroundOption from './BackgroundOption'
import SectionShell from './SectionShell'

const THUMB_MAX_WIDTH = 320
const THUMB_MAX_HEIGHT = 190
const THUMB_QUALITY = 0.72

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <rect x="2.5" y="4" width="15" height="12" rx="2" />
    <circle cx="7" cy="8.5" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
    <path d="M2.5 13l4-4 3.5 3.5 2.5-2.5 5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UploadIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
    <path d="M7 2v8M3.5 5.5L7 2l3.5 3.5M2.5 12h9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function BackgroundSection({
  backgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
  onAddCustomBackground,
  onDeleteCustomBackground,
  overlayStrength,
  onOverlayStrengthChange,
}) {
  const fileInputRef = useRef(null)
  const [bgUploadStatus, setBgUploadStatus] = useState({ kind: 'idle', message: '' })
  const thumbnailCacheRef = useRef(new Map())
  const [thumbRevision, bumpThumbRevision] = useReducer((count) => count + 1, 0)
  const backgroundSourceCacheRef = useRef(new Map())

  const ensureBackgroundSource = useCallback(async (id) => {
    if (backgroundSourceCacheRef.current.has(id)) {
      return backgroundSourceCacheRef.current.get(id)
    }
    const src = await loadBackgroundImage(id)
    if (src) backgroundSourceCacheRef.current.set(id, src)
    return src
  }, [])

  // ── Pre-load any persisted thumbs from IDB before generating new ones.
  useEffect(() => {
    if (!backgrounds.length) return
    loadAllThumbs(backgrounds.map((b) => b.id)).then((cached) => {
      let hit = false
      for (const [id, url] of Object.entries(cached)) {
        if (!thumbnailCacheRef.current.has(id)) {
          thumbnailCacheRef.current.set(id, url)
          hit = true
        }
      }
      if (hit) bumpThumbRevision()
    })
  }, [backgrounds])

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

      const persisted = await getThumb(item.id)
      if (persisted) {
        thumbnailCacheRef.current.set(item.id, persisted)
        return persisted
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
        if (typeof bitmap.close === 'function') bitmap.close()
        return canvas.toDataURL('image/webp', THUMB_QUALITY)
      }

      const src = await ensureBackgroundSource(item.id)
      if (!src) return null
      try {
        if (typeof window.fetch === 'function' && 'createImageBitmap' in window) {
          const response = await fetch(src)
          if (!response.ok) throw new Error('Failed to fetch image')
          const blob = await response.blob()
          const bitmap = await window.createImageBitmap(blob, { resizeWidth: THUMB_MAX_WIDTH })
          const result = drawBitmapToCanvas(bitmap)
          if (result) setThumb(item.id, result)
          return result
        }
      } catch {
        // fall through to legacy <img> path
      }

      return new Promise((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.crossOrigin = 'anonymous'
        image.src = src

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
          const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))
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
          setThumb(item.id, dataUrl)
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
          // best-effort thumbnail generation
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
  }, [backgrounds, ensureBackgroundSource])

  const backgroundItems = useMemo(
    () =>
      backgrounds.map((item) => {
        const cachedSrc = backgroundSourceCacheRef.current.get(item.id)
        const isCustom = item.isCustom === true || isCustomBackgroundId(item.id)
        const fallbackSrc = isCustom ? loadBackgroundImage(item.id) : null
        return {
          id: item.id,
          label: item.label,
          isCustom,
          isSelected: selectedBackgroundId === item.id,
          thumbnailUrl:
            thumbnailCacheRef.current.get(item.id) ??
            cachedSrc ??
            fallbackSrc ??
            undefined,
        }
      }),
    // thumbRevision intentionally drives a re-read of the cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backgrounds, selectedBackgroundId, thumbRevision],
  )

  const handleCustomBackgroundFromBlob = useCallback(
    async (blob, label) => {
      if (!onAddCustomBackground) return
      setBgUploadStatus({ kind: 'loading', message: 'Resizing image…' })
      try {
        const { dataUrl } = await resizeImageToDataUrl(blob)
        const id = makeCustomBackgroundId()
        await onAddCustomBackground({ id, label, dataUrl })
        setBgUploadStatus({ kind: 'success', message: 'Background added.' })
        window.setTimeout(() => {
          setBgUploadStatus((current) =>
            current.kind === 'success' ? { kind: 'idle', message: '' } : current,
          )
        }, 1800)
      } catch (error) {
        setBgUploadStatus({
          kind: 'error',
          message: error?.message ?? 'Could not save that image.',
        })
      }
    },
    [onAddCustomBackground],
  )

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const baseName = file.name?.replace(/\.[^.]+$/, '')?.trim() || 'Custom'
      await handleCustomBackgroundFromBlob(file, baseName)
    },
    [handleCustomBackgroundFromBlob],
  )

  const headerRight = onAddCustomBackground ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex h-6 items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] px-2.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--dashboard-text-70)] transition-[border-color,background-color,color] duration-150 hover:border-white/30 hover:bg-white/[0.12] hover:text-[color:var(--dashboard-text-100)]"
        aria-label="Upload a custom background image"
      >
        {UploadIcon}
        Upload
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  ) : null

  const overlayPercent = Math.round((overlayStrength ?? 0.75) * 100)

  return (
    <SectionShell icon={Icon} title="Background" headerRight={headerRight}>
      {bgUploadStatus.kind !== 'idle' ? (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[0.62rem] ${
            bgUploadStatus.kind === 'error'
              ? 'border-rose-400/40 bg-rose-500/10 text-rose-100/90'
              : bgUploadStatus.kind === 'success'
                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100/90'
                : 'border-white/15 bg-white/[0.05] text-[color:var(--dashboard-text-75)]'
          }`}
          role={bgUploadStatus.kind === 'error' ? 'alert' : 'status'}
        >
          {bgUploadStatus.kind === 'loading' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3 animate-spin">
              <circle cx="12" cy="12" r="9" opacity="0.25" />
              <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
            </svg>
          ) : null}
          <span className="leading-snug">{bgUploadStatus.message}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {backgroundItems.map((item) => (
          <BackgroundOption
            key={item.id}
            label={item.label}
            thumbnailUrl={item.thumbnailUrl}
            isSelected={item.isSelected}
            isCustom={item.isCustom}
            onSelect={() => onBackgroundSelect?.(item.id)}
            onDelete={
              item.isCustom && onDeleteCustomBackground
                ? () => onDeleteCustomBackground(item.id)
                : undefined
            }
          />
        ))}
      </div>

      {/* ── Overlay strength slider (IDEA-V2-002) ── */}
      {onOverlayStrengthChange ? (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--dashboard-text-55)]">
              Overlay Strength
            </p>
            <span className="text-[0.62rem] font-semibold tabular-nums text-[color:var(--dashboard-text-75)]">
              {overlayPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={overlayPercent}
            onChange={(event) => onOverlayStrengthChange(Number(event.target.value) / 100)}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.12] accent-emerald-300 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
            aria-label="Background overlay strength"
          />
          <p className="mt-1.5 text-[0.6rem] leading-snug text-[color:var(--dashboard-text-40)]">
            Dim the wallpaper for better text readability.
          </p>
        </div>
      ) : null}
    </SectionShell>
  )
}

export default BackgroundSection
