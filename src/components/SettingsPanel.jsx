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
  clockTimezone,
  onClockTimezoneChange,
  widgetsEnabled,
  onWidgetToggle,
  onOpenChange,
  textColorOptions,
  selectedTextColorId,
  onTextColorChange,
}) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const thumbnailCacheRef = useRef(new Map())
  const [thumbRevision, bumpThumbRevision] = useReducer((count) => count + 1, 0)
  const widgetStates = useMemo(
    () => ({
      weather: widgetsEnabled?.weather !== false,
      todo: widgetsEnabled?.todo !== false,
      pomodoro: widgetsEnabled?.pomodoro !== false,
    }),
    [widgetsEnabled],
  )
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
  const activeTimeZone =
    clockTimezone && availableTimeZones.includes(clockTimezone)
      ? clockTimezone
      : availableTimeZones[0] ?? 'UTC'
  const activeTimeZoneLabel = useMemo(
    () => normalizeTimeZoneLabel(activeTimeZone),
    [activeTimeZone],
  )
  const hasTimezoneQuery = timezoneQuery.trim().length > 0

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

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!visible) return

    const handleClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [visible])

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
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[color:var(--dashboard-text-100)] shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] transition hover:border-white/35 hover:bg-white/20"
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
            className={`absolute right-0 top-full mt-3 h-[84vh] w-80 overflow-hidden rounded-[30px] border border-white/20 bg-white/[0.08] p-[1.05rem] text-[color:var(--dashboard-text-100)] shadow-[0_32px_70px_-38px_rgba(15,23,42,0.95)] backdrop-blur transition-all duration-250 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:border-white/30 hover:shadow-[0_42px_95px_-45px_rgba(15,23,42,0.95)] flex flex-col relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/[0.16] before:via-white/[0.05] before:to-transparent before:opacity-0 before:transition before:duration-300  ${
              open
                ? 'pointer-events-auto scale-100 opacity-100 translate-y-0'
                : 'pointer-events-none scale-[0.97] opacity-0 translate-y-2'
            }`}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget) return
              if (!open) {
                setVisible(false)
              }
            }} 
          >
            <div className="relative z-[1] flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 shadow-[0_22px_55px_-45px_rgba(15,23,42,0.95)]">
              <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-80)]">
                Settings
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-white/20 bg-white/[0.12] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-80)] transition hover:border-white/35 hover:text-[color:var(--dashboard-text-100)]"
              >
                Close
              </button>
            </div>

            <div className="relative z-[1] mt-4 flex-1 space-y-5 overflow-y-scroll pr-1 custom-scroll">
              <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-70)]">
                  Profile
                </p>
                <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.1] px-4 py-3">
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--dashboard-text-55)]">
                      Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--dashboard-text-100)]">
                      {currentName ? currentName : 'Not set'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNameEditRequest?.()}
                    className="rounded-full border border-white/25 bg-white/[0.18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--dashboard-text-80)] transition hover:border-white/40 hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:border-white/10 disabled:text-[color:var(--dashboard-text-35)]"
                    disabled={!onNameEditRequest}
                  >
                    Edit
                  </button>
                </div>
              </section>
              <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-70)]">
                  Widgets
                </p>
                <div className="mt-3 space-y-3">
                  {[
                    {
                      id: 'weather',
                      label: 'Weather',
                      description: 'Shows current conditions for your selected city.',
                    },
                    {
                      id: 'todo',
                      label: 'Todo List',
                      description:
                        'Track and complete multiple tasks. Items persist locally until you clear them.',
                    },
                    {
                      id: 'pomodoro',
                      label: 'Pomodoro',
                      description:
                        'Guides you through focus and break cycles. Timer runs locally and resets anytime you need.',
                    },
                  ].map((item) => {
                    const enabled = widgetStates[item.id]
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.1] px-4 py-3 shadow-[0_24px_55px_-48px_rgba(15,23,42,0.95)]"
                      >
                        <div className="flex items-center gap-2 text-left">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--dashboard-text-75)]">
                            {item.label}
                          </p>
                          <span className="group relative inline-flex h-4 w-4 items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              className="h-4 w-4 text-[color:var(--dashboard-text-65)]"
                            >
                              <circle cx="10" cy="10" r="8" strokeOpacity="0.5" />
                              <circle cx="10" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
                              <path d="M10 9v4.6" strokeLinecap="round" />
                            </svg>
                            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2 text-[0.6rem] text-[color:var(--dashboard-text-80)] opacity-0 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.95)] backdrop-blur-2xl transition duration-200 group-hover:opacity-100">
                              {item.description}
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleWidgetToggle(item.id)}
                          role="switch"
                          aria-checked={enabled}
                          disabled={!onWidgetToggle}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full border px-1 transition-colors duration-200 ${
                            enabled
                              ? 'border-emerald-200/80 bg-emerald-400/85'
                              : 'border-white/20 bg-white/12'
                          } ${!onWidgetToggle ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-white shadow-[0_12px_20px_-10px_rgba(148,163,184,0.9)] transition-transform duration-200 ease-out ${
                              enabled ? 'translate-x-7 bg-white' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
              <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-70)]">
                  Clock Timezone
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-2 text-[color:var(--dashboard-text-75)] shadow-[0_18px_38px_-36px_rgba(15,23,42,0.95)]">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-60)]">
                        Current
                      </span>
                      <span className="text-sm font-medium tracking-wide text-[color:var(--dashboard-text-100)]">
                        {activeTimeZoneLabel}
                      </span>
                    </div>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--dashboard-text-45)]">
                      {describeTimeZoneOffset(activeTimeZone)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.95)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4 text-[color:var(--dashboard-text-60)]"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={timezoneQuery}
                      onChange={(event) => setTimezoneQuery(event.target.value)}
                      placeholder="Search world time zones"
                      className="h-7 w-full bg-transparent text-sm text-[color:var(--dashboard-text-100)] placeholder:text-[color:var(--dashboard-text-40)] focus:outline-none"
                    />
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {hasTimezoneQuery ? (
                      displayedTimeZones.length ? (
                        displayedTimeZones.map((zone) => {
                          const label = normalizeTimeZoneLabel(zone)
                          const offset = describeTimeZoneOffset(zone)
                          const isActive = zone === activeTimeZone
                          return (
                            <button
                              key={zone}
                              type="button"
                              onClick={() => onClockTimezoneChange?.(zone)}
                              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-2 text-left transition duration-150 ${
                                isActive
                                  ? 'border-emerald-300/70 bg-emerald-400/25 text-[color:var(--dashboard-text-100)] shadow-[0_24px_40px_-30px_rgba(16,185,129,0.65)]'
                                  : 'border-white/12 bg-white/10 text-[color:var(--dashboard-text-75)] hover:border-white/35 hover:text-[color:var(--dashboard-text-100)]'
                              } ${!onClockTimezoneChange ? 'cursor-not-allowed opacity-60' : ''}`}
                              disabled={!onClockTimezoneChange}
                            >
                              <span className="flex flex-col gap-1">
                                <span className="text-sm font-semibold tracking-wide">
                                  {label}
                                </span>
                                {offset ? (
                                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--dashboard-text-50)]">
                                    {offset}
                                  </span>
                                ) : null}
                              </span>
                              {isActive ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  className="h-4 w-4 text-emerald-200"
                                >
                                  <path
                                    d="M5 11l3 3 7-7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.4"
                                  className="h-4 w-4 text-[color:var(--dashboard-text-35)]"
                                >
                                  <path
                                    d="M7 4l6 6-6 6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          )
                        })
                      ) : (
                        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-[color:var(--dashboard-text-65)]">
                          No time zones match your search. Try a different city or region.
                        </p>
                      )
                    ) : null}
                  </div>
                  {hasTimezoneQuery &&
                  filteredTimeZones.length > displayedTimeZones.length ? (
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--dashboard-text-45)]">
                      Showing first {displayedTimeZones.length} of {filteredTimeZones.length} matches.
                    </p>
                  ) : null}
                </div>
              </section>
              {textColorItems.length ? (
                <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.95)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-70)]">
                    Text Color
                  </p>
                  <div className="mt-4 rounded-[22px] border border-white/12 bg-white/[0.04] px-1.5 py-3 shadow-[0_26px_52px_-40px_rgba(15,23,42,0.9)] backdrop-blur">
                    <div className="relative flex items-center justify-between">
                      <span className="pointer-events-none absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-white/12" />
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
                            className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-250 ${
                              isSelected
                                ? 'scale-[1.1] shadow-[0_30px_48px_-28px_rgba(94,234,212,0.65)]'
                                : 'shadow-[0_22px_40px_-30px_rgba(15,23,42,0.7)] hover:scale-110'
                            } ${isDisabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`absolute inset-0 rounded-full transition-colors duration-250 ${
                                isSelected
                                  ? 'bg-emerald-200/15 ring-2 ring-emerald-200/80'
                                  : 'bg-white/[0.08] group-hover:bg-white/[0.13]'
                              }`}
                            />
                            <span className="absolute inset-[3px] rounded-full bg-white/18 opacity-0 blur-md transition-opacity duration-250 group-hover:opacity-55" />
                            <span
                              className="relative h-6 w-6 rounded-full"
                              style={{ backgroundColor: item.hex }}
                            />
                            {isSelected ? (
                              <span className="absolute inset-0 rounded-full border-2 border-emerald-200/60 opacity-90" />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <span className="h-1 w-14 rounded-full bg-white/15" />
                      <span className="h-1 w-10 rounded-full bg-white/8" />
                    </div>
                  </div>
                </section>
              ) : null}
              <section className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--dashboard-text-70)]">
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
