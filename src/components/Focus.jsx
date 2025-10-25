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
      className={`h-3.5 w-3.5 stroke-[3] ${active ? 'stroke-white' : 'stroke-transparent'}`}
    >
      <polyline
        points="4 10.5 8 14.5 16 6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const CARD_CLASSES =
  'flex h-48 w-48 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/25'

export function Focus() {
  const initialFocus = readStoredFocus()
  const [focus, setFocus] = useState(initialFocus)
  const [isEditing, setIsEditing] = useState(() => !initialFocus)
  const [draft, setDraft] = useState(initialFocus?.text ?? '')
  const inputRef = useRef(null)
  const dayKeyRef = useRef(getTodayKey())

  useEffect(() => {
    if (!focus?.text) {
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
    const interval = window.setInterval(() => {
      const currentDayKey = getTodayKey()
      if (dayKeyRef.current !== currentDayKey) {
        dayKeyRef.current = currentDayKey
        setFocus(null)
        setDraft('')
        setIsEditing(true)
        window.localStorage.removeItem(FOCUS_KEY)
      }
    }, 60 * 1000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isEditing) return
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(timeout)
  }, [isEditing])

  const handleSave = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setFocus({
      text: trimmed,
      completed: false,
    })
    setIsEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSave()
    }
  }

  const toggleCompleted = () => {
    setFocus((current) =>
      current ? { ...current, completed: !current.completed } : current,
    )
  }

  const clearFocus = () => {
    setFocus(null)
    setDraft('')
    setIsEditing(true)
  }

  const startEditing = () => {
    setDraft(focus?.text ?? '')
    setIsEditing(true)
  }

  return (
    <section className={CARD_CLASSES}>
      <div className="flex items-center justify-between">
        <h2 className="text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-white/70">
          Focus
        </h2>
        {focus?.completed ? (
          <span className="rounded-full bg-sky-500/25 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-sky-100">
            Done
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex-1 rounded-2xl px-3 py-3">
        {isEditing ? (
          <div className="flex h-full flex-col">
            <label
              htmlFor="focus-text"
              className="text-[0.55rem] uppercase tracking-[0.32em] text-white/50"
            >
              Today&apos;s Focus
            </label>
            <input
              id="focus-text"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Set your focus"
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
            />
            <button
              type="button"
              onClick={handleSave}
              className="mt-3 w-full rounded-full bg-sky-500/90 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white shadow-[0_15px_30px_-20px_rgba(56,189,248,0.8)] transition hover:bg-sky-400"
            >
              Save
            </button>
          </div>
        ) : focus ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleCompleted}
                aria-pressed={focus.completed}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  focus.completed
                    ? 'border-sky-300 bg-sky-500/80 shadow-[0_12px_25px_-15px_rgba(56,189,248,0.9)]'
                    : 'border-white/25 bg-white/10 hover:border-white/35'
                }`}
                aria-label={
                  focus.completed
                    ? 'Mark focus as incomplete'
                    : 'Mark focus as complete'
                }
              >
                <CheckIcon active={focus.completed} />
              </button>
              <p
                className={`flex-1 text-sm font-medium ${
                  focus.completed
                    ? 'text-white/60 line-through decoration-sky-200/80'
                    : 'text-white'
                }`}
              >
                {focus.text}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between text-[0.55rem] uppercase tracking-[0.32em] text-white/55">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-full border border-white/20 px-2.5 py-1 text-white/70 transition hover:border-white/35 hover:text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={clearFocus}
                className="rounded-full border border-white/10 px-2.5 py-1 text-rose-200/70 transition hover:border-rose-200/40 hover:text-rose-100"
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-start justify-center gap-3 text-left">
            <p className="text-sm font-semibold text-white/85">
              No focus yet
            </p>
            <p className="text-[0.6rem] uppercase tracking-[0.32em] text-white/50">
              Set your intention for the day.
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-white/90 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:bg-white"
            >
              Set Focus
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Focus
