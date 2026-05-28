import { memo } from 'react'

/** Single thumbnail tile in the Background grid. */
export const BackgroundOption = memo(function BackgroundOption({
  label,
  thumbnailUrl,
  isSelected,
  isCustom,
  onSelect,
  onDelete,
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-colors duration-150 ${
        isSelected ? 'border-white/80' : 'border-white/10 hover:border-white/35'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
        aria-label={`Use background ${label}`}
        aria-pressed={isSelected}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-16 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-16 w-full items-center justify-center bg-white/[0.04]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-4 w-4 animate-pulse text-white/40">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
        )}
        {isSelected ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-slate-900">
                <path d="M2 6.5l2.5 2.5 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        ) : null}
      </button>
      {isCustom && onDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white/85 opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-opacity duration-150 hover:bg-rose-500/80 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-2.5 w-2.5">
            <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  )
})

export default BackgroundOption
