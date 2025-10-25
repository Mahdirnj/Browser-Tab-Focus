import { useEffect, useRef, useState } from 'react'

const USER_NAME_KEY = 'focus_dashboard_userName'

function greetingForHour(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 24) return 'Good evening'
  return 'Good night'
}

export function Greeting({ theme = 'dark' }) {
  const initialName =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(USER_NAME_KEY) ?? ''
      : ''

  const [name, setName] = useState(initialName)
  const [inputValue, setInputValue] = useState(initialName)
  const [isEditing, setIsEditing] = useState(() => !initialName)
  const [greeting, setGreeting] = useState(() => greetingForHour())
  const inputRef = useRef(null)

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

  const isLight = theme === 'light'

  return (
    <section className="flex flex-col items-center gap-4 text-center">
      {isEditing ? (
        <div
          className={`w-full max-w-md rounded-3xl border p-6 shadow-[0_45px_80px_-45px_rgba(11,20,45,0.85)] backdrop-blur-2xl ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.35)]'
              : 'border-white/20 bg-white/[0.12] text-white'
          }`}
        >
          <label
            htmlFor="user-name"
            className={`block text-[0.7rem] font-semibold uppercase tracking-[0.45em] ${
              isLight ? 'text-slate-600' : 'text-white/60'
            }`}
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
            className={`mt-3 w-full rounded-2xl border px-4 py-3 text-base focus:outline-none focus:ring-2 ${
              isLight
                ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-300/60'
                : 'border-white/20 bg-white/[0.08] text-white/90 placeholder:text-white/45 focus:border-sky-200 focus:ring-sky-300/60'
            }`}
          />
          <p
            className={`mt-3 text-xs ${
              isLight ? 'text-slate-500' : 'text-white/60'
            }`}
          >
            Press Enter to save.
          </p>
        </div>
      ) : (
        <>
          <p
            className={`text-[0.65rem] uppercase tracking-[0.75em] ${
              isLight ? 'text-slate-500' : 'text-white/55'
            }`}
          >
            Focus Dashboard
          </p>
          <h1
            className={`text-4xl font-semibold md:text-6xl ${
              isLight
                ? 'text-slate-900 drop-shadow-[0_10px_25px_rgba(148,163,184,0.45)]'
                : 'bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent drop-shadow-[0_12px_30px_rgba(15,23,42,0.4)]'
            }`}
          >
            {greeting}, {name}.
          </h1>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
              isLight
                ? 'border-slate-900/20 bg-white/70 text-slate-900/80 hover:border-slate-900/35 hover:text-slate-900'
                : 'border-white/25 bg-white/[0.08] text-white/70 hover:border-white/35 hover:text-white'
            }`}
          >
            Change Name
          </button>
        </>
      )}
    </section>
  )
}

export default Greeting
