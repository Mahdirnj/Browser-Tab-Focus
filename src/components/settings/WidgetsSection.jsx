import SectionShell from './SectionShell'
import ToggleSwitch from './ToggleSwitch'
import { WIDGET_DEFS } from './sharedConstants'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <rect x="3" y="3" width="6" height="6" rx="1.5" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" />
  </svg>
)

export function WidgetsSection({ widgetStates, onWidgetToggle }) {
  return (
    <SectionShell icon={Icon} title="Widgets">
      <div className="divide-y divide-white/[0.06]">
        {WIDGET_DEFS.map((item) => {
          const enabled = widgetStates[item.id]
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-semibold text-[color:var(--dashboard-text-80)]">{item.label}</p>
                <p className="mt-0.5 text-[0.62rem] leading-snug text-[color:var(--dashboard-text-40)]">{item.description}</p>
              </div>
              <ToggleSwitch
                checked={enabled}
                onChange={(next) => onWidgetToggle?.(item.id, next)}
                disabled={!onWidgetToggle}
              />
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

export default WidgetsSection
