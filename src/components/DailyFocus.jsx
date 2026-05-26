import { useEffect, useRef, useState } from 'react'
import { DAILY_FOCUS_KEY, FOCUS_DATE_KEY } from '../constants/storageKeys'
import { readJSON, readString, writeJSON, writeString } from '../utils/storage'

function getTodayString() {
  return new Date().toDateString()
}

function loadFocusState() {
  const storedDate = readString(FOCUS_DATE_KEY, '')
  if (storedDate !== getTodayString()) {
    return { text: '', completed: false }
  }
  const stored = readJSON(DAILY_FOCUS_KEY, null)
  if (!stored || typeof stored.text !== 'string') return { text: '', completed: false }
  return { text: stored.text, completed: Boolean(stored.completed) }
}

function saveFocusState(state) {
  writeJSON(DAILY_FOCUS_KEY, state)
  writeString(FOCUS_DATE_KEY, getTodayString())
}

/** Animated check icon — matches the TodoList's approach */
function CheckIcon({ active }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="h-2.5 w-2.5">
      <polyline
        points="2 6.5 5 9.5 10 3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        strokeDasharray="12"
        strokeDashoffset={active ? 0 : 12}
        style={{
          transition:
            'stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease',
          opacity: active ? 1 : 0,
        }}
      />
    </svg>
  )
}

export function DailyFocus() {
  const [focusState, setFocusState] = useState(() => loadFocusState())
  const [inputValue, setInputValue] = useState('')
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  // Slight delay so the fade-in runs after first paint
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  const hasGoal = focusState.text.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    // Brief scale-pulse on submit
    setSubmitting(true)
    window.setTimeout(() => setSubmitting(false), 340)

    const next = { text: trimmed, completed: false }
    setFocusState(next)
    saveFocusState(next)
    setInputValue('')
  }

  function handleToggle() {
    const next = { ...focusState, completed: !focusState.completed }
    setFocusState(next)
    saveFocusState(next)
  }

  function handleReset() {
    const cleared = { text: '', completed: false }
    setFocusState(cleared)
    saveFocusState(cleared)
  }

  return (
    <div
      className={`mt-2 flex flex-col items-center gap-1.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        mounted ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-2.5 w-2.5 text-[color:var(--dashboard-text-40)]">
          <circle cx="6" cy="6" r="4.5" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--dashboard-text-40)]">
          Today&apos;s Focus
        </p>
      </div>

      {!hasGoal ? (
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 transition-transform duration-300 ease-out ${
            submitting ? 'scale-[0.97]' : 'scale-100'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What's your main focus today?"
            maxLength={80}
            className="w-64 rounded-full border border-white/12 bg-white/[0.05] px-4 py-1.5 text-[0.78rem] tracking-[0.03em] text-[color:var(--dashboard-text-80)] placeholder:text-[color:var(--dashboard-text-30)] backdrop-blur-md transition-all duration-300 ease-out hover:border-white/20 hover:bg-white/[0.08] focus:border-white/30 focus:bg-white/[0.09] focus:shadow-[0_0_20px_-8px_rgba(255,255,255,0.25)] focus:outline-none"
            aria-label="Set your focus goal for today"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="group flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-[color:var(--dashboard-text-55)] transition-all duration-200 ease-out hover:scale-110 hover:border-white/35 hover:bg-white/[0.14] hover:text-[color:var(--dashboard-text-95)] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Set today's focus"
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3 w-3 transition-transform duration-200 group-hover:translate-y-px"
            >
              <path d="M7 2v10M2 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      ) : (
        <div
          className={`group/goal flex items-center gap-2.5 rounded-full border px-3.5 py-2 backdrop-blur-sm transition-all duration-300 ease-out ${
            focusState.completed
              ? 'border-emerald-300/20 bg-emerald-300/[0.05] shadow-[0_0_28px_-8px_rgba(52,211,153,0.22)]'
              : 'border-white/10 bg-white/[0.05] shadow-[0_2px_16px_-6px_rgba(0,0,0,0.3)] hover:border-white/18 hover:bg-white/[0.08]'
          }`}
        >
          {/* Toggle checkbox */}
          <button
            type="button"
            onClick={handleToggle}
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-250 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              focusState.completed
                ? 'border-emerald-300/55 bg-emerald-300/15 text-emerald-300 shadow-[0_0_14px_-5px_rgba(52,211,153,0.55)]'
                : 'border-white/18 bg-white/[0.05] text-[color:var(--dashboard-text-65)] hover:border-white/35 hover:bg-white/[0.10]'
            }`}
            aria-label={focusState.completed ? 'Mark focus incomplete' : 'Mark focus as done'}
            aria-pressed={focusState.completed}
          >
            <CheckIcon active={focusState.completed} />
          </button>

          {/* Goal text */}
          <p
            className={`max-w-[220px] text-[0.82rem] tracking-[0.02em] transition-all duration-400 ease-out ${
              focusState.completed
                ? 'text-[color:var(--dashboard-text-30)] line-through decoration-white/20'
                : 'text-[color:var(--dashboard-text-80)]'
            }`}
          >
            {focusState.text}
          </p>

          {/* Divider + clear button — inside capsule, fades on hover */}
          <span className="h-3.5 w-px flex-shrink-0 bg-white/[0.12] transition-opacity duration-200 group-hover/goal:bg-white/20" aria-hidden="true" />
          <button
            type="button"
            onClick={handleReset}
            className="flex-shrink-0 text-[color:var(--dashboard-text-30)] opacity-0 transition-all duration-200 group-hover/goal:opacity-100 hover:text-[color:var(--dashboard-text-70)] focus-visible:opacity-100 focus-visible:outline-none"
            aria-label="Clear today's focus"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-2.5 w-2.5"
            >
              <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
