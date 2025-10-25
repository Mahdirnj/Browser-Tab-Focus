import { useEffect, useState } from 'react'

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="backdrop-blur-[1px] rounded-full bg-white/[0.08] px-8 py-4 text-6xl font-light tracking-tight text-white/95 shadow-[0_25px_70px_-40px_rgba(11,20,45,0.7)]  md:px-12 md:text-8xl">
      <span className="tabular-nums">{formatTime(now)}</span>
    </div>
  )
}

export default Clock
