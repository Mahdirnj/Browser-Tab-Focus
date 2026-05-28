import SectionShell from './SectionShell'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="10" cy="10" r="7" />
    <path d="M7 10a3 3 0 006 0" strokeLinecap="round" />
  </svg>
)

export function TextColorSection({ items, onTextColorChange }) {
  if (!items?.length) return null

  return (
    <SectionShell icon={Icon} title="Text Color">
      <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-2 py-3">
        <div className="relative flex items-center justify-between">
          <span className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/[0.1]" />
          {items.map((item) => {
            const isSelected = item.isSelected
            const isDisabled = !onTextColorChange
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTextColorChange?.(item.id)}
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
    </SectionShell>
  )
}

export default TextColorSection
