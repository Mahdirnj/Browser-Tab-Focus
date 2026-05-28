import { useCallback, useEffect, useState } from 'react'
import SectionShell from './SectionShell'

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--dashboard-text-45)]">
    <path d="M4.5 13.5a4 4 0 014-4 4 4 0 014-4 4 4 0 013.7 5.5A3 3 0 0114.5 17h-9a3 3 0 01-1-5.84" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function WeatherApiSection({ weatherApiKey, onWeatherApiKeyChange }) {
  const [weatherApiKeyInput, setWeatherApiKeyInput] = useState(weatherApiKey ?? '')

  useEffect(() => {
    setWeatherApiKeyInput(weatherApiKey ?? '')
  }, [weatherApiKey])

  const trimmedInput = weatherApiKeyInput.trim()
  const stored = weatherApiKey ?? ''
  const hasStored = Boolean(stored)
  const controlsDisabled = !onWeatherApiKeyChange
  const canClear = hasStored && !controlsDisabled

  const commit = useCallback(() => {
    if (controlsDisabled) return
    if (trimmedInput === stored) return
    onWeatherApiKeyChange?.(trimmedInput)
  }, [controlsDisabled, onWeatherApiKeyChange, stored, trimmedInput])

  const clear = () => {
    if (!onWeatherApiKeyChange) return
    setWeatherApiKeyInput('')
    onWeatherApiKeyChange('')
  }

  return (
    <SectionShell icon={Icon} title="Weather API">
      <div className="space-y-2.5">
        <p className="text-[0.63rem] leading-relaxed text-[color:var(--dashboard-text-45)]">
          Paste your OpenWeather API key. It never leaves this device.
        </p>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={weatherApiKeyInput}
          onChange={(event) => setWeatherApiKeyInput(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
          }}
          placeholder="32-character API key"
          disabled={controlsDisabled}
          className={`w-full rounded-xl border border-white/[0.14] bg-white/[0.07] px-3.5 py-2 text-[0.8rem] text-[color:var(--dashboard-text-90)] placeholder:text-[color:var(--dashboard-text-35)] transition focus:border-sky-300/50 focus:outline-none focus:ring-1 focus:ring-sky-300/30 ${
            controlsDisabled ? 'cursor-not-allowed opacity-60' : ''
          }`}
          aria-label="OpenWeather API Key"
        />
        <div className="flex items-center justify-between gap-2">
          <a
            href="https://home.openweathermap.org/api_keys"
            target="_blank"
            rel="noreferrer"
            className="text-[0.62rem] text-sky-300/80 underline-offset-2 hover:underline"
          >
            Get a free key →
          </a>
          {hasStored ? (
            <button
              type="button"
              onClick={clear}
              disabled={!canClear}
              className={`rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition ${
                canClear
                  ? 'cursor-pointer border-white/20 text-[color:var(--dashboard-text-65)] hover:border-rose-300/50 hover:text-rose-300/90'
                  : 'cursor-not-allowed border-white/10 text-[color:var(--dashboard-text-40)] opacity-60'
              }`}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </SectionShell>
  )
}

export default WeatherApiSection
