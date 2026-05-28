import { useRef, useState } from 'react'
import {
  downloadExport,
  importAll,
  readJsonFile,
} from '../../utils/settingsBackup'
import SectionShell from './SectionShell'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M12 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 10v5" strokeLinecap="round" />
    <path d="M7.5 12.5L10 15l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * Backup section — exports every persisted preference and imports it back.
 * Implements IDEA-V2-008.
 */
export function BackupSection() {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  const setBriefStatus = (next) => {
    setStatus(next)
    if (next.kind === 'success') {
      window.setTimeout(() => {
        setStatus((current) => (current.kind === 'success' ? { kind: 'idle', message: '' } : current))
      }, 2400)
    }
  }

  const handleExport = async () => {
    try {
      setStatus({ kind: 'loading', message: 'Preparing export…' })
      await downloadExport()
      setBriefStatus({ kind: 'success', message: 'Settings exported.' })
    } catch (error) {
      console.error(error)
      setStatus({
        kind: 'error',
        message: error?.message ?? 'Could not export settings.',
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            'Import will overwrite your current FocusLoom settings, todos, bookmarks, custom backgrounds, and other preferences. Continue?',
          )
    if (!confirmed) return

    try {
      setStatus({ kind: 'loading', message: 'Restoring settings…' })
      const json = await readJsonFile(file)
      const result = await importAll(json)
      setStatus({
        kind: 'success',
        message: `Restored ${result.localStorageCount} settings + ${result.customBackgroundCount} backgrounds. Reloading…`,
      })
      window.setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload()
      }, 800)
    } catch (error) {
      console.error(error)
      setStatus({
        kind: 'error',
        message: error?.message ?? 'Could not import that file.',
      })
    }
  }

  const isLoading = status.kind === 'loading'

  return (
    <SectionShell icon={Icon} title="Backup">
      <p className="mb-3 text-[0.63rem] leading-relaxed text-[color:var(--dashboard-text-45)]">
        Save every preference, todo, bookmark, and custom background as a JSON
        file. Import it on another device to restore.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--dashboard-text-80)] transition-[border-color,background-color,color] duration-150 hover:border-white/35 hover:bg-white/[0.14] hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
            <path d="M7 2v8M3.5 5.5L7 9l3.5-3.5M2.5 12h9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--dashboard-text-80)] transition-[border-color,background-color,color] duration-150 hover:border-white/35 hover:bg-white/[0.14] hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
            <path d="M7 12V4M3.5 8.5L7 5l3.5 3.5M2.5 2h9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
      {status.kind !== 'idle' ? (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[0.62rem] ${
            status.kind === 'error'
              ? 'border-rose-400/40 bg-rose-500/10 text-rose-100/90'
              : status.kind === 'success'
                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100/90'
                : 'border-white/15 bg-white/[0.05] text-[color:var(--dashboard-text-75)]'
          }`}
          role={status.kind === 'error' ? 'alert' : 'status'}
        >
          {status.kind === 'loading' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3 animate-spin">
              <circle cx="12" cy="12" r="9" opacity="0.25" />
              <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
            </svg>
          ) : null}
          <span className="leading-snug">{status.message}</span>
        </div>
      ) : null}
    </SectionShell>
  )
}

export default BackupSection
