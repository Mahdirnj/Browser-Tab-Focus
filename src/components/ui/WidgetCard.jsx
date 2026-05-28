/**
 * Shared base for the dashboard's "card" widgets.
 *
 * Replaces the duplicated `CARD_CLASSES` strings that lived in
 * `PomodoroTimer`, `TodoList`, `Weather`, and `Bookmarks`. Each widget
 * passes a `className` for sizing or other one-off tweaks, and any extra
 * props (refs, ARIA attributes, data-* hooks, inline styles) are spread
 * onto the underlying `<section>`.
 */

export const WIDGET_CARD_BASE =
  'flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 ' +
  'text-[color:var(--dashboard-text-100)] shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] ' +
  'backdrop-blur-md transition duration-300 hover:border-white/25'

export function WidgetCard({ className = '', children, ...rest }) {
  return (
    <section {...rest} className={`${WIDGET_CARD_BASE} ${className}`.trim()}>
      {children}
    </section>
  )
}

export default WidgetCard
