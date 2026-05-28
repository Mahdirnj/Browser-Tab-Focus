/**
 * Shared wrapper for settings sections — rounded card with an icon + title
 * header. Keeps every section visually consistent and lets the orchestrator
 * swap them around without duplicating the header structure.
 */
export function SectionShell({ icon, title, headerRight, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-[color:var(--dashboard-text-55)]">
            {title}
          </p>
        </div>
        {headerRight ?? null}
      </div>
      {children}
    </section>
  )
}

export default SectionShell
