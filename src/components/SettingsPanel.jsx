import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { isCustomBackgroundId, loadBackgroundImage, makeCustomBackgroundId } from '../background'
import { fetchImageAsDataUrl, resizeImageToDataUrl } from '../utils/imageResize'
import { getThumb, setThumb, loadAllThumbs } from '../utils/thumbCache'

const THUMB_MAX_WIDTH = 320
const THUMB_MAX_HEIGHT = 190
const THUMB_QUALITY = 0.72
const MAX_TIMEZONE_RESULTS = 80
const FALLBACK_TIMEZONES = [
  'UTC',
  'Atlantic/Reykjavik',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Warsaw',
  'Europe/Athens',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Jerusalem',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Jakarta',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Colombo',
  'Asia/Karachi',
  'Asia/Tashkent',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Phoenix',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Halifax',
  'America/St_Johns',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Montevideo',
  'America/Caracas',
  'America/Panama',
  'Indian/Mauritius',
  'Indian/Maldives',
]

/** Defined at module level — never recreated on render. */
const WIDGET_DEFS = [
  { id: 'weather', label: 'Weather', description: 'Current conditions for your selected city.' },
  { id: 'todo', label: 'Todo List', description: 'Track and complete tasks. Persists locally.' },
  { id: 'pomodoro', label: 'Pomodoro', description: 'Focus and break cycles with a local timer.' },
  { id: 'dailyFocus', label: "Today's Focus", description: 'Single daily goal. Resets at midnight.' },
  { id: 'quote', label: 'Daily Quote', description: 'Fresh quote each day from a bundled set.' },
]

const POMODORO_DEFS = [
  { label: 'Focus', key: 'focus', default: 25 },
  { label: 'Short Break', key: 'shortBreak', default: 5 },
  { label: 'Long Break', key: 'longBreak', default: 15 },
]

function normalizeTimeZoneLabel(zone) {
  return zone
    .split('/')
    .map((part) => part.replace(/_/g, ' '))
    .join(' — ')
}

function describeTimeZoneOffset(zone) {
  try {
    if (
      typeof Intl === 'undefined' ||
      typeof Intl.DateTimeFormat !== 'function'
    ) {
      return ''
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
    })
    const offsetPart = formatter
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')
    if (!offsetPart) return ''
    return offsetPart.value.replace('GMT', 'UTC')
  } catch (error) {
    try {
      const fallbackFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'short',
      })
      const offsetPart = fallbackFormatter
        .formatToParts(new Date())
        .find((part) => part.type === 'timeZoneName')
      return offsetPart ? offsetPart.value : ''
    } catch (innerError) {
      console.warn('Unable to resolve timezone offset', zone, innerError)
      return ''
    }
  }
}

const BackgroundOption = memo(function BackgroundOption({
  label,
  thumbnailUrl,
  isSelected,
  isCustom,
  onSelect,
  onDelete,
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-colors duration-150 ${
        isSelected ? 'border-white/80' : 'border-white/10 hover:border-white/35'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
        aria-label={`Use background ${label}`}
        aria-pressed={isSelected}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-16 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-16 w-full items-center justify-center bg-white/[0.04]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-4 w-4 animate-pulse text-white/40">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
        )}
        {isSelected ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-slate-900">
                <path d="M2 6.5l2.5 2.5 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        ) : null}
      </button>
      {isCustom && onDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white/85 opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-opacity duration-150 hover:bg-rose-500/80 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-2.5 w-2.5">
            <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  )
})

/** Number input that lets users freely edit (including clearing) and commits only on blur */
function DurationInput({ value, defaultValue, min = 1, max = 120, label, onChange }) {
  const [raw, setRaw] = useState(String(value ?? defaultValue))

  // Sync if parent value changes externally
  useEffect(() => {
    setRaw(String(value ?? defaultValue))
  }, [value, defaultValue])

  function commit(rawVal) {
    const num = Number(rawVal)
    if (rawVal === '' || isNaN(num) || num < min) {
      setRaw(String(defaultValue))
      onChange(defaultValue)
    } else {
      const clamped = Math.min(max, Math.max(min, num))
      setRaw(String(clamped))
      onChange(clamped)
    }
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className="w-14 rounded-lg border border-white/15 bg-white/[0.08] px-2 py-1 text-center text-xs font-semibold tracking-[0.1em] text-[color:var(--dashboard-text-90)] transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label={`${label} duration in minutes`}
    />
  )
}

export function SettingsPanel({
  backgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
  currentName,
  onNameEditRequest,
  clockTimezone,
  onClockTimezoneChange,
  widgetsEnabled,
  onWidgetToggle,
  onOpenChange,
  textColorOptions,
  selectedTextColorId,
  onTextColorChange,
  openSearchInNewTab,
  onSearchBehaviorChange,
  weatherApiKey,
  onWeatherApiKeyChange,
  pomodoroDurations,
  onPomodoroDurationsChange,
  onAddCustomBackground,
  onDeleteCustomBackground,
  calendarId,
  calendarOptions,
  onCalendarChange,
}) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const thumbnailCacheRef = useRef(new Map())
  const [thumbRevision, bumpThumbRevision] = useReducer((count) => count + 1, 0)
  const backgroundSourceCacheRef = useRef(new Map())
  const widgetStates = useMemo(
    () => ({
      weather: widgetsEnabled?.weather !== false,
      todo: widgetsEnabled?.todo !== false,
      pomodoro: widgetsEnabled?.pomodoro !== false,
      dailyFocus: widgetsEnabled?.dailyFocus !== false,
      quote: widgetsEnabled?.quote !== false,
    }),
    [widgetsEnabled],
  )
  const [weatherApiKeyInput, setWeatherApiKeyInput] = useState(
    weatherApiKey ?? '',
  )
  const fileInputRef = useRef(null)
  const [bgAddMode, setBgAddMode] = useState(null) // null | 'url'
  const [urlDraft, setUrlDraft] = useState('')
  const [bgUploadStatus, setBgUploadStatus] = useState({ kind: 'idle', message: '' })
  const [timezoneQuery, setTimezoneQuery] = useState('')
  const availableTimeZones = useMemo(() => {
    let zones = []
    if (
      typeof Intl !== 'undefined' &&
      typeof Intl.supportedValuesOf === 'function'
    ) {
      try {
        zones = Intl.supportedValuesOf('timeZone')
      } catch (error) {
        console.warn('Unable to read supported time zones', error)
        zones = []
      }
    }
    if (!zones || zones.length === 0) {
      zones = FALLBACK_TIMEZONES
    }
    if (clockTimezone && !zones.includes(clockTimezone)) {
      zones = [...zones, clockTimezone]
    }
    return Array.from(new Set(zones)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  }, [clockTimezone])
  const filteredTimeZones = useMemo(() => {
    const normalized = timezoneQuery.trim().toLowerCase()
    if (!normalized) return []
    return availableTimeZones.filter((zone) =>
      zone.toLowerCase().includes(normalized),
    )
  }, [availableTimeZones, timezoneQuery])
  const displayedTimeZones = useMemo(
    () => filteredTimeZones.slice(0, MAX_TIMEZONE_RESULTS),
    [filteredTimeZones],
  )
  // Pre-compute label + offset once per filtered result set, not inline per render.
  const displayedTimeZoneData = useMemo(
    () =>
      displayedTimeZones.map((zone) => ({
        zone,
        label: normalizeTimeZoneLabel(zone),
        offset: describeTimeZoneOffset(zone),
      })),
    [displayedTimeZones],
  )
  const activeTimeZone =
    clockTimezone && availableTimeZones.includes(clockTimezone)
      ? clockTimezone
      : availableTimeZones[0] ?? 'UTC'
  const activeTimeZoneLabel = useMemo(
    () => normalizeTimeZoneLabel(activeTimeZone),
    [activeTimeZone],
  )
  const activeTimeZoneOffset = useMemo(
    () => describeTimeZoneOffset(activeTimeZone),
    [activeTimeZone],
  )
  const hasTimezoneQuery = timezoneQuery.trim().length > 0
  const searchOpensInNewTab = openSearchInNewTab !== false
  useEffect(() => {
    setWeatherApiKeyInput(weatherApiKey ?? '')
  }, [weatherApiKey])
  const trimmedWeatherApiKeyInput = weatherApiKeyInput.trim()
  const storedWeatherApiKey = weatherApiKey ?? ''
  const hasStoredWeatherKey = Boolean(storedWeatherApiKey)
  const weatherApiKeyControlsDisabled = !onWeatherApiKeyChange
  const canClearWeatherApiKey =
    hasStoredWeatherKey && !weatherApiKeyControlsDisabled
  const handleWeatherApiKeyCommit = useCallback(() => {
    if (weatherApiKeyControlsDisabled) return
    if (trimmedWeatherApiKeyInput === storedWeatherApiKey) return
    onWeatherApiKeyChange?.(trimmedWeatherApiKeyInput)
  }, [
    onWeatherApiKeyChange,
    storedWeatherApiKey,
    trimmedWeatherApiKeyInput,
    weatherApiKeyControlsDisabled,
  ])
  const handleWeatherApiKeyClear = () => {
    if (!onWeatherApiKeyChange) return
    setWeatherApiKeyInput('')
    onWeatherApiKeyChange('')
  }
  const handleWeatherApiKeyKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleWeatherApiKeyCommit()
    }
  }

  const handleWidgetToggle = useCallback(
    (key) => {
      const nextValue = !widgetStates[key]
      onWidgetToggle?.(key, nextValue)
    },
    [onWidgetToggle, widgetStates],
  )

  const openPanel = useCallback(() => {
    setVisible(true)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => setOpen(true))
    } else {
      setOpen(true)
    }
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const toggleOpen = useCallback(() => {
    if (open) {
      closePanel()
    } else {
      openPanel()
    }
  }, [open, closePanel, openPanel])

  const handleBackgroundSelect = useCallback(
    (id) => {
      onBackgroundSelect(id)
    },
    [onBackgroundSelect],
  )

  const handleTextColorSelect = useCallback(
    (id) => {
      onTextColorChange?.(id)
    },
    [onTextColorChange],
  )
  const handleSearchBehaviorToggle = useCallback(() => {
    if (!onSearchBehaviorChange) return
    onSearchBehaviorChange(!searchOpensInNewTab)
  }, [onSearchBehaviorChange, searchOpensInNewTab])

  const handleCustomBackgroundFromBlob = useCallback(
    async (blob, label) => {
      if (!onAddCustomBackground) return
      setBgUploadStatus({ kind: 'loading', message: 'Resizing image…' })
      try {
        const { dataUrl } = await resizeImageToDataUrl(blob)
        const id = makeCustomBackgroundId()
        await onAddCustomBackground({ id, label, dataUrl })
        setBgUploadStatus({ kind: 'success', message: 'Background added.' })
        setBgAddMode(null)
        setUrlDraft('')
        // Auto-clear the success message
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
      // Reset value so picking the same file twice still triggers change
      event.target.value = ''
      if (!file) return
      const baseName = file.name?.replace(/\.[^.]+$/, '')?.trim() || 'Custom'
      await handleCustomBackgroundFromBlob(file, baseName)
    },
    [handleCustomBackgroundFromBlob],
  )

  const handleAddFromUrlSubmit = useCallback(async () => {
    if (!onAddCustomBackground) return
    const trimmed = urlDraft.trim()
    if (!trimmed) {
      setBgUploadStatus({ kind: 'error', message: 'Enter an image URL.' })
      return
    }
    setBgUploadStatus({ kind: 'loading', message: 'Fetching image…' })
    try {
      const { dataUrl } = await fetchImageAsDataUrl(trimmed)
      const id = makeCustomBackgroundId()
      let label = 'Custom'
      try {
        const filename = new URL(trimmed).pathname.split('/').pop() ?? ''
        const stripped = filename.replace(/\.[^.]+$/, '').trim()
        if (stripped) label = stripped
      } catch {
        // ignore — label stays "Custom"
      }
      await onAddCustomBackground({ id, label, dataUrl })
      setBgUploadStatus({ kind: 'success', message: 'Background added.' })
      setBgAddMode(null)
      setUrlDraft('')
      window.setTimeout(() => {
        setBgUploadStatus((current) =>
          current.kind === 'success' ? { kind: 'idle', message: '' } : current,
        )
      }, 1800)
    } catch (error) {
      setBgUploadStatus({
        kind: 'error',
        message: error?.message ?? 'Could not fetch that image.',
      })
    }
  }, [onAddCustomBackground, urlDraft])

  const handleDeleteBackground = useCallback(
    (id) => {
      if (!onDeleteCustomBackground) return
      onDeleteCustomBackground(id)
    },
    [onDeleteCustomBackground],
  )

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!visible) return

    const handleClick = (event) => {
      if (
        !panelRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [visible])

  const ensureBackgroundSource = useCallback(async (id) => {
    if (backgroundSourceCacheRef.current.has(id)) {
      return backgroundSourceCacheRef.current.get(id)
    }
    const src = await loadBackgroundImage(id)
    if (src) {
      backgroundSourceCacheRef.current.set(id, src)
    }
    return src
  }, [])

  // ── Instant pre-load: pull all cached thumbs from IndexedDB before the
  // idle queue runs so thumbnails are already ready when the panel opens.
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
  }, [backgrounds, bumpThumbRevision])

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

      // Check IndexedDB before doing any heavy canvas work
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
        if (typeof bitmap.close === 'function') {
          bitmap.close()
        }
        return canvas.toDataURL('image/webp', THUMB_QUALITY)
      }

      const src = await ensureBackgroundSource(item.id)
      if (!src) return null
      try {
        if (typeof window.fetch === 'function' && 'createImageBitmap' in window) {
          const response = await fetch(src)
          if (!response.ok) throw new Error('Failed to fetch image')
          const blob = await response.blob()
          const bitmap = await window.createImageBitmap(blob, {
            resizeWidth: THUMB_MAX_WIDTH,
          })
          const result = drawBitmapToCanvas(bitmap)
          if (result) setThumb(item.id, result)
          return result
        }
      } catch {
        // Ignore and try fallback
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

  const textColorItems = useMemo(
    () =>
      (textColorOptions ?? []).map((item) => ({
        id: item.id,
        label: item.label,
        hex: item.hex,
        isSelected: item.id === selectedTextColorId,
      })),
    [textColorOptions, selectedTextColorId],
  )
  const backgroundItems = useMemo(
    () =>
      backgrounds.map((item) => {
        const cachedSrc = backgroundSourceCacheRef.current.get(item.id)
        const isCustom = item.isCustom === true || isCustomBackgroundId(item.id)
        // Custom backgrounds resolve to a full data URL synchronously — fine
        // for a tiny thumb. Bundled backgrounds wait on the canvas pipeline.
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
    [backgrounds, selectedBackgroundId, thumbRevision],
  )

  return (
    <div className="absolute right-6 top-6 z-20">
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          onClick={toggleOpen}
          ref={triggerRef}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] transition-[border-color,background-color] duration-150 ${
            open
              ? 'border-white/30 bg-white/20 text-white'
              : 'border-white/20 bg-white/10 text-[color:var(--dashboard-text-100)] hover:border-white/35 hover:bg-white/20'
          }`}
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

        {visible && (
          <div
            id="settings-panel"
            ref={panelRef}
            style={{ backdropFilter: 'blur(22px) saturate(1.3)', WebkitBackdropFilter: 'blur(22px) saturate(1.3)' }}
            className={`absolute right-0 top-full mt-3 flex h-[84vh] w-[22rem] flex-col overflow-hidden rounded-[26px] border border-white/[0.14] bg-white/[0.08] text-[color:var(--dashboard-text-100)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
              open
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-2 scale-[0.97] opacity-0'
            }`}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.08]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" fill="none" className="h-3.5 w-3.5 text-[color:var(--dashboard-text-60)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 3.06-1.756 3.486 0a1.724 1.724 0 002.573 1.066c1.543-.93 3.31.836 2.38 2.38a1.724 1.724 0 001.065 2.572c1.756.426 1.756 3.06 0 3.486a1.724 1.724 0 00-1.066 2.573c.93 1.543-.836 3.31-2.38 2.38a1.724 1.724 0 00-2.572 1.065c-.426 1.756-3.06 1.756-3.486 0a1.724 1.724 0 00-2.573-1.066c-1.543.93-3.31-.836-2.38-2.38a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-3.06 0-3.486a1.724 1.724 0 001.066-2.573c-.93-1.543.836-3.31 2.38-2.38.996.6 2.276.16 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold tracking-[0.06em] text-[color:var(--dashboard-text-90)]">
                  Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-[color:var(--dashboard-text-50)] transition-[background-color,color] duration-100 hover:bg-white/[0.14] hover:text-[color:var(--dashboard-text-90)]"
                aria-label="Close settings"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* thin separator */}
            <div className="mx-5 h-px bg-white/[0.07]" />

            {/* ─── Scrollable content ─── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 custom-scroll">
              <div className="space-y-3">

                {/* ── Profile ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <circle cx="10" cy="7" r="3.5" />
                      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Profile</p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-[color:var(--dashboard-text-40)]">Name</p>
                      <p className="mt-0.5 text-[0.82rem] font-semibold text-[color:var(--dashboard-text-95)]">
                        {currentName ? currentName : 'Not set'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNameEditRequest?.()}
                      disabled={!onNameEditRequest}
                      className="cursor-pointer rounded-full border border-white/20 bg-white/[0.12] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[color:var(--dashboard-text-75)] transition-[border-color,background-color,color] duration-150 hover:border-white/35 hover:bg-white/[0.18] hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>
                  </div>
                </section>

                {/* ── Widgets ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <rect x="3" y="3" width="6" height="6" rx="1.5" />
                      <rect x="11" y="3" width="6" height="6" rx="1.5" />
                      <rect x="3" y="11" width="6" height="6" rx="1.5" />
                      <rect x="11" y="11" width="6" height="6" rx="1.5" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Widgets</p>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {WIDGET_DEFS.map((item) => {
                      const enabled = widgetStates[item.id]
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0">
                          <div className="min-w-0">
                            <p className="text-[0.75rem] font-semibold text-[color:var(--dashboard-text-80)]">{item.label}</p>
                            <p className="mt-0.5 text-[0.62rem] leading-snug text-[color:var(--dashboard-text-40)]">{item.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleWidgetToggle(item.id)}
                            role="switch"
                            aria-checked={enabled}
                            disabled={!onWidgetToggle}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center overflow-hidden rounded-full border px-0.5 transition-colors duration-150 ${
                              enabled
                                ? 'border-emerald-300/60 bg-emerald-400/80'
                                : 'border-white/20 bg-white/[0.1]'
                            } ${!onWidgetToggle ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`block h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-150 ease-out ${
                                enabled ? 'translate-x-[1.2rem]' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* ── Search ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <circle cx="9" cy="9" r="5.5" />
                      <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Search</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.75rem] font-semibold text-[color:var(--dashboard-text-80)]">
                        {searchOpensInNewTab ? 'Open in new tab' : 'Open in current tab'}
                      </p>
                      <p className="mt-0.5 text-[0.62rem] leading-snug text-[color:var(--dashboard-text-40)]">
                        Toggle to launch results in a new browser tab.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchBehaviorToggle}
                      role="switch"
                      aria-checked={searchOpensInNewTab}
                      aria-label={searchOpensInNewTab ? 'Open search results in a new tab' : 'Open search results in the current tab'}
                      disabled={!onSearchBehaviorChange}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center overflow-hidden rounded-full border px-0.5 transition-colors duration-150 ${
                        searchOpensInNewTab
                          ? 'border-emerald-300/60 bg-emerald-400/80'
                          : 'border-white/20 bg-white/[0.1]'
                      } ${!onSearchBehaviorChange ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-150 ease-out ${
                          searchOpensInNewTab ? 'translate-x-[1.2rem]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </section>

                {/* ── Pomodoro ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <circle cx="10" cy="10" r="7" />
                      <path d="M10 6.5v3.8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Pomodoro</p>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {POMODORO_DEFS.map(({ label, key, default: def }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0">
                        <span className="text-[0.75rem] font-semibold text-[color:var(--dashboard-text-70)]">
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <DurationInput
                            value={pomodoroDurations?.[key]}
                            defaultValue={def}
                            label={label}
                            onChange={(val) =>
                              onPomodoroDurationsChange?.({
                                ...(pomodoroDurations ?? { focus: 25, shortBreak: 5, longBreak: 15 }),
                                [key]: val,
                              })
                            }
                          />
                          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--dashboard-text-35)]">
                            min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Text Color ── */}
                {textColorItems.length ? (
                  <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                        <circle cx="10" cy="10" r="7" />
                        <path d="M7 10a3 3 0 006 0" strokeLinecap="round" />
                      </svg>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Text Color</p>
                    </div>
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-2 py-3">
                      <div className="relative flex items-center justify-between">
                        <span className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/[0.1]" />
                        {textColorItems.map((item) => {
                          const isSelected = item.isSelected
                          const isDisabled = !onTextColorChange
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleTextColorSelect(item.id)}
                              aria-pressed={isSelected}
                              aria-label={`Use ${item.label} text color`}
                              disabled={isDisabled}
                              className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 ${
                                isSelected
                                  ? 'scale-[1.12] shadow-[0_0_20px_-4px_rgba(94,234,212,0.5)]'
                                  : 'hover:scale-110'
                              } ${isDisabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`absolute inset-0 rounded-full transition-colors duration-150 ${
                                  isSelected
                                    ? 'bg-emerald-200/10 ring-2 ring-emerald-200/70'
                                    : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
                                }`}
                              />
                              <span
                                className="relative h-6 w-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                                style={{ backgroundColor: item.hex }}
                              />
                              {isSelected ? (
                                <span className="absolute inset-0 rounded-full border-2 border-emerald-200/50" />
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* ── Weather API ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <path d="M4.5 13.5a4 4 0 014-4 4 4 0 014-4 4 4 0 013.7 5.5A3 3 0 0114.5 17h-9a3 3 0 01-1-5.84" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Weather API</p>
                  </div>
                  <div className="space-y-2.5">
                    <p className="text-[0.63rem] leading-relaxed text-[color:var(--dashboard-text-45)]">
                      Paste your OpenWeather API key. It never leaves this device.
                    </p>
                    <input
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={weatherApiKeyInput}
                      onChange={(event) => setWeatherApiKeyInput(event.target.value)}
                      onBlur={handleWeatherApiKeyCommit}
                      onKeyDown={handleWeatherApiKeyKeyDown}
                      placeholder="32-character API key"
                      disabled={weatherApiKeyControlsDisabled}
                      className={`w-full rounded-xl border border-white/[0.14] bg-white/[0.07] px-3.5 py-2 text-[0.8rem] text-[color:var(--dashboard-text-90)] placeholder:text-[color:var(--dashboard-text-35)] transition focus:border-sky-300/50 focus:outline-none focus:ring-1 focus:ring-sky-300/30 ${
                        weatherApiKeyControlsDisabled ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      aria-label="OpenWeather API Key"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href="https://home.openweathermap.org/api_keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[0.62rem] text-sky-300/80 underline-offset-2 hover:underline"
                      >
                        Get a free key →
                      </a>
                      {hasStoredWeatherKey ? (
                        <button
                          type="button"
                          onClick={handleWeatherApiKeyClear}
                          disabled={!canClearWeatherApiKey}
                          className={`rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition ${
                            canClearWeatherApiKey
                              ? 'cursor-pointer border-white/20 text-[color:var(--dashboard-text-65)] hover:border-rose-300/50 hover:text-rose-300/90'
                              : 'cursor-not-allowed border-white/10 text-[color:var(--dashboard-text-40)] opacity-60'
                          }`}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>

                {/* ── Calendar ── */}
                {Array.isArray(calendarOptions) && calendarOptions.length ? (
                  <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                        <rect x="3" y="4" width="14" height="13" rx="2" />
                        <path d="M3 8h14" strokeLinecap="round" />
                        <path d="M7 2.5v3M13 2.5v3" strokeLinecap="round" />
                      </svg>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Calendar</p>
                    </div>
                    <div className="space-y-2">
                      {/* Active calendar display */}
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.06] px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--dashboard-text-40)]">Active</span>
                          <span className="text-[0.82rem] font-semibold text-[color:var(--dashboard-text-95)]">
                            {calendarOptions.find((o) => o.id === calendarId)?.label ?? calendarOptions[0]?.label}
                          </span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-[color:var(--dashboard-text-35)]">
                          <rect x="3" y="4" width="14" height="13" rx="2" />
                          <path d="M3 8h14" strokeLinecap="round" />
                          <path d="M7 2.5v3M13 2.5v3" strokeLinecap="round" />
                        </svg>
                      </div>
                      {/* Calendar options list */}
                      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 custom-scroll">
                        {calendarOptions.map((option) => {
                          const isActive = option.id === calendarId
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => onCalendarChange?.(option.id)}
                              disabled={!onCalendarChange}
                              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-[border-color,background-color,color] duration-100 ${
                                isActive
                                  ? 'border-emerald-300/50 bg-emerald-400/15 text-[color:var(--dashboard-text-100)]'
                                  : 'border-white/[0.08] bg-white/[0.06] text-[color:var(--dashboard-text-70)] hover:border-white/25 hover:bg-white/[0.1] hover:text-[color:var(--dashboard-text-100)]'
                              } ${!onCalendarChange ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                              <span className="text-[0.8rem] font-semibold">{option.label}</span>
                              {isActive ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 flex-shrink-0 text-emerald-300">
                                  <path d="M3 8.5l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-30)]">
                                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* ── Clock Timezone ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                      <circle cx="10" cy="10" r="7.5" />
                      <path d="M10 2.5c-2.5 2.5-3.5 5-3.5 7.5s1 5 3.5 7.5M10 2.5c2.5 2.5 3.5 5 3.5 7.5s-1 5-3.5 7.5M2.5 10h15" strokeLinecap="round" />
                    </svg>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Clock Timezone</p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.06] px-3.5 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--dashboard-text-40)]">Active</span>
                        <span className="text-[0.82rem] font-semibold text-[color:var(--dashboard-text-95)]">
                          {activeTimeZoneLabel}
                        </span>
                      </div>
                      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-40)]">
                        {activeTimeZoneOffset}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                        <circle cx="9" cy="9" r="5.5" />
                        <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
                      </svg>
                      <input
                        type="search"
                        value={timezoneQuery}
                        onChange={(event) => setTimezoneQuery(event.target.value)}
                        placeholder="Search world time zones"
                        className="h-6 w-full bg-transparent text-[0.82rem] text-[color:var(--dashboard-text-90)] placeholder:text-[color:var(--dashboard-text-35)] focus:outline-none"
                      />
                    </div>
                    <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                      {hasTimezoneQuery ? (
                        displayedTimeZoneData.length ? (
                          displayedTimeZoneData.map(({ zone, label, offset }) => {
                            const isActive = zone === activeTimeZone
                            return (
                              <button
                                key={zone}
                                type="button"
                                onClick={() => onClockTimezoneChange?.(zone)}
                                disabled={!onClockTimezoneChange}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-[border-color,background-color,color] duration-100 ${
                                  isActive
                                    ? 'border-emerald-300/50 bg-emerald-400/15 text-[color:var(--dashboard-text-100)]'
                                    : 'border-white/[0.08] bg-white/[0.06] text-[color:var(--dashboard-text-70)] hover:border-white/25 hover:bg-white/[0.1] hover:text-[color:var(--dashboard-text-100)]'
                                } ${!onClockTimezoneChange ? 'cursor-not-allowed opacity-60' : ''}`}
                              >
                                <span className="flex flex-col gap-0.5">
                                  <span className="text-[0.8rem] font-semibold">{label}</span>
                                  {offset ? (
                                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--dashboard-text-45)]">
                                      {offset}
                                    </span>
                                  ) : null}
                                </span>
                                {isActive ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 flex-shrink-0 text-emerald-300">
                                    <path d="M3 8.5l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-30)]">
                                    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            )
                          })
                        ) : (
                          <p className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-[0.78rem] text-[color:var(--dashboard-text-50)]">
                            No time zones found. Try a city or region name.
                          </p>
                        )
                      ) : null}
                    </div>
                    {hasTimezoneQuery && filteredTimeZones.length > displayedTimeZones.length ? (
                      <p className="text-[0.6rem] uppercase tracking-[0.25em] text-[color:var(--dashboard-text-40)]">
                        Showing first {displayedTimeZones.length} of {filteredTimeZones.length} matches.
                      </p>
                    ) : null}
                  </div>
                </section>

                {/* ── Background ── */}
                <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
                        <rect x="2.5" y="4" width="15" height="12" rx="2" />
                        <circle cx="7" cy="8.5" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
                        <path d="M2.5 13l4-4 3.5 3.5 2.5-2.5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">Background</p>
                    </div>
                    {onAddCustomBackground ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-6 items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] px-2.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--dashboard-text-70)] transition-[border-color,background-color,color] duration-150 hover:border-white/30 hover:bg-white/[0.12] hover:text-[color:var(--dashboard-text-100)]"
                          aria-label="Upload a custom background image"
                        >
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
                            <path d="M7 2v8M3.5 5.5L7 2l3.5 3.5M2.5 12h9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBgAddMode((current) => (current === 'url' ? null : 'url'))
                            setBgUploadStatus({ kind: 'idle', message: '' })
                          }}
                          className={`flex h-6 items-center gap-1 rounded-full border px-2.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] transition-[border-color,background-color,color] duration-150 ${
                            bgAddMode === 'url'
                              ? 'border-sky-300/60 bg-sky-400/15 text-[color:var(--dashboard-text-100)]'
                              : 'border-white/15 bg-white/[0.07] text-[color:var(--dashboard-text-70)] hover:border-white/30 hover:bg-white/[0.12] hover:text-[color:var(--dashboard-text-100)]'
                          }`}
                          aria-pressed={bgAddMode === 'url'}
                        >
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
                            <path d="M5.5 8.5l3-3M4.5 7.5l-1.5 1.5a2 2 0 102.8 2.8l1.5-1.5M9.5 6.5l1.5-1.5a2 2 0 10-2.8-2.8L6.7 3.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          From URL
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : null}
                  </div>

                  {bgAddMode === 'url' ? (
                    <div className="mb-3 rounded-xl border border-white/[0.12] bg-white/[0.04] p-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={urlDraft}
                          onChange={(event) => setUrlDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              handleAddFromUrlSubmit()
                            } else if (event.key === 'Escape') {
                              setBgAddMode(null)
                              setUrlDraft('')
                              setBgUploadStatus({ kind: 'idle', message: '' })
                            }
                          }}
                          placeholder="https://example.com/photo.jpg"
                          disabled={bgUploadStatus.kind === 'loading'}
                          className="h-7 flex-1 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2.5 text-[0.7rem] text-[color:var(--dashboard-text-90)] placeholder:text-[color:var(--dashboard-text-35)] focus:border-sky-300/40 focus:outline-none focus:ring-1 focus:ring-sky-300/30 disabled:opacity-60"
                          aria-label="Image URL"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddFromUrlSubmit}
                          disabled={bgUploadStatus.kind === 'loading' || !urlDraft.trim()}
                          className="flex h-7 items-center rounded-lg border border-sky-300/40 bg-sky-400/20 px-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--dashboard-text-100)] transition-[background-color,border-color] duration-150 hover:border-sky-300/60 hover:bg-sky-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : null}

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
                        onSelect={() => handleBackgroundSelect(item.id)}
                        onDelete={
                          item.isCustom && onDeleteCustomBackground
                            ? () => handleDeleteBackground(item.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
