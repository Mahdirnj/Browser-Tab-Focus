import { useState } from 'react'

export function SearchBar({ theme = 'dark' }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const isLight = theme === 'light'

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto flex w-full max-w-2xl items-center rounded-full border pl-5 pr-2 shadow-[0_25px_50px_-25px_rgba(15,23,42,0.65)] backdrop-blur-2xl focus-within:border-white/30 ${
        isLight
          ? 'border-slate-900/10 bg-white/80 focus-within:bg-white/90'
          : 'border-white/15 bg-white/10 focus-within:bg-white/15'
      }`}
    >
      <span className={isLight ? 'text-slate-500' : 'text-white/60'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <circle cx="11" cy="11" r="6" />
          <line x1="20" y1="20" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        aria-label="Search the web"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Google or type a URL"
        className={`flex-1 bg-transparent px-4 py-3 text-base focus:outline-none ${
          isLight
            ? 'text-slate-900 placeholder:text-slate-500'
            : 'text-white placeholder:text-white/50'
        }`}
      />
      <button
        type="submit"
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          isLight
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-white text-slate-900 hover:bg-slate-100'
        }`}
      >
        Search
      </button>
    </form>
  )
}

export default SearchBar
