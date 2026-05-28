import { useEffect, useMemo, useState } from 'react'
import { formatCalendarDate, DEFAULT_CALENDAR_ID } from '../utils/calendar'
import { getDefaultTimezone } from '../utils/timezone'

const DEFAULT_TIMEZONE = getDefaultTimezone()

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

export function Clock({ timezone, calendarId = DEFAULT_CALENDAR_ID }) {
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
  const dateInfo = useMemo(
    () => formatCalendarDate(now, calendarId, effectiveZone),
    [now, calendarId, effectiveZone],
  )

  useEffect(() => {
    const tick = () => setNow(new Date())
    const interval = window.setInterval(tick, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const hasDate = Boolean(dateInfo?.text)
  const hasZone = Boolean(zoneLabel)

  return (
    <div className="group flex flex-col items-center rounded-full border border-white/15 bg-white/[0.08] px-8 py-4 text-[color:var(--dashboard-text-95)] shadow-[0_25px_70px_-40px_rgba(11,20,45,0.7)] backdrop-blur-[1px] transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.015] hover:border-white/30 hover:bg-white/[0.12] hover:shadow-[0_30px_70px_-30px_rgba(11,20,45,0.85)] md:px-12">
      <span className="tabular-nums text-6xl font-light tracking-tight transition-colors duration-300 group-hover:text-[color:var(--dashboard-text-100)] md:text-8xl">
        {displayTime}
      </span>
      {(hasDate || hasZone) ? (
        <div className="mt-2 flex items-center justify-center gap-x-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-60)] transition-colors duration-300 group-hover:text-[color:var(--dashboard-text-75)] md:text-sm">
          {hasDate ? (
            <span
              className="whitespace-nowrap"
              dir={dateInfo.isRtl ? 'rtl' : 'ltr'}
              title="Today"
            >
              {dateInfo.text}
            </span>
          ) : null}
          {hasDate && hasZone ? (
            <span
              aria-hidden="true"
              className="h-3.5 w-px rounded-full bg-[color:var(--dashboard-text-20)]"
            />
          ) : null}
          {hasZone ? (
            <span className="whitespace-nowrap normal-case tracking-[0.15em]">{zoneLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default Clock
