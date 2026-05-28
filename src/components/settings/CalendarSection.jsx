import SectionShell from './SectionShell'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <rect x="3" y="4" width="14" height="13" rx="2" />
    <path d="M3 8h14" strokeLinecap="round" />
    <path d="M7 2.5v3M13 2.5v3" strokeLinecap="round" />
  </svg>
)

export function CalendarSection({ calendarOptions, calendarId, onCalendarChange }) {
  if (!Array.isArray(calendarOptions) || !calendarOptions.length) return null
  const active = calendarOptions.find((o) => o.id === calendarId) ?? calendarOptions[0]

  return (
    <SectionShell icon={Icon} title="Calendar">
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.06] px-3.5 py-2.5">
          <div className="flex flex-col">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--dashboard-text-40)]">Active</span>
            <span className="text-[0.82rem] font-semibold text-[color:var(--dashboard-text-95)]">
              {active?.label}
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-[color:var(--dashboard-text-35)]">
            <rect x="3" y="4" width="14" height="13" rx="2" />
            <path d="M3 8h14" strokeLinecap="round" />
            <path d="M7 2.5v3M13 2.5v3" strokeLinecap="round" />
          </svg>
        </div>
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
    </SectionShell>
  )
}

export default CalendarSection
