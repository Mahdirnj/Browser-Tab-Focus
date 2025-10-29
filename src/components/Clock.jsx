import { useEffect, useMemo, useState } from 'react'

const DEFAULT_TIMEZONE =
  typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'

function formatTime(date, timeZone) {
  try {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    })
  } catch (error) {
    console.warn('Unable to format time with timezone', timeZone, error)
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

function formatTimeZoneLabel(timeZone) {
  if (!timeZone) return ''
  return timeZone
    .split('/')
    .map((part) => part.replace(/_/g, ' '))
    .join(' • ')
}

export function Clock({ timezone }) {
  const [now, setNow] = useState(() => new Date())
  const effectiveZone = timezone || DEFAULT_TIMEZONE
  const displayTime = useMemo(
    () => formatTime(now, effectiveZone),
    [now, effectiveZone],
  )
  const zoneLabel = useMemo(
    () => formatTimeZoneLabel(effectiveZone),
    [effectiveZone],
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center rounded-full border border-white/15 bg-white/[0.08] px-8 py-4 text-[color:var(--dashboard-text-95)] shadow-[0_25px_70px_-40px_rgba(11,20,45,0.7)] backdrop-blur-[1px] md:px-12">
      <span className="tabular-nums text-6xl font-light tracking-tight md:text-8xl">
        {displayTime}
      </span>
      <span className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--dashboard-text-60)] md:text-sm">
        {zoneLabel}
      </span>
    </div>
  )
}

export default Clock
