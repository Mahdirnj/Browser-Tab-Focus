import { useMemo, useState, useEffect } from 'react'
import { getTodayQuote } from '../constants/quotes'

export function Quote() {
  const quote = useMemo(() => getTodayQuote(), [])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 120)
    return () => window.clearTimeout(id)
  }, [])

  if (!quote) return null

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {/* Horizontal capsule — quote + inline author */}
      <div className="group relative flex max-w-lg items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/18 hover:bg-white/[0.08]">
        <span className="h-3.5 w-px flex-shrink-0 rounded-full bg-white/20 transition-all duration-300 group-hover:bg-white/35" />
        <p className="text-center text-[0.85rem] font-medium italic leading-relaxed tracking-[0.01em] text-[color:var(--dashboard-text-60)]">
          &ldquo;{quote.text}&rdquo;
          <span className="ml-2 not-italic font-semibold text-[0.75rem] tracking-[0.06em] text-[color:var(--dashboard-text-40)]"> — {quote.author}</span>
        </p>
        <span className="h-3.5 w-px flex-shrink-0 rounded-full bg-white/20 transition-all duration-300 group-hover:bg-white/35" />
      </div>
    </div>
  )
}
