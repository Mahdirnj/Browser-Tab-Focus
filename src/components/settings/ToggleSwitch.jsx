/**
 * The pill-style toggle used throughout the Settings panel.
 * Behaves as a button so callers control wiring; we just render the chrome.
 */
export function ToggleSwitch({ checked, onChange, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center overflow-hidden rounded-full border px-0.5 transition-colors duration-150 ${
        checked
          ? 'border-emerald-300/60 bg-emerald-400/80'
          : 'border-white/20 bg-white/[0.1]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-150 ease-out ${
          checked ? 'translate-x-[1.2rem]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default ToggleSwitch
