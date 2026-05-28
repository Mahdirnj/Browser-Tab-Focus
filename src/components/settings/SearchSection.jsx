import SectionShell from './SectionShell'
import ToggleSwitch from './ToggleSwitch'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="9" cy="9" r="5.5" />
    <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
  </svg>
)

export function SearchSection({ openInNewTab, onSearchBehaviorChange }) {
  return (
    <SectionShell icon={Icon} title="Search">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.75rem] font-semibold text-[color:var(--dashboard-text-80)]">
            {openInNewTab ? 'Open in new tab' : 'Open in current tab'}
          </p>
          <p className="mt-0.5 text-[0.62rem] leading-snug text-[color:var(--dashboard-text-40)]">
            Toggle to launch results in a new browser tab.
          </p>
        </div>
        <ToggleSwitch
          checked={openInNewTab}
          onChange={(next) => onSearchBehaviorChange?.(next)}
          disabled={!onSearchBehaviorChange}
          ariaLabel={openInNewTab ? 'Open search results in a new tab' : 'Open search results in the current tab'}
        />
      </div>
    </SectionShell>
  )
}

export default SearchSection
