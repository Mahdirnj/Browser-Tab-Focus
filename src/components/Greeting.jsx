import { useEffect, useRef, useState } from 'react'

const USER_NAME_KEY = 'focus_dashboard_userName'

function greetingForHour(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 24) return 'Good evening'
  return 'Good night'
}

export function Greeting({ editSignal = 0, onNameChange }) {
  const initialName =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(USER_NAME_KEY) ?? ''
      : ''

  const [name, setName] = useState(initialName)
  const [inputValue, setInputValue] = useState(initialName)
  const [isEditing, setIsEditing] = useState(() => !initialName)
  const [greeting, setGreeting] = useState(() => greetingForHour())
  const inputRef = useRef(null)
  const lastEditSignalRef = useRef(editSignal)

  useEffect(() => {
    if (!name) {
      window.localStorage.removeItem(USER_NAME_KEY)
      return
    }
    window.localStorage.setItem(USER_NAME_KEY, name)
  }, [name])

  useEffect(() => {
    const tick = () => setGreeting(greetingForHour())
    tick()
    const id = window.setInterval(tick, 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isEditing) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(id)
  }, [isEditing])

  useEffect(() => {
    if (lastEditSignalRef.current !== editSignal) {
      lastEditSignalRef.current = editSignal
      setIsEditing(true)
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 20)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [editSignal])

  useEffect(() => {
    if (typeof onNameChange === 'function') {
      onNameChange(name)
    }
  }, [name, onNameChange])

  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setName(trimmed)
    setIsEditing(false)
    setGreeting(greetingForHour())
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
    if (event.key === 'Escape') {
      setInputValue(name)
      setIsEditing(false)
    }
  }

  return (
    <section className="flex flex-col items-center gap-4 text-center">
      {isEditing ? (
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/[0.12] p-6 text-[color:var(--dashboard-text-95)] shadow-[0_45px_80px_-45px_rgba(11,20,45,0.85)] backdrop-blur-sm">
          <label
            htmlFor="user-name"
            className="block text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-[color:var(--dashboard-text-60)]"
          >
            What is your name?
          </label>
          <input
            id="user-name"
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your name"
            className="mt-3 w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3 text-base text-[color:var(--dashboard-text-90)] placeholder:text-[color:var(--dashboard-text-45)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
          />
          <p className="mt-3 text-xs text-[color:var(--dashboard-text-60)]">Press Enter to save.</p>
        </div>
      ) : (
        <>
          <h1 className="bg-gradient-to-r from-[color:var(--dashboard-text-100)] via-[color:var(--dashboard-text-95)] to-[color:var(--dashboard-text-80)] bg-clip-text text-4xl font-semibold text-transparent leading-tight drop-shadow-[0_12px_30px_rgba(15,23,42,0.4)] md:text-6xl md:leading-snug">
            {greeting}, {name}.
          </h1>
        </>
      )}
    </section>
  )
}

export default Greeting
