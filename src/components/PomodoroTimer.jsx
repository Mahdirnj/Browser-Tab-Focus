import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CARD_CLASSES =
  'flex h-48 w-48 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/25'

const FOCUS_DURATION = 25 * 60 * 1000
const SHORT_BREAK_DURATION = 5 * 60 * 1000
const LONG_BREAK_DURATION = 15 * 60 * 1000
const LONG_BREAK_INTERVAL = 4

const hasWindow = () => typeof window !== 'undefined'
const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

export function PomodoroTimer({ isObscured = false }) {
  const [phase, setPhase] = useState('focus')
  const [phaseDuration, setPhaseDuration] = useState(FOCUS_DURATION)
  const [remainingMs, setRemainingMs] = useState(FOCUS_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [resetPulse, setResetPulse] = useState(false)
  const rafRef = useRef(null)
  const endTimestampRef = useRef(null)
  const resetPulseTimeout = useRef(null)

  const startPhase = useCallback((nextPhase, autoStart) => {
    const nextDuration =
      nextPhase === 'focus'
        ? FOCUS_DURATION
        : nextPhase === 'longBreak'
          ? LONG_BREAK_DURATION
          : SHORT_BREAK_DURATION

    setPhase(nextPhase)
    setPhaseDuration(nextDuration)
    setRemainingMs(nextDuration)

    if (!hasWindow()) {
      setIsRunning(false)
      return
    }

    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (autoStart) {
      endTimestampRef.current = getNow() + nextDuration
      setIsRunning(true)
    } else {
      endTimestampRef.current = null
      setIsRunning(false)
    }
  }, [])

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'focus') {
      setCyclesCompleted((count) => {
        const nextCount = count + 1
        const isLongBreak = nextCount % LONG_BREAK_INTERVAL === 0
        startPhase(isLongBreak ? 'longBreak' : 'shortBreak', true)
        return nextCount
      })
    } else {
      startPhase('focus', true)
    }
  }, [phase, startPhase])

  useEffect(() => {
    if (!hasWindow()) return undefined

    if (!isRunning) {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return undefined
    }

    const tick = () => {
      if (endTimestampRef.current == null) {
        setIsRunning(false)
        return
      }

      const remaining = endTimestampRef.current - getNow()
      if (remaining <= 0) {
        setRemainingMs(0)
        if (rafRef.current != null) {
          window.cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        setIsRunning(false)
        handlePhaseComplete()
        return
      }

      setRemainingMs(remaining)
      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isRunning, handlePhaseComplete])

  useEffect(() => {
    if (!hasWindow()) return undefined
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (resetPulseTimeout.current != null) {
        window.clearTimeout(resetPulseTimeout.current)
      }
    }
  }, [])

  const toggleRunning = useCallback(() => {
    if (!hasWindow()) return
    if (isRunning) {
      setIsRunning(false)
      return
    }

    endTimestampRef.current = getNow() + remainingMs
    setIsRunning(true)
  }, [isRunning, remainingMs])

  const handleReset = useCallback(() => {
    if (resetPulseTimeout.current != null && hasWindow()) {
      window.clearTimeout(resetPulseTimeout.current)
    }
    setCyclesCompleted(0)
    startPhase('focus', false)
    setResetPulse(true)
    if (hasWindow()) {
      resetPulseTimeout.current = window.setTimeout(() => {
        setResetPulse(false)
      }, 420)
    }
  }, [startPhase])


  const nextPhaseLabel = useMemo(() => {
    if (phase === 'focus') {
      const nextCount = cyclesCompleted + 1
      return nextCount % LONG_BREAK_INTERVAL === 0 ? 'Long Break' : 'Break'
    }
    return 'Focus'
  }, [phase, cyclesCompleted])

  const formattedTime = useMemo(() => formatTime(remainingMs), [remainingMs])
  const cycleDisplay = useMemo(
    () => (cyclesCompleted % LONG_BREAK_INTERVAL) + 1,
    [cyclesCompleted],
  )
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const progressFraction = phaseDuration ? Math.min(1, Math.max(0, remainingMs / phaseDuration)) : 0
  const strokeOffset = circumference * (1 - progressFraction)

  const accentStroke =
    phase === 'focus' ? 'stroke-emerald-300/90' : phase === 'longBreak' ? 'stroke-sky-300/90' : 'stroke-cyan-300/90'
  const accentGlow =
    phase === 'focus'
      ? 'shadow-[0_18px_35px_-20px_rgba(16,185,129,0.9)]'
      : phase === 'longBreak'
        ? 'shadow-[0_18px_35px_-20px_rgba(14,165,233,0.9)]'
        : 'shadow-[0_18px_35px_-20px_rgba(6,182,212,0.9)]'

  return (
    <section
      className={`${CARD_CLASSES} ${accentGlow}`}
      aria-hidden={isObscured ? 'true' : undefined}
      data-obscured={isObscured ? 'true' : 'false'}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[0.5rem] font-semibold uppercase tracking-[0.38em] text-white/70">
            Pomodoro
          </h2>
          <p className="mt-1 text-[0.5rem] uppercase tracking-[0.28em] text-white/45">
            Next: {nextPhaseLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="group flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/65 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Restart current cycle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4"
          >
            <path
              d="M6.5 4.5L4 7l2.5 2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 7h5.2a4.8 4.8 0 11-4.5 6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={`relative  flex flex-1 items-center justify-center pomodoro-ring ${resetPulse ? 'pomodoro-ring--pulse' : ''}`}
      >
        <svg
          viewBox="0 0 160 160"
          className="h-36 w-36 text-white/20"
          role="presentation"
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="fill-none stroke-current"
            strokeWidth="10"
            strokeOpacity="0.12"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`pomodoro-progress fill-none ${accentStroke}`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`pomodoro-time text-xl font-semibold tracking-[0.18em] text-white transition-opacity duration-300 ${
              isRunning ? 'animate-none' : 'opacity-95'
            }`}
          >
            {formattedTime}
          </span>
          <span className="mt-2 text-[0.45rem] uppercase tracking-[0.26em] text-white/45 transition-opacity duration-300 pomodoro-time-sub">
            Cycle {cycleDisplay}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleRunning}
          className={`pomodoro-play absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.32em] text-white/85 opacity-0 transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
          aria-pressed={isRunning}
        >
          <span className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[0.6rem] text-white shadow-[0_18px_35px_-25px_rgba(148,163,184,0.9)]">
            {isRunning ? 'Pause' : 'Start'}
          </span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleRunning}
          className={`rounded-full border px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
            isRunning
              ? 'border-white/25 bg-white/20 text-white hover:border-white/35'
              : 'border-white/20 bg-white/10 text-white/80 hover:border-white/35 hover:text-white'
          }`}
          aria-pressed={isRunning}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <div />
      </div>
    </section>
  )
}

export default PomodoroTimer
