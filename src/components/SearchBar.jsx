import { useEffect, useRef, useState } from 'react'
import bingLogo from '../SearchEngineLogo/bing.png'

const SEARCH_ENGINES = [
  {
    id: 'google',
    label: 'Google',
    baseUrl: 'https://www.google.com/search?q=',
  },
  {
    id: 'bing',
    label: 'Bing',
    baseUrl: 'https://www.bing.com/search?q=',
  },
  {
    id: 'brave',
    label: 'Brave',
    baseUrl: 'https://search.brave.com/search?q=',
  },
  {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    baseUrl: 'https://duckduckgo.com/?q=',
  },
  {
    id: 'yahoo',
    label: 'Yahoo',
    baseUrl: 'https://search.yahoo.com/search?p=',
  },
]

const SEARCH_BUTTON_ANIMATION_STYLE_ID = 'search-enhancement-animations'

function ensureSearchButtonAnimations() {
  if (typeof document === 'undefined') return
  if (document.getElementById(SEARCH_BUTTON_ANIMATION_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = SEARCH_BUTTON_ANIMATION_STYLE_ID
  style.textContent = `
@keyframes searchBeamHue {
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(180deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes searchMenuReveal {
  0% {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
  }
  60% {
    opacity: 1;
    transform: translateY(1px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes searchSuggestionsReveal {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
  }
  65% {
    opacity: 1;
    transform: translateY(4px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`
  document.head.appendChild(style)
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState(SEARCH_ENGINES[0])
  const [menuOpen, setMenuOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const menuRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const suggestionsAbortRef = useRef(null)

  useEffect(() => {
    ensureSearchButtonAnimations()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.clearTimeout(debounceRef.current)
    debounceRef.current = null
    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current.abort()
      suggestionsAbortRef.current = null
    }

    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setSuggestionsOpen(false)
      setHighlightIndex(-1)
      setIsFetchingSuggestions(false)
      return undefined
    }

    debounceRef.current = window.setTimeout(() => {
      setIsFetchingSuggestions(true)
      setSuggestionsOpen(true)
      setHighlightIndex(-1)
      setSuggestions([])

      const controller = new AbortController()
      suggestionsAbortRef.current = controller
      const requestUrl = `https://corsproxy.io/?https://duckduckgo.com/ac/?q=${encodeURIComponent(trimmed)}`

      fetch(requestUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `DuckDuckGo suggestion request failed with status ${response.status}`,
            )
          }
          return response.json()
        })
        .then((payload) => {
          const phrases = Array.isArray(payload)
            ? payload
                .map((item) => {
                  if (typeof item === 'string') return item
                  if (item && typeof item.phrase === 'string') return item.phrase
                  return null
                })
                .filter(Boolean)
            : []
        const nextSuggestions = phrases.slice(0, 4)

          setSuggestions(nextSuggestions)
          setSuggestionsOpen(nextSuggestions.length > 0)
          setHighlightIndex(-1)
          if (suggestionsAbortRef.current === controller) {
            suggestionsAbortRef.current = null
          }
          setIsFetchingSuggestions(false)
        })
        .catch((error) => {
          if (error?.name === 'AbortError') {
            return
          }
          console.error('Failed to fetch search suggestions', error)
          setSuggestions([])
          setSuggestionsOpen(false)
          setHighlightIndex(-1)
          if (suggestionsAbortRef.current === controller) {
            suggestionsAbortRef.current = null
          }
          setIsFetchingSuggestions(false)
        })
    }, 220)

    return () => {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort()
        suggestionsAbortRef.current = null
      }
    }
  }, [query])

  useEffect(() => {
    if (!suggestionsOpen || typeof document === 'undefined') return undefined

    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setSuggestionsOpen(false)
        setHighlightIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [suggestionsOpen])

  const openSearchForTerm = (rawQuery) => {
    const trimmed = rawQuery.trim()
    if (!trimmed) return
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
    const url = `${engine.baseUrl}${encodeURIComponent(trimmed)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    openSearchForTerm(query)
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
  }

  const handleEngineSelect = (nextEngineId) => {
    const next = SEARCH_ENGINES.find((item) => item.id === nextEngineId)
    if (!next) return
    setEngine(next)
    setMenuOpen(false)
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
  }

  const isSuggestionPanelVisible =
    suggestionsOpen || (isFetchingSuggestions && query.trim().length > 0)

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="flex items-center rounded-full border border-white/15 bg-white/12 pl-5 pr-2 text-white shadow-[0_25px_50px_-25px_rgba(15,23,42,0.65)] backdrop-blur-sm transition-[background-color,backdrop-filter,border-color] duration-500 ease-out focus-within:border-white/30 focus-within:bg-white/20 focus-within:backdrop-blur-[14px]">
        <span className="text-white/60">
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
          role="combobox"
          aria-expanded={isSuggestionPanelVisible}
          aria-controls={
            isSuggestionPanelVisible ? 'search-suggestions-panel' : undefined
          }
          aria-activedescendant={
            suggestionsOpen && highlightIndex >= 0
              ? `search-suggestion-${highlightIndex}`
              : undefined
          }
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              if (!suggestions.length) return
              event.preventDefault()
              setSuggestionsOpen(true)
              setHighlightIndex((current) => {
                const next = current + 1
                return next >= suggestions.length ? 0 : next
              })
            } else if (event.key === 'ArrowUp') {
              if (!suggestions.length) return
              event.preventDefault()
              setSuggestionsOpen(true)
              setHighlightIndex((current) => {
                if (current <= 0) return suggestions.length - 1
                return current - 1
              })
            } else if (event.key === 'Enter') {
              if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
                event.preventDefault()
                const selected = suggestions[highlightIndex]
                setQuery(selected)
                openSearchForTerm(selected)
              }
            } else if (event.key === 'Escape') {
              if (suggestionsOpen) {
                event.preventDefault()
                setSuggestionsOpen(false)
                setHighlightIndex(-1)
              }
            }
          }}
          onFocus={() => {
            if (suggestions.length) {
              setSuggestionsOpen(true)
            }
          }}
          placeholder={`Search ${engine.label} or type a URL`}
          ref={inputRef}
          className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none"
        />
        <div className="ml-1 flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 transition hover:border-white/35 hover:text-white"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <SearchEngineIcon type={engine.id} className="h-4 w-4" />
              <span className="hidden sm:inline">{engine.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-3.5 w-3.5"
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl border border-white/25 bg-slate-900/30 p-2 shadow-[0_35px_60px_-25px_rgba(15,23,42,0.9)] backdrop-blur-3xl"
                style={{
                  animation: 'searchMenuReveal 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <ul className="space-y-1">
                  {SEARCH_ENGINES.filter((item) => item.id !== engine.id).map(
                    (item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleEngineSelect(item.id)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/15 hover:text-white"
                        >
                          <SearchEngineIcon type={item.id} className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
          <SearchButton />
        </div>
      </div>
      {isSuggestionPanelVisible && (
        <div
          id="search-suggestions-panel"
          className="absolute inset-x-0 top-full z-40 mt-3 px-1.5 sm:px-2"
          style={{
            animation: 'searchSuggestionsReveal 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/18 via-white/10 to-white/5 text-sm text-white shadow-[0_45px_95px_-35px_rgba(15,23,42,0.85)] ring-1 ring-white/20 backdrop-blur-md">
            {suggestions.length ? (
              <ul
                id="search-suggestions-list"
                role="listbox"
                className="max-h-[min(320px,45vh)] overflow-y-auto divide-y divide-white/10"
              >
                {suggestions.map((item, index) => {
                  const isActive = index === highlightIndex
                  return (
                    <li key={`${item}-${index}`}>
                      <button
                        type="button"
                        id={`search-suggestion-${index}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery(item)
                          openSearchForTerm(item)
                        }}
                        className={`flex w-full items-center justify-between px-5 py-3 text-left transition duration-150 ease-out ${
                          isActive
                            ? 'bg-white/25 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] backdrop-blur-sm'
                            : 'text-white/75 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        <span className="truncate text-sm">{item}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="h-3.5 w-3.5 text-white/40"
                        >
                          <path d="M6 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-3 px-5 py-4 text-white/70">
                {isFetchingSuggestions ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 animate-spin text-white/60"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        className="opacity-25"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M21 12a9 9 0 00-9-9"
                        className="opacity-60"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                    <span>Searching for suggestions...</span>
                  </>
                ) : (
                  <span>No suggestions found</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  )
}

function SearchEngineIcon({ type, className }) {
  const classes = ['h-4 w-4', className].filter(Boolean).join(' ')
  switch (type) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={classes} fill="none">
          <path
            d="M22 12.24c0-.68-.06-1.36-.18-2.02H12v3.83h5.62a4.81 4.81 0 01-2.08 3.16v2.63h3.36c1.97-1.81 3.1-4.48 3.1-7.6z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.79 0 5.13-.92 6.84-2.52l-3.36-2.63c-.93.62-2.12.98-3.48.98a6.02 6.02 0 01-5.68-4.15H2.85v2.7A10 10 0 0012 23z"
            fill="#34A853"
          />
          <path
            d="M6.32 14.68A6.02 6.02 0 016.01 9V6.3H2.85a10 10 0 000 11.4l3.47-3.02z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.96c1.52 0 2.89.52 3.97 1.55l2.97-2.97C16.97 1.84 14.63 1 12 1A10 10 0 002.85 6.3l3.47 2.7A6.02 6.02 0 0112 4.96z"
            fill="#EA4335"
          />
        </svg>
      )
    case 'bing':
      return (
        <img
          src={bingLogo}
          alt="Bing"
          className={`${classes} object-contain`}
          loading="lazy"
          decoding="async"
        />
      )
    case 'brave':
      return (
        <svg viewBox="0 0 24 24" className={classes} fill="none">
          <path
            d="M4.5 4.5L12 2l7.5 2.5v9.8L12 22l-7.5-5.7V4.5z"
            fill="#FF6F3D"
          />
          <path
            d="M12 4l-5 1.8v4.7L12 16l5-5.5V5.8L12 4z"
            fill="#fff"
            opacity="0.85"
          />
        </svg>
      )
    case 'duckduckgo':
      return (
        <svg viewBox="0 0 24 24" className={classes} fill="none">
          <circle cx="12" cy="12" r="10" fill="#DE5833" />
          <path
            d="M12 6.5c.9 0 1.6.73 1.6 1.62v.24l.82-.18c.44-.1.86.22.86.67v2.73c0 1.05-.84 1.89-1.88 1.89H9.6c-.9 0-1.63-.73-1.63-1.63 0-.7.4-1.35 1.02-1.54l.95-.3V8.12c0-.9.73-1.62 1.63-1.62z"
            fill="#fff"
          />
          <path
            d="M11.4 13.5l-.6 3h2.4l-.6-3h-1.2z"
            fill="#65B32E"
          />
        </svg>
      )
    case 'yahoo':
      return (
        <svg viewBox="0 0 24 24" className={classes} fill="none">
          <path
            d="M11.2 13.7L7.5 6H5l5.1 10.7V19h3v-2.3L18 6h-2.5l-3.7 7.7z"
            fill="#5F01D1"
          />
        </svg>
      )
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={classes}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="19" y1="19" x2="15" y2="15" />
        </svg>
      )
  }
}

function SearchButton() {
  return (
    <button
      type="submit"
      className="group relative overflow-hidden rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
    >
      <span className="relative z-10">Search</span>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-pink-400 via-indigo-400 to-sky-300 opacity-80 blur-[3px]"
        style={{ filter: 'hue-rotate(0deg)' }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-pink-400 via-indigo-400 to-sky-300 opacity-95"
        style={{ animation: 'searchBeamHue 4.5s linear infinite' }}
      />
    </button>
  )
}

export default SearchBar
