import { useMemo, useState } from 'react'
import SectionShell from './SectionShell'
import { describeTimeZoneOffset, normalizeTimeZoneLabel } from './timezoneUtils'
import { FALLBACK_TIMEZONES, MAX_TIMEZONE_RESULTS } from './sharedConstants'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 2.5c-2.5 2.5-3.5 5-3.5 7.5s1 5 3.5 7.5M10 2.5c2.5 2.5 3.5 5 3.5 7.5s-1 5-3.5 7.5M2.5 10h15" strokeLinecap="round" />
  </svg>
)

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="9" cy="9" r="5.5" />
    <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
  </svg>
)

export function TimezoneSection({ clockTimezone, onClockTimezoneChange }) {
  const [timezoneQuery, setTimezoneQuery] = useState('')

  const availableTimeZones = useMemo(() => {
    let zones = []
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      try {
        zones = Intl.supportedValuesOf('timeZone')
      } catch (error) {
        console.warn('Unable to read supported time zones', error)
        zones = []
      }
    }
    if (!zones || zones.length === 0) zones = FALLBACK_TIMEZONES
    if (clockTimezone && !zones.includes(clockTimezone)) zones = [...zones, clockTimezone]
    return Array.from(new Set(zones)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  }, [clockTimezone])

  const filteredTimeZones = useMemo(() => {
    const normalized = timezoneQuery.trim().toLowerCase()
    if (!normalized) return []
    return availableTimeZones.filter((zone) => zone.toLowerCase().includes(normalized))
  }, [availableTimeZones, timezoneQuery])

  const displayedTimeZones = useMemo(
    () => filteredTimeZones.slice(0, MAX_TIMEZONE_RESULTS),
    [filteredTimeZones],
  )

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

  return (
    <SectionShell icon={Icon} title="Clock Timezone">
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
          {SearchIcon}
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
    </SectionShell>
  )
}

export default TimezoneSection
