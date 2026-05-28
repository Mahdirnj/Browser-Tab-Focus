import { useEffect, useState } from 'react'

/**
 * Number input that lets users freely edit (including clearing) and commits
 * only on blur or Enter. Used by the Pomodoro section.
 */
export function DurationInput({ value, defaultValue, min = 1, max = 120, label, onChange }) {
  const [raw, setRaw] = useState(String(value ?? defaultValue))

  // Sync if parent value changes externally
  useEffect(() => {
    setRaw(String(value ?? defaultValue))
  }, [value, defaultValue])

  function commit(rawVal) {
    const num = Number(rawVal)
    if (rawVal === '' || Number.isNaN(num) || num < min) {
      setRaw(String(defaultValue))
      onChange(defaultValue)
    } else {
      const clamped = Math.min(max, Math.max(min, num))
      setRaw(String(clamped))
      onChange(clamped)
    }
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className="w-14 rounded-lg border border-white/15 bg-white/[0.08] px-2 py-1 text-center text-xs font-semibold tracking-[0.1em] text-[color:var(--dashboard-text-90)] transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label={`${label} duration in minutes`}
    />
  )
}

export default DurationInput
