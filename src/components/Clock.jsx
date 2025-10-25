import { useEffect, useState } from 'react'

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Clock({ theme = 'dark' }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const isLight = theme === 'light'

  return (
    <div
      className={`rounded-full border px-8 py-4 text-6xl font-light tracking-tight shadow-[0_25px_70px_-40px_rgba(11,20,45,0.7)] backdrop-blur-3xl md:px-12 md:text-8xl ${
        isLight
          ? 'border-slate-900/10 bg-white/80 text-slate-900'
          : 'border-white/10 bg-white/[0.08] text-white/95'
      }`}
    >
      <span className="tabular-nums">{formatTime(now)}</span>
    </div>
  )
}

export default Clock
