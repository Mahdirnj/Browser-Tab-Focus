import SectionShell from './SectionShell'
import { GREETING_SUBLINE_MODES } from '../../utils/greetingSubline'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <path d="M3 10a7 7 0 1112.9 3.8L17 17l-3.2-1.1A7 7 0 013 10z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9.5h6M7 12h4" strokeLinecap="round" />
  </svg>
)

const SUBLINE_OPTIONS = [
  {
    id: GREETING_SUBLINE_MODES.none,
    label: 'Off',
    description: 'Show just the greeting.',
  },
  {
    id: GREETING_SUBLINE_MODES.dayContext,
    label: 'Day context',
    description: 'A motivational line that changes with the weekday.',
  },
  {
    id: GREETING_SUBLINE_MODES.focusEcho,
    label: "Today's focus",
    description: 'Echo your daily focus goal under the greeting.',
  },
]

export function GreetingSection({ sublineMode, onSublineModeChange }) {
  const activeMode = SUBLINE_OPTIONS.some((option) => option.id === sublineMode)
    ? sublineMode
    : GREETING_SUBLINE_MODES.dayContext

  return (
    <SectionShell icon={Icon} title="Greeting">
      <div className="space-y-1.5">
        <p className="mb-1 text-[0.6rem] uppercase tracking-[0.2em] text-[color:var(--dashboard-text-40)]">
          Sub-line
        </p>
        {SUBLINE_OPTIONS.map((option) => {
          const isActive = option.id === activeMode
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSublineModeChange?.(option.id)}
              disabled={!onSublineModeChange}
              className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-[border-color,background-color,color] duration-100 ${
                isActive
                  ? 'border-emerald-300/50 bg-emerald-400/15 text-[color:var(--dashboard-text-100)]'
                  : 'border-white/[0.08] bg-white/[0.06] text-[color:var(--dashboard-text-70)] hover:border-white/25 hover:bg-white/[0.1] hover:text-[color:var(--dashboard-text-100)]'
              } ${!onSublineModeChange ? 'cursor-not-allowed opacity-60' : ''}`}
              aria-pressed={isActive}
            >
              <span className="min-w-0">
                <span className="block text-[0.8rem] font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-[0.62rem] leading-snug text-[color:var(--dashboard-text-40)]">
                  {option.description}
                </span>
              </span>
              {isActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300">
                  <path d="M3 8.5l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-30)]">
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </SectionShell>
  )
}

export default GreetingSection
