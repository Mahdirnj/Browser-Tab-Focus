import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { BOOKMARKS_KEY } from '../constants/storageKeys'
import { readJSON, removeKey, writeJSON } from '../utils/storage'

const MAX_BOOKMARKS = 30
const UNGROUPED_KEY = '__ungrouped__'

const CARD_CLASSES =
  'relative flex w-48 max-h-[28rem] flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-[color:var(--dashboard-text-100)] shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/30 before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/[0.12] before:via-white/[0.04] before:to-transparent before:opacity-80'

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

function normalizeFolder(value) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 32)
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
        folder: normalizeFolder(item.folder),
      }
    })
    .filter(Boolean)
    .slice(0, MAX_BOOKMARKS)
}

/**
 * Group bookmarks for rendering while preserving the source array order.
 * Returns [{ folder, items }] where folder === '' represents ungrouped items.
 * Folders appear in first-seen order to keep the layout predictable.
 */
function buildGroups(bookmarks) {
  const groups = new Map()
  for (const bookmark of bookmarks) {
    const key = bookmark.folder || ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(bookmark)
  }
  return Array.from(groups.entries()).map(([folder, items]) => ({
    folder,
    items,
  }))
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(() => readStoredBookmarks())
  const [editMode, setEditMode] = useState(false)
  const [formMode, setFormMode] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [draftFolder, setDraftFolder] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [formError, setFormError] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState(() => new Set())
  const [draggingId, setDraggingId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null) // { kind: 'before'|'folder'|'end', value }
  const [listParent] = useAutoAnimate({ duration: 220, easing: 'ease-out' })
  const folderListId = useId()

  const canAddMore = bookmarks.length < MAX_BOOKMARKS
  const showAddForm = formMode === 'add'

  useEffect(() => {
    if (!bookmarks.length) {
      removeKey(BOOKMARKS_KEY)
      return
    }
    writeJSON(BOOKMARKS_KEY, bookmarks)
  }, [bookmarks])

  const groups = useMemo(() => buildGroups(bookmarks), [bookmarks])
  const knownFolders = useMemo(
    () =>
      Array.from(new Set(bookmarks.map((b) => b.folder).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [bookmarks],
  )

  const resetForm = useCallback(() => {
    setFormMode(null)
    setDraftName('')
    setDraftUrl('')
    setDraftFolder('')
    setActiveId(null)
    setFormError('')
  }, [])

  const openAddForm = () => {
    if (!canAddMore) return
    setFormMode('add')
    setDraftName('')
    setDraftUrl('')
    setDraftFolder('')
    setActiveId(null)
    setFormError('')
  }

  const openEditForm = (bookmark) => {
    setFormMode('edit')
    setDraftName(bookmark.name)
    setDraftUrl(bookmark.url)
    setDraftFolder(bookmark.folder ?? '')
    setActiveId(bookmark.id)
    setFormError('')
  }

  const handleSave = () => {
    const name = draftName.trim()
    const url = normalizeUrl(draftUrl)
    const folder = normalizeFolder(draftFolder)

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
          item.id === activeId ? { ...item, name, url, folder } : item,
        ),
      )
    } else if (formMode === 'add' && canAddMore) {
      setBookmarks((current) => [
        ...current,
        {
          id: createId(),
          name,
          url,
          folder,
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
    setEditMode((current) => {
      const next = !current
      if (!next) {
        // Clear any drag state when leaving edit mode
        setDraggingId(null)
        setDropTarget(null)
      }
      return next
    })
  }

  const toggleFolderCollapsed = useCallback((folderName) => {
    setCollapsedFolders((current) => {
      const next = new Set(current)
      if (next.has(folderName)) next.delete(folderName)
      else next.add(folderName)
      return next
    })
  }, [])

  /* ─────────────────  Drag and drop  ───────────────── */

  const handleDragStart = (event, bookmarkId) => {
    if (!editMode) return
    setDraggingId(bookmarkId)
    // Required for Firefox to start the drag
    try {
      event.dataTransfer.setData('text/plain', bookmarkId)
      event.dataTransfer.effectAllowed = 'move'
    } catch {
      // ignored — older browsers
    }
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDropTarget(null)
  }

  const handleRowDragOver = (event, bookmarkId) => {
    if (!draggingId || draggingId === bookmarkId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget({ kind: 'before', value: bookmarkId })
  }

  const handleFolderHeaderDragOver = (event, folderName) => {
    if (!draggingId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget({ kind: 'folder', value: folderName })
  }

  const handleListEndDragOver = (event) => {
    if (!draggingId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget({ kind: 'end', value: '' })
  }

  /**
   * Reorder list. Move `draggingId` to the position implied by `target`.
   * - target.kind === 'before' -> insert just before bookmark with id = target.value, inherit its folder
   * - target.kind === 'folder' -> append to folder named target.value (empty string = ungrouped)
   * - target.kind === 'end'    -> append to ungrouped section
   */
  const applyDrop = useCallback(() => {
    if (!draggingId || !dropTarget) {
      setDraggingId(null)
      setDropTarget(null)
      return
    }
    setBookmarks((current) => {
      const moving = current.find((item) => item.id === draggingId)
      if (!moving) return current
      const without = current.filter((item) => item.id !== draggingId)

      if (dropTarget.kind === 'before') {
        const targetIndex = without.findIndex((item) => item.id === dropTarget.value)
        if (targetIndex === -1) return current
        const targetItem = without[targetIndex]
        const next = [...without]
        next.splice(targetIndex, 0, { ...moving, folder: targetItem.folder ?? '' })
        return next
      }

      if (dropTarget.kind === 'folder') {
        const folder = dropTarget.value
        // Append after the last item of that folder; if no items, append to end
        let lastIndex = -1
        for (let i = 0; i < without.length; i++) {
          if ((without[i].folder ?? '') === folder) lastIndex = i
        }
        const insertAt = lastIndex === -1 ? without.length : lastIndex + 1
        const next = [...without]
        next.splice(insertAt, 0, { ...moving, folder })
        return next
      }

      // 'end' — drop into ungrouped at the bottom
      return [...without, { ...moving, folder: '' }]
    })
    setDraggingId(null)
    setDropTarget(null)
  }, [draggingId, dropTarget])

  const handleDrop = (event) => {
    event.preventDefault()
    applyDrop()
  }

  /* ─────────────────  Render helpers  ───────────────── */

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
        className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-xs text-[color:var(--dashboard-text-95)] placeholder:text-[color:var(--dashboard-text-45)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
      />
      <input
        value={draftFolder}
        onChange={(event) => setDraftFolder(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Folder (optional)"
        list={folderListId}
        maxLength={32}
        className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-2 text-xs text-[color:var(--dashboard-text-95)] placeholder:text-[color:var(--dashboard-text-45)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
      />
      {knownFolders.length ? (
        <datalist id={folderListId}>
          {knownFolders.map((folderName) => (
            <option key={folderName} value={folderName} />
          ))}
        </datalist>
      ) : null}
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

  const renderBookmarkRow = (bookmark) => {
    const hostname = getHostname(bookmark.url)
    const isDragging = draggingId === bookmark.id
    const isDropBefore =
      dropTarget?.kind === 'before' && dropTarget.value === bookmark.id

    if (formMode === 'edit' && activeId === bookmark.id) {
      return (
        <li key={bookmark.id}>
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.9)]">
            {formFields}
          </div>
        </li>
      )
    }

    return (
      <li
        key={bookmark.id}
        draggable={editMode}
        onDragStart={(event) => handleDragStart(event, bookmark.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => handleRowDragOver(event, bookmark.id)}
        onDrop={handleDrop}
        className={`relative ${isDragging ? 'opacity-40' : ''}`}
      >
        {isDropBefore ? (
          <span className="pointer-events-none absolute -top-1 left-1 right-1 h-0.5 rounded-full bg-sky-300/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        ) : null}
        <div className="group relative flex w-full items-center rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2 text-[0.7rem] font-semibold text-[color:var(--dashboard-text-90)] shadow-[0_12px_30px_-26px_rgba(15,23,42,0.8)] transition hover:border-white/35 hover:bg-white/[0.16] hover:text-[color:var(--dashboard-text-100)]">
          {editMode ? (
            <span
              className="mr-1 flex h-5 w-3 cursor-grab items-center justify-center text-[color:var(--dashboard-text-45)] active:cursor-grabbing"
              aria-hidden="true"
              title="Drag to reorder"
            >
              <svg viewBox="0 0 6 14" fill="currentColor" className="h-3 w-1.5">
                <circle cx="1.5" cy="2" r="1" />
                <circle cx="4.5" cy="2" r="1" />
                <circle cx="1.5" cy="7" r="1" />
                <circle cx="4.5" cy="7" r="1" />
                <circle cx="1.5" cy="12" r="1" />
                <circle cx="4.5" cy="12" r="1" />
              </svg>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => handleBookmarkClick(bookmark)}
            title={hostname || bookmark.url}
            className="relative z-0 flex w-full min-w-0 items-center gap-2 pr-10 text-left"
          >
            <BookmarkFavicon url={bookmark.url} />
            <span
              className={`min-w-0 flex-1 ${
                editMode ? 'break-words leading-snug' : 'truncate'
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
      </li>
    )
  }

  const renderFolderHeader = (group) => {
    const isUngrouped = !group.folder
    const isCollapsed = collapsedFolders.has(group.folder)
    const isFolderDropTarget =
      dropTarget?.kind === 'folder' && dropTarget.value === group.folder

    return (
      <li
        key={`__folder__${group.folder || UNGROUPED_KEY}`}
        className="list-none"
      >
        <button
          type="button"
          onClick={() => toggleFolderCollapsed(group.folder)}
          onDragOver={(event) => handleFolderHeaderDragOver(event, group.folder)}
          onDrop={handleDrop}
          className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[0.55rem] font-semibold uppercase tracking-[0.22em] transition ${
            isFolderDropTarget
              ? 'bg-sky-400/15 text-[color:var(--dashboard-text-100)] ring-1 ring-sky-300/50'
              : 'text-[color:var(--dashboard-text-55)] hover:bg-white/[0.05] hover:text-[color:var(--dashboard-text-90)]'
          }`}
          aria-expanded={!isCollapsed}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-2.5 w-2.5 transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
          >
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="flex-1 truncate">
            {isUngrouped ? 'Other' : group.folder}
          </span>
          <span className="text-[color:var(--dashboard-text-35)]">
            {group.items.length}
          </span>
        </button>
      </li>
    )
  }

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

      <div className="custom-scroll relative z-10 mt-3 flex-1 overflow-y-auto pr-0.5">
        {bookmarks.length || showAddForm ? (
          <ul ref={listParent} className="flex flex-col gap-2 list-none">
            {showAddForm ? (
              <li
                key="__add-form__"
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.9)]"
              >
                {formFields}
              </li>
            ) : null}
            {groups.flatMap((group) => {
              const isUngrouped = !group.folder
              const showHeader = !isUngrouped || groups.length > 1
              const isCollapsed = collapsedFolders.has(group.folder)
              const headerNode = showHeader ? renderFolderHeader(group) : null
              const rowNodes = isCollapsed
                ? []
                : group.items.map((item) => renderBookmarkRow(item))
              return headerNode ? [headerNode, ...rowNodes] : rowNodes
            })}
            {editMode && draggingId ? (
              <li
                key="__drop-end__"
                onDragOver={handleListEndDragOver}
                onDrop={handleDrop}
                className={`rounded-xl border border-dashed py-3 text-center text-[0.55rem] uppercase tracking-[0.25em] transition ${
                  dropTarget?.kind === 'end'
                    ? 'border-sky-300/60 bg-sky-400/10 text-[color:var(--dashboard-text-90)]'
                    : 'border-white/10 text-[color:var(--dashboard-text-40)]'
                }`}
              >
                Drop to remove from folder
              </li>
            ) : null}
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
