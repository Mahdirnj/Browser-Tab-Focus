import { useEffect, useRef, useState } from 'react'

const FOCUS_KEY = 'focus_dashboard_focus'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function readStoredFocus() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(FOCUS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.text) return null
    if (parsed.date !== getTodayKey()) {
      window.localStorage.removeItem(FOCUS_KEY)
      return null
    }
    return {
      text: parsed.text,
      completed: Boolean(parsed.completed),
    }
  } catch (error) {
    console.warn('Unable to parse stored focus', error)
    window.localStorage.removeItem(FOCUS_KEY)
    return null
  }
}

function CheckIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 stroke-[3] ${active ? 'stroke-white' : 'stroke-transparent'}`}
    >
      <polyline
        points="4 10.5 8 14.5 16 6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PANEL_CLASSES =
  'w-full rounded-[28px] border border-white/15 bg-white/[0.13] px-6 py-7 shadow-[0_45px_80px_-45px_rgba(11,20,45,0.85)] backdrop-blur-2xl transition duration-500 hover:border-white/25'

export function Focus() {
  const [focus, setFocus] = useState(() => readStoredFocus())
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)
  const dayKeyRef = useRef(getTodayKey())

  useEffect(() => {
    if (!focus) {
      window.localStorage.removeItem(FOCUS_KEY)
      return
    }
    const today = getTodayKey()
    dayKeyRef.current = today
    window.localStorage.setItem(
      FOCUS_KEY,
      JSON.stringify({
        ...focus,
        date: today,
      }),
    )
  }, [focus])

  useEffect(() => {
    if (focus) return
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(timeout)
  }, [focus])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentDayKey = getTodayKey()
      if (dayKeyRef.current !== currentDayKey) {
        dayKeyRef.current = currentDayKey
        setFocus(null)
        window.localStorage.removeItem(FOCUS_KEY)
      }
    }, 60 * 1000)

    return () => window.clearInterval(interval)
  }, [])

  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setFocus({
      text: trimmed,
      completed: false,
    })
    setInputValue('')
  }

  const toggleCompleted = () => {
    setFocus((current) =>
      current ? { ...current, completed: !current.completed } : current,
    )
  }

  const clearFocus = () => {
    setFocus(null)
    setInputValue('')
  }

  return (
    <section className={PANEL_CLASSES}>
      <div className="flex items-center justify-between">
        <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-white/70">
          Main Focus
        </h2>
        {focus?.completed && (
          <span className="rounded-full bg-sky-500/20 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-sky-100">
            Complete
          </span>
        )}
      </div>

      {!focus ? (
        <div className="mt-6">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="What is your main focus for today?"
            className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 text-base text-white/90 placeholder:text-white/40 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
          />
          <p className="mt-3 text-xs text-white/55">
            Press Enter to lock it in for the day.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-4">
          <button
            type="button"
            onClick={toggleCompleted}
            aria-pressed={focus.completed}
            className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
              focus.completed
                ? 'border-sky-300 bg-sky-400/90 shadow-[0_10px_25px_-12px_rgba(56,189,248,0.8)]'
                : 'border-white/25 bg-white/[0.08] hover:border-white/40'
            }`}
            aria-label={
              focus.completed
                ? 'Mark focus as incomplete'
                : 'Mark focus as complete'
            }
          >
            <CheckIcon active={focus.completed} />
          </button>
          <div className="flex-1">
            <p
              className={`text-lg font-medium text-white/90 ${
                focus.completed
                  ? 'text-white/60 line-through decoration-sky-200/80'
                  : ''
              }`}
            >
              {focus.text}
            </p>
            <button
              type="button"
              onClick={clearFocus}
              className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.35em] text-white/60 transition hover:text-rose-200"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Focus
