import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const BackgroundOption = memo(function BackgroundOption({
  label,
  url,
  isSelected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border transition-colors duration-150 ${
        isSelected ? 'border-white/80' : 'border-white/10 hover:border-white/35'
      }`}
      aria-label={`Use background ${label}`}
      aria-pressed={isSelected}
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-16 w-full object-cover transition duration-300 group-hover:scale-105"
      />
      {isSelected ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold uppercase tracking-[0.25em]">
          Active
        </span>
      ) : null}
    </button>
  )
})

export function SettingsPanel({
  backgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
}) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const preloadedRef = useRef(new Set())

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const handleBackgroundSelect = useCallback(
    (id) => {
      onBackgroundSelect(id)
    },
    [onBackgroundSelect],
  )

  useEffect(() => {
    if (!open) return

    const handleClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!backgrounds.length) return

    let cancelled = false
    const preload = () => {
      backgrounds.forEach((item) => {
        if (cancelled || preloadedRef.current.has(item.id)) return
        const image = new Image()
        image.src = item.url
        const decode = image.decode ? image.decode() : Promise.resolve()
        decode
          .catch(() => null)
          .finally(() => preloadedRef.current.add(item.id))
      })
    }

    const requestIdle =
      window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 180))
    const cancelIdle =
      window.cancelIdleCallback ?? ((handle) => window.clearTimeout(handle))

    const handle = requestIdle(preload)

    return () => {
      cancelled = true
      cancelIdle(handle)
    }
  }, [backgrounds])

  const backgroundItems = useMemo(
    () =>
      backgrounds.map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        isSelected: selectedBackgroundId === item.id,
      })),
    [backgrounds, selectedBackgroundId],
  )

  return (
    <div className="absolute right-6 top-6 z-20">
      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] transition hover:border-white/35 hover:bg-white/20"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="settings-panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="1.6"
            stroke="currentColor"
            fill="none"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 3.06-1.756 3.486 0a1.724 1.724 0 002.573 1.066c1.543-.93 3.31.836 2.38 2.38a1.724 1.724 0 001.065 2.572c1.756.426 1.756 3.06 0 3.486a1.724 1.724 0 00-1.066 2.573c.93 1.543-.836 3.31-2.38 2.38a1.724 1.724 0 00-2.572 1.065c-.426 1.756-3.06 1.756-3.486 0a1.724 1.724 0 00-2.573-1.066c-1.543.93-3.31-.836-2.38-2.38a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-3.06 0-3.486a1.724 1.724 0 001.066-2.573c-.93-1.543.836-3.31 2.38-2.38.996.6 2.276.16 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {open && (
          <div
            id="settings-panel"
            ref={panelRef}
            className="absolute right-0 top-full mt-3 w-80 rounded-3xl border border-white/15 bg-slate-900/80 p-5 text-white shadow-[0_35px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em]">
                Settings
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Background
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {backgroundItems.map((item) => (
                    <BackgroundOption
                      key={item.id}
                      label={item.label}
                      url={item.url}
                      isSelected={item.isSelected}
                      onSelect={() => handleBackgroundSelect(item.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
