import DurationInput from './DurationInput'
import SectionShell from './SectionShell'
import { DEFAULT_POMODORO_DURATIONS, POMODORO_DEFS } from './sharedConstants'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6.5v3.8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function PomodoroSection({ pomodoroDurations, onPomodoroDurationsChange }) {
  return (
    <SectionShell icon={Icon} title="Pomodoro">
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
                    ...(pomodoroDurations ?? DEFAULT_POMODORO_DURATIONS),
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
    </SectionShell>
  )
}

export default PomodoroSection
