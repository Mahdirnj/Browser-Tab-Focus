import { useEffect, useMemo, useState } from 'react'

const CITY_KEY = 'focus_dashboard_city'
const WEATHER_CACHE_KEY = 'focus_dashboard_weatherCache'
const CACHE_TTL = 30 * 60 * 1000

function readStoredCity() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(CITY_KEY) ?? ''
}

function readCachedWeather(city) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(WEATHER_CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.data) return null
    const isFresh = Date.now() - parsed.timestamp < CACHE_TTL
    const sameCity =
      parsed.data.city &&
      parsed.data.city.toLowerCase() === city?.toLowerCase()

    if (isFresh && sameCity) {
      return parsed.data
    }
  } catch (error) {
    console.warn('Unable to parse cached weather', error)
  }
  return null
}

const PANEL_CLASSES =
  'flex h-48 w-48 flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/[0.12] p-4 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-sm transition duration-300 hover:border-white/30'

export function Weather() {
  const apiKey = useMemo(
    () => import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() ?? '',
    [],
  )
  const initialCity = useMemo(() => readStoredCity(), [])

  const [city, setCity] = useState(initialCity)
  const [isEditing, setIsEditing] = useState(() => !initialCity)
  const [inputValue, setInputValue] = useState(initialCity)
  const [weather, setWeather] = useState(() => readCachedWeather(initialCity))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!city) {
      window.localStorage.removeItem(CITY_KEY)
      return
    }
    window.localStorage.setItem(CITY_KEY, city)
  }, [city])

  useEffect(() => {
    setInputValue(city)
  }, [city])

  useEffect(() => {
    if (!city || !apiKey) return

    const cached = readCachedWeather(city)
    if (cached) {
      setWeather(cached)
      return
    }

    fetchWeather(city)
  }, [city, apiKey])

  const fetchWeather = async (targetCity) => {
    const nextCity = targetCity ?? city
    if (!nextCity || !apiKey) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(nextCity)}&units=metric&appid=${apiKey}`,
      )

      if (!response.ok) {
        throw new Error('Unable to fetch weather for that city.')
      }

      const payload = await response.json()
      const result = {
        city: payload.name,
        temp: Math.round(payload.main?.temp ?? 0),
        description: payload.weather?.[0]?.description ?? '',
      }

      setWeather(result)
      window.localStorage.setItem(
        WEATHER_CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: result,
        }),
      )
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Something went wrong fetching the weather.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCitySubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (trimmed.toLowerCase() !== city?.toLowerCase()) {
      window.localStorage.removeItem(WEATHER_CACHE_KEY)
    }
    setCity(trimmed)
    setInputValue(trimmed)
    setIsEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleCitySubmit()
    }
    if (event.key === 'Escape') {
      setInputValue(city)
      setIsEditing(false)
    }
  }

  const handleRefresh = () => {
    window.localStorage.removeItem(WEATHER_CACHE_KEY)
    fetchWeather(city)
  }

  const formattedDescription = weather?.description
    ? weather.description
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : ''

  const displayCity = weather?.city ?? city ?? ''
  const hasCity = Boolean(city)
  const canRefresh = hasCity && Boolean(apiKey)

  let content
  if (!apiKey) {
    content = (
      <p className="text-xs text-white/70">
        Add your OpenWeather API key to see live conditions.
      </p>
    )
  } else if (isEditing) {
    content = (
      <div className="flex w-full flex-col gap-2">
        <input
          id="weather-city"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="City name"
          className="w-full rounded-2xl border border-white/25 bg-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCitySubmit}
            className="flex-1 rounded-full bg-sky-400/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_15px_30px_-20px_rgba(56,189,248,0.9)] transition hover:bg-sky-300 disabled:opacity-40"
            disabled={!inputValue.trim()}
          >
            Save
          </button>
          {hasCity && (
            <button
              type="button"
              onClick={() => {
                setInputValue(city)
                setIsEditing(false)
              }}
              className="flex-1 rounded-full border border-white/25 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  } else if (!hasCity) {
    content = (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-full border border-white/25 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 transition hover:border-white/40 hover:text-white"
      >
        Choose City
      </button>
    )
  } else if (loading) {
    content = <p className="text-xs text-white/70">Updating...</p>
  } else if (weather) {
    content = (
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 -z-10 rounded-full bg-sky-400/35 blur-2xl" />
        <p className="text-4xl font-semibold tracking-tight text-white drop-shadow-lg">
          {weather.temp}
          <span className="ml-1 text-base font-light text-white/75">
            {'\u00B0'}C
          </span>
        </p>
        {formattedDescription ? (
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
            {formattedDescription}
          </p>
        ) : null}
      </div>
    )
  } else {
    content = (
      <p className="text-xs text-white/70">Tap refresh to load weather.</p>
    )
  }

  return (
    <section className={PANEL_CLASSES}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-white/60">
            Weather
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              displayCity ? 'text-white/90' : 'text-white/60'
            }`}
          >
            {displayCity || 'Set City'}
          </p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            {canRefresh ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-full border border-white/25 bg-white/[0.08] p-1.5 text-white/75 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                disabled={loading}
                aria-label="Refresh weather"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a8 8 0 0113.657-2.657L20 6m0 0h-4m4 0v-4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 18a8 8 0 01-13.657 2.657L4 18m0 0h4m-4 0v4"
                  />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setInputValue(city)
                setIsEditing(true)
              }}
              className="rounded-full border border-white/25 bg-white/[0.08] p-1.5 text-white/75 transition hover:border-white/40 hover:text-white"
              aria-label={hasCity ? 'Change city' : 'Set city'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 20l1.537-5.25 12.325-11.263z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col items-center justify-center text-center">
        {content}
      </div>
      {error ? (
        <p className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-[0.65rem] text-rose-50/90">
          {error}
        </p>
      ) : null}
    </section>
  )
}

export default Weather
