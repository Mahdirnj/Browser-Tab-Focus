import SectionShell from './SectionShell'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round" />
  </svg>
)

export function ProfileSection({ currentName, onNameEditRequest }) {
  return (
    <SectionShell icon={Icon} title="Profile">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.18em] text-[color:var(--dashboard-text-40)]">Name</p>
          <p className="mt-0.5 text-[0.82rem] font-semibold text-[color:var(--dashboard-text-95)]">
            {currentName ? currentName : 'Not set'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNameEditRequest?.()}
          disabled={!onNameEditRequest}
          className="cursor-pointer rounded-full border border-white/20 bg-white/[0.12] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[color:var(--dashboard-text-75)] transition-[border-color,background-color,color] duration-150 hover:border-white/35 hover:bg-white/[0.18] hover:text-[color:var(--dashboard-text-100)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit
        </button>
      </div>
    </SectionShell>
  )
}

export default ProfileSection
