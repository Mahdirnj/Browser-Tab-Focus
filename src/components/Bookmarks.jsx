import { useCallback, useEffect, useMemo, useState } from 'react'
import { BOOKMARKS_KEY } from '../constants/storageKeys'
import { readJSON, removeKey, writeJSON } from '../utils/storage'

const MAX_BOOKMARKS = 6

const CARD_CLASSES =
  'relative flex w-48 min-h-48 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-[color:var(--dashboard-text-100)] shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/30 before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/[0.12] before:via-white/[0.04] before:to-transparent before:opacity-80'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeUrl(rawValue) {
  const trimmed = rawValue.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function getHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function getOrigin(url) {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function getFaviconSources(url) {
  const host = getHostname(url)
  if (!host) return []

  const origin = getOrigin(url)
  const stripped = host.replace(/^www\./i, '')
  const hosts = [host, stripped].filter(Boolean)
  const uniqueHosts = Array.from(new Set(hosts))

  const sources = []
  uniqueHosts.forEach((entry) => {
    sources.push(`https://www.google.com/s2/favicons?domain=${entry}&sz=64`)
    sources.push(`https://icons.duckduckgo.com/ip3/${entry}.ico`)
  })
  if (origin) {
    sources.push(`${origin}/favicon.ico`)
  }

  return Array.from(new Set(sources))
}

function BookmarkFavicon({ url }) {
  const sources = useMemo(() => getFaviconSources(url), [url])
  const sourcesKey = sources.join('|')
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [sourcesKey])

  const src = sources[sourceIndex]
  if (!src) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-7 w-7 flex-shrink-0 text-[color:var(--dashboard-text-45)]"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" strokeLinecap="round" />
        <path d="M12 3a14 14 0 010 18" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="h-7 w-7 flex-shrink-0 rounded-full"
      loading="lazy"
      decoding="async"
      onError={() => {
        setSourceIndex((current) =>
          current + 1 < sources.length ? current + 1 : sources.length,
        )
      }}
    />
  )
}

function readStoredBookmarks() {
  const stored = readJSON(BOOKMARKS_KEY, [])
  if (!Array.isArray(stored)) return []

  return stored
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const name = typeof item.name === 'string' ? item.name.trim() : ''
      const urlRaw = typeof item.url === 'string' ? item.url.trim() : ''
      const url = normalizeUrl(urlRaw)
      if (!name || !url) return null
      return {
        id: typeof item.id === 'string' ? item.id : createId(),
        name,
        url,
      }
    })
    .filter(Boolean)
    .slice(0, MAX_BOOKMARKS)
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(() => readStoredBookmarks())
  const [editMode, setEditMode] = useState(false)
  const [formMode, setFormMode] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [formError, setFormError] = useState('')

  const canAddMore = bookmarks.length < MAX_BOOKMARKS
  const showAddForm = formMode === 'add'

  useEffect(() => {
    if (!bookmarks.length) {
      removeKey(BOOKMARKS_KEY)
      return
    }
    writeJSON(BOOKMARKS_KEY, bookmarks)
  }, [bookmarks])

  const resetForm = useCallback(() => {
    setFormMode(null)
    setDraftName('')
    setDraftUrl('')
    setActiveId(null)
    setFormError('')
  }, [])

  const openAddForm = () => {
    if (!canAddMore) return
    setFormMode('add')
    setDraftName('')
    setDraftUrl('')
    setActiveId(null)
    setFormError('')
  }

  const openEditForm = (bookmark) => {
    setFormMode('edit')
    setDraftName(bookmark.name)
    setDraftUrl(bookmark.url)
    setActiveId(bookmark.id)
    setFormError('')
  }

  const handleSave = () => {
    const name = draftName.trim()
    const url = normalizeUrl(draftUrl)

    if (!name) {
      setFormError('Name is required.')
      return
    }
    if (!url) {
      setFormError('Enter a valid URL.')
      return
    }

    if (formMode === 'edit' && activeId) {
      setBookmarks((current) =>
        current.map((item) =>
          item.id === activeId ? { ...item, name, url } : item,
        ),
      )
    } else if (formMode === 'add' && canAddMore) {
      setBookmarks((current) => [
        ...current,
        {
          id: createId(),
          name,
          url,
        },
      ])
    }

    resetForm()
  }

  const handleDelete = (id) => {
    setBookmarks((current) => current.filter((item) => item.id !== id))
    if (activeId === id) {
      resetForm()
    }
  }

  const handleBookmarkClick = (bookmark) => {
    if (editMode) {
      openEditForm(bookmark)
      return
    }
    if (typeof window !== 'undefined') {
      window.location.assign(bookmark.url)
    }
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSave()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      resetForm()
    }
  }

  const toggleEditMode = () => {
    setEditMode((current) => !current)
  }

  const bookmarkItems = useMemo(
    () =>
      bookmarks.map((bookmark) => ({
        ...bookmark,
        hostname: getHostname(bookmark.url),
      })),
    [bookmarks],
  )
  const formFields = (
    <div className="space-y-2">
      <input
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Website name"
        className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-xs text-[color:var(--dashboard-text-95)] placeholder:text-[color:var(--dashboard-text-45)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
      />
      <input
        value={draftUrl}
        onChange={(event) => setDraftUrl(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="https://example.com"
        className=" w-full rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-xs text-[color:var(--dashboard-text-95)] placeholder:text-[color:var(--dashboard-text-45)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
      />
      {formError ? (
        <p className=" text-[0.6rem] text-rose-200/90">{formError}</p>
      ) : null}
      <div className="flex gap-2 pr-1.5">
        <button
          type="button"
          onClick={handleSave}
          className=" flex-1 rounded-full bg-sky-400/90 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--dashboard-text-100)] shadow-[0_12px_25px_-18px_rgba(56,189,248,0.9)] transition hover:bg-sky-300"
        >
          {formMode === 'edit' ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className=" flex-1 rounded-full border border-white/25 bg-white/[0.08] px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--dashboard-text-70)] transition hover:border-white/40 hover:text-[color:var(--dashboard-text-100)]"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <section className={CARD_CLASSES}>
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-[color:var(--dashboard-text-70)]">
            Bookmarks
          </p>
          <p className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-[color:var(--dashboard-text-55)]">
            {bookmarks.length}/{MAX_BOOKMARKS} saved
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={openAddForm}
            disabled={!canAddMore}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.12] text-[color:var(--dashboard-text-90)] shadow-[0_10px_25px_-18px_rgba(15,23,42,0.9)] transition hover:border-white/40 hover:bg-white/[0.2] hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-[color:var(--dashboard-text-35)]"
            aria-label="Add bookmark"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path d="M10 4v12" strokeLinecap="round" />
              <path d="M4 10h12" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleEditMode}
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-[color:var(--dashboard-text-90)] shadow-[0_10px_25px_-18px_rgba(15,23,42,0.9)] transition ${
              editMode
                ? 'border-sky-200/80 bg-sky-400/20 text-sky-100 ring-2 ring-sky-300/60'
                : 'border-white/20 bg-white/[0.12] hover:border-white/40 hover:bg-white/[0.2] hover:text-[color:var(--dashboard-text-100)]'
            }`}
            aria-label="Edit bookmarks"
            aria-pressed={editMode}
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
                d="M4 13.5V16h2.5l7.6-7.6-2.5-2.5L4 13.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.1 5.6l2.5 2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-3">
        {bookmarkItems.length || showAddForm ? (
          <ul className="flex flex-col gap-2">
            {showAddForm ? (
              <li className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.9)]">
                {formFields}
              </li>
            ) : null}
            {bookmarkItems.map((bookmark) => (
              <li key={bookmark.id}>
                {formMode === 'edit' && activeId === bookmark.id ? (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.9)]">
                    {formFields}
                  </div>
                ) : (
                  <div className="group relative flex w-full items-center rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2 text-[0.7rem] font-semibold text-[color:var(--dashboard-text-90)] shadow-[0_12px_30px_-26px_rgba(15,23,42,0.8)] transition hover:border-white/35 hover:bg-white/[0.16] hover:text-[color:var(--dashboard-text-100)]">
                    <button
                      type="button"
                      onClick={() => handleBookmarkClick(bookmark)}
                      title={bookmark.hostname || bookmark.url}
                      className="relative z-0 flex w-full min-w-0 items-center gap-2 pr-10 text-left"
                    >
                      <BookmarkFavicon url={bookmark.url} />
                      <span
                        className={`min-w-0 flex-1 ${
                          editMode
                            ? 'break-words leading-snug'
                            : 'truncate'
                        }`}
                      >
                        {bookmark.name}
                      </span>
                    </button>
                    {!editMode ? (
                      <span
                        className="pointer-events-none absolute right-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-[color:var(--dashboard-text-60)] opacity-0 transition duration-200 group-hover:opacity-100 group-hover:text-[color:var(--dashboard-text-90)]"
                        aria-hidden="true"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="h-3.5 w-3.5"
                        >
                          <circle cx="11" cy="11" r="6.5" />
                          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                          <path d="M11 8.5v5" strokeLinecap="round" />
                          <path d="M8.5 11h5" strokeLinecap="round" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(bookmark.id)}
                        className="absolute right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-[color:var(--dashboard-text-65)] transition hover:border-rose-400/90 hover:bg-rose-500/25 hover:text-rose-50"
                        aria-label={`Delete ${bookmark.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="h-4 w-4"
                        >
                          <path d="M6 6h8" strokeLinecap="round" />
                          <path d="M8 6l.4-1.2A1 1 0 019.35 4h1.3a1 1 0 01.95.8L12 6" strokeLinecap="round" />
                          <rect x="6.5" y="7" width="7" height="8" rx="1.3" />
                          <path d="M9 9.5v4" strokeLinecap="round" />
                          <path d="M11 9.5v4" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[0.6rem] uppercase tracking-[0.32em] text-[color:var(--dashboard-text-45)]">
            Add favorites
          </div>
        )}
      </div>
    </section>
  )
}

export default Bookmarks
